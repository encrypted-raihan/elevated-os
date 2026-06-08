import { initializeApp } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

import { getStorage } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDfPiyOKDJEmW5hHOcAePAfX4mex8h6Gng",
  authDomain: "elevated-os.firebaseapp.com",
  projectId: "elevated-os",
  storageBucket: "elevated-os.firebasestorage.app",
  messagingSenderId: "23806838484",
  appId: "1:23806838484:web:2f4fd018ef860f4d3add41"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;