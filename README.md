# LuxeVisuals — Portfolio Landing Page

A single-page portfolio/landing site (Hero → Portfolio → Commission &amp; Contact)
built with plain HTML/CSS/JS. The only build step is a small zero-dependency
Node script that turns `/projects/` into portfolio cards and individual
project pages — there's no framework, and you never run `npm install`. It's
designed to be hosted for free on **GitHub Pages**.

This README assumes you've never set up a GitHub repo before and walks
through it from zero.

---

## 1. What you need

- A [GitHub account](https://github.com/join) (free)
- [Git](https://git-scm.com/downloads) installed on your computer
- A code editor — [VS Code](https://code.visualstudio.com/) is a good free option
- (Optional, for local preview) [Node.js](https://nodejs.org/)

---

## 2. Create the GitHub repository

1. Log in to GitHub and click the **+** in the top-right corner → **New repository**.
2. Name it something like `luxevisuals-portfolio` (the name doesn't matter, but avoid spaces).
3. Set it to **Public** — GitHub Pages' free tier requires public repos (unless you're on GitHub Pro/Team).
4. **Do not** check "Add a README" — you already have one in this folder.
5. Click **Create repository**. GitHub will show you a page with setup commands — keep that tab open.

---

## 3. Choosing a license

This project ships with an **"All Rights Reserved"** `LICENSE` file by default. That's usually the right call for a personal brand site — it protects your designs, your monogram, and your copy from being reused without permission.

If you'd rather let other developers freely reuse the *code* of this site (not your artwork, portfolio pieces, or branding) for their own projects, you can swap in the **MIT License** instead:

- Delete the contents of `LICENSE`
- Paste in the [MIT License text](https://choosealicense.com/licenses/mit/), replacing the copyright line with your name and year

Either way, keeping *some* license file (rather than none) makes your rights explicit — GitHub repos with no license default to standard copyright, but stating it directly avoids any ambiguity.

---

## 4. Push this project to GitHub

Open a terminal in this project folder and run:

```bash
git init
git add .
git commit -m "Initial commit — LuxeVisuals landing page"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin main
```

Replace `YOUR-USERNAME` and `YOUR-REPO-NAME` with the values GitHub showed you in Step 2.

---

## 5. Turn on GitHub Pages

The site has a small build step (it scans `/projects/` and generates the
portfolio cards + project pages before publishing), so Pages needs to be set
to build from a **GitHub Actions workflow** rather than deploying a branch
directly. The workflow file lives at `.github/workflows/deploy.yml` — you
just need to point Pages at it:

1. In your repository on GitHub, go to **Settings** → **Pages** (in the left sidebar).
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push a commit (or go to the **Actions** tab and re-run the workflow) — the "Deploy to GitHub Pages" workflow will run automatically.
4. Once it finishes (usually under a minute), refresh the Pages settings screen — GitHub will show a green box with your live URL, something like:

```
https://YOUR-USERNAME.github.io/YOUR-REPO-NAME/
```

That's your live site. Every push to `main` re-runs the build and redeploys automatically — you can watch progress under the **Actions** tab.

---

## 6. Adding your real logo & profile picture

The site currently ships with a gold "LV" monogram PNG as a placeholder for both the header logo and the hero profile picture. Swap in your real files:

1. Replace `assets/images/logo.png` with your actual logo image (keep the filename `logo.png`, or update the `src`/`href` attributes below if you rename it).
2. Replace `assets/images/profile.png` with your real profile picture the same way.
3. If you rename either file, update these in `index.html`:
   - `<link rel="icon" type="image/png" href="assets/images/logo.png">`
   - `<img class="brand-mark" src="assets/images/logo.png">`
   - `<img src="assets/images/profile.png" alt="LuxeVisuals profile">`
4. Commit and push — the live site updates automatically.

*(Tip: keep the profile picture roughly square — the hero frame crops it to a square.)*

---

## 7. Adding a new project

This is fully automatic — you never touch HTML, CSS, or JavaScript. All you
do is add a folder, and it appears in the Portfolio section of the landing
page with its own dedicated page.

Every project lives in its own folder under `/projects/`:

```text
projects/
    lumberbound/
        01.png
        02.png
        03.mp4
        project.json

    fishing/
        01.jpg
        02.png
        03.mp4
        project.json

    template-project/          ← ships with the site, a starting point
        01.png
        project.json
```

**To add a project:**

1. Go to `/projects/`.
2. Create a new folder (its name becomes the project's URL, e.g. `projects/lumberbound/` → `yoursite.com/projects/lumberbound/`).
3. Drop in your images (`.png`, `.jpg`, `.jpeg`, `.webp`) and/or videos (`.mp4`, `.webm`) — name them anything, there's no fixed count and no fixed naming pattern required.
4. Add a `project.json` file (see below).
5. Commit and push to GitHub.
6. Wait for the "Deploy to GitHub Pages" workflow to finish (check the **Actions** tab).
7. The project automatically appears in the Portfolio section on the landing page, with its own page at `/projects/<your-folder-name>/`.

The easiest way to start a new one is to **duplicate `/projects/template-project/`**, rename the copy, swap out `01.png` for your real media, and edit `project.json`.

### `project.json`

```json
{
  "title": "Lumberbound",
  "description": "Premium UI system designed for a progression-based lumber simulator.",
  "featured": true
}
```

- **title** — required.
- **description** — shown on the portfolio card and at the top of the project's page.
- **longDescription** *(optional)* — a longer write-up shown further down the project page. Leave it out if the media should speak for itself.
- **featured** *(optional)* — `true` adds a "Featured" tag to the card.
- **order** *(optional)* — a number controlling where the card sits in the Portfolio section. Lower numbers come first. Projects without an `order` are placed after the ones that have it, sorted alphabetically by title.
- **thumbnail** *(optional)* — the filename of the media file to use as the card thumbnail (e.g. `"thumbnail": "03.jpg"`). If omitted, the first media file (alphabetical/numeric order) is used automatically.

You do **not** need to list your media files anywhere — every image or video sitting in the folder is detected automatically and shown in that project's gallery.

Clicking a project image or video opens it fullscreen in a lightbox (dark overlay, centered media, closes on the X button, clicking outside, or Escape).

---

## 8. Previewing locally before you push

Because the Portfolio section and project pages are generated by the build
script, you need to run the build once before previewing — serving the raw
repo folder will show an empty portfolio section.

```bash
# 1. Build (only needs Node.js installed — no npm install required)
node scripts/build.js

# 2. Serve the generated /_site folder
npx serve _site
# or: python3 -m http.server 8000 --directory _site
```

Then open the URL it gives you (e.g. `http://localhost:8000`) in your browser. Re-run `node scripts/build.js` any time you change something in `/projects/` and want to see it locally.

---

## 9. Project structure

```
luxevisuals-portfolio/
├── index.html                Landing page — hero, portfolio (generated),
│                                commission CTA, and contact links
├── css/
│   └── style.css               All styling (colors, layout, animation)
├── js/
│   ├── main.js                  Nav, scroll reveals, counters, page loader
│   └── project-gallery.js        Lightbox for the gallery on project pages
├── assets/images/            Logo, profile picture
├── projects/
│   ├── template-project/       Starting point — duplicate this to add a project
│   │   ├── 01.png
│   │   └── project.json
│   └── <your-project>/          Each project = one folder + project.json
├── templates/
│   └── project-page.html        HTML template used to generate each project's page
├── scripts/
│   └── build.js                  Build script — scans /projects/, generates cards + pages
├── .github/workflows/
│   └── deploy.yml                 GitHub Actions: builds and deploys to Pages
├── CNAME
├── LICENSE
├── sitemap.xml
└── README.md                       You are here
```

`_site/` is the generated output folder — it's git-ignored and gets rebuilt automatically by GitHub Actions on every push, so you never commit it.

---

## 10. Updating text (hero copy, links, etc.)

Everything is plain HTML in a single file — open `index.html` in a code editor and edit the text directly:

- **Hero headline &amp; intro** → the `#top` section near the top of `index.html`
- **Services strip** → the three `.cap-card` blocks just below the hero
- **Portfolio intro copy** → the `#portfolio` section head
- **Commission CTA &amp; social links** (Discord server, Discord DM, X, Roblox) → the `#commission` section, and mirrored in the footer

There's no CMS or database — editing `index.html` and pushing to GitHub is the whole workflow.

---

## 11. A note on custom domains (optional)

If you'd like `luxevisuals.site` (or similar) instead of the `github.io` URL:

1. Buy a domain from any registrar (Namecheap, Cloudflare, Google Domains successor, etc.).
2. In your repo's **Settings → Pages**, add it under **Custom domain**.
3. In your domain registrar's DNS settings, add a `CNAME` record pointing to `YOUR-USERNAME.github.io`.

The `CNAME` file in this repo's root already handles the GitHub Pages side of this — just update its contents with your domain if it changes.

GitHub's own guide covers this in more depth: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site
