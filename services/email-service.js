import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.TRANSPORTER_EMAIL,
        pass: process.env.TRANSPORTER_PASSWORD
    }
});

export async function sendVerificationEmail(email, username, verifyLink) {
    try {
        await transporter.sendMail({
            from: `"FilmLog" <${process.env.TRANSPORTER_EMAIL}>`,
            to: email,
            subject: "Verify your account",
            html: `
                <h1>Hello ${username},</h1>
                <p>Greetings from the FilmLog community.</p>
                <a href="${verifyLink}">Click here to verify your account</a>
                <hr>
                <p>If you haven't signed up for FilmLog, please ignore this email.</p>
            `,
        });
    } catch (err) {
        console.error("Error sending email:", err);
        throw err;
    };
};