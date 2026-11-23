(() => {
  const list = document.getElementById("repo-list");
  const state = document.getElementById("repo-state");
  const { githubUsername: user, selectedRepos, featuredRepos, maxRepos, sortBy } = CONFIG;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const setState = (msg, cls = "text-secondary") => { state.className = "small " + cls; state.textContent = msg; state.hidden = !msg; };

  function pick(repos) {
    const missing = [];
    let out = selectedRepos.length
      ? selectedRepos.map(n => { const r = repos.find(x => x.name.toLowerCase() === n.toLowerCase()); if (!r) missing.push(n); return r; }).filter(Boolean)
      : repos.filter(r => !r.fork);
    const sorters = {
      updated: (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
      stars: (a, b) => b.stargazers_count - a.stargazers_count,
      name: (a, b) => a.name.localeCompare(b.name)
    };
    if (sorters[sortBy]) out = [...out].sort(sorters[sortBy]);
    return { repos: out.slice(0, maxRepos), missing };
  }

  function card(r) {
    const featured = featuredRepos.map(x => x.toLowerCase()).includes(r.name.toLowerCase());
    return `<div class="col-md-6"><article class="repo h-100">
      <div class="d-flex justify-content-between align-items-start gap-2"><h3 class="h6 mb-1">${esc(r.name)}</h3>${featured ? '<span class="badge-soft">Featured</span>' : ""}</div>
      <p class="small text-secondary mb-3">${esc(r.description) || "Belum ada deskripsi."}</p>
      <div class="d-flex flex-wrap align-items-center gap-3 small text-secondary mt-auto">
        ${r.language ? `<span><i class="bi bi-code-slash"></i> ${esc(r.language)}</span>` : ""}
        <span><i class="bi bi-star"></i> ${r.stargazers_count}</span><span><i class="bi bi-diagram-2"></i> ${r.forks_count}</span>
        <a class="ms-auto link-accent" href="${esc(r.html_url)}" target="_blank" rel="noopener">Buka repository <i class="bi bi-box-arrow-up-right"></i></a>
      </div></article></div>`;
  }

  (async () => {
    setState("Memuat repository…");
    try {
      const res = await fetch(`https://api.github.com/users/${user}/repos?type=public&sort=updated&per_page=100`);
      if (res.status === 403) throw new Error("Batas permintaan GitHub API tercapai. Coba lagi beberapa saat lagi.");
      if (!res.ok) throw new Error(`GitHub API mengembalikan status ${res.status}.`);
      const { repos, missing } = pick(await res.json());
      list.innerHTML = repos.map(card).join("");
      if (!repos.length) return setState("Tidak ada repository publik yang cocok dengan konfigurasi di config.js.");
      setState(missing.length ? `Repository tidak ditemukan atau tidak publik: ${missing.join(", ")}.` : "");
    } catch (e) {
      setState(e.message || "Repository tidak dapat dimuat. Periksa koneksi internet Anda.", "text-danger");
    }
  })();
})();