import { toggleLikeReview } from "/js/components/toggle-like-review.js";

// Reload page if going back and forth the URLs -> solves like button bug
window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

// Gets data
const data = document.getElementById("data").dataset;
const userId = data.userId;
const filmId = data.filmId;
let isFilmWatched = data.isFilmWatched === "true";
let isFilmInWatchlist = data.isFilmInWatchlist === "true";
let filmRate = Number(data.filmRate);
let isFilmReviewed = data.isFilmReviewed === "true";
let isEditing = isFilmWatched && !isFilmReviewed
                ? true
                : false;

// Handles watch btn functionality
const watchForm = document.getElementById("watch-form");
if (watchForm) {

    // Handles the delete review pop-up
    const deleteReviewPopUp = document.getElementById("delete-review-pop-up");
    const deleteReviewBtn = document.getElementById("delete-review-btn");
    const keepReviewBtn = document.getElementById("keep-review-btn");

    keepReviewBtn.addEventListener("click", () => {
        deleteReviewPopUp.classList.add("hidden");
    });
    deleteReviewBtn.addEventListener("click", (event) => {
        watchHandler(event);
        deleteReviewPopUp.classList.add("hidden");
    });

    const watchImg = document.getElementById("watch-img");
    const watchText = document.getElementById("watch-text");
    const watchBtn = document.getElementById("watch-btn");

    const reviewItems = document.querySelectorAll("#rate-hr, #rate-form, #review-hr, #review-div");
    
    function updateWatchUI() {
        if (isFilmWatched) {
            watchImg.src = "/images/watched.png";
            watchText.textContent = "Watched";
            reviewItems.forEach(i => i.classList.remove("hidden"));

        } else {
            watchImg.src = "/images/not-watched.png";
            watchText.textContent = "Watch";
            isFilmReviewed = false
            reviewItems.forEach(i => i.classList.add("hidden"));
        };
    };
    
    watchForm.addEventListener("mouseenter", () => {
        watchText.textContent = isFilmWatched ? "Remove" : "Mark as Watched";
    });
    watchForm.addEventListener("mouseleave", () => {
        updateWatchUI();
    });
    
    async function watchHandler(event) {
    
        event.preventDefault();
        watchBtn.disabled = true;

        if ((isFilmReviewed || filmRate > 0) && event.submitter === watchBtn) {
            deleteReviewPopUp.classList.remove("hidden");
            watchBtn.disabled = false;
            return;
        };
    
        const action = isFilmWatched ? "remove" : "add";
        
        try {
            const response = await fetch(`/film/${filmId}/watched`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action,
                    filmId
                })
            });
    
            if (response.ok) {
                isFilmWatched = !isFilmWatched;
            };
    
        } catch (error) {
            console.error(error);
    
        } finally {
            updateWatchUI();
            if (action === "remove") {
                isEditing = true;
                filmRate = 0;
                updateRateUI(filmRate);
                updateReviewCharCount();
                updateReviewBtnUI();
            };
            watchBtn.disabled = false;

        };
    };

    watchForm.addEventListener("submit", async (event) => watchHandler(event));

};

// Handles watchlist btn functionality
const watchlistForm = document.getElementById("watchlist-form");
if (watchlistForm) {

    const watchlistImg = document.getElementById("watchlist-img");
    const watchlistText = document.getElementById("watchlist-text");
    const watchlistBtn = document.getElementById("watchlist-btn");
    
    function updateWatchlistUI() {
        if (isFilmInWatchlist) {
            watchlistImg.src = "/images/in-watchlist.png";
            watchlistText.textContent = "On Watchlist";
        } else {
            watchlistImg.src = "/images/not-in-watchlist.png";
            watchlistText.textContent = "Watchlist";
        };
    };
    
    watchlistForm.addEventListener("mouseenter", () => {
        watchlistText.textContent = isFilmInWatchlist ? "Remove" : "Add";
    });
    watchlistForm.addEventListener("mouseleave", () => {
        updateWatchlistUI();
    });
    
    watchlistForm.addEventListener("submit", async (event) => {
    
        event.preventDefault();
        watchlistBtn.disabled = true;
    
        const action = isFilmInWatchlist ? "remove" : "add";
        
        try {
            const response = await fetch(`/film/${filmId}/watchlist`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    action,
                    filmId
                })
            });
    
            if (response.ok) {
                isFilmInWatchlist = !isFilmInWatchlist;
            };
    
        } catch (error) {
            console.error(error);
    
        } finally {
            updateWatchlistUI();
            watchlistBtn.disabled = false;
        };
    
    });

};

// Handles film ratings
const rateForm = document.getElementById("rate-form");
if (rateForm) {

    const rateBtns = rateForm.querySelectorAll(".rate-btn");

    function updateRateUI(clickedBtnValue) {
        rateBtns.forEach(b => {
            if (clickedBtnValue === 0) {
                b.style.filter = "brightness(1.1)";
            } else if (b.value != clickedBtnValue) {
                b.style.filter = "brightness(0.15)";
            } else {
                b.style.filter = "brightness(1.1)";
            };
        });
    };

    updateRateUI(filmRate);

    // Rate btns hover
    rateBtns.forEach(b => {
        b.addEventListener("mouseenter", () => {
            if (b.value != filmRate) {
                b.style.filter = "brightness(1.5)";
            } else {
                b.style.filter = "brightness(0.6)";
            };
        });
    });
    rateBtns.forEach(b => {
        b.addEventListener("mouseleave", () => {
            updateRateUI(filmRate);
        });
    });

    // Disables and enables rate btns
    function disableRateBtns() {
        rateBtns.forEach(btn => {
            btn.disabled = true;
        });
    };
    function enableRateBtns() {
        rateBtns.forEach(btn => {
            btn.disabled = false;
        });
    };

    // Rate submit
    rateForm.addEventListener("submit", async (event) => {

        event.preventDefault();
        disableRateBtns();

        const rate = Number(event.submitter.value);

        const action = rate === filmRate
            ? "remove"
            : "add";

        try {
            const response = await fetch(`/film/${filmId}/rate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    filmId,
                    action,
                    rate,
                }),
            });

            if (response.ok) {
                if (action === "add") {
                    filmRate = rate
                };
                if (action === "remove") {
                    filmRate = 0
                };
            };
            
        } catch (error) {
            console.error(error);

        } finally {
            updateRateUI(filmRate);
            enableRateBtns();

        };
    });

};

// Handles film reviews
const reviewForm = document.getElementById("review-form");
if (reviewForm) {

    // Review text char count
    const charCount = document.getElementById("review-char-count");
    const reviewText = document.getElementById("review-text");

    function updateReviewCharCount() {
        const textLength = reviewText.value.length;
        charCount.textContent = textLength;
        if (!isEditing && isFilmReviewed) {
            charCount.style.color = "inherit";
        } else if (textLength >= 180) {
            charCount.style.color = "orangered";
        } else if (textLength >= 120) {
            charCount.style.color = "orange";
        } else {
            charCount.style.color = "inherit";
        };
    };

    updateReviewCharCount();

    reviewText.addEventListener("input", updateReviewCharCount);

    // Makes the spoilers checkbox also check when clicking the label or the wrapper (the gap between checkbox and label)
    const spoilersCheckbox = document.getElementById("spoilers-checkbox");
    spoilersCheckbox.addEventListener("click", (e) => {
        e.stopPropagation();
    });
    const spoilersWrapper = document.getElementById("spoilers-wrapper");
    spoilersWrapper.addEventListener("click", () => {
        if (!spoilersCheckbox.disabled) {
            spoilersCheckbox.checked = !spoilersCheckbox.checked;
        };
    });

    // Handles the EDIT / SAVE btn
    const reviewBtn = document.getElementById("review-btn");

    function updateReviewBtnUI() {
        if (!isFilmReviewed || isEditing) {
            reviewBtn.textContent = "SAVE";
            reviewBtn.style.backgroundColor = "var(--light-green)";
            reviewText.readOnly = false;
            spoilersCheckbox.disabled = false;
        } else {
            reviewBtn.textContent = "EDIT";
            reviewBtn.style.backgroundColor = "var(--blue)";
            reviewText.readOnly = true;
            spoilersCheckbox.disabled = true;
        };
        updateReviewCharCount()
    };

    updateReviewBtnUI();

    reviewBtn.addEventListener("mouseenter", () => {
        reviewBtn.style.backgroundColor = !isFilmReviewed || isEditing ? "var(--extra-light-green)" : "var(--light-blue)";
    });
    reviewBtn.addEventListener("mouseleave", () => {
        reviewBtn.style.backgroundColor = !isFilmReviewed || isEditing ? "var(--light-green)" : "var(--blue)";
    });

    // Review submit
    reviewForm.addEventListener("submit", async (event) => {

        event.preventDefault();
        reviewBtn.disabled = true;

        if (reviewBtn.textContent === "EDIT") {
            isEditing = true;
            updateReviewBtnUI();
            reviewBtn.disabled = false;
            return;
        };

        const review = reviewForm.review.value.trim();
        const containsSpoilers = reviewForm.spoilersCheckbox.checked ? true : false;

        try {
            const response = await fetch(`/film/${filmId}/review`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    filmId,
                    review,
                    containsSpoilers,
                })
            });

            if (response.ok) {
                isFilmReviewed = true;
            };

        } catch (error) {
            console.error(error);

        } finally {
            isEditing = false;
            updateReviewBtnUI();
            reviewBtn.disabled = false;

        };
    });

};

// Handles popular reviews
const likeReviewForms = document.querySelectorAll(".popular-review-div .like-review-form");
if (likeReviewForms.length > 0) {

    // Like review hover
    likeReviewForms.forEach(f => {
        const btn = f.querySelector(".like-review-btn");

        // Disables interaction if the review belongs to the current user
        if (userId !== f.authorId.value) {
            btn.style.pointerEvents = "none";
            return;
        };

        const btnElements = btn.querySelectorAll("*");
        btn.addEventListener("mouseenter", () => {
            btnElements.forEach(e => e.style.color = "var(--extra-light-detail-color)");
        });
        btn.addEventListener("mouseleave", () => {
            btnElements.forEach(e => e.style.color = "var(--light-detail-color)");
        });
    });

    // See review with spoilers
    const spoilersWarnings = document.querySelectorAll(".spoilers-warning");
    if (spoilersWarnings.length > 0) {

        spoilersWarnings.forEach(w => {

            const reviewId = w.id.replace("spoilers-warning-", "")
            const spoilersWarning = document.getElementById(`spoilers-warning-${reviewId}`);
            const spoilersReview = document.getElementById(`spoilers-review-${reviewId}`);

            w.addEventListener("click", () => {
                spoilersWarning.classList.add("hidden");
                spoilersReview.classList.remove("hidden");
            });
        });

    };

    toggleLikeReview(userId, filmId);

};