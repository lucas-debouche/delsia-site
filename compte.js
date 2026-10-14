(() => {
  const FUNCTIONS_BASE = `${window.DELSIA_SUPABASE_URL}/functions/v1`;

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  let client;
  try {
    client = window.delsiaCreateSupabase();
  } catch (err) {
    console.warn(err);
    return;
  }

  const authBox = document.getElementById("authBox");
  const accountBox = document.getElementById("accountBox");
  const planLabel = document.getElementById("planLabel");
  const userLabel = document.getElementById("userLabel");
  const statusLabel = document.getElementById("statusLabel");
  const periodLabel = document.getElementById("periodLabel");
  const subscribeBtn = document.getElementById("subscribeBtn");
  const portalBtn = document.getElementById("portalBtn");
  const accountMsg = document.getElementById("accountMsg");
  const portalHint = document.getElementById("portalHint");
  const logoutBtn = document.getElementById("logoutBtn");

  const PLAN_LABELS = {
    beta: "Beta (accès test)",
    trial: "Essai",
    agent: "Agent — 12 € / mois",
    expired: "Gratuit limité",
  };

  function planTitle(plan) {
    return PLAN_LABELS[plan] || plan || "—";
  }

  async function logout() {
    await client.auth.signOut();
    await refreshUi();
  }

  logoutBtn?.addEventListener("click", logout);

  window.delsiaBindPasswordAuth(client, {
    onSignedIn: () => refreshUi(),
  });

  portalBtn?.addEventListener("click", async () => {
    accountMsg.hidden = true;
    portalBtn.disabled = true;
    const {
      data: { session },
    } = await client.auth.getSession();
    if (!session) {
      accountMsg.hidden = false;
      accountMsg.textContent = "Session expirée. Reconnecte-toi.";
      portalBtn.disabled = false;
      await refreshUi();
      return;
    }

    try {
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
        throw new Error(
          data.error ||
            "Aucun abonnement Stripe lié. Utilise « S’abonner » pour en créer un.",
        );
      }
      window.location.href = data.url;
    } catch (err) {
      accountMsg.hidden = false;
      accountMsg.textContent = err.message || "Erreur Stripe";
      portalBtn.disabled = false;
    }
  });

  async function refreshUi() {
    const {
      data: { session },
    } = await client.auth.getSession();

    if (!session?.user) {
      authBox.hidden = false;
      accountBox.hidden = true;
      return;
    }

    authBox.hidden = true;
    accountBox.hidden = false;
    userLabel.textContent = session.user.email || "";

    const { data: profile, error } = await client
      .from("users")
      .select(
        "plan, subscription_status, period_end, stripe_customer_id, quota_monthly",
      )
      .eq("id", session.user.id)
      .maybeSingle();

    if (error || !profile) {
      planLabel.textContent = "Profil en cours de création…";
      statusLabel.textContent =
        "Recharge la page dans quelques secondes. Si ça continue, ouvre l’app une fois.";
      if (subscribeBtn) subscribeBtn.hidden = false;
      return;
    }

    planLabel.textContent = planTitle(profile.plan);
    statusLabel.textContent = `Statut : ${profile.subscription_status || "none"} · Quota : ${
      profile.plan === "beta"
        ? "illimité (beta)"
        : `${profile.quota_monthly} CR / mois`
    }`;

    if (profile.period_end) {
      periodLabel.hidden = false;
      const d = new Date(profile.period_end);
      periodLabel.textContent = `Période en cours jusqu’au ${d.toLocaleDateString("fr-FR")}`;
    } else {
      periodLabel.hidden = true;
    }

    const isPaidAgent =
      profile.plan === "agent" &&
      ["active", "trialing", "past_due"].includes(profile.subscription_status);

    // Gérer toujours visible ; S’abonner seulement si pas déjà Agent payant
    if (subscribeBtn) subscribeBtn.hidden = isPaidAgent;
    if (portalBtn) {
      portalBtn.hidden = false;
      portalBtn.className = isPaidAgent
        ? "btn btn--primary"
        : "btn btn--ghost-on-navy";
    }
    if (portalHint) portalHint.hidden = false;
  }

  client.auth.onAuthStateChange(() => {
    refreshUi();
  });

  refreshUi();
})();
