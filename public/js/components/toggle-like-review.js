export function toggleLikeReview(userId, filmId) {

    const likeReviewForms = document.querySelectorAll(".like-review-form");
    if (likeReviewForms.length === 0) return;

    likeReviewForms.forEach(f => {

        f.addEventListener("submit", async (e) => {

            e.preventDefault();

            const heart = f.querySelector(".heart");

            // User cannot click to like its own review
            if (userId !== heart.dataset.authorId) return;
            ////

            e.submitter.disabled = true;
            
            const likeCount = f.querySelector(".like-count-number");
            const reviewId = heart.dataset.reviewId;
            const action = heart.dataset.isLiked === "true"
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
                        heart.src = "/images/liked.png";
                        heart.alt = "Remove like from review";
                        heart.dataset.isLiked = true;

                    } else if (action === "remove") {
                        heart.src = "/images/not-liked.png";
                        heart.alt = "Like review";
                        heart.dataset.isLiked = false;
                    };
                };

            } catch (error) {
                console.error(error);

            } finally {
                likeCount.textContent = data.likeCount;
                e.submitter.disabled = false;

            };
        });
    });

};