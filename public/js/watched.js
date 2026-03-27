// Reload page if going back and forth the URLs -> solves like button bug
window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
        window.location.reload();
    }
});

const userId = document.getElementById("data").dataset.userId;
let reviewId, isLiked, filmId, authorId;

// Handles full review pop-up
const reviewBtns = document.querySelectorAll(".log-review");
if (reviewBtns.length > 0) {

    const popUp = document.getElementById("review-pop-up");
    
    // Close pop-up
    const closeBtn = document.getElementById("close-review-btn");
    closeBtn.addEventListener("click", () => {
        popUp.classList.add("hidden");
    });
    ////

    
    const author = document.getElementById("review-author");
    const filmTitle = document.getElementById("review-film-title");
    const rate = document.getElementById("review-rate");
    const review = document.getElementById("review-review");
    const heartImg = document.getElementById("review-heart-img");
    const likeCount = document.getElementById("review-like-count");
    const watchedOn = document.getElementById("review-watched-on");

    // Like btn hover
    const likeBtn = document.getElementById("like-review-btn");
    const likeBtnElements = likeBtn.querySelectorAll("*");

    function mouseEnter() {
        if (userId === authorId) return;
        likeBtn.style.cursor = "pointer";
        likeBtnElements.forEach(e => {
            e.style.color = "white";
        });
    };
    function mouseLeave() {
        likeBtn.style.cursor = "default";
        likeBtnElements.forEach(e => {
            e.style.color = "var(--extra-light-detail-color)";
        });
    };
    
    likeBtn.addEventListener("mouseenter", mouseEnter);
    likeBtn.addEventListener("mouseleave", mouseLeave);
    ////

    // Show pop-up and setup data
    reviewBtns.forEach(btn => {
        btn.addEventListener("click", () => {

            reviewId = btn.dataset.reviewId;

            isLiked = btn.dataset.isLiked === "true";
            filmId = btn.dataset.filmId;
            authorId = btn.dataset.authorId;
            
            author.textContent = btn.dataset.username;
            filmTitle.innerHTML = `<a href="/film/${filmId}">${btn.dataset.filmTitle}</a>`;
            rate.textContent = btn.dataset.rate;
            rate.style.backgroundColor = `var(--rate-${btn.dataset.rate}-color)`;
            likeCount.textContent = btn.dataset.likeCount;
            watchedOn.textContent = new Date(btn.dataset.watchedOn).toLocaleDateString();

            // Hide and show spoilers
            if (btn.dataset.containsSpoilers === "true") {
                review.innerHTML = `<em class='spoilers-warning' id='spoilers-warning' style='font-weight: 200;'>
                                    This review may contain spoilers. 
                                    <span class="seeSpoilers">I can handle the truth.</span></em>`;
                document
                    .getElementById("spoilers-warning")
                    .addEventListener("click", () => {
                        review.innerHTML = btn.dataset.review;
                    });

            } else {
                review.innerHTML = btn.dataset.review;
            };
            ////

            // Like review init
            if (isLiked) {
                heartImg.src = "/images/liked.png"
                heartImg.alt = "Remove like from review"
            } else {
                heartImg.src = "/images/not-liked.png"
                heartImg.alt = "Like review"
            };
            ////
    
            popUp.classList.remove("hidden");
            
        });
    });

    // Like submit
    const likeReviewForm = document.getElementById("like-review-form");
    likeReviewForm.addEventListener("submit", async (e) => {

        e.preventDefault();

        // User cannot click to like its own review
        if (userId === authorId) return;
        ////

        e.submitter.disabled = true;
        
        const action = isLiked
                    ? "remove"
                    : "add";

        let data;

        try {
            const response = await fetch(`/film/${filmId}/like-review`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    reviewId,
                    action,
                }),
            });

            data = await response.json();

            if (response.ok) {
                if (action === "add") {
                    heartImg.src = "/images/liked.png";
                    heartImg.alt = "Remove like from review";
                    isLiked = true;

                } else if (action === "remove") {
                    heartImg.src = "/images/not-liked.png";
                    heartImg.alt = "Like review";
                    isLiked = false;
                };
            };

        } catch (error) {
            console.error(error);

        } finally {
            // Updates likeCount and isLiked information whithout needing to reload the page
            reviewBtns.forEach(btn => {
                if (btn.dataset.reviewId === reviewId) {
                    btn.dataset.isLiked = isLiked;
                    btn.dataset.likeCount = data.likeCount;
                };
            });
            ////
            
            likeCount.textContent = data.likeCount;
            e.submitter.disabled = false;

        };
    });
    ////

};
