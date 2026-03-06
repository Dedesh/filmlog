import * as v from "https://cdn.skypack.dev/validator";

// Dinamic URI for /find/:searchText
const searchBar = document.getElementById("search-bar");
if (searchBar) {

    searchBar.addEventListener("submit", (event) => {

        event.preventDefault();
        
        const input = event.target.searchText.value.trim();
        
        if (!input) return;
        
        window.location.href = "/find/" + encodeURIComponent(input);
        
    });
};

// Handles Log in pop-up
const logInBtn = document.getElementById("log-in-btn");
if (logInBtn) {

    const popUp = document.querySelector("#log-in-pop-up");
    
    logInBtn.addEventListener("click", (event) => {

        event.preventDefault();

        popUp.classList.toggle("hidden");

        const emailInput = popUp.querySelector("input[name='email']");
        emailInput.focus();
        
    });

    const closeBtn = document.getElementById("log-in-close-btn");
    closeBtn.addEventListener("click", (event) => {

        event.preventDefault();
        
        popUp.classList.toggle("hidden");

    });
};

// Handles Register pop-up
const registerBtn = document.getElementById("register-btn");
if (registerBtn) {

    const popUp = document.querySelector("#register-pop-up");
    
    registerBtn.addEventListener("click", (event) => {

        event.preventDefault();

        popUp.classList.toggle("hidden");

        const emailInput = popUp.querySelector("input[name='email']");
        emailInput.focus();

    });

    const closeBtn = document.getElementById("register-close-btn");
    closeBtn.addEventListener("click", (event) => {

        event.preventDefault();

        popUp.classList.toggle("hidden");

    });
};

// Register with fetch
const registerForm = document.getElementById("register-form");
if (registerForm) {

    const registerError = document.getElementById("register-error");

    registerForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        const email = registerForm.email.value;
        const username = registerForm.username.value;
        const password = registerForm.password.value;

        registerError.textContent = "";

        if (!v.isEmail(email)) {
            registerError.textContent = "Invalid email.";

        } else if (!v.isLength(username, { min: 4, max: 12 })) {
            registerError.textContent = "Username must be 4 - 12 characters long.";
            
        } else if (!v.isAlpha(username)) {
            registerError.textContent = "Username must contain only letters.";

        } else if (!v.isLength(password, { min: 8, max: 20 })) {
            registerError.textContent = "Password must be 8 - 20 characters long.";

        } else if (!v.isAlphanumeric(password)) {
            registerError.textContent = "Password must contain only letters and numbers.";

        };

        if (registerError.textContent !== "") {
            registerError.classList.remove("hidden");
            return;
        };

        try {

            const response = await fetch("/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email, username, password
                }),
            });

            const data = await response.json();
            
            if (!response.ok) {
                registerError.textContent = data.error;
                registerError.classList.remove("hidden");
                return;
            };

            window.location.href = `/message?message=${encodeURIComponent(data.message)}`;

        } catch (err) {
            console.error(err);
            registerError.textContent = "Internal server error."
            registerError.classList.remove("hidden");
        };

    });
};

// Log in with fetch
const logInForm = document.getElementById("log-in-form");
if (logInForm) {

    const logInError = document.getElementById("log-in-error");

    logInForm.addEventListener("submit", async (event) => {
    
        event.preventDefault();
    
        const email = logInForm.email.value;
        const password = logInForm.password.value;
    
        try {
    
            const response = await fetch("/log-in", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email, password
                }),
            });
            
            if (!response.ok) {
                const data = await response.json();
                logInError.textContent = data.error;
                logInError.classList.remove("hidden");
                return;
            }

            if (window.location.pathname === "/verify" || window.location.pathname === "/message") {
                window.location.href = "/";
                return;
            };
            
            window.location.reload();
    
        } catch (err) {
            console.error(err);
            logInError.textContent = "Internal server error.";
            logInError.classList.remove("hidden");
        };
    
    });
};

// Log out with fetch
const logOutForm = document.getElementById("log-out-form");
if (logOutForm) {
    logOutForm.addEventListener("submit", async (event) => {

        event.preventDefault();

        await fetch("/log-out", {
            method: "POST",
        });

        window.location.reload();

    });
};