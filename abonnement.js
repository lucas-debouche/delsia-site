(() => {
  const FUNCTIONS_BASE = `${window.DELSIA_SUPABASE_URL}/functions/v1`;

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  const params = new URLSearchParams(window.location.search);
  const flash = document.getElementById("flash");
  if (params.get("success") === "1" && flash) {
    flash.hidden = false;
    flash.textContent =
      "Paiement reçu. Rouvrez l’app Delsia : votre plan Agent sera actif d’ici une minute. Vous pouvez aussi ouvrir Mon compte.";
  }
  if (params.get("canceled") === "1" && flash) {
    flash.hidden = false;
    flash.textContent = "Paiement annulé. Vous pouvez réessayer quand vous voulez.";
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
      throw new Error(data.error || "Impossible d’ouvrir la gestion de l’abonnement. Réessayez dans un instant.");
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

    // Un seul bloc : Gérer (Agent) OU Payer (sinon) — jamais les deux
    const canManage =
      profile?.plan === "agent" &&
      !!profile?.stripe_customer_id &&
      ["active", "trialing", "past_due", "canceled"].includes(
        profile?.subscription_status,
      );

    if (canManage) {
      planHint.hidden = false;
      planHint.textContent =
        "Un abonnement Agent est rattaché à ce compte. Carte, factures et résiliation : bouton ci-dessous.";
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
      payMsg.textContent = "Session expirée. Reconnectez-vous.";
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
        throw new Error(data.error || "Impossible d’ouvrir la page de paiement. Réessayez dans un instant.");
      }
      window.location.href = data.url;
    } catch (err) {
      payMsg.hidden = false;
      payMsg.textContent = err.message || "Le paiement n’a pas pu démarrer. Réessayez dans un instant.";
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
      payMsg.textContent = "Session expirée. Reconnectez-vous.";
      portalBtn.disabled = false;
      await refreshUi();
      return;
    }
    try {
      await openPortal(session);
    } catch (err) {
      payMsg.hidden = false;
      payMsg.textContent = err.message || "Une erreur est survenue. Réessayez dans un instant.";
      portalBtn.disabled = false;
    }
  });

  client.auth.onAuthStateChange(() => {
    refreshUi();
  });

  refreshUi();
})();
