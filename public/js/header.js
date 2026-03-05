// Dinamic URI for /find/:searchText
function handleSearch(event) {

    event.preventDefault();

    const input = event.target.searchText.value.trim();

    if (!input) return;

    window.location.href = "/find/" + encodeURIComponent(input);
    
};

// Handles Log in and Register pop-ups
function toggleLogInPopUp(event) {

    event.preventDefault();

    const popUp = document.querySelector("#log-in-pop-up");
    popUp.classList.toggle("hidden");

    if (!popUp.classList.contains("hidden")) {
        const emailInput = popUp.querySelector("input[name='email']");
        emailInput.focus();
    }

};

function toggleRegisterPopUp(event) {

    event.preventDefault();

    const popUp = document.querySelector("#register-pop-up");
    popUp.classList.toggle("hidden");

    if (!popUp.classList.contains("hidden")) {
        const emailInput = popUp.querySelector("input[name='email']");
        emailInput.focus();
    }

};
