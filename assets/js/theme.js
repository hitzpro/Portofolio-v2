(() => {
  const KEY = "theme-mode", root = document.documentElement;
  const btn = document.getElementById("theme-toggle"), auto = document.getElementById("theme-auto");
  const saved = () => { try { const m = localStorage.getItem(KEY); return m === "light" || m === "dark" ? m : null; } catch (e) { return null; } };
  const byTime = () => { const h = new Date().getHours(); return h >= 6 && h < 18 ? "light" : "dark"; };

  function apply() {
    const mode = saved(), t = mode || byTime();
    if (root.dataset.theme !== t) {
      root.dataset.theme = t; root.setAttribute("data-bs-theme", t);
      window.dispatchEvent(new CustomEvent("themechange", { detail: t }));
    }
    btn.innerHTML = `<i class="bi bi-${t === "dark" ? "sun" : "moon"}"></i>`;
    btn.setAttribute("aria-label", t === "dark" ? "Ganti ke tema terang" : "Ganti ke tema gelap");
    auto.hidden = !mode;
  }
  btn.addEventListener("click", () => {
    try { localStorage.setItem(KEY, root.dataset.theme === "dark" ? "light" : "dark"); } catch (e) {}
    apply();
  });
  auto.addEventListener("click", () => { try { localStorage.removeItem(KEY); } catch (e) {} apply(); });
  // Perbarui otomatis saat tab kembali aktif dan tiap menit.
  document.addEventListener("visibilitychange", () => { if (!document.hidden) apply(); });
  setInterval(apply, 60000);
  apply();
})();