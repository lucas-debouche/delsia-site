(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const nav = document.getElementById("nav");
  const onScroll = () => {
    if (!nav) return;
    const hasHero = Boolean(document.querySelector(".hero"));
    nav.classList.toggle("is-solid", !hasHero || window.scrollY > 24);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("is-open"));
    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => links.classList.remove("is-open"));
    });
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

  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          if (entry.target.id === "magic" || entry.target.classList.contains("magic")) {
            entry.target.classList.add("is-in");
          }
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }
})();
