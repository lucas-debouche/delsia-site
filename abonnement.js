(() => {
  const FUNCTIONS_BASE = `${window.DELSIA_SUPABASE_URL}/functions/v1`;

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const params = new URLSearchParams(window.location.search);
  const flash = document.getElementById("flash");
  if (params.get("success") === "1" && flash) {
    flash.hidden = false;
    flash.textContent =
      "Paiement reçu. Rouvre l’app Delsia : ton plan Agent sera actif sous une minute. Tu peux aussi ouvrir Mon compte.";
  }
  if (params.get("canceled") === "1" && flash) {
    flash.hidden = false;
    flash.textContent = "Paiement annulé. Tu peux réessayer quand tu veux.";
  }

  let client;
  try {
    client = window.delsiaCreateSupabase();
  } catch (err) {
    console.warn(err);
    return;
  }

  const authBox = document.getElementById("authBox");
  const payBox = document.getElementById("payBox");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const portalBtn = document.getElementById("portalBtn");
  const payMsg = document.getElementById("payMsg");
  const userLabel = document.getElementById("userLabel");
  const planHint = document.getElementById("planHint");
  const checkoutActions = document.getElementById("checkoutActions");
  const manageActions = document.getElementById("manageActions");
  const logoutPayBtn = document.getElementById("logoutPayBtn");
  const logoutManageBtn = document.getElementById("logoutManageBtn");

  async function logout() {
    await client.auth.signOut();
    await refreshUi();
  }
  logoutPayBtn?.addEventListener("click", logout);
  logoutManageBtn?.addEventListener("click", logout);

  window.delsiaBindPasswordAuth(client, {
    onSignedIn: () => refreshUi(),
  });

  async function openPortal(session) {
    const res = await fetch(`${FUNCTIONS_BASE}/create-portal`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: window.DELSIA_SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
      },
      body: "{}",
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      throw new Error(data.error || "Impossible d’ouvrir le portail");
    }
    window.location.href = data.url;
  }

  async function refreshUi() {
    const {
      data: { session },
    } = await client.auth.getSession();

    if (!session?.user) {
      authBox.hidden = false;
      payBox.hidden = true;
      return;
    }

    authBox.hidden = true;
    payBox.hidden = false;
    userLabel.textContent = `Connecté : ${session.user.email}`;

    const { data: profile } = await client
      .from("users")
      .select("plan, subscription_status, stripe_customer_id")
      .eq("id", session.user.id)
      .maybeSingle();

    const hasStripeCustomer = !!profile?.stripe_customer_id;
    const isAgentActive =
      profile?.plan === "agent" &&
      ["active", "trialing", "past_due"].includes(profile?.subscription_status);

    if (hasStripeCustomer && (isAgentActive || profile?.plan === "agent")) {
      planHint.hidden = false;
      planHint.textContent =
        "Abonnement actif — carte, factures et résiliation via le bouton ci-dessous.";
      checkoutActions.hidden = true;
      manageActions.hidden = false;
    } else {
      planHint.hidden = true;
      checkoutActions.hidden = false;
      manageActions.hidden = true;
    }
  }

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
          apikey: window.DELSIA_SUPABASE_ANON_KEY,
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

  portalBtn?.addEventListener("click", async () => {
    payMsg.hidden = true;
    portalBtn.disabled = true;
    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session) {
      payMsg.hidden = false;
      payMsg.textContent = "Session expirée. Reconnecte-toi.";
      portalBtn.disabled = false;
      await refreshUi();
      return;
    }
    try {
      await openPortal(session);
    } catch (err) {
      payMsg.hidden = false;
      payMsg.textContent = err.message || "Erreur Stripe";
      portalBtn.disabled = false;
    }
  });

  client.auth.onAuthStateChange(() => {
    refreshUi();
  });

  refreshUi();
})();
