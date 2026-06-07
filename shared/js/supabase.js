const SUPABASE_URL =
    "https://ejimbzeckvspmqffjeck.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_EKAoejg3HY3RWdxtiKzpSA_-ew8AYZ1";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

window.supabaseClient = supabaseClient;