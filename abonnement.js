(() => {
  const SUPABASE_URL = "https://gsyqfgwgrkonnnkethwd.supabase.co";
  // Clé anon / publishable uniquement — jamais la service_role
  const SUPABASE_ANON_KEY =
    window.DELSIA_SUPABASE_ANON_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdzeXFmZ3dncmtvbm5ua2V0aHdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxMzUwODgsImV4cCI6MjA4MzcxMTA4OH0.rPLUPiSZShSCw24jbFAsEhmGt4Gt7wknT2KeW5Vr8Xw";

  const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const params = new URLSearchParams(window.location.search);
  const flash = document.getElementById("flash");
  if (params.get("success") === "1" && flash) {
    flash.hidden = false;
    flash.textContent =
      "Paiement reçu. Rouvre l’app Delsia : ton plan Agent sera actif sous une minute.";
  }
  if (params.get("canceled") === "1" && flash) {
    flash.hidden = false;
    flash.textContent = "Paiement annulé. Tu peux réessayer quand tu veux.";
  }

  if (!window.supabase || SUPABASE_ANON_KEY.startsWith("REPLACE_")) {
    console.warn(
      "Configure window.DELSIA_SUPABASE_ANON_KEY ou remplace REPLACE_WITH_SUPABASE_ANON_KEY dans abonnement.js",
    );
    return;
  }

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const authBox = document.getElementById("authBox");
  const payBox = document.getElementById("payBox");
  const emailInput = document.getElementById("emailInput");
  const magicBtn = document.getElementById("magicBtn");
  const magicMsg = document.getElementById("magicMsg");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const payMsg = document.getElementById("payMsg");
  const userLabel = document.getElementById("userLabel");

  async function refreshUi() {
    const {
      data: { session },
    } = await client.auth.getSession();

    if (session?.user) {
      authBox.hidden = true;
      payBox.hidden = false;
      userLabel.textContent = `Connecté : ${session.user.email}`;
    } else {
      authBox.hidden = false;
      payBox.hidden = true;
    }
  }

  magicBtn?.addEventListener("click", async () => {
    const email = (emailInput?.value || "").trim();
    if (!email) {
      magicMsg.hidden = false;
      magicMsg.textContent = "Indique ton e-mail.";
      return;
    }
    magicBtn.disabled = true;
    const { error } = await client.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/abonnement.html`,
      },
    });
    magicBtn.disabled = false;
    magicMsg.hidden = false;
    magicMsg.textContent = error
      ? error.message
      : "Lien envoyé. Ouvre-le depuis ta boîte mail pour te connecter.";
  });

  checkoutBtn?.addEventListener("click", async () => {
    payMsg.hidden = true;
    checkoutBtn.disabled = true;
    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session) {
      payMsg.hidden = false;
      payMsg.textContent = "Session expirée. Reconnecte-toi.";
      checkoutBtn.disabled = false;
      await refreshUi();
      return;
    }

    try {
      const res = await fetch(`${FUNCTIONS_BASE}/create-checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: session.user.email }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Impossible de créer la session Stripe");
      }
      window.location.href = data.url;
    } catch (err) {
      payMsg.hidden = false;
      payMsg.textContent = err.message || "Erreur Stripe";
      checkoutBtn.disabled = false;
    }
  });

  client.auth.onAuthStateChange(() => {
    refreshUi();
  });

  refreshUi();
})();
