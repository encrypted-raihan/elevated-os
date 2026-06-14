import { db } from "../firebase.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

import { homeFor, normalizeRole } from "../utils/permissions.js";

export async function requireRole(uid, allowedRoles = []) {

  const snap = await getDoc(
    doc(db, "users", uid)
  );

  if (!snap.exists()) {
    throw new Error("Profile not found");
  }

  const profile = snap.data();
  const role = normalizeRole(profile.role);

  if (!allowedRoles.map(normalizeRole).includes(role)) {
    window.location.href = homeFor(role);
    return null;
  }

  return profile;
}
