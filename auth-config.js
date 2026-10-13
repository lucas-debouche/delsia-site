// Config auth web partagée (compte + abonnement).
// flowType implicit : le lien e-mail fonctionne même ouvert sur un autre appareil.
// PKCE cassait le parcours quand le lien ouvrait l’app (deep link delsia://).

window.DELSIA_SUPABASE_URL = "https://gsyqfgwgrkonnnkethwd.supabase.co";
window.DELSIA_SUPABASE_ANON_KEY =
  window.DELSIA_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzeXFmZ3dncmtvbm5ua2V0aHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzUwODgsImV4cCI6MjA4MzcxMTA4OH0.rPLUPiSZShSCw24jbFAsEhmGt4Gt7wknT2KeW5Vr8Xw";

window.delsiaCreateSupabase = function delsiaCreateSupabase() {
  if (!window.supabase) {
    throw new Error("supabase-js manquant");
  }
  return window.supabase.createClient(
    window.DELSIA_SUPABASE_URL,
    window.DELSIA_SUPABASE_ANON_KEY,
    {
      auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        flowType: "implicit",
      },
    },
  );
};

window.delsiaCleanAuthHash = function delsiaCleanAuthHash() {
  const url = new URL(window.location.href);
  if (url.hash && /access_token|refresh_token|error=/.test(url.hash)) {
    history.replaceState({}, document.title, url.pathname + url.search);
  }
};
