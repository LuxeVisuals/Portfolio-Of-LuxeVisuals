/* =============================================================================
   LuxeVisuals — Portfolio auto-loader (category-aware)

   Portfolio pieces live in two subfolders under /portfolio:
     portfolio/ui/          UI design frames & clips (including animation)
     portfolio/reviews/     client reviews

   Inside each folder, name files sequentially starting at 1:
   1.png, 2.mp4, 3.jpg, 4.jpeg ... — no manifest, no config needed.
   This script probes each folder for those files and builds the grid +
   lightbox automatically.

   Which folder(s) get scanned is controlled by a ?cat= query param on
   portfolio.html:
     portfolio.html            -> mixes both categories together
     portfolio.html?cat=ui     -> UI only
     portfolio.html?cat=reviews   -> Client Reviews only

   Switching category from the sidebar sub-nav happens in place (History API
   + a short fade) instead of a full page reload — faster and avoids
   re-fetching everything already on screen.

   NOTE: this relies on fetch() HEAD requests, which only work when the site
   is served over http(s) — e.g. GitHub Pages, or a local dev server such as
   `npx serve` / `python3 -m http.server`. Opening index.html directly from
   disk (file://) will NOT be able to probe the folder due to browser CORS
   rules — see the README for how to preview locally.
   ============================================================================= */

(() => {
  const CATEGORIES = {
    ui: { folder: "portfolio/ui/", label: "UI", tag: "UI" },
    reviews: { folder: "portfolio/reviews/", label: "Client Reviews", tag: "REVIEW" },
  };
  const CATEGORY_ORDER = ["ui", "reviews"];

  const HERO_COPY = {
    all: {
      title: "Portfolio",
      eyebrow: "Selected Work",
      lede: "A running record of finished UI frames, scripted animations, and client reviews. Click any piece to view it full screen.",
    },
    ui: {
      title: "UI",
      eyebrow: "Selected Work — UI",
      lede: "Finished UI frames, full interface redesigns, and scripted animation. Click any piece to view it full screen.",
    },
    reviews: {
      title: "Client Reviews",
      eyebrow: "Selected Work — Client Reviews",
      lede: "Feedback and reviews from past clients. Click any piece to view it full screen.",
    },
  };

  const EXTENSIONS = ["png", "jpg", "jpeg", "mp4"];
  const MAX_ITEMS = 300; // hard ceiling, just in case
  const MAX_CONSECUTIVE_MISSES = 3; // stop scanning after this many empty slots in a row
  const FADE_MS = 220;

  const grid = document.getElementById("portfolio-grid");
  if (!grid) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- Category resolution ---------------- */

  const resolveCat = (raw) => (CATEGORIES[raw] ? raw : "all");

  const params = new URLSearchParams(location.search);
  let activeCat = resolveCat(params.get("cat"));

  applyHeroCopy(activeCat);
  markActiveSubNav(activeCat);

  function applyHeroCopy(cat) {
    const copy = HERO_COPY[cat] || HERO_COPY.all;
    const titleEl = document.getElementById("portfolio-title");
    const eyebrowEl = document.getElementById("portfolio-eyebrow");
    const ledeEl = document.getElementById("portfolio-lede");
    if (titleEl) titleEl.textContent = copy.title;
    if (eyebrowEl) eyebrowEl.textContent = copy.eyebrow;
    if (ledeEl) ledeEl.textContent = copy.lede;
    document.title = `${copy.title === "Portfolio" ? "Portfolio" : copy.title + " — Portfolio"} — LuxeVisuals`;
  }

  function markActiveSubNav(cat) {
    document.querySelectorAll(".nav-sub a").forEach((a) => {
      const linkCat = new URL(a.href, location.href).searchParams.get("cat");
      a.classList.toggle("active", linkCat === cat);
    });
  }

  /* ---------------- In-place category switching ---------------- */

  document.querySelectorAll(".nav-sub a").forEach((a) => {
    a.addEventListener("click", (e) => {
      const url = new URL(a.href, location.href);
      if (url.pathname.split("/").pop() !== "portfolio.html") return; // not a same-page link, let it navigate normally
      e.preventDefault();
      const cat = resolveCat(url.searchParams.get("cat"));
      switchCategory(cat, true);
    });
  });

  window.addEventListener("popstate", () => {
    const p = new URLSearchParams(location.search);
    switchCategory(resolveCat(p.get("cat")), false);
  });

  function switchCategory(cat, pushHistory) {
    if (cat === activeCat) return;
    activeCat = cat;
    if (pushHistory) {
      const qs = cat === "all" ? "" : `?cat=${cat}`;
      history.pushState({ cat }, "", `portfolio.html${qs}`);
    }
    applyHeroCopy(cat);
    markActiveSubNav(cat);

    if (reduceMotion) {
      loadPortfolio(cat);
      return;
    }
    grid.classList.add("fading");
    setTimeout(() => loadPortfolio(cat), FADE_MS);
  }

  /* ---------------- Scanning ---------------- */

  const fileExists = (url) =>
    fetch(url, { method: "HEAD", cache: "no-store" })
      .then((res) => res.ok)
      .catch(() => false);

  async function findItem(folder, n) {
    for (const ext of EXTENSIONS) {
      const url = `${folder}${n}.${ext}`;
      // eslint-disable-next-line no-await-in-loop
      if (await fileExists(url)) {
        return { url, type: ext === "mp4" ? "video" : "image" };
      }
    }
    return null;
  }

  async function scanFolder(catKey) {
    const { folder, tag } = CATEGORIES[catKey];
    const found = [];
    let misses = 0;

    for (let n = 1; n <= MAX_ITEMS; n++) {
      // eslint-disable-next-line no-await-in-loop
      const item = await findItem(folder, n);
      if (item) {
        found.push({ ...item, cat: catKey, tag });
        misses = 0;
      } else {
        misses++;
        if (misses >= MAX_CONSECUTIVE_MISSES) break;
      }
    }
    return found;
  }

  /* ---------------- Tiles + Lightbox ---------------- */

  function buildTile(item) {
    const tile = document.createElement("div");
    tile.className = "portfolio-item reveal";

    const kindTag = document.createElement("span");
    kindTag.className = "kind-tag";
    kindTag.textContent = item.tag;
    tile.appendChild(kindTag);

    let media;
    if (item.type === "video") {
      media = document.createElement("video");
      media.src = item.url;
      media.muted = true;
      media.loop = true;
      media.playsInline = true;
      media.autoplay = true;
      media.preload = "metadata";
    } else {
      media = document.createElement("img");
      media.src = item.url;
      media.loading = "lazy";
      media.decoding = "async";
      media.alt = "";
    }
    tile.appendChild(media);

    const overlay = document.createElement("div");
    overlay.className = "overlay";
    overlay.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg>`;
    tile.appendChild(overlay);

    tile.addEventListener("click", () => openLightbox(item));
    return tile;
  }

  let lightbox, stage, closeBtn;

  function ensureLightbox() {
    if (lightbox) return;
    lightbox = document.createElement("div");
    lightbox.className = "lightbox";
    lightbox.innerHTML = `
      <button class="lightbox-close" aria-label="Close">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M6 6l12 12M18 6L6 18"/>
        </svg>
      </button>
      <div class="lightbox-stage"></div>
    `;
    document.body.appendChild(lightbox);
    stage = lightbox.querySelector(".lightbox-stage");
    closeBtn = lightbox.querySelector(".lightbox-close");

    closeBtn.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeLightbox();
    });
  }

  function openLightbox(item) {
    ensureLightbox();
    stage.innerHTML = "";
    let media;
    if (item.type === "video") {
      media = document.createElement("video");
      media.src = item.url;
      media.controls = true;
      media.autoplay = true;
      media.loop = true;
      media.playsInline = true;
    } else {
      media = document.createElement("img");
      media.src = item.url;
      media.alt = "";
    }
    stage.appendChild(media);
    lightbox.classList.add("open");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("open");
    document.body.style.overflow = "";
    setTimeout(() => {
      stage.innerHTML = "";
    }, 300);
  }

  /* ---------------- Load + render ---------------- */

  let loadToken = 0;

  async function loadPortfolio(cat) {
    const token = ++loadToken;
    let found = [];

    if (cat === "all") {
      const results = await Promise.all(CATEGORY_ORDER.map((c) => scanFolder(c)));
      CATEGORY_ORDER.forEach((c, i) => { found = found.concat(results[i]); });
    } else {
      found = await scanFolder(cat);
    }

    if (token !== loadToken) return; // a newer category switch superseded this scan

    grid.innerHTML = "";

    if (!found.length) {
      const folderHint = cat === "all" ? "portfolio/ui or portfolio/reviews" : CATEGORIES[cat].folder;
      grid.innerHTML = `
        <div class="portfolio-empty">
          No work uploaded yet — drop numbered files (1.png, 2.mp4 …)
          into <code>${folderHint}</code> to populate this page.
        </div>`;
      grid.classList.remove("fading");
      return;
    }

    found.forEach((item) => grid.appendChild(buildTile(item)));
    grid.classList.remove("fading");

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
      );
      grid.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    } else {
      grid.querySelectorAll(".reveal").forEach((el) => el.classList.add("in-view"));
    }
  }

  grid.innerHTML = `
    <div class="portfolio-loading">
      <div class="spin"></div>
      Scanning /portfolio …
    </div>`;

  loadPortfolio(activeCat);
})();
