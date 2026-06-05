const form = document.getElementById("loginForm");

const username = document.getElementById("username");
const password = document.getElementById("password");

const usernameError = document.getElementById("usernameError");
const passwordError = document.getElementById("passwordError");
const loginError = document.getElementById("loginError");

const togglePassword = document.getElementById("togglePassword");
const eyeIcon = document.getElementById("eyeIcon");
const loginBtn = document.getElementById("loginBtn");
/* ==========================================
   PASSWORD TOGGLE
========================================== */

togglePassword.addEventListener("click", () => {

    if (password.type === "password") {

        password.type = "text";

        eyeIcon.innerHTML = `
            <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83"/>
            <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-5.17 5.94"/>
            <path d="M6.61 6.61A21.75 21.75 0 0 0 1 12s4 8 11 8a10.94 10.94 0 0 0 5.39-1.39"/>
            <line x1="2" y1="2" x2="22" y2="22"/>
        `;

    } else {

        password.type = "password";

        eyeIcon.innerHTML = `
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/>
            <circle cx="12" cy="12" r="3"/>
        `;
    }

});


/* ==========================================
   LOGIN FORM
========================================== */

form.addEventListener("submit", (e) => {

    e.preventDefault();

    usernameError.textContent = "";
    passwordError.textContent = "";
    loginError.textContent = "";

    let valid = true;

    /* Username Validation */

    if (username.value.trim() === "") {

        usernameError.textContent = "Username is required";

        valid = false;
    }

    /* Password Validation */

    if (password.value.trim() === "") {

        passwordError.textContent = "Password is required";

        valid = false;
    }

    if (!valid) return;

    const user = username.value.trim();
    const pass = password.value.trim();

    /* Admin */

    if (user === "admin" && pass === "admin123") {

        window.location.href = "../admin/dashboard/index.html";
        return;
    }

    /* Client */

    if (user === "client" && pass === "client123") {

        window.location.href = "../client/dashboard/index.html";
        return;
    }

    /* Team */

    if (user === "team" && pass === "team123") {

        window.location.href = "../team/dashboard/index.html";
        return;
    }

    /* Invalid */

    loginError.textContent = "Invalid username or password";

});