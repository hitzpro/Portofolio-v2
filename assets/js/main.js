(() => {
  const links = [...document.querySelectorAll(".nav-link[href^='#']")];
  const sections = links.map(l => document.querySelector(l.getAttribute("href"))).filter(Boolean);
  const collapse = document.getElementById("nav");

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) links.forEach(l => l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach(s => obs.observe(s));

  links.forEach(l => l.addEventListener("click", () => {
    if (collapse.classList.contains("show")) bootstrap.Collapse.getInstance(collapse)?.hide();
  }));
  document.getElementById("year").textContent = new Date().getFullYear();
})();

// Tilt 3D pada foto hero (nonaktif di perangkat sentuh dan reduced motion)
(() => {
  const el = document.querySelector("[data-tilt]");
  if (!el || matchMedia("(prefers-reduced-motion: reduce), (hover: none)").matches) return;
  const inner = el.querySelector(".tilt-inner"), MAX = 14; let raf;
  el.addEventListener("pointermove", e => {
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      inner.style.transform = `rotateY(${(x - .5) * 2 * MAX}deg) rotateX(${-(y - .5) * 2 * MAX}deg) scale(1.03)`;
      el.style.setProperty("--gx", x * 100 + "%"); el.style.setProperty("--gy", y * 100 + "%");
    });
  });
  el.addEventListener("pointerleave", () => { cancelAnimationFrame(raf); inner.style.transform = ""; });
})();

// Logo proyek: jika file belum ada, tampilkan inisial
document.querySelectorAll("img[data-fallback]").forEach(img => {
  const swap = () => { const s = document.createElement("span"); s.className = "logo-fallback"; s.textContent = img.dataset.fallback; s.setAttribute("aria-hidden", "true"); img.replaceWith(s); };
  img.addEventListener("error", swap, { once: true });
  if (img.complete && img.naturalWidth === 0 && img.currentSrc) swap();
});