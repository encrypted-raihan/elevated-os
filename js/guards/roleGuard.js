import { db } from "../firebase.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

export async function requireRole(uid, allowedRoles = []) {

  const snap = await getDoc(
    doc(db, "users", uid)
  );

  if (!snap.exists()) {
    throw new Error("Profile not found");
  }

  const profile = snap.data();

  if (!allowedRoles.includes(profile.role)) {

    switch (profile.role) {

      case "admin":
        window.location.href =
          "/admin/dashboard/index.html";
        break;

      case "client":
        window.location.href =
          "/client/dashboard/index.html";
        break;

      default:
        window.location.href =
          "/team/dashboard/index.html";
    }

    return null;
  }

  return profile;
}