(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const nav = document.getElementById("nav");
  const links = document.getElementById("navLinks");
  const toggle = document.getElementById("navToggle");
  const hasStage = Boolean(document.querySelector("[data-stage]"));
  let lastY = window.scrollY;

  const onScroll = () => {
    if (!nav) return;
    const y = window.scrollY;
    nav.classList.toggle("is-solid", !hasStage || y > 24);
    const menuOpen = links?.classList.contains("is-open");
    nav.classList.toggle("is-hidden", !menuOpen && y > lastY && y > 160);
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("is-open"));
    links.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => links.classList.remove("is-open"));
    });
  }
})();
