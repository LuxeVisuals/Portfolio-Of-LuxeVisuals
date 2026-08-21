#!/usr/bin/env node

/**
 * LuxeVisuals Portfolio Builder
 *
 * Project structure:
 *
 * projects/
 * └── thegatsby/
 *     ├── Contributors.png
 *     ├── Emotes.jpg
 *     ├── Gamepasses.webp
 *     ├── Showcase.mp4
 *     └── project.json
 *
 * Filename does NOT matter.
 *
 * The script automatically:
 * - Finds all supported media files
 * - Uses the first media file as the portfolio thumbnail
 * - Generates the project page
 * - Generates the project gallery
 * - Updates the main portfolio
 */

const fs = require("fs");
const path = require("path");


// ============================================================
// PATHS
// ============================================================

const ROOT = path.resolve(__dirname, "..");

const PROJECTS_DIR = path.join(
  ROOT,
  "projects"
);

const MAIN_INDEX = path.join(
  ROOT,
  "index.html"
);

const CSS_PATH = "../../css/style.css";
const GALLERY_JS_PATH = "../../js/project-gallery.js";


// ============================================================
// SUPPORTED FILE TYPES
// ============================================================

const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".avif"
]);

const VIDEO_EXTENSIONS = new Set([
  ".mp4",
  ".webm",
  ".mov",
  ".m4v"
]);


// ============================================================
// HELPERS
// ============================================================

function isImage(file) {
  return IMAGE_EXTENSIONS.has(
    path.extname(file).toLowerCase()
  );
}

function isVideo(file) {
  return VIDEO_EXTENSIONS.has(
    path.extname(file).toLowerCase()
  );
}

function isMedia(file) {
  return isImage(file) || isVideo(file);
}


function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function titleFromFolder(folder) {
  return folder
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, char =>
      char.toUpperCase()
    );
}


function readProjectJson(projectDir) {

  const file = path.join(
    projectDir,
    "project.json"
  );

  if (!fs.existsSync(file)) {

    return {
      title: titleFromFolder(
        path.basename(projectDir)
      ),

      description:
        "Roblox UI/UX project by LuxeVisuals.",

      featured: false
    };
  }

  try {

    return JSON.parse(
      fs.readFileSync(
        file,
        "utf8"
      )
    );

  } catch (error) {

    console.warn(
      `Could not read ${file}`
    );

    return {
      title: titleFromFolder(
        path.basename(projectDir)
      ),

      description:
        "Roblox UI/UX project by LuxeVisuals.",

      featured: false
    };
  }
}


// ============================================================
// FIND MEDIA
// ============================================================

function getProjectMedia(projectDir) {

  return fs
    .readdirSync(
      projectDir,
      {
        withFileTypes: true
      }
    )

    .filter(entry =>
      entry.isFile() &&
      isMedia(entry.name)
    )

    .map(entry => entry.name)

    .sort((a, b) =>
      a.localeCompare(
        b,
        undefined,
        {
          numeric: true,
          sensitivity: "base"
        }
      )
    );
}


// ============================================================
// GENERATE PROJECT PAGE
// ============================================================

function generateProjectPage(
  projectSlug,
  projectData,
  media
) {

  const galleryItems = media
    .map(file => {

      const type =
        isVideo(file)
          ? "video"
          : "image";

      return `
        <button
          class="portfolio-item"
          type="button"
          data-type="${type}"
          data-src="${escapeHtml(file)}"
          aria-label="Open ${escapeHtml(file)}">

          ${
            type === "video"

              ? `
                <video
                  src="${escapeHtml(file)}"
                  muted
                  playsinline
                  preload="metadata">
                </video>
              `

              : `
                <img
                  src="${escapeHtml(file)}"
                  alt=""
                  loading="lazy"
                  decoding="async">
              `
          }

        </button>
      `;
    })
    .join("\n");


  return `<!DOCTYPE html>

<html lang="en">

<head>

  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>
    ${escapeHtml(projectData.title)}
    — LuxeVisuals
  </title>

  <meta
    name="description"
    content="${escapeHtml(projectData.description)}"
  >

  <link
    rel="stylesheet"
    href="${CSS_PATH}"
  >

  <style>

    body {
      min-height: 100vh;
    }

    .project-page {
      padding-top: 40px;
    }

    .project-header {
      max-width: 760px;
      margin-bottom: 45px;
    }

    .project-header h1 {
      font-size: clamp(38px, 5vw, 62px);
      margin-top: 14px;
    }

    .project-description {
      color: var(--champagne-dim);
      font-size: 16px;
      max-width: 650px;
    }

    #project-gallery {
      display: grid;
      grid-template-columns:
        repeat(2, minmax(0, 1fr));
      gap: 22px;
    }

    .portfolio-item {
      position: relative;
      display: block;
      width: 100%;
      padding: 0;
      overflow: hidden;
      background: var(--ink);
      border: 1px solid var(--line);
      cursor: pointer;
      transition:
        transform 0.35s var(--ease-out),
        border-color 0.35s var(--ease-out),
        box-shadow 0.35s var(--ease-out);
    }

    .portfolio-item:hover {
      transform: translateY(-3px);
      border-color: var(--line-bright);
      box-shadow:
        0 18px 50px -20px
        rgba(205, 164, 78, 0.35);
    }

    .portfolio-item img,
    .portfolio-item video {
      display: block;
      width: 100%;
      height: auto;
      aspect-ratio: 16 / 10;
      object-fit: cover;
      transition:
        transform 0.5s var(--ease-out);
    }

    .portfolio-item:hover img,
    .portfolio-item:hover video {
      transform: scale(1.035);
    }

    @media (max-width: 640px) {

      #project-gallery {
        grid-template-columns: 1fr;
      }

    }

  </style>

</head>


<body>

  <div class="container">

    <main class="project-page">

      <a
        class="back-link"
        href="../../index.html"
      >
        ← Back to Portfolio
      </a>


      <header class="project-header">

        <span class="eyebrow">
          Selected Work
        </span>

        <h1>
          ${escapeHtml(projectData.title)}
        </h1>

        <p class="project-description">
          ${escapeHtml(projectData.description)}
        </p>

      </header>


      <section
        id="project-gallery"
        aria-label="${escapeHtml(projectData.title)} gallery"
      >

        ${galleryItems}

      </section>

    </main>


    <footer class="site-footer">

      <span>
        © ${new Date().getFullYear()}
        LuxeVisuals
      </span>

      <span>
        <a href="../../index.html">
          Portfolio
        </a>
      </span>

    </footer>

  </div>


  <script
    src="${GALLERY_JS_PATH}"
    defer
  ></script>

</body>

</html>
`;
}


// ============================================================
// GENERATE MAIN PORTFOLIO CARD
// ============================================================

function generatePortfolioCard(
  projectSlug,
  projectData,
  thumbnail
) {

  const projectUrl =
    `projects/${projectSlug}/index.html`;

  const thumbnailUrl =
    `projects/${projectSlug}/${thumbnail}`;

  const thumbnailType =
    isVideo(thumbnail)
      ? "video"
      : "image";


  const featured =
    projectData.featured
      ? `
        <span class="featured-tag">
          Featured
        </span>
      `
      : "";


  const media =
    thumbnailType === "video"

      ? `
        <div class="project-thumb">

          <video
            src="${escapeHtml(thumbnailUrl)}"
            muted
            loop
            autoplay
            playsinline
            preload="metadata">
          </video>

        </div>
      `

      : `
        <div class="project-thumb">

          <img
            src="${escapeHtml(thumbnailUrl)}"
            alt="${escapeHtml(projectData.title)}"
            loading="lazy"
            decoding="async"
          >

        </div>
      `;


  return `
        <a
          class="project-card cut-card"
          href="${escapeHtml(projectUrl)}"
        >

          ${featured}

          ${media}

          <div class="project-info">

            <h3>
              ${escapeHtml(projectData.title)}
            </h3>

            <p>
              ${escapeHtml(projectData.description)}
            </p>

          </div>

        </a>
  `;
}


// ============================================================
// BUILD EVERYTHING
// ============================================================

function build() {

  console.log(
    "\nLuxeVisuals Portfolio Builder\n"
  );


  // ----------------------------------------------------------
  // Check folders
  // ----------------------------------------------------------

  if (!fs.existsSync(PROJECTS_DIR)) {

    throw new Error(
      "projects/ folder does not exist."
    );

  }


  if (!fs.existsSync(MAIN_INDEX)) {

    throw new Error(
      "index.html does not exist."
    );

  }


  // ----------------------------------------------------------
  // Find projects
  // ----------------------------------------------------------

  const projectFolders =
    fs
      .readdirSync(
        PROJECTS_DIR,
        {
          withFileTypes: true
        }
      )

      .filter(entry =>
        entry.isDirectory()
      )

      .map(entry =>
        entry.name
      );


  const projects = [];


  // ----------------------------------------------------------
  // Process each project
  // ----------------------------------------------------------

  for (const projectSlug of projectFolders) {

    const projectDir =
      path.join(
        PROJECTS_DIR,
        projectSlug
      );


    const projectData =
      readProjectJson(
        projectDir
      );


    const media =
      getProjectMedia(
        projectDir
      );


    // No images/videos = skip project
    if (!media.length) {

      console.warn(
        `Skipping "${projectSlug}" — no media found.`
      );

      continue;

    }


    // --------------------------------------------------------
    // Generate project index.html
    // --------------------------------------------------------

    const projectIndex =
      path.join(
        projectDir,
        "index.html"
      );


    fs.writeFileSync(
      projectIndex,
      generateProjectPage(
        projectSlug,
        projectData,
        media
      ),
      "utf8"
    );


    // --------------------------------------------------------
    // Add to portfolio list
    // --------------------------------------------------------

    projects.push({

      slug: projectSlug,

      data: projectData,

      media,

      thumbnail: media[0]

    });


    console.log(
      `✓ ${projectSlug} — ${media.length} media file(s)`
    );

  }


  // ----------------------------------------------------------
  // Featured projects first
  // ----------------------------------------------------------

  projects.sort(
    (a, b) => {

      if (
        a.data.featured !==
        b.data.featured
      ) {

        return a.data.featured
          ? -1
          : 1;

      }


      return a.data.title.localeCompare(
        b.data.title
      );

    }
  );


  // ----------------------------------------------------------
  // Generate portfolio cards
  // ----------------------------------------------------------

  let cards = "";


  if (!projects.length) {

    cards = `
      <div class="portfolio-empty">
        No projects have been added yet.
      </div>
    `;

  } else {

    cards =
      projects
        .map(project =>
          generatePortfolioCard(
            project.slug,
            project.data,
            project.thumbnail
          )
        )
        .join("\n");

  }


  // ----------------------------------------------------------
  // Insert cards into index.html
  // ----------------------------------------------------------

  let mainIndex =
    fs.readFileSync(
      MAIN_INDEX,
      "utf8"
    );


  const START =
    "<!-- PROJECTS:START -->";

  const END =
    "<!-- PROJECTS:END -->";


  const startIndex =
    mainIndex.indexOf(START);

  const endIndex =
    mainIndex.indexOf(END);


  if (
    startIndex === -1 ||
    endIndex === -1 ||
    endIndex < startIndex
  ) {

    throw new Error(
      "Could not find PROJECTS:START and PROJECTS:END markers in index.html."
    );

  }


  mainIndex =
    mainIndex.slice(
      0,
      startIndex + START.length
    )

    + "\n"

    + cards

    + "\n      "

    + mainIndex.slice(
      endIndex
    );


  fs.writeFileSync(
    MAIN_INDEX,
    mainIndex,
    "utf8"
  );


  // ----------------------------------------------------------
  // Done
  // ----------------------------------------------------------

  console.log(
    `\n✓ Build complete — ${projects.length} project(s) generated.\n`
  );

}


try {

  build();

} catch (error) {

  console.error(
    `\n✕ Build failed:\n${error.message}\n`
  );

  process.exit(1);

}