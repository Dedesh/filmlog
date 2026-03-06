import "./config/env.js";
import { db } from "./config/db.js";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import axios from "axios";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { registerLimiter } from "./middlewares/rate-limiters.js";
import { sendVerificationEmail } from "./services/email-service.js";
import jwt from "jsonwebtoken";
import { authenticateUser } from "./middlewares/auth.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use(authenticateUser);

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

    const email = req.body.email.toLowerCase();
    const username = req.body.username;
    const password = req.body.password;
    
    try {

        const isEmailTaken = await db.query("SELECT email FROM users WHERE email = $1 AND is_verified = true", [email]);
        const isUsernameTaken = await db.query("SELECT username FROM users WHERE username ILIKE $1 AND is_verified = true", [username]);

        if (isEmailTaken.rows.length > 0) {
            return res.status(409).json({ error: "This email is already registered." });  
        } else if (isUsernameTaken.rows.length > 0) {
            return res.status(409).json({ error: "This username is already in use." });
        } else {
            await db.query(
                `DELETE FROM users
                WHERE (email = $1 OR username = $2)
                AND is_verified = false`,
                [email, username]); // Deletes unverified users so the new user can register
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

        return res.status(201).json({
            success: true,
            message: "Account created successfully, verify your email before logging in.",
        });

    } catch (err) {
        console.error(err);        
        return res.status(500).json({ error: "Internal server error." });
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

    const email = req.body.email.toLowerCase();
    const password = req.body.password;

    try {

        const result = await db.query(
            "SELECT id, password, is_verified, username FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: "Email not registered." });
        }

        if (result.rows[0].is_verified === false) {
            return res.status(401).json({ error: "The account is not yet verified, check your email." });
        }

        const user = result.rows[0]

        const doesMatch = await bcrypt.compare(password, user.password);

        if (!doesMatch) {
            return res.status(401).json({ error: "Password is not correct." });
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

        return res.json({ success: true });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Internal server error." });
    };

});

app.post("/log-out", (req, res) => {
    
    res.clearCookie("authToken");

    return res.sendStatus(204);

});

app.get("/message", (req, res) => {

    const message = req.query.message;

    res.render("pages/message", {
        message
    });
    
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}.`);
});
