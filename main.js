/* Arizona Granite & Stone — V2 "The Slab Yard" site script (no build, no dependencies) */

/* ===== CONFIG — the only place the form email lives ===== */
const CONFIG = {
  formEmail: "arizonagraniteandstone@gmail.com",
  formEndpoint: "https://formsubmit.co/ajax/", // + formEmail
  phoneDisplay: "(623) 498-9056",
  phoneTel: "+16234989056",
  // Real customer reviews only. Leave empty and the Reviews section stays hidden.
  // Shape: { text: "…", name: "First name L.", where: "Google" }
  reviews: [],
};

(() => {
  "use strict";
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 900px)").matches;

  /* ---------- header: glass once you scroll ---------- */
  const top = $("#top-bar");
  const onScroll = () => top.classList.toggle("scrolled", scrollY > 24);
  onScroll(); addEventListener("scroll", onScroll, { passive: true });

  /* ---------- mobile menu ---------- */
  const nav = $("#nav"), menuBtn = $(".menu-btn");
  menuBtn?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    menuBtn.innerHTML = `<svg aria-hidden="true"><use href="#i-${open ? "close" : "menu"}"/></svg>`;
  });
  $$("#nav a").forEach(a => a.addEventListener("click", () => { nav.classList.remove("open"); menuBtn?.setAttribute("aria-expanded", "false"); menuBtn.innerHTML = `<svg aria-hidden="true"><use href="#i-menu"/></svg>`; }));

  const yearEl = $("#year"); if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- THE CUT LINE: a bridge-saw laser that follows a fine pointer over the hero ---------- */
  const hero = $(".hero"), cut = $("#cut");
  if (hero && cut && finePointer) {
    const h = $(".cut-h", cut), v = $(".cut-v", cut);
    hero.addEventListener("pointermove", ev => {
      const r = hero.getBoundingClientRect();
      h.style.top = `${ev.clientY - r.top}px`;
      v.style.left = `${ev.clientX - r.left}px`;
      hero.classList.add("cutting");
    });
    hero.addEventListener("pointerleave", () => hero.classList.remove("cutting"));
  }

  /* =====================================================================
     EDGE PROFILES — cross-sections drawn to one scale. 1 unit = 1/40 inch → 3/4" = 30 units
     ===================================================================== */
  const T = 30, X = 150, Y = 22, STRIP = 34, APRON = 30, PROJ = 16, PSTRIP = 40;
  const f = n => +n.toFixed(2);
  const FACES = {
    square: (x, y, h) => `L${x},${y} L${x},${y + h}`,
    bevel: (x, y, h) => { const c = h >= 60 ? 18 : 12; return `L${x - c},${y} L${x},${y + c} L${x},${y + h}`; },
    quirk: (x, y, h) => `L${x - 4},${y} L${x},${y + 4} L${x},${y + h}`,
    demi: (x, y, h) => { const r = h >= 60 ? 26 : 24; return `L${x - r},${y} A${r},${r} 0 0 1 ${x},${y + r} L${x},${y + h}`; },
    bullnose: (x, y, h) => { const r = h / 2; return `L${x - r},${y} A${r},${r} 0 0 1 ${x - r},${y + h}`; },
    doubleBull: (x, y, h) => { const r = h / 4; return `L${x - r},${y} A${r},${r} 0 0 1 ${x - r},${y + h / 2} A${r},${r} 0 0 1 ${x - r},${y + h}`; },
    cove: (x, y, h) => { const r = h >= 60 ? 12 : 10; return `L${x - r},${y} A${r},${r} 0 0 0 ${x},${y + r} L${x},${y + h}`; },
    ogee: (x, y, h) => { const a = 9, b = 16.5, w = a + b; return `L${x - w},${y} A${a},${a} 0 0 0 ${x - w + a},${y + a} A${b},${b} 0 0 1 ${x},${y + a + b} L${x},${y + h}`; },
    dupont: (x, y, h) => { const s = 6, R = h - s; return `L${x - R - 3},${y} L${x - R - 3},${y + s} L${x - R},${y + s} A${R},${R} 0 0 1 ${x},${y + h}`; },
    chiseled: (x, y, h) => {
      const jag = [0, 1.6, -1.1, 1.9, -0.6, 1.3, -1.4, 1.0, -0.4, 1.7, -0.9, 0.6, 0];
      return `L${x},${y} ` + jag.map((d, i) => `L${f(x + d)},${f(y + (h * i) / (jag.length - 1))}`).join(" ");
    },
    ogeeBull: (x, y, h) => { const a = 10, R = (h - a) / 2; return `L${x - a - R},${y} A${a},${a} 0 0 0 ${x - R},${y + a} A${R},${R} 0 0 1 ${x},${y + a + R} A${R},${R} 0 0 1 ${x - R},${y + h}`; },
    dupontBull: (x, y, h) => { const s = 10, R = (h - s) / 2; return `L${x - R},${y} L${x - R},${y + s} A${R},${R} 0 0 1 ${x - R},${y + h}`; },
    coveSquare: (x, y, h) => FACES.cove(x, y, 30).replace(/ L[\d.]+,[\d.]+$/, "") + ` L${x},${y + h}`,
  };
  const SEAM_X = { doubleBull: X - 15 };
  const MITER_K = { square: 0, bevel: 9, quirk: 2, demi: 7.03, cove: 8.49 };

  function profile(e) {
    let d, seams = [], depth;
    if (e.build === "slab") {
      depth = T;
      d = `M0,${Y} ${FACES[e.face](X, Y, T)} L0,${Y + T} Z`;
    } else if (e.build === "laminate") {
      depth = 2 * T;
      d = `M0,${Y} ${FACES[e.face](X, Y, 2 * T)} L${X - STRIP},${Y + 2 * T} L${X - STRIP},${Y + T} L0,${Y + T} Z`;
      seams.push(`M${X - STRIP},${Y + T} L${(SEAM_X[e.face] ?? X) - 1},${Y + T}`);
    } else if (e.build === "miter") {
      depth = 3 * T;
      d = `M0,${Y} ${FACES[e.face](X, Y, 3 * T)} L${X - APRON},${Y + 3 * T} L${X - APRON},${Y + T} L0,${Y + T} Z`;
      const k = MITER_K[e.face] ?? 0;
      seams.push(`M${X - APRON},${Y + T} L${f(X - k)},${f(Y + k)}`);
    } else {
      depth = 2 * T;
      const xt = X - PROJ;
      d = `M0,${Y} ${FACES[e.face](xt, Y, T)} ${FACES[e.lower](X, Y + T, T)} L${X - PSTRIP},${Y + 2 * T} L${X - PSTRIP},${Y + T} L0,${Y + T} Z`;
      seams.push(`M${X - PSTRIP},${Y + T} L${xt},${Y + T}`);
    }
    return { d, seams, depth };
  }

  const TOTAL = { slab: '3/4"', laminate: '1 1/2"', miter: '2 1/4"', projected: '1 1/2"' };
  let uid = 0;
  // mode: "card" (tight box) · "stage" (big, with the inch call-out) · "scale" (shared box for the three-up, so thickness compares truthfully)
  function edgeSVG(e, mode = "card") {
    const { d, seams, depth } = profile(e);
    const id = `fade${++uid}`;
    const stage = mode === "stage";
    const vb = stage ? `44 ${f(Y + depth / 2 - 57)} 152 114` : mode === "scale" ? `30 ${Y - 14} 182 ${3 * T + 28}` : `0 ${Y - 12} 186 ${depth + 24}`;
    const fadeFrom = stage ? 44 : mode === "scale" ? 30 : 0, fadeTo = stage ? 88 : mode === "scale" ? 80 : 46;
    const dimX = X + 14;
    const dim = mode !== "card"
      ? `<g aria-hidden="true"><path class="p-dim" d="M${dimX},${Y} L${dimX},${Y + depth} M${dimX - 3},${Y} L${dimX + 3},${Y} M${dimX - 3},${Y + depth} L${dimX + 3},${Y + depth}"/>
         <text class="p-dim-text" x="${dimX + 6}" y="${Y + depth / 2 + 2.5}">${TOTAL[e.build]}</text></g>`
      : `<path class="p-dim" aria-hidden="true" d="M${dimX},${Y} L${dimX},${Y + depth} M${dimX - 2.5},${Y} L${dimX + 2.5},${Y} M${dimX - 2.5},${Y + depth} L${dimX + 2.5},${Y + depth}"/>`;
    return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs><linearGradient id="${id}g" gradientUnits="userSpaceOnUse" x1="${fadeFrom}" x2="${fadeTo}" y1="0" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>
      <mask id="${id}"><rect x="-10" y="-10" width="400" height="300" fill="url(#${id}g)"/></mask></defs>
      <g mask="url(#${id})"><path class="p-body" d="${d}"/>${seams.map(s => `<path class="p-seam" d="${s}"/>`).join("")}</g>${dim}</svg>`;
  }

  const GROUPS = [
    { id: "slab", label: '3/4" slab', note: '3/4", 2 cm or 3 cm — one layer of stone' },
    { id: "laminate", label: '1 1/2" built-up', note: '1 1/2" — a strip laminated under the front for a thicker look' },
    { id: "miter", label: '2 1/4" mitered', note: '2 1/4" — a mitered apron for a deep, solid-block look' },
    { id: "projected", label: "Stacked & projected", note: "Two profiles stacked, the lower one stepping out past the top" },
  ];
  const E = (id, name, build, face, size, desc, lower) => ({ id, name, build, face, size, desc, lower });
  const EDGES = [
    E("square", "Square", "slab", "square", '3/4"', "Straight, crisp and clean. The simplest modern look."),
    E("beveled", "Beveled", "slab", "bevel", '3/4"', "A flat angled cut across the top corner."),
    E("demi", "Demi", "slab", "demi", '3/4"', "A soft rounded top that drops to a flat bottom — a half bullnose."),
    E("cove", "Cove", "slab", "cove", '3/4"', "A small scooped notch on the top corner."),
    E("ogee", "Ogee", "slab", "ogee", '3/4"', "A classic S-curve: a dip, then a rounded roll to the bottom."),
    E("dupont", "Dupont", "slab", "dupont", '3/4"', "A small step down, then a rounded drop to the front."),
    E("square-15", "Square", "laminate", "square", '1 1/2"', "A thick, squared front for a heavier look."),
    E("bullnose-15", "Bullnose", "laminate", "bullnose", '1 1/2"', "Fully rounded top to bottom. No sharp corners."),
    E("demi-15", "Demi", "laminate", "demi", '1 1/2"', "Rounded on top, flat underneath."),
    E("beveled-15", "Beveled", "laminate", "bevel", '1 1/2"', "An angled top corner on a thick front."),
    E("chiseled-15", "Chiseled", "laminate", "chiseled", '1 1/2"', "A rough, hand-cut front face — rustic, natural."),
    E("double-bullnose-15", "Double Bullnose", "laminate", "doubleBull", '1 1/2"', "Two stacked rounds, like two slabs with rolled edges."),
    E("ogee-bullnose-15", "Ogee Bullnose", "laminate", "ogeeBull", '1 1/2"', "An ogee curve on top rolling into a rounded bottom."),
    E("dupont-bullnose-15", "Dupont Bullnose", "laminate", "dupontBull", '1 1/2"', "A small step on top, then a full round down the front."),
    E("cove-square-15", "Cove Square", "laminate", "coveSquare", '1 1/2"', "A scooped top corner on a thick, square front."),
    E("mitered-225", "Mitered", "miter", "square", '2 1/4"', "Two pieces joined at 45°, so the front reads as one solid block."),
    E("beveled-225", "Beveled", "miter", "bevel", '2 1/4"', "A mitered apron with an angled top corner."),
    E("demi-225", "Demi", "miter", "demi", '2 1/4"', "A mitered apron with a softly rounded top."),
    E("cove-225", "Cove", "miter", "cove", '2 1/4"', "A mitered apron with a scooped top corner."),
    E("quirk-mitered-225", "Quirk Mitered", "miter", "quirk", '2 1/4"', "A mitered apron with a tiny eased corner on top."),
    E("square-proj-square", "Square with projected Square", "projected", "square", '3/4" + 3/4"', "A squared top over a squared strip that steps out.", "square"),
    E("cove-proj-bullnose", "Cove with projected Bullnose", "projected", "cove", '3/4" + 3/4"', "A cove on top, a round bullnose stepping out below.", "bullnose"),
    E("cove-proj-cove", "Cove with projected Cove", "projected", "cove", '3/4" + 3/4"', "Two scooped corners, one stepped out past the other.", "cove"),
    E("cove-proj-ogee", "Cove with projected Ogee", "projected", "cove", '3/4" + 3/4"', "A cove on top over a stepped-out ogee.", "ogee"),
    E("dupont-proj-bullnose", "Dupont with projected Bullnose", "projected", "dupont", '3/4" + 3/4"', "A Dupont top over a rounded bullnose strip.", "bullnose"),
    E("dupont-proj-demi", "Dupont with projected Demi", "projected", "dupont", '3/4" + 3/4"', "A Dupont top over a stepped-out demi.", "demi"),
    E("dupont-proj-dupont", "Dupont with projected Dupont", "projected", "dupont", '3/4" + 3/4"', "Two Dupont profiles stacked and stepped.", "dupont"),
    E("dupont-proj-square", "Dupont with projected Square", "projected", "dupont", '3/4" + 3/4"', "A Dupont top over a squared strip.", "square"),
    E("ogee-proj-cove", "Ogee with projected Cove", "projected", "ogee", '3/4" + 3/4"', "An ogee top over a stepped-out cove.", "cove"),
    E("ogee-proj-ogee", "Ogee with projected Ogee", "projected", "ogee", '3/4" + 3/4"', "Two ogee curves, stacked and stepped — the most ornate.", "ogee"),
  ];
  const label = e => e.build === "projected" ? `3/4" ${e.name.replace("with projected", 'with 3/4" projected')}` : `${e.size} ${e.name}`;

  /* THICKNESS, HONESTLY — three builds in one shared box, so 2 1/4" really is three times 3/4" */
  const thick = $("#thickness");
  if (thick) {
    const THREE = [
      { e: EDGES.find(e => e.id === "square"), name: '3/4" slab', line: "One layer of stone. 2 cm or 3 cm." },
      { e: EDGES.find(e => e.id === "square-15"), name: '1 1/2" built-up', line: "A strip laminated under the front. The seam is the dotted line." },
      { e: EDGES.find(e => e.id === "mitered-225"), name: '2 1/4" mitered', line: "An apron joined at 45°, so the front reads as one solid block." },
    ];
    thick.innerHTML = THREE.map(t => `<div class="thick">${edgeSVG(t.e, "scale")}<b>${t.name}</b><span>${t.line}</span></div>`).join("");
  }

  const tabsEl = $("#edge-tabs"), gridEl = $("#edge-grid"), edgeSelect = $("#f-edge");
  let activeGroup = "slab", selected = EDGES[0];
  if (edgeSelect) {
    GROUPS.forEach(g => {
      const og = document.createElement("optgroup"); og.label = g.label;
      EDGES.filter(e => e.build === g.id).forEach(e => { const o = document.createElement("option"); o.value = label(e); o.textContent = label(e); og.append(o); });
      edgeSelect.append(og);
    });
  }
  function renderTabs() {
    tabsEl.innerHTML = GROUPS.map(g => `<button type="button" class="edge-tab" data-g="${g.id}" aria-pressed="${g.id === activeGroup}">${g.label}<span class="count">${EDGES.filter(e => e.build === g.id).length}</span></button>`).join("");
  }
  function renderGrid() {
    gridEl.innerHTML = EDGES.filter(e => e.build === activeGroup).map(e =>
      `<button type="button" class="edge-card" data-id="${e.id}" aria-pressed="${e.id === selected.id}" aria-label="${label(e)} edge">${edgeSVG(e)}<span class="name">${e.name}</span><span class="size">${e.size}</span></button>`).join("");
  }
  function renderStage() {
    $("#edge-stage-svg").innerHTML = edgeSVG(selected, "stage");
    $("#edge-stage-svg").setAttribute("aria-label", `Cross-section drawing of a ${label(selected)} edge`);
    $("#edge-stage-name").textContent = selected.name;
    $("#edge-stage-group").textContent = GROUPS.find(g => g.id === selected.build).note;
    $("#edge-stage-desc").textContent = selected.desc;
    $("#edge-added").innerHTML = "";
  }
  if (tabsEl && gridEl) {
    renderTabs(); renderGrid(); renderStage();
    tabsEl.addEventListener("click", ev => {
      const b = ev.target.closest(".edge-tab"); if (!b) return;
      activeGroup = b.dataset.g;
      selected = EDGES.find(e => e.build === activeGroup);
      renderTabs(); renderGrid(); renderStage();
    });
    gridEl.addEventListener("click", ev => {
      const b = ev.target.closest(".edge-card"); if (!b) return;
      selected = EDGES.find(e => e.id === b.dataset.id);
      $$(".edge-card", gridEl).forEach(c => c.setAttribute("aria-pressed", String(c === b)));
      renderStage();
      if (window.matchMedia("(max-width: 899px)").matches) $(".edge-stage").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    });
    $("#edge-use").addEventListener("click", () => {
      edgeSelect.value = label(selected);
      $("#edge-added").innerHTML = `<svg aria-hidden="true"><use href="#i-check"/></svg>Added “${label(selected)}” to your quote.`;
      setTimeout(() => { $("#quote").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" }); }, 350);
    });
  }

  /* =====================================================================
     THE SLAB YARD — drag-to-browse row of their own jobs, plus the lightbox
     ===================================================================== */
  const PHOTOS = [
    { s: "waterfall-marble", w: [800, 1200, 1600], ar: 0.75, tag: "Installed · Waterfall island", cap: "White marble, veins wrapped down the side", alt: "Kitchen island in white marble with grey and gold veining wrapping down the side as a waterfall edge" },
    { s: "granite-island", w: [600, 900, 1600], ar: 1.333, tag: "Installed · Island + perimeter", cap: "Tan granite with a full-height backsplash", alt: "Kitchen with tan and gold granite on the island, perimeter counters and full-height backsplash, dark cherry cabinets and pendant lights" },
    { s: "quartz-island", w: [600, 900, 1200], ar: 0.75, tag: "Installed · Kitchen island", cap: "White quartz, bold charcoal veining", alt: "Large white quartz island with dramatic charcoal veins in a kitchen with white cabinets and a dark tile backsplash" },
    { s: "black-granite", w: [600, 900, 1600], ar: 1.778, tag: "Installed · Full kitchen", cap: "Polished black granite over white cabinets", alt: "Long kitchen with polished black granite countertops over white cabinets and a white tile floor" },
    { s: "marble-island", w: [600, 900, 1500], ar: 0.75, tag: "Mid-install · Island", cap: "Veined white, sink cutout made, going on", alt: "White island top with long grey veins and an undermount sink cutout, set on blue cabinets with protective paper on the floor" },
    { s: "quartz-veined", w: [600, 900, 1600], ar: 0.75, tag: "Installed · New build", cap: "Long white island, fine gold-grey veins", alt: "Long white island top with fine gold-grey veining and a black sink, in a bright open room with marble-look floor tile" },
    { s: "quartz-top", w: [600, 900, 1600], ar: 0.905, tag: "Installed · Eased square edge", cap: "White quartz on a wood base", alt: "White quartz counter with a crisp square edge on a wood base cabinet, beige tile floor" },
    { s: "seam-repair", w: [600, 900, 1600], ar: 0.75, tag: "Repair · Sink cutout", cap: "Clamped and bonded while the bond sets", alt: "Close-up of a granite countertop repair at a stainless sink, a clamp holding a stone block in place while the bond sets" },
    { s: "black-granite-bar", w: [600, 900, 1600], ar: 1.778, tag: "Installed · Peninsula", cap: "Black granite, undermount double sink", alt: "Black granite peninsula with an undermount double stainless sink and white cabinets around the kitchen" },
  ];
  const yard = $("#yard");
  const srcset = (p, ext) => p.w.map(w => `assets/img/${p.s}-${w}.${ext} ${w}w`).join(", ");
  if (yard) {
    yard.innerHTML = PHOTOS.map((p, i) => {
      const sizes = p.ar > 1 ? "(max-width: 899px) 90vw, 60vw" : "(max-width: 899px) 60vw, 34vw";
      return `<button type="button" class="slab" data-i="${i}" aria-label="View larger: ${p.cap}" style="aspect-ratio:${p.ar}">
        <picture><source type="image/webp" srcset="${srcset(p, "webp")}" sizes="${sizes}">
        <img src="assets/img/${p.s}-${p.w[1]}.jpg" srcset="${srcset(p, "jpg")}" sizes="${sizes}" width="${p.w[1]}" height="${Math.round(p.w[1] / p.ar)}" loading="eager" decoding="async" draggable="false" alt="${p.alt}"></picture>
        <span class="tag">${p.tag}</span>
        <span class="cap"><b>${p.cap}</b><span>${String(i + 1).padStart(2, "0")} / ${String(PHOTOS.length).padStart(2, "0")}</span></span></button>`;
    }).join("");

    // progress + counter
    const thumb = $("#yard-thumb"), count = $("#yard-count");
    const slabs = $$(".slab", yard);
    const update = () => {
      const max = yard.scrollWidth - yard.clientWidth;
      const frac = max > 0 ? yard.scrollLeft / max : 0;
      const w = Math.max(0.08, yard.clientWidth / yard.scrollWidth);
      thumb.style.width = `${w * 100}%`;
      thumb.style.left = `${frac * (100 - w * 100)}%`;
      // which slab is nearest the left edge
      const x = yard.scrollLeft + 24;
      let idx = 0; slabs.forEach((s, i) => { if (s.offsetLeft - yard.offsetLeft <= x) idx = i; });
      count.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(PHOTOS.length).padStart(2, "0")}`;
    };
    yard.addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update);
    update();

    // drag to browse (mouse / pen); touch already scrolls natively
    let drag = null, moved = false;
    yard.addEventListener("pointerdown", ev => {
      if (ev.pointerType === "touch") return;
      drag = { x: ev.clientX, left: yard.scrollLeft }; moved = false;
      yard.classList.add("dragging");
    });
    addEventListener("pointermove", ev => {
      if (!drag) return;
      const dx = ev.clientX - drag.x;
      if (Math.abs(dx) > 4) moved = true;
      yard.scrollLeft = drag.left - dx;
    });
    const endDrag = () => { if (!drag) return; drag = null; setTimeout(() => yard.classList.remove("dragging"), 50); };
    addEventListener("pointerup", endDrag); addEventListener("pointercancel", endDrag);

    const step = dir => {
      const x = yard.scrollLeft + 24;
      let idx = 0; slabs.forEach((s, i) => { if (s.offsetLeft - yard.offsetLeft <= x) idx = i; });
      const target = slabs[Math.max(0, Math.min(slabs.length - 1, idx + dir))];
      yard.scrollTo({ left: target.offsetLeft - yard.offsetLeft - parseFloat(getComputedStyle(yard).paddingLeft), behavior: reduceMotion ? "auto" : "smooth" });
    };
    $("#yard-prev").addEventListener("click", () => step(-1));
    $("#yard-next").addEventListener("click", () => step(1));
    yard.addEventListener("keydown", ev => { if (ev.key === "ArrowRight") { step(1); ev.preventDefault(); } if (ev.key === "ArrowLeft") { step(-1); ev.preventDefault(); } });

    // lightbox
    const lb = $("#lightbox"), lbImg = $("#lb-img");
    let cur = 0;
    function show(i) {
      cur = (i + PHOTOS.length) % PHOTOS.length;
      const p = PHOTOS[cur], big = p.w[p.w.length - 1];
      lbImg.src = `assets/img/${p.s}-${big}.jpg`;
      lbImg.srcset = `assets/img/${p.s}-${big}.webp`;
      lbImg.alt = p.alt;
      $("#lb-cap").textContent = `${p.tag} — ${p.cap}`;
      $("#lb-count").textContent = `${cur + 1} / ${PHOTOS.length}`;
    }
    yard.addEventListener("click", ev => {
      if (moved) return; // it was a drag
      const b = ev.target.closest(".slab"); if (!b) return;
      show(+b.dataset.i);
      if (typeof lb.showModal === "function") lb.showModal(); else lb.setAttribute("open", "");
    });
    $("#lb-close").addEventListener("click", () => lb.close());
    $("#lb-prev").addEventListener("click", () => show(cur - 1));
    $("#lb-next").addEventListener("click", () => show(cur + 1));
    lb.addEventListener("keydown", ev => { if (ev.key === "ArrowLeft") show(cur - 1); if (ev.key === "ArrowRight") show(cur + 1); });
    lb.addEventListener("click", ev => { if (ev.target === lb || ev.target.classList.contains("lb-figure")) lb.close(); });
    let x0 = null;
    lb.addEventListener("touchstart", ev => { x0 = ev.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", ev => { if (x0 == null) return; const dx = ev.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1)); x0 = null; });
  }

  /* ---------- reviews: only real ones, hidden when empty ---------- */
  if (CONFIG.reviews.length) {
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
    $("#reviews-grid").innerHTML = CONFIG.reviews.map(r => `<figure class="review"><blockquote>${esc(r.text)}</blockquote><figcaption>${esc(r.name)}${r.where ? " · " + esc(r.where) : ""}</figcaption></figure>`).join("");
    $("#reviews").hidden = false;
  }

  /* =====================================================================
     QUOTE FORM → FormSubmit (AJAX). Fallback box on any failure.
     ===================================================================== */
  const form = $("#quote-form");
  const msg = $("#form-msg");
  function fail(text) { msg.textContent = text; msg.hidden = false; }
  function fields() {
    const fd = new FormData(form);
    return {
      name: (fd.get("name") || "").trim(), phone: (fd.get("phone") || "").trim(), email: (fd.get("email") || "").trim(),
      project: fd.get("project") || "", material: fd.get("material") || "", edge: fd.get("edge") || "",
      notes: (fd.get("notes") || "").trim(), photos: (fd.get("photos") || "").trim(), honey: fd.get("_honey") || "",
    };
  }
  function mailtoFrom(v) {
    const body = [`Name: ${v.name}`, `Phone: ${v.phone}`, `Email: ${v.email}`, `Project: ${v.project}`, `Material: ${v.material}`, `Edge: ${v.edge}`, `Size / notes: ${v.notes}`, `Photos: ${v.photos}`].join("\n");
    return `mailto:${CONFIG.formEmail}?subject=${encodeURIComponent(`Quote request — ${v.project} — ${v.name}`)}&body=${encodeURIComponent(body)}`;
  }
  form?.addEventListener("submit", async ev => {
    ev.preventDefault();
    msg.hidden = true;
    const v = fields();
    const bad = [];
    const nameEl = $("#f-name"), phoneEl = $("#f-phone"), emailEl = $("#f-email");
    [nameEl, phoneEl, emailEl].forEach(el => el.removeAttribute("aria-invalid"));
    if (!v.name) { bad.push("your name"); nameEl.setAttribute("aria-invalid", "true"); }
    if (v.phone.replace(/\D/g, "").length < 10) { bad.push("a phone number with area code"); phoneEl.setAttribute("aria-invalid", "true"); }
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) { bad.push("a valid email (or leave it blank)"); emailEl.setAttribute("aria-invalid", "true"); }
    if (bad.length) { fail(`Please add ${bad.join(" and ")}.`); $("[aria-invalid=true]", form)?.focus(); return; }
    if (v.honey) return; // bot

    const btn = $("#f-submit");
    btn.disabled = true; btn.firstChild.textContent = "Sending…";
    const payload = {
      _subject: `New quote request — ${v.project} — ${v.name}`, _template: "table", _honey: "",
      Name: v.name, Phone: v.phone, Email: v.email || "(not given)",
      Project: v.project, Material: v.material, Edge: v.edge,
      "Size / notes": v.notes || "(none)", Photos: v.photos || "(none)",
    };
    if (v.email) payload._replyto = v.email;
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(CONFIG.formEndpoint + CONFIG.formEmail, {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload), signal: ctrl.signal,
      });
      clearTimeout(t);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) === "false") throw new Error(data.message || res.status);
      form.hidden = true; $("#form-ok").hidden = false; $("#form-ok").focus();
    } catch (err) {
      $("#fail-mail").href = mailtoFrom(v);
      form.hidden = true; $("#form-fail").hidden = false; $("#form-fail").focus();
    } finally {
      btn.disabled = false; btn.firstChild.textContent = "Send my request";
    }
  });

  /* ---------- phone call bar: tuck away while the form is on screen ---------- */
  const bar = $("#callbar"), quote = $("#quote");
  if (bar && quote && "IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => bar.classList.toggle("hide", en.isIntersecting), { threshold: 0.15 }).observe(quote);
  }

  /* ---------- quiet reveal on scroll (never hides content without JS) ---------- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    const els = $$(".head-row, .stat, .stone, .thick, .step, .badge-card, .shop-copy, .quote-lead, .quote-card");
    const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -8% 0px" });
    els.forEach(el => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add("reveal"); io.observe(el); } });
  }
})();
