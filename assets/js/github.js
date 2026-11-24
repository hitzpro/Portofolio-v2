(() => {
  const list = document.getElementById("repo-list"), state = document.getElementById("repo-state"), dash = document.getElementById("gh-dash");
  const { githubUsername: user, selectedRepos, featuredRepos, maxRepos, sortBy } = CONFIG;
  const COLORS = { JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", Java: "#b07219", HTML: "#e34c26", CSS: "#563d7c", PHP: "#4F5D95", Astro: "#ff5a03", Vue: "#41b883", Shell: "#89e051", "C++": "#f34b7d", C: "#555555", Go: "#00ADD8", Kotlin: "#A97BFF", Dart: "#00B4AB", Blade: "#f7523f", "Jupyter Notebook": "#DA5B0B" };
  const color = l => COLORS[l] || "#8b949e";
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const setState = (msg, cls = "text-secondary") => { state.className = "small " + cls; state.textContent = msg; state.hidden = !msg; };
  const ago = d => {
    const s = (Date.now() - new Date(d)) / 1000, u = [[31536000, "tahun"], [2592000, "bulan"], [86400, "hari"], [3600, "jam"], [60, "menit"]];
    for (const [sec, n] of u) if (s >= sec) return `${Math.floor(s / sec)} ${n} lalu`;
    return "baru saja";
  };
  const fmtDate = d => new Date(d).toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  function pick(repos) {
    const missing = [];
    let out = selectedRepos.length
      ? selectedRepos.map(n => { const r = repos.find(x => x.name.toLowerCase() === n.toLowerCase()); if (!r) missing.push(n); return r; }).filter(Boolean)
      : repos.filter(r => !r.fork);
    const sorters = { updated: (a, b) => new Date(b.updated_at) - new Date(a.updated_at), stars: (a, b) => b.stargazers_count - a.stargazers_count, name: (a, b) => a.name.localeCompare(b.name) };
    if (sorters[sortBy]) out = [...out].sort(sorters[sortBy]);
    return { repos: out.slice(0, maxRepos), missing };
  }

  function dashboard(u, repos) {
    const own = repos.filter(r => !r.fork);
    const stars = own.reduce((a, r) => a + r.stargazers_count, 0), forks = own.reduce((a, r) => a + r.forks_count, 0);
    const langs = {}; own.forEach(r => { if (r.language) langs[r.language] = (langs[r.language] || 0) + 1; });
    const entries = Object.entries(langs).sort((a, b) => b[1] - a[1]), total = entries.reduce((a, [, n]) => a + n, 0) || 1;
    const last = repos.reduce((m, r) => (new Date(r.pushed_at || r.updated_at) > m ? new Date(r.pushed_at || r.updated_at) : m), new Date(0));
    dash.innerHTML = `
      <div class="gh-head">
        <img src="${esc(u.avatar_url)}&s=104" alt="Avatar GitHub ${esc(u.login)}" width="52" height="52" loading="lazy">
        <div><p class="gh-name">${esc(u.name || u.login)}</p><p class="gh-sub">@${esc(u.login)} · bergabung ${fmtDate(u.created_at)} · aktivitas terakhir ${ago(last)}</p></div>
        <a class="btn btn-outline btn-sm ms-auto" href="${esc(u.html_url)}" target="_blank" rel="noopener">Lihat profil</a>
      </div>
      <div class="gh-stats">
        <div class="gh-stat"><b>${u.public_repos}</b><span>Repositori publik</span></div>
        <div class="gh-stat"><b>${stars}</b><span>Total stars</span></div>
        <div class="gh-stat"><b>${forks}</b><span>Total forks</span></div>
        <div class="gh-stat"><b>${u.followers}</b><span>Followers</span></div>
      </div>
      ${entries.length ? `<div class="gh-bar" role="img" aria-label="Distribusi bahasa pemrograman">${entries.map(([l, n]) => `<i style="width:${(n / total) * 100}%;background:${color(l)}" title="${esc(l)}"></i>`).join("")}</div>
      <ul class="gh-legend">${entries.map(([l, n]) => `<li><span class="dot" style="background:${color(l)}"></span>${esc(l)} ${Math.round((n / total) * 100)}%</li>`).join("")}</ul>` : ""}`;
    dash.style.minHeight = "0";
  }

  function card(r) {
    const featured = featuredRepos.map(x => x.toLowerCase()).includes(r.name.toLowerCase());
    const topics = (r.topics || []).slice(0, 3).map(t => `<span class="tag">${esc(t)}</span>`).join("");
    return `<div class="col-md-6"><article class="repo2 h-100">
      <div class="repo2-top"><i class="bi bi-journal-code"></i><h3>${esc(r.name)}</h3>${featured ? '<span class="badge-soft ms-auto">Featured</span>' : ""}</div>
      <p class="repo2-desc">${esc(r.description) || "Belum ada deskripsi."}</p>
      ${topics ? `<div>${topics}</div>` : ""}
      <div class="repo2-meta">
        ${r.language ? `<span><span class="dot" style="background:${color(r.language)}"></span>${esc(r.language)}</span>` : ""}
        <span><i class="bi bi-star"></i> ${r.stargazers_count}</span><span><i class="bi bi-diagram-2"></i> ${r.forks_count}</span>
        <span><i class="bi bi-clock"></i> ${ago(r.pushed_at || r.updated_at)}</span>
      </div>
      <a class="repo2-link" href="${esc(r.html_url)}" target="_blank" rel="noopener">Buka repository <i class="bi bi-arrow-up-right"></i></a>
    </article></div>`;
  }

  async function getData() {
    const KEY = "gh-cache-v2";
    try { const c = JSON.parse(sessionStorage.getItem(KEY)); if (c && Date.now() - c.t < 600000) return c; } catch (e) {}
    const [ru, rr] = await Promise.all([fetch(`https://api.github.com/users/${user}`), fetch(`https://api.github.com/users/${user}/repos?type=public&sort=updated&per_page=100`)]);
    if (ru.status === 403 || rr.status === 403) throw new Error("Batas permintaan GitHub API tercapai. Coba lagi beberapa saat lagi.");
    if (!ru.ok || !rr.ok) throw new Error(`GitHub API mengembalikan status ${!ru.ok ? ru.status : rr.status}.`);
    const data = { t: Date.now(), user: await ru.json(), repos: await rr.json() };
    try { sessionStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
    return data;
  }

  (async () => {
    setState("Memuat data GitHub…");
    try {
      const { user: u, repos: all } = await getData();
      dashboard(u, all);
      const { repos, missing } = pick(all);
      list.innerHTML = repos.map(card).join("");
      if (!repos.length) return setState("Tidak ada repository publik yang cocok dengan konfigurasi di config.js.");
      setState(missing.length ? `Repository tidak ditemukan atau tidak publik: ${missing.join(", ")}.` : "");
    } catch (e) {
      dash.hidden = true;
      setState(e.message || "Data GitHub tidak dapat dimuat. Periksa koneksi internet Anda.", "text-danger");
    }
  })();
})();