(() => {
  const wrap = document.getElementById("skills-3d");
  if (!wrap || typeof SKILL_LOGOS === "undefined") return;
  const label = document.getElementById("skills-3d-label");
  const HINT = "Geser logo untuk memutar";
  const noGL = () => wrap.classList.add("no-3d");
  const hasGL = () => { try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); } catch (e) { return false; } };
  if (!hasGL()) return noGL();
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mobile = matchMedia("(max-width: 767px)").matches;

  const load = src => new Promise((ok, fail) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = fail; document.head.appendChild(s); });
  // Three.js + SVGLoader baru dimuat saat area skills mendekati viewport.
  const io = new IntersectionObserver(async es => {
    if (!es[0].isIntersecting) return;
    io.disconnect();
    try {
      await load("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js");
      await load("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/SVGLoader.js");
      init();
    } catch (e) { noGL(); }
  }, { rootMargin: "300px" });
  io.observe(wrap);

  // SVG -> logo 3D: tiap path diekstrusi menjadi volume, lubang (mis. huruf JS) tetap terjaga.
  function logo(item) {
    const inner = new THREE.Group(), mat = new THREE.MeshStandardMaterial({ color: item.color, roughness: .55, metalness: .1, side: THREE.DoubleSide });
    new THREE.SVGLoader().parse(item.svg).paths.forEach(p => {
      if (p.userData.style.fill === "none") return;
      THREE.SVGLoader.createShapes(p).forEach(sh =>
        inner.add(new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 14, bevelEnabled: false, curveSegments: mobile ? 5 : 10 }), mat)));
    });
    inner.scale.y = -1; inner.position.set(-64, 64, -7);   // sumbu Y SVG terbalik; pusatkan viewBox 128x128
    const g = new THREE.Group(); g.add(inner); g.scale.setScalar(2 / 128);
    g.userData = { name: item.name, vx: 0, vy: 0 };
    return g;
  }

  function init() {
    const renderer = new THREE.WebGLRenderer({ antialias: !mobile, alpha: true });
    renderer.setPixelRatio(mobile ? 1 : Math.min(devicePixelRatio, 2));
    wrap.insertBefore(renderer.domElement, label);
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(40, 1, .1, 60);
    scene.add(new THREE.AmbientLight(0xffffff, .85));
    const sun = new THREE.DirectionalLight(0xffffff, .8); sun.position.set(3, 4, 6); scene.add(sun);

    const n = SKILL_LOGOS.length, gap = 2.5;
    const objs = SKILL_LOGOS.map((it, i) => { const o = logo(it); o.userData.base = 2 / 128; o.position.x = (i - (n - 1) / 2) * gap; scene.add(o); return o; });

    const draw = () => renderer.render(scene, camera);
    function resize() {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      renderer.setSize(w, h); camera.aspect = w / h;
      camera.position.z = Math.max(8, ((n * gap) / 2 + .4) / (Math.tan(camera.fov * Math.PI / 360) * camera.aspect));
      camera.updateProjectionMatrix(); draw();
    }
    new ResizeObserver(resize).observe(wrap);

    const ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), el = renderer.domElement;
    const top = o => { while (o && o.parent !== scene) o = o.parent; return o; };
    const pick = e => {
      const r = el.getBoundingClientRect();
      ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ptr, camera);
      const hit = ray.intersectObjects(objs, true)[0];
      return hit ? top(hit.object) : null;
    };
    let hover = null, drag = null, lx = 0, ly = 0;
    label.textContent = HINT;
    el.addEventListener("pointerdown", e => { drag = pick(e); lx = e.clientX; ly = e.clientY; if (drag) el.setPointerCapture(e.pointerId); });
    el.addEventListener("pointermove", e => {
      if (drag) { drag.userData.vy += (e.clientX - lx) * .002; drag.userData.vx += (e.clientY - ly) * .002; lx = e.clientX; ly = e.clientY; return; }
      hover = pick(e); label.textContent = hover ? hover.userData.name : HINT;
    });
    el.addEventListener("pointerup", () => { drag = null; });
    el.addEventListener("pointerleave", () => { hover = null; label.textContent = HINT; });

    let visible = false;
    function tick() {
      if (!visible || document.hidden) return;
      objs.forEach(o => {
        const d = o.userData;
        o.rotation.x += d.vx; o.rotation.y += d.vy + (reduce ? 0 : .004);
        d.vx *= .92; d.vy *= .92;
        const t = d.base * (o === hover ? 1.12 : 1); o.scale.setScalar(o.scale.x + (t - o.scale.x) * .15);
      });
      draw(); requestAnimationFrame(tick);
    }
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) tick(); }).observe(wrap);
    document.addEventListener("visibilitychange", () => { if (!document.hidden && visible) tick(); });
    window.addEventListener("themechange", draw);
    resize();
  }
})();