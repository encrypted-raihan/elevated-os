import { auth } from "../firebase.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

export function requireAuth() {
  return new Promise((resolve) => {

    onAuthStateChanged(auth, (user) => {

      if (!user) {
        window.location.href = "..../../index/index.html";
        return;
      }

      resolve(user);

    });

  });
}   