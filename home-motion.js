(() => {
  const root = document.documentElement;
  const { gsap, ScrollTrigger, SplitText, Lenis } = window;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!gsap || !ScrollTrigger || reduce) {
    root.classList.remove("has-motion");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);
  if (SplitText) gsap.registerPlugin(SplitText);
  root.classList.add("has-motion");

  /* ——— Défilement fluide ——— */
  let lenis = null;
  if (Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const scrollToY = (y) => (lenis ? lenis.scrollTo(y, { duration: 1.6 }) : window.scrollTo({ top: y, behavior: "smooth" }));

  let exampleY = null;
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      if (a.hasAttribute("data-to-example") && exampleY) {
        e.preventDefault();
        scrollToY(exampleY());
        return;
      }
      const target = document.getElementById(a.getAttribute("href").slice(1));
      if (!target || !target.offsetParent) return;
      e.preventDefault();
      scrollToY(target.getBoundingClientRect().top + window.scrollY);
    });
  });

  /* ——— Arrivée sur la page ——— */
  gsap
    .timeline({ defaults: { ease: "expo.out" } })
    .fromTo(".hl__in", { y: 0, yPercent: 110 }, { y: 0, yPercent: 0, duration: 1.2, stagger: 0.12 })
    .fromTo(
      [".hero__lead", ".hero__ctas", ".hero__meta"],
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, stagger: 0.08 },
      0.35
    )
    .fromTo(".stage__device", { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 1.4 }, 0.15);

  const mm = gsap.matchMedia();

  /* ——— Scène épinglée (ordinateur) ——— */
  mm.add("(min-width: 961px)", () => {
    const stage = document.querySelector("[data-stage]");
    const phone = stage.querySelector("[data-phone]");
    const device = stage.querySelector(".stage__device");
    const caps = [...stage.querySelectorAll("[data-cap]")];
    const ticks = [...stage.querySelectorAll("[data-tick]")];
    const home = stage.querySelector("[data-home]");
    const report = stage.querySelector("[data-report]");
    const inner = stage.querySelector("[data-report-inner]");
    const blocks = ["cr", "act", "own", "evt"].map((k) => stage.querySelector(`[data-blk="${k}"]`));
    const rings = stage.querySelectorAll("[data-ring]");
    const bars = stage.querySelectorAll("[data-wave] i");
    const timeEl = stage.querySelector("[data-time]");
    const hud = stage.querySelector("[data-hud]");

    const quote = stage.querySelector("[data-quote]");
    const split = SplitText && quote ? new SplitText(quote, { type: "words" }) : null;
    const words = split ? split.words : [];

    const shown = "inset(0% 0% 0% 0% round 14px)";
    const hidden = "inset(0% 0% 100% 0% round 14px)";
    const shiftTo = (el) => () => -Math.max(0, el.offsetTop + el.offsetHeight + 24 - report.clientHeight);
    const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
    const clock = { s: 0 };

    const tiltX = gsap.quickTo(device, "rotationX", { duration: 0.9, ease: "power3" });
    const tiltY = gsap.quickTo(device, "rotationY", { duration: 0.9, ease: "power3" });

    gsap.set(caps, { autoAlpha: 0, y: 40 });
    gsap.set(hud, { autoAlpha: 0 });
    gsap.set(phone, { rotate: -6, scale: 0.94, transformOrigin: "50% 60%" });
    gsap.set(report, { xPercent: 100, opacity: 1 });
    gsap.set(blocks, { clipPath: hidden, y: 24 });
    gsap.set(words, { opacity: 0.15 });

    const tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: {
        trigger: stage,
        start: "top top",
        end: () => "+=" + window.innerHeight * 5,
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (self.progress > 0.08) {
            tiltX(0);
            tiltY(0);
          }
        },
      },
    });

    const swap = (from, to, at) => {
      if (from) tl.to(from, { autoAlpha: 0, y: -40, duration: 0.5 }, at);
      tl.to(to, { autoAlpha: 1, y: 0, duration: 0.5 }, at + (from ? 0.25 : 0));
    };
    const fill = (i, at, duration) => tl.fromTo(ticks[i], { "--p": 0 }, { "--p": 1, ease: "none", duration }, at);
    const reveal = (el, at) => tl.to(el, { clipPath: shown, y: 0, duration: 0.7, ease: "power3.out" }, at);

    // La promesse s'écarte, le téléphone se redresse
    tl.to(".hl:nth-child(1)", { xPercent: -35, duration: 1 }, 0)
      .to(".hl:nth-child(2)", { xPercent: 35, duration: 1 }, 0)
      .to("[data-copy]", { autoAlpha: 0, duration: 0.6 }, 0.3)
      .to(phone, { rotate: 0, scale: 1, duration: 1 }, 0)
      .to(hud, { autoAlpha: 1, duration: 0.4 }, 0.8);
    swap(null, caps[0], 0.7);
    tl.addLabel("example", 1.2).addLabel("step1", 1.2);

    // Appui sur le micro, enregistrement
    tl.to("[data-mic]", { scale: 0.88, duration: 0.15, ease: "power1.in" }, 1.2)
      .to("[data-mic]", { scale: 1, duration: 0.35, ease: "back.out(3)" }, 1.35)
      .to("[data-idle]", { autoAlpha: 0, duration: 0.2 }, 1.25)
      .to("[data-rec]", { autoAlpha: 1, duration: 0.2 }, 1.35)
      .fromTo(
        rings,
        { scale: 1, opacity: 0.9 },
        { scale: 1.7, opacity: 0, duration: 0.6, stagger: 0.3, repeat: 1, ease: "none" },
        1.3
      )
      .to(clock, { s: 134, duration: 1.15, ease: "none", onUpdate: () => (timeEl.textContent = fmt(clock.s)) }, 1.3);
    if (words.length) {
      tl.to(words, { opacity: 1, duration: 0.15, stagger: 1.05 / words.length, ease: "none" }, 1.3);
    }
    for (let k = 0; k < 5; k++) {
      tl.to(
        bars,
        { scaleY: () => gsap.utils.random(0.2, 1), duration: 0.22, stagger: { each: 0.01, from: "random" }, ease: "sine.inOut" },
        1.35 + k * 0.22
      );
    }
    fill(0, 1.2, 1.25);

    // L'écran passe au compte rendu
    swap(caps[0], caps[1], 2.45);
    tl.to(home, { xPercent: -30, opacity: 0, duration: 0.7 }, 2.55).to(report, { xPercent: 0, duration: 0.7 }, 2.55);
    reveal(blocks[0], 3.05);
    fill(1, 2.45, 1.2);
    tl.addLabel("step2", 3.45);

    // Actions
    swap(caps[1], caps[2], 3.65);
    tl.to(inner, { y: shiftTo(blocks[1]), duration: 0.7 }, 3.75);
    reveal(blocks[1], 3.85);
    fill(2, 3.65, 1.2);
    tl.addLabel("step3", 4.6);

    // Version propriétaire
    swap(caps[2], caps[3], 4.85);
    tl.to(inner, { y: shiftTo(blocks[2]), duration: 0.7 }, 4.95);
    reveal(blocks[2], 5.05);
    fill(3, 4.85, 1.2);
    tl.addLabel("step4", 5.8);

    // Rendez-vous ajouté au calendrier
    swap(caps[3], caps[4], 6.05);
    tl.to(inner, { y: shiftTo(blocks[3]), duration: 0.7 }, 6.15);
    reveal(blocks[3], 6.25);
    tl.to("[data-cal]", { scale: 0.9, duration: 0.12, ease: "power1.in" }, 7.05)
      .to("[data-cal]", { scale: 1, backgroundColor: "#10b981", duration: 0.3, ease: "back.out(3)" }, 7.17)
      .to("[data-cal-a]", { autoAlpha: 0, duration: 0.12 }, 7.11)
      .to("[data-cal-b]", { autoAlpha: 1, duration: 0.12 }, 7.17);
    fill(4, 6.05, 1.25);
    tl.addLabel("step5", 7.5);

    // Le repère d'étapes s'efface avant que la scène ne se désépingle
    tl.to(hud, { autoAlpha: 0, duration: 0.3 }, 7.65);

    exampleY = () => tl.scrollTrigger.labelToScroll("example");

    // Repère d'étapes cliquable, étape active annoncée
    const bounds = [2.6, 3.8, 5.0, 6.2];
    let active = -1;
    const markActive = () => {
      const i = bounds.filter((b) => tl.time() >= b).length;
      if (i === active) return;
      active = i;
      ticks.forEach((t, k) => (k === i ? t.setAttribute("aria-current", "step") : t.removeAttribute("aria-current")));
    };
    tl.eventCallback("onUpdate", markActive);
    markActive();
    const goTo = (i) => {
      const y = tl.scrollTrigger.labelToScroll("step" + (i + 1));
      if (lenis) lenis.scrollTo(y, { duration: 1.2 });
      else window.scrollTo({ top: y, behavior: "smooth" });
    };
    const onTick = ticks.map((t, i) => {
      const fn = () => goTo(i);
      t.addEventListener("click", fn);
      return fn;
    });

    const onMove = (e) => {
      if (tl.scrollTrigger.progress > 0.08) return;
      tiltY((e.clientX / window.innerWidth - 0.5) * 16);
      tiltX(-(e.clientY / window.innerHeight - 0.5) * 10);
    };
    window.addEventListener("pointermove", onMove);

    return () => {
      window.removeEventListener("pointermove", onMove);
      ticks.forEach((t, i) => {
        t.removeEventListener("click", onTick[i]);
        t.removeAttribute("aria-current");
      });
      exampleY = null;
      split?.revert();
    };
  });

  /* ——— Mobile : les extraits d'écran montent avec le scroll ——— */
  mm.add("(max-width: 960px)", () => {
    gsap.utils.toArray(".mstep .crop").forEach((el) => {
      gsap.fromTo(
        el,
        { y: 60, opacity: 0, scale: 0.94 },
        { y: 0, opacity: 1, scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top 98%", end: "top 62%", scrub: 0.6 } }
      );
    });
  });

  /* ——— Bandeau : deux lignes en sens opposés ——— */
  gsap.utils.toArray("[data-band]").forEach((row) => {
    const toLeft = Number(row.dataset.band) < 0;
    gsap.fromTo(
      row,
      { xPercent: toLeft ? 0 : -30 },
      {
        xPercent: toLeft ? -30 : 0,
        ease: "none",
        scrollTrigger: { trigger: ".band", start: "top bottom", end: "bottom top", scrub: 0.5 },
      }
    );
  });

  /* ——— PDF : un cercle clair remplit la section, les feuilles se posent ——— */
  const paper = document.querySelector("[data-paper]");
  if (paper) {
    // Centre du cercle à 20vh du haut de la section (cf. styles.css). Le titre n'apparaît
    // qu'une fois entièrement couvert par le cercle, pour rester lisible à chaque instant.
    const head = paper.querySelector("[data-paper-head]");
    const circle = { p: 0 };
    let fullR = 0;
    let headR = 0;
    const measure = () => {
      const w = paper.offsetWidth;
      const cy = window.innerHeight * 0.2;
      fullR = Math.ceil(Math.hypot(w / 2, Math.max(cy, paper.offsetHeight - cy))) + 2;
      const x0 = head.offsetLeft;
      const y0 = head.offsetTop;
      const x1 = x0 + head.offsetWidth;
      const y1 = y0 + head.offsetHeight;
      headR = Math.max(...[[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => Math.hypot(x - w / 2, y - cy)));
    };
    const ease = gsap.parseEase("power2.out");
    const render = () => {
      const r = circle.p * fullR;
      paper.style.setProperty("--r", r + "px");
      const t = ease(gsap.utils.clamp(0, 1, (r - headR) / (fullR * 0.2)));
      gsap.set(head, { autoAlpha: t, y: 32 * (1 - t) });
    };
    measure();
    render();
    gsap.to(circle, {
      p: 1,
      ease: "none",
      onUpdate: render,
      scrollTrigger: {
        trigger: paper,
        start: "top 85%",
        end: "top 20%",
        scrub: 0.5,
        onRefresh: () => {
          measure();
          render();
        },
      },
    });

    const land = { trigger: "[data-sheets]", start: "top bottom", end: "center 55%", scrub: 0.6 };
    gsap.fromTo('[data-sheet="1"]', { y: 240, rotate: -11, scale: 0.86 }, { y: 0, rotate: -2, scale: 1, ease: "none", scrollTrigger: land });
    gsap.fromTo('[data-sheet="2"]', { y: 380, rotate: 13, scale: 0.86 }, { y: 0, rotate: 2.5, scale: 1, ease: "none", scrollTrigger: land });
  }

  /* ——— Fiabilité : les mots se soulignent ——— */
  const trustCrop = document.querySelector("[data-trust] .crop");
  if (trustCrop) {
    gsap.fromTo(
      "[data-mark]",
      { "--u": 0 },
      { "--u": 1, ease: "none", stagger: 0.4, scrollTrigger: { trigger: trustCrop, start: "top 80%", end: "top 40%", scrub: 0.5 } }
    );
    gsap.from("[data-term]", {
      scale: 0.5,
      autoAlpha: 0,
      duration: 0.7,
      ease: "back.out(2.5)",
      stagger: 0.12,
      scrollTrigger: { trigger: trustCrop, start: "top 50%" },
    });
  }

  /* ——— Lignes qui se tracent ——— */
  gsap.utils.toArray("[data-facts], [data-line]").forEach((el) => {
    gsap.fromTo(el, { "--l": 0 }, { "--l": 1, duration: 1.4, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 92%" } });
  });
  gsap.from("[data-facts] > div", {
    y: 40,
    autoAlpha: 0,
    duration: 1,
    ease: "expo.out",
    stagger: 0.1,
    scrollTrigger: { trigger: "[data-facts]", start: "top 88%" },
  });
  gsap.utils.toArray("[data-rise]").forEach((el) => {
    gsap.from(el, { y: 30, autoAlpha: 0, duration: 1, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 92%" } });
  });

  /* ——— Titres : ligne par ligne, lettre par lettre ——— */
  document.fonts.ready.then(() => {
    if (SplitText) {
      gsap.utils.toArray("[data-split]").forEach((el) => {
        if (!el.offsetParent || el.offsetWidth < 2) return;
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 1.1,
              ease: "expo.out",
              stagger: 0.08,
              scrollTrigger: { trigger: el, start: "top 85%" },
            }),
        });
      });
      gsap.utils.toArray("[data-chars]").forEach((el) => {
        SplitText.create(el, {
          type: "words,chars,lines",
          mask: "lines",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.chars, {
              yPercent: 115,
              duration: 0.9,
              ease: "expo.out",
              stagger: 0.016,
              scrollTrigger: { trigger: el, start: "top 80%" },
            }),
        });
      });
    }
    ScrollTrigger.refresh();
  });
})();
