import jwt from "jsonwebtoken";

export function authenticateUser(req, res, next) {

    const authToken = req.cookies.authToken;

    if (!authToken) {
        res.locals.user = null;
        return next();
    }

    try {

        const decoded = jwt.verify(
            authToken,
            process.env.JWT_SECRET
        );

        res.locals.user = {
            id: decoded.id,
            username: decoded.username,
        };

    } catch (err) {
        res.locals.user = null;
    };

    next();
};
