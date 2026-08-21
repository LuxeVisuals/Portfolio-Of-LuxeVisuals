#!/usr/bin/env node

/**
 * LuxeVisuals portfolio build script
 *
 * Reads projects from /projects/<slug>/ and generates the portfolio
 * cards inside index.html between:
 *
 *   <!-- PROJECTS:START -->
 *   <!-- PROJECTS:END -->
 *
 * Expected project structure:
 *
 * projects/
 *   project-slug/
 *     index.html
 *     images/
 *       image-1.png
 *       image-2.jpg
 *     videos/
 *       showcase.mp4
 *
 * Optional project.json:
 * {
 *   "title": "Project Name",
 *   "description": "Short description shown on the portfolio.",
 *   "featured": true,
 *   "thumbnail": "images/cover.png"
 * }
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PROJECTS_DIR = path.join(ROOT, "projects");
const INDEX_FILE = path.join(ROOT, "index.html");

const START_MARKER = "<!-- PROJECTS:START -->";
const END_MARKER = "<!-- PROJECTS:END -->";

const IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".avif"
]);

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".mov"
]);

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    console.warn(`Warning: Could not read ${file}`);
    return {};
  }
}

function titleFromSlug(slug) {
  return slug
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isMedia(file) {
  const ext = path.extname(file).toLowerCase();

  return (
    IMAGE_EXTENSIONS.has(ext) ||
    VIDEO_EXTENSIONS.has(ext)
  );
}

function findMedia(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        isMedia(entry.name)
    )
    .map((entry) => entry.name)
    .sort((a, b) =>
      a.localeCompare(b, undefined, {
        numeric: true
      })
    );
}

function findFirstMedia(projectDir) {
  const preferredDirs = [
    path.join(projectDir, "images"),
    path.join(projectDir, "videos"),
    projectDir
  ];

  for (const dir of preferredDirs) {
    const media = findMedia(dir);

    if (media.length) {
      return path
        .relative(
          projectDir,
          path.join(dir, media[0])
        )
        .replace(/\\/g, "/");
    }
  }

  return null;
}

function getProjectData(slug) {
  const projectDir = path.join(
    PROJECTS_DIR,
    slug
  );

  const configFile = path.join(
    projectDir,
    "project.json"
  );

  const config = fs.existsSync(configFile)
    ? readJson(configFile)
    : {};

  const thumbnail =
    config.thumbnail ||
    findFirstMedia(projectDir);

  return {
    slug,
    title:
      config.title ||
      titleFromSlug(slug),

    description:
      config.description ||
      "Roblox UI/UX project by LuxeVisuals.",

    featured:
      Boolean(config.featured),

    thumbnail
  };
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getThumbnailType(file) {
  if (!file) {
    return "image";
  }

  const ext =
    path.extname(file).toLowerCase();

  return VIDEO_EXTENSIONS.has(ext)
    ? "video"
    : "image";
}

function buildCard(project) {
  const projectPath =
    `projects/${project.slug}/index.html`;

  const thumbnail =
    project.thumbnail;

  let media = `
        <div class="project-thumb">
          <div class="portfolio-empty">
            NO PREVIEW
          </div>
        </div>`;

  if (thumbnail) {
    const mediaPath =
      `projects/${project.slug}/${thumbnail}`
        .replace(/\\/g, "/");

    const type =
      getThumbnailType(thumbnail);

    if (type === "video") {
      media = `
        <div class="project-thumb">
          <video
            src="${escapeHtml(mediaPath)}"
            muted
            loop
            playsinline
            preload="metadata">
          </video>
        </div>`;
    } else {
      media = `
        <div class="project-thumb">
          <img
            src="${escapeHtml(mediaPath)}"
            alt="${escapeHtml(project.title)}"
            loading="lazy"
            decoding="async">
        </div>`;
    }
  }

  const featured =
    project.featured
      ? `<span class="featured-tag">Featured</span>`
      : "";

  return `
        <a
          class="project-card cut-card"
          href="${escapeHtml(projectPath)}">

          ${featured}

          ${media}

          <div class="project-info">
            <h3>
              ${escapeHtml(project.title)}
            </h3>

            <p>
              ${escapeHtml(project.description)}
            </p>
          </div>

        </a>`;
}

function main() {
  if (!fs.existsSync(INDEX_FILE)) {
    throw new Error(
      "index.html was not found."
    );
  }

  if (!fs.existsSync(PROJECTS_DIR)) {
    throw new Error(
      "projects/ directory was not found."
    );
  }

  const index =
    fs.readFileSync(
      INDEX_FILE,
      "utf8"
    );

  const start =
    index.indexOf(START_MARKER);

  const end =
    index.indexOf(END_MARKER);

  if (
    start === -1 ||
    end === -1 ||
    end < start
  ) {
    throw new Error(
      "Could not find PROJECTS:START / PROJECTS:END markers in index.html."
    );
  }

  const projectDirs =
    fs
      .readdirSync(
        PROJECTS_DIR,
        { withFileTypes: true }
      )
      .filter(
        (entry) =>
          entry.isDirectory()
      )
      .map(
        (entry) =>
          entry.name
      )
      .filter(
        (slug) =>
          !slug.startsWith(".")
      );

  const projects =
    projectDirs
      .map(getProjectData)
      .sort((a, b) => {
        if (
          a.featured !==
          b.featured
        ) {
          return a.featured
            ? -1
            : 1;
        }

        return a.title.localeCompare(
          b.title
        );
      });

  const generated =
    projects.length
      ? projects
          .map(buildCard)
          .join("\n")
      : `
        <div class="portfolio-empty">
          No projects have been added yet.
        </div>`;

  const newIndex =
    index.slice(
      0,
      start + START_MARKER.length
    ) +
    generated +
    "\n      " +
    index.slice(end);

  fs.writeFileSync(
    INDEX_FILE,
    newIndex,
    "utf8"
  );

  console.log(
    `Built portfolio with ${projects.length} project(s).`
  );
}

try {
  main();
} catch (error) {
  console.error(
    `Build failed: ${error.message}`
  );

  process.exit(1);
}
