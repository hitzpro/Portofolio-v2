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