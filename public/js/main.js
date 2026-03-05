// Handles "read more" btns in /find
const moreTextButtons = document.querySelectorAll('[id^="more-text-"]');

moreTextButtons.forEach((btn) => {

    const btnId = btn.id.replace("more-text-", "");
    const halfText = document.querySelector("#half-text-" + btnId);
    const fullText = document.querySelector("#full-text-" + btnId);

    btn.addEventListener("click", () => {

        btn.classList.toggle("hidden");
        halfText.classList.toggle("hidden");
        fullText.classList.toggle("hidden");
        
    });
});

// Log in fetch
const logInForm = document.querySelector("")