import { auth, db } from "../js/firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

const form = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

const emailError = document.getElementById("emailError");
const passwordError = document.getElementById("passwordError");
const loginError = document.getElementById("loginError");

const togglePassword = document.getElementById("togglePassword");
const eyeIcon = document.getElementById("eyeIcon");
const loginBtn = document.getElementById("loginBtn");

const ROLE_ROUTES = {
  admin: "../admin/dashboard/index.html",
  client: "../client/dashboard/index.html",
  manager: "../team/dashboard/index.html",
  developer: "../team/dashboard/index.html",
  team: "../team/dashboard/index.html", // fallback for any older docs
};

let isRedirecting = false;

document.addEventListener("DOMContentLoaded", () => {
  bindEvents();
  checkAlreadyLoggedIn();
});

function bindEvents() {
  togglePassword.addEventListener("click", () => {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      eyeIcon.innerHTML = `
        <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83"/>
        <path d="M9.88 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a21.8 21.8 0 0 1-5.17 5.94"/>
        <path d="M6.61 6.61A21.75 21.75 0 0 0 1 12s4 8 11 8a10.94 10.94 0 0 0 5.39-1.39"/>
        <line x1="2" y1="2" x2="22" y2="22"/>
      `;
    } else {
      passwordInput.type = "password";
      eyeIcon.innerHTML = `
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/>
        <circle cx="12" cy="12" r="3"/>
      `;
    }
  });

  form.addEventListener("submit", handleLogin);
}

async function checkAlreadyLoggedIn() {
  onAuthStateChanged(auth, async (user) => {
    if (!user || isRedirecting) return;

    try {
      const profile = await loadProfile(user.uid);
      if (!profile) {
        await safeSignOut();
        return;
      }

      const route = getRouteForRole(profile.role);
      if (route) {
        isRedirecting = true;
        window.location.href = route;
      }
    } catch (error) {
      console.error("Session check failed:", error);
    }
  });
}

async function handleLogin(event) {
  event.preventDefault();

  clearErrors();

  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();

  let valid = true;

  if (!email) {
    emailError.textContent = "Email is required";
    valid = false;
  }

  if (!password) {
    passwordError.textContent = "Password is required";
    valid = false;
  }

  if (!valid) return;

  setLoading(true);

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const user = credential.user;

    const profile = await loadProfile(user.uid);

    if (!profile) {
      await safeSignOut();
      loginError.textContent = "Account profile not found.";
      return;
    }

    if (profile.active === false) {
      await safeSignOut();
      loginError.textContent = "This account is disabled.";
      return;
    }

    try {
      await updateDoc(doc(db, "users", user.uid), {
        lastLogin: serverTimestamp(),
      });
    } catch (e) {
      console.warn("Could not update lastLogin:", e);
    }

    const route = getRouteForRole(profile.role);

    if (!route) {
      await safeSignOut();
      loginError.textContent = "Invalid account role.";
      return;
    }

    isRedirecting = true;
    window.location.href = route;
  } catch (error) {
    console.error("Login failed:", error);

    if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
      loginError.textContent = "Invalid email or password.";
    } else if (error.code === "auth/too-many-requests") {
      loginError.textContent = "Too many attempts. Try again later.";
    } else if (error.code === "auth/network-request-failed") {
      loginError.textContent = "Network error. Check your connection.";
    } else {
      loginError.textContent = error.message || "Login failed.";
    }
  } finally {
    setLoading(false);
  }
}

async function loadProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

function getRouteForRole(role) {
  const normalized = String(role || "").toLowerCase().trim();
  return ROLE_ROUTES[normalized] || null;
}

async function safeSignOut() {
  try {
    await signOut(auth);
  } catch {
    // Ignore sign-out errors.
  }
}

function clearErrors() {
  emailError.textContent = "";
  passwordError.textContent = "";
  loginError.textContent = "";
}

function setLoading(isLoading) {
  loginBtn.disabled = isLoading;
  loginBtn.textContent = isLoading ? "Signing In..." : "Sign In";
}