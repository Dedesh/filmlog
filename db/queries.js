import { db } from "./connection.js";

export async function addFilmToDatabase(filmData) {

    await db.query(
        `INSERT INTO films (id, title, release_date, poster_path)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO NOTHING`,
        [filmData.id, filmData.title, filmData.release_date, filmData.poster_path]
    );

};

export async function checkWatchlist(userId, filmId) {

    const result = await db.query(
        `SELECT EXISTS (
            SELECT 1 FROM watchlist
            WHERE user_id = $1
            AND film_id = $2
        )`,
        [userId, filmId]
    );

    return result.rows[0].exists;
};
export async function addWatchlist(userId, filmId) {

    await db.query(
        `INSERT INTO watchlist (user_id, film_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, film_id) DO NOTHING`,
        [userId, filmId]
    );

};
export async function removeWatchlist(userId, filmId) {

    await db.query(
        `DELETE FROM watchlist
        WHERE user_id = $1
        AND film_id = $2`,
        [userId, filmId]
    );

};

export async function checkWatched(userId, filmId) {

    const result = await db.query(
        `SELECT watched_on, rate, review, contains_spoilers, like_count
        FROM watched
        WHERE user_id = $1
        AND film_id = $2`,
        [userId, filmId]
    );

    if (result.rows.length > 0) {
        return {
            isFilmWatched: true,
            watchedAt: result.rows[0].watched_on,
            rate: result.rows[0].rate,
            review: result.rows[0].review,
            containsSpoilers: result.rows[0].contains_spoilers,
            likeCount: result.rows[0].like_count,

        }

    } else {
        return {
            isFilmWatched: false
        }

    };
};
export async function addWatched(userId, filmId) {

    await db.query(
        `INSERT INTO watched (user_id, film_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, film_id) DO NOTHING`,
        [userId, filmId]
    );

};
export async function removeWatched(userId, filmId) {

    await db.query(
        `DELETE FROM watched
        WHERE user_id = $1
        AND film_id = $2`,
        [userId, filmId]
    );

};

export async function updateRate(userId, filmId, rate) {

    await db.query(
        `UPDATE watched
        SET rate = $3
        WHERE user_id = $1
        AND film_id = $2`,
        [userId, filmId, rate]
    );

};

export async function removeRate(userId, filmId) {

    await db.query(
        `UPDATE watched
        SET rate = null
        WHERE user_id = $1
        AND film_id = $2`,
        [userId, filmId]
    );

};

export async function updateReview(userId, filmId, review, containsSpoilers) {

    await db.query(
        `UPDATE watched
        SET review = $3,
            contains_spoilers = $4
        WHERE user_id = $1
        AND film_id = $2`,
        [userId, filmId, review, containsSpoilers]
    );

};

export async function getPopularReviews(userId, filmId, limit, page) {

    const offset = (page - 1) * limit;

    const result = await db.query(
        `SELECT w.*, u.username, rl.user_id IS NOT NULL AS is_liked
        FROM watched w
        JOIN users u
            ON w.user_id = u.id
        LEFT JOIN review_likes rl
            ON rl.review_id = w.id
            AND rl.user_id = $1
        WHERE w.film_id = $2
        AND w.review IS NOT NULL
        ORDER BY w.like_count DESC
        LIMIT $3 OFFSET $4`,
        [userId, filmId, limit, offset]
    );

    return result;

};

export async function addReviewLike(userId, reviewId) {

    await db.query(
        `INSERT INTO review_likes (user_id, review_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING`,
        [userId, reviewId]
    );

    const response = await db.query(
        `UPDATE watched
        SET like_count = like_count + 1
        WHERE id = $1
        RETURNING like_count`,
        [reviewId]
    );

    return response.rows[0].like_count;

};
export async function removeReviewLike(userId, reviewId) {

    await db.query(
        `DELETE FROM review_likes
        WHERE user_id = $1
        AND review_id = $2`,
        [userId, reviewId]
    );

    const response = await db.query(
        `UPDATE watched
        SET like_count = like_count - 1
        WHERE id = $1
        RETURNING like_count`,
        [reviewId]
    );

    return response.rows[0].like_count;

};

export async function getUsername(userId) {

    const response = await db.query(
        `SELECT username
        FROM users
        WHERE id = $1`,
        [userId]
    );

    if (response.rows.length > 0) {
        return response.rows[0].username;

    } else {
        return false

    };

};

export async function getWatchlist(userId) {

    const response = await db.query(
        `SELECT film_id, title, poster_path
        FROM watchlist w
        JOIN films f on f.id = w.film_id
        WHERE w.user_id = $1
        ORDER BY listed_on DESC`,
        [userId]
    );

    return response.rows;

};

export async function getWatched(authorId, orderBy) {

    const response = await db.query(
        `SELECT w.id AS review_id, film_id, watched_on, rate, review, contains_spoilers, like_count, title, release_date, poster_path, rl.user_id IS NOT NULL AS is_liked
        FROM watched w
        JOIN films f on f.id = w.film_id
        LEFT JOIN review_likes rl
            ON rl.review_id = w.id
            AND rl.user_id = $1
        WHERE w.user_id = $1
        ORDER BY ${orderBy}`,
        [authorId]
    );

    return response.rows;

};
