import "./config/env.js";
import { db } from "./config/db.js";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import axios from "axios";
import bcrypt from "bcrypt";
import validator from "validator";
import crypto from "crypto";
import { registerLimiter } from "./middlewares/rate-limiters.js";
import { sendVerificationEmail } from "./services/email-service.js";
import jwt from "jsonwebtoken";
import { authenticateUser } from "./middlewares/auth.js";
import { validateCurrentUrl } from "./utils/validateCurrentUrl.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(authenticateUser);

// Middleware to track the current URL
app.use((req, res, next) => {
    res.locals.currentUrl = req.originalUrl;
    next();
});

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const ACCESS_TOKEN = process.env.TMDB_TOKEN;

app.get("/", (req, res) => {

    res.render("pages/home");

});

app.get("/find/:searchText", async (req, res) => {

    const searchText = req.params.searchText;

    let search;

    try {
        const result = await axios.get(
            `${TMDB_BASE_URL}/search/movie`, {
                params: {
                    query: searchText,
                },
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                },
            }
        );

        search = result.data.results;

    } catch (error) {
        console.error(error.response?.data || error.message);
    };

    return res.render("pages/find", {
        searchText,
        search,
    });

});

app.get("/film/:id", async (req, res) => {

    const filmId = req.params.id;
    let filmData;

    try {
        const result = await axios.get(
            `${TMDB_BASE_URL}/movie/${filmId}?append_to_response=credits`, {
                headers: {
                    Authorization: `Bearer ${ACCESS_TOKEN}`,
                },
            }
        );

        filmData = result.data;

    } catch (error) {
        console.error(error.response?.data || error.message);
    };

    return res.render("pages/film", {
        filmData,
    });

});

app.post("/register", registerLimiter, async (req, res) => {

    const currentUrl = validateCurrentUrl(req.body.currentUrl || "/");

    const email = req.body.email.toLowerCase();
    const username = req.body.username;
    const password = req.body.password;

    if (!validator.isEmail(email)) {
        return res.status(400).send("Invalid email.")
    };
    
    try {

        const isRegistered = await db.query("SELECT is_verified FROM users WHERE email = $1", [email]);

        if (isRegistered.rows.length > 0) {

            if (isRegistered.rows[0].is_verified === true) { // Account already exists and is verified
                return res.status(400).send("This email is already registered.");
            } else {                                         // Account already exists but is not verified, so it will be deleted before registering a new one
                await db.query("DELETE FROM users WHERE email = $1", [email]);
            };
            
        };

        const hashedPassword = await bcrypt.hash(password, 12);
        const verificationToken = crypto.randomBytes(32).toString("hex");
        const verificationTokenExpiration = new Date(Date.now() + 60 * 60 * 1000); // One hour after the registration attempt

        await db.query(
            "INSERT INTO users (email, password, username, verification_token, verification_token_expiration) VALUES ($1, $2, $3, $4, $5)",
            [email, hashedPassword, username, verificationToken, verificationTokenExpiration]
        );

        const verifyLink = `http://localhost:${PORT}/verify?token=${verificationToken}`;

        await sendVerificationEmail(email, username, verifyLink);

        return res.render("pages/message", {
            message: "Account created successfully, verify your email before logging in."
        });

    } catch (err) {
        console.error(err);        
        return res.render("pages/message", {
            message: "Internal server error."
        });
    };

});

app.get("/verify", async (req, res) => {

    const verificationToken = req.query.token;

    if (!verificationToken) {
        return res.render("pages/message", {
            message: "Token is missing."
        });
    };

    try {

        const result = await db.query(
            `UPDATE users
            SET is_verified = true,
                verification_token = NULL,
                verification_token_expiration = NULL
            WHERE verification_token = $1
            AND verification_token_expiration > NOW()
            RETURNING id`,
            [verificationToken]
        );
    
        if (result.rows.length === 0) {
            return res.render("pages/message", {
                message: "Invalid or expired token."
            });
        };

        return res.render("pages/message", {
            message: "Your account has been verified."
        });

    } catch (err) {
        console.error(err);
        return res.render("pages/message", {
            message: "Internal server error."
        });
    };

});

app.post("/log-in", async (req, res) => {

    const currentUrl = validateCurrentUrl(req.body.currentUrl || "/");

    const email = req.body.email.toLowerCase();
    const password = req.body.password;

    try {

        const result = await db.query(
            "SELECT id, password, is_verified, username FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.redirect(currentUrl);
            return res.status(401).send("Email not registered.");
        }

        if (result.rows[0].is_verified === false) {
            return res.status(401).send("The account is not yet verified, check your email.");
        }

        const user = result.rows[0]

        const doesMatch = await bcrypt.compare(password, user.password);

        if (!doesMatch) {
            return res.status(401).send("Password is not correct.");
        }

        const authToken = jwt.sign(
            {
                id: user.id,
                username: user.username,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN },
        );

        res.cookie("authToken", authToken, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.redirect(currentUrl);

    } catch (err) {
        console.error(err);
        return res.render("pages/message", {
            message: "Internal server error."
        });
    };

});

app.post("/log-out", (req, res) => {

    const currentUrl = validateCurrentUrl(req.body.currentUrl || "/");
    
    res.clearCookie("authToken");

    return res.redirect(currentUrl);

});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}.`);
});
