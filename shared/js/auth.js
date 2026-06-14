
/*
=========================================
ELEVATED WEB SOLUTIONS
AUTHENTICATION
=========================================
*/

const db = window.supabaseClient;

/* =========================================
   LOGIN
========================================= */

async function login(email, password) {

    const { data, error } =
        await db.auth.signInWithPassword({

            email: email,
            password: password

        });

    if (error) {
        throw error;
    }

    return data.user;

}

/* =========================================
   LOGOUT
========================================= */

async function logout() {

    await db.auth.signOut();

    window.location.href = "..../../index/index.html";

}

/* =========================================
   CURRENT USER
========================================= */

async function getCurrentUser() {

    const { data: { user } } = await db.auth.getUser();

    return user;

}

/* =========================================
   PROFILE
========================================= */

async function getProfile() {

    const user = await getCurrentUser();

    if (!user) return null;

    const { data, error } = await db
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (error) return null;

    return data;

}

/* =========================================
   ROLE REDIRECT
========================================= */

async function redirectByRole() {

    const profile = await getProfile();

    if (!profile) {

        window.location.href = "..../../index/index.html";
        return;

    }

    if (profile.role === "admin") {

        window.location.href = "../admin/dashboard/index.html";

    } else if (profile.role === "team") {

        window.location.href = "../team/dashboard/index.html";

    } else if (profile.role === "client") {

        window.location.href = "../client/dashboard/index.html";

    }

}

/* =========================================
   AUTH GUARD
========================================= */

async function requireAuth() {

    const user = await getCurrentUser();

    if (!user) {

        window.location.href = "..../../index/index.html";

    }

}
