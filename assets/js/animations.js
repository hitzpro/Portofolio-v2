(() => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  window.addEventListener("load", () => {
    if (!window.gsap || !window.ScrollTrigger) return; // konten tetap terbaca tanpa GSAP
    gsap.registerPlugin(ScrollTrigger);
    gsap.from("#home .hero-in", { opacity: 0, y: 16, duration: .7, stagger: .09, ease: "power2.out" });
    gsap.utils.toArray("[data-reveal]").forEach(el =>
      gsap.from(el, { opacity: 0, y: 20, duration: .6, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } }));
    // Parallax hanya di desktop dan hanya untuk bentuk dekoratif hero.
    gsap.matchMedia().add("(min-width: 992px)", () => {
      gsap.utils.toArray("[data-parallax]").forEach(el =>
        gsap.to(el, { yPercent: parseFloat(el.dataset.parallax), ease: "none", scrollTrigger: { trigger: "#home", start: "top top", end: "bottom top", scrub: true } }));
    });
  });
})();