
/**
 * AL TAOUFIK - Supabase Configuration
 */

window.SUPABASE_URL =
    "https://zymooestvjzunwacipws.supabase.co";

window.SUPABASE_ANON_KEY =
    "sb_publishable_Ba-qJ8TWXvT4Dzs7_wDsmw_V6AV1_cc";

window.supabaseClient = null;

if (
    window.supabase &&
    window.SUPABASE_URL.startsWith("https://") &&
    window.SUPABASE_ANON_KEY
) {
    window.supabaseClient = window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_ANON_KEY
    );

    console.log("AL TAOUFIK: Supabase connected.");
} else {
    console.error(
        "AL TAOUFIK: Supabase library or configuration is missing."
    );
}
