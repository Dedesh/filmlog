import rateLimit from "express-rate-limit";

const timeInMinutes = 5;
const timeInMs = 1000 * 60 * timeInMinutes;
const tries = 5;

export const registerLimiter = rateLimit({
  windowMs: timeInMs,
  max: tries,
  message: `Too many registration attempts. Try again after ${timeInMinutes} minutes.`,
});
