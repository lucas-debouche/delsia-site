(() => {
  // Magic link / Site URL → souvent https://delsia.fr#access_token=…
  // Sans ça, l’accueil ignore les tokens et la session est perdue.
  const hash = window.location.hash || "";
  if (/(access_token|refresh_token|type=magiclink|type=signup|type=recovery)/.test(hash)) {
    const path = (window.location.pathname || "").toLowerCase();
    const alreadyOnAuth =
      path.includes("compte.html") ||
      path.includes("abonnement.html") ||
      path.includes("auth-callback.html");
    if (!alreadyOnAuth) {
      const next = new URLSearchParams(window.location.search).get("next");
      const target =
        next === "abonnement" ? "abonnement.html" : "compte.html";
      window.location.replace(target + hash);
      return;
    }
  }

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const nav = document.getElementById("nav");
  const onScroll = () => {
    if (!nav || !document.querySelector(".hero")) return;
    nav.classList.toggle("is-solid", window.scrollY > 24);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("is-open"));
  }

  const tabButtons = document.querySelectorAll(".cr-tabs button");
  const panels = document.querySelectorAll(".cr-panel");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      tabButtons.forEach((b) => {
        const active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });
      panels.forEach((panel) => {
        const active = panel.getAttribute("data-panel") === tab;
        panel.classList.toggle("is-active", active);
        panel.hidden = !active;
      });
    });
  });
})();
