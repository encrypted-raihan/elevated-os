const SUPABASE_URL =
    "https://qhewzaskyimalclwpypg.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_DrIfq4PXA7A2SXTgfHLvVw_jpSZOiS-";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

window.supabaseClient = supabaseClient;