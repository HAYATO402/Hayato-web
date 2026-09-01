(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  const header = document.querySelector(".site-header");

  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 48);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const hero = document.querySelector(".interactive-hero");
  if (hero && finePointer.matches && !reducedMotion.matches) {
    let frame = 0;
    hero.addEventListener("pointermove", (event) => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        hero.style.setProperty("--pointer-x", `${event.clientX - rect.left}px`);
        hero.style.setProperty("--pointer-y", `${event.clientY - rect.top}px`);
        frame = 0;
      });
    });
  }

  const spotlightElements = document.querySelectorAll(
    ".point-item, .result-card, .service-card, .issue-card, .vecport-proof-grid > div"
  );

  spotlightElements.forEach((element) => {
    element.classList.add("spotlight-card");
    if (!finePointer.matches || reducedMotion.matches) return;
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      element.style.setProperty("--spot-x", `${event.clientX - rect.left}px`);
      element.style.setProperty("--spot-y", `${event.clientY - rect.top}px`);
    });
  });

  document.querySelectorAll(".magnetic-button").forEach((button) => {
    if (!finePointer.matches || reducedMotion.matches) return;
    button.addEventListener("pointermove", (event) => {
      const rect = button.getBoundingClientRect();
      const x = (event.clientX - rect.left - rect.width / 2) * 0.08;
      const y = (event.clientY - rect.top - rect.height / 2) * 0.08;
      button.style.setProperty("--magnetic-x", `${x}px`);
      button.style.setProperty("--magnetic-y", `${y}px`);
      button.style.setProperty("--button-x", `${event.clientX - rect.left}px`);
      button.style.setProperty("--button-y", `${event.clientY - rect.top}px`);
    });
    button.addEventListener("pointerleave", () => {
      button.style.setProperty("--magnetic-x", "0px");
      button.style.setProperty("--magnetic-y", "0px");
    });
  });

  const revealGroups = [
    ".target-card",
    ".issue-card",
    ".result-card",
    ".list-card li",
    ".process-step",
    ".service-card"
  ];

  revealGroups.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.classList.add("reveal-item");
      element.style.setProperty("--reveal-order", String(index));
      element.style.setProperty("--reveal-delay", `${Math.min(index, 8) * 70}ms`);
    });
  });

  const formatCount = (value, format) => {
    if (format === "verified") {
      const formatted = Math.round(value).toLocaleString("en-US");
      return `${formatted} / ${formatted}`;
    }
    if (format === "decimal") return value.toFixed(3);
    if (format === "percent") return `${Math.round(value)}%`;
    return Math.round(value).toLocaleString("en-US");
  };

  const animateCount = (element) => {
    if (element.dataset.counted === "true") return;
    element.dataset.counted = "true";
    const target = Number(element.dataset.countTo);
    const format = element.dataset.countFormat || "integer";

    if (reducedMotion.matches) {
      element.textContent = formatCount(target, format);
      return;
    }

    const duration = 1200;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = formatCount(target * eased, format);
      if (progress < 1) window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  };

  if (!("IntersectionObserver" in window) || reducedMotion.matches) {
    document.querySelectorAll(".reveal-item").forEach((element) => element.classList.add("is-visible"));
    document.querySelectorAll("[data-count-to]").forEach(animateCount);
    return;
  }

  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -6%" }
  );

  document.querySelectorAll(".reveal-item").forEach((element) => revealObserver.observe(element));

  const countObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.55 }
  );

  document.querySelectorAll("[data-count-to]").forEach((element) => countObserver.observe(element));
})();
