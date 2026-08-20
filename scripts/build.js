#!/usr/bin/env node
/* =============================================================================
   LuxeVisuals — static build script

   No npm dependencies (uses only Node's built-in fs/path), so it runs
   straight from GitHub Actions with no `npm install` step.

   What it does:
     1. Copies the whole repo into /_site (minus dev-only files/folders).
     2. Scans /projects/<slug>/ for a project.json + image/video files.
     3. Injects a project card into portfolio.html for each project found.
     4. Generates a full page at /projects/<slug>/index.html for each
        project, from templates/project-page.html, with its own gallery.

   Nothing in here needs to be touched to add a project — see the README.
   ============================================================================= */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "_site");
const PROJECTS_DIR = path.join(ROOT, "projects");
const TEMPLATE_PATH = path.join(ROOT, "templates", "project-page.html");

const MEDIA_EXT = {
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".webp": "image",
  ".mp4": "video",
  ".webm": "video",
};

// Root-level entries that exist for development only and should never end
// up in the deployed site. Everything else (CNAME, the Google verification
// file, sitemap.xml, LICENSE, etc.) is copied through untouched.
const EXCLUDE = new Set([
  ".git",
  ".github",
  ".gitignore",
  ".gitattributes",
  "_gitignore",
  "_gitattributes",
  "scripts",
  "templates",
  "node_modules",
  "_site",
  "README.md",
]);

function naturalCompare(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

/* ---------------- Discover projects ---------------- */

function scanProjects() {
  if (!fs.existsSync(PROJECTS_DIR)) return [];

  const slugs = fs
    .readdirSync(PROJECTS_DIR)
    .filter((entry) => fs.statSync(path.join(PROJECTS_DIR, entry)).isDirectory());

  const projects = [];

  for (const slug of slugs) {
    const dir = path.join(PROJECTS_DIR, slug);
    const jsonPath = path.join(dir, "project.json");

    if (!fs.existsSync(jsonPath)) {
      console.warn(`[build] Skipping "${slug}" — no project.json found.`);
      continue;
    }

    let config;
    try {
      config = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    } catch (err) {
      console.warn(`[build] Skipping "${slug}" — project.json isn't valid JSON (${err.message}).`);
      continue;
    }

    if (!config.title) {
      console.warn(`[build] Skipping "${slug}" — project.json needs at least a "title".`);
      continue;
    }

    const mediaFiles = fs
      .readdirSync(dir)
      .filter((f) => MEDIA_EXT[path.extname(f).toLowerCase()])
      .sort(naturalCompare)
      .map((f) => ({ file: f, type: MEDIA_EXT[path.extname(f).toLowerCase()] }));

    if (!mediaFiles.length) {
      console.warn(`[build] "${slug}" has no images or videos — the page will build, but its gallery will be empty.`);
    }

    let thumbnail = mediaFiles[0] || null;
    if (config.thumbnail) {
      const match = mediaFiles.find((m) => m.file === config.thumbnail);
      if (match) thumbnail = match;
      else console.warn(`[build] "${slug}" — thumbnail "${config.thumbnail}" not found among its files, using the first file instead.`);
    }

    projects.push({
      slug,
      title: config.title,
      description: config.description || "",
      longDescription: config.longDescription || "",
      featured: !!config.featured,
      order: typeof config.order === "number" ? config.order : null,
      media: mediaFiles,
      thumbnail,
    });
  }

  // Explicit "order" values first (ascending), then everything else
  // alphabetically by title.
  projects.sort((a, b) => {
    const aHas = a.order !== null;
    const bHas = b.order !== null;
    if (aHas && bHas) return a.order - b.order;
    if (aHas) return -1;
    if (bHas) return 1;
    return a.title.localeCompare(b.title);
  });

  return projects;
}

/* ---------------- HTML generation ---------------- */

function mediaTag(src, type) {
  return type === "video"
    ? `<video src="${src}" muted loop playsinline autoplay preload="metadata"></video>`
    : `<img src="${src}" alt="" loading="lazy" decoding="async">`;
}

function buildGridHTML(projects) {
  if (!projects.length) {
    return `          <div class="portfolio-empty">No projects yet — add a folder under <code>/projects/</code> with a <code>project.json</code> to populate this page.</div>`;
  }

  return projects
    .map((p) => {
      const featuredTag = p.featured ? `<span class="featured-tag">FEATURED</span>` : "";
      const thumb = p.thumbnail
        ? mediaTag(`projects/${p.slug}/${p.thumbnail.file}`, p.thumbnail.type)
        : "";
      return `          <a class="project-card cut-card reveal" href="projects/${p.slug}/index.html">
            ${featuredTag}
            <div class="project-thumb">${thumb}</div>
            <div class="project-info">
              <h3>${escapeHtml(p.title)}</h3>
              <p>${escapeHtml(p.description)}</p>
            </div>
          </a>`;
    })
    .join("\n");
}

function buildGalleryHTML(project) {
  if (!project.media.length) {
    return `          <div class="portfolio-empty">No media in this project yet.</div>`;
  }
  return project.media
    .map((item) => {
      const tag = mediaTag(item.file, item.type);
      return `          <div class="portfolio-item reveal" data-type="${item.type}" data-src="${item.file}">
            ${tag}
            <div class="overlay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/></svg></div>
          </div>`;
    })
    .join("\n");
}

function injectBetweenMarkers(html, startMarker, endMarker, content) {
  const start = html.indexOf(startMarker);
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1) {
    throw new Error(`Could not find markers "${startMarker}" / "${endMarker}".`);
  }
  return html.slice(0, start + startMarker.length) + "\n" + content + "\n" + html.slice(end);
}

function buildPortfolioPage(projects) {
  const destPath = path.join(OUT, "portfolio.html");
  let html = fs.readFileSync(destPath, "utf8");
  html = injectBetweenMarkers(html, "<!-- PROJECTS:START -->", "<!-- PROJECTS:END -->", buildGridHTML(projects));
  fs.writeFileSync(destPath, html);
}

function buildProjectPages(projects) {
  const template = fs.readFileSync(TEMPLATE_PATH, "utf8");

  for (const project of projects) {
    let html = template;
    html = html.split("{{TITLE}}").join(escapeHtml(project.title));
    html = html.split("{{DESCRIPTION}}").join(escapeHtml(project.description));

    const longDescBlock = project.longDescription
      ? `<section class="reveal"><div class="cap-card cut-card" style="padding:30px 30px;"><p style="margin:0; color:var(--champagne-dim); font-size:15px; line-height:1.8;">${escapeHtml(project.longDescription)}</p></div></section>`
      : "";
    html = html.split("{{LONG_DESCRIPTION}}").join(longDescBlock);

    html = injectBetweenMarkers(html, "<!-- GALLERY:START -->", "<!-- GALLERY:END -->", buildGalleryHTML(project));

    const destDir = path.join(OUT, "projects", project.slug);
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(path.join(destDir, "index.html"), html);
  }
}

/* ---------------- Main ---------------- */

function main() {
  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  // 1. Copy the whole repo through as-is, minus dev-only files. This also
  //    carries every /projects/<slug>/ folder (project.json + raw media)
  //    straight into /_site/projects/<slug>/.
  for (const entry of fs.readdirSync(ROOT)) {
    if (EXCLUDE.has(entry)) continue;
    copyRecursive(path.join(ROOT, entry), path.join(OUT, entry));
  }

  // 2. Discover projects and generate the grid + individual pages.
  const projects = scanProjects();
  console.log(`[build] Found ${projects.length} project(s): ${projects.map((p) => p.slug).join(", ") || "(none)"}`);

  buildPortfolioPage(projects);
  buildProjectPages(projects);

  console.log("[build] Done — output written to /_site");
}

main();
