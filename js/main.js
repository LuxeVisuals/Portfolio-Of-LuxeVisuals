/* LuxeVisuals — shared site behaviour: mobile nav, scroll-spy nav highlight,
   scroll reveals, page loader, exit fade (for links off this page), cursor
   glow, sticky mini-CTA, animated stat counters, profile parallax.

   Perf notes: all pointer/scroll work uses passive listeners and a single
   requestAnimationFrame loop (no per-event layout work), IntersectionObserver
   replaces scroll polling, and everything heavier than a fade is skipped
   under prefers-reduced-motion. */

(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  document.addEventListener("DOMContentLoaded", () => {
    /* ---- Mobile nav toggle ---- */
    const hamburger = document.querySelector(".hamburger");
    const navLinks = document.getElementById("nav-links");

    const closeMenu = () => {
      navLinks?.classList.remove("open");
      hamburger?.setAttribute("aria-expanded", "false");
    };

    hamburger?.addEventListener("click", () => {
      const open = navLinks?.classList.toggle("open");
      hamburger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks?.querySelectorAll(".nav-link").forEach((l) => l.addEventListener("click", closeMenu));
    document.addEventListener("click", (e) => {
      if (!navLinks?.classList.contains("open")) return;
      if (navLinks.contains(e.target) || hamburger?.contains(e.target)) return;
      closeMenu();
    });

    /* ---- Scroll-spy: highlight the nav link for the section in view ---- */
    const sections = ["top", "portfolio", "commission"]
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const navLinkFor = (id) => document.querySelector(`.nav-link[href="#${id}"]`);
    if (sections.length && "IntersectionObserver" in window) {
      const ioNav = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              document.querySelectorAll(".nav-link").forEach((l) => l.classList.remove("active"));
              navLinkFor(entry.target.id)?.classList.add("active");
            }
          });
        },
        { threshold: 0, rootMargin: "-40% 0px -55% 0px" }
      );
      sections.forEach((s) => ioNav.observe(s));
    }

    /* ---- Scroll reveal ---- */
    const revealEls = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && revealEls.length) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              io.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
      );
      revealEls.forEach((el) => io.observe(el));
    } else {
      revealEls.forEach((el) => el.classList.add("in-view"));
    }

    /* ---- Page loader (once per browser session) ---- */
    const loader = document.querySelector(".page-loader");
    if (loader) {
      if (sessionStorage.getItem("lv-visited")) {
        loader.remove();
      } else {
        sessionStorage.setItem("lv-visited", "1");
        const dismiss = () => {
          loader.classList.add("hide");
          setTimeout(() => loader.remove(), 550);
        };
        if (document.readyState === "complete") {
          setTimeout(dismiss, 320);
        } else {
          window.addEventListener("load", () => setTimeout(dismiss, 320), { once: true });
        }
      }
    }

    /* ---- Exit fade for links that leave this page (project pages, external) ----
       Same-page anchors (#portfolio etc.) are left alone so native smooth
       scrolling handles them. */
    if (!reduceMotion) {
      document.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        if (!href) return;
        if (a.target === "_blank" || href.startsWith("http") || href.startsWith("#") ||
            href.startsWith("mailto:") || href.startsWith("tel:")) return;

        a.addEventListener("click", (e) => {
          e.preventDefault();
          document.body.classList.add("page-exit");
          setTimeout(() => { window.location.href = href; }, 260);
        });
      });
    }

    /* ---- Sticky mini-CTA: hidden while the hero is in view ---- */
    const miniCta = document.querySelector(".mini-cta");
    const hero = document.querySelector(".hero");
    if (miniCta && hero && "IntersectionObserver" in window) {
      const ioCta = new IntersectionObserver(
        (entries) => entries.forEach((entry) => miniCta.classList.toggle("show", !entry.isIntersecting)),
        { threshold: 0 }
      );
      ioCta.observe(hero);
    }

    /* ---- Animated stat counters ---- */
    const counters = document.querySelectorAll(".counter");
    if (counters.length && "IntersectionObserver" in window) {
      const animateCounter = (el) => {
        const target = parseFloat(el.dataset.target || "0");
        const suffix = el.dataset.suffix || "";
        if (reduceMotion) {
          el.textContent = target + suffix;
          return;
        }
        const duration = 1100;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
          else el.textContent = target + suffix;
        };
        requestAnimationFrame(step);
      };
      const ioCounters = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              ioCounters.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach((c) => ioCounters.observe(c));
    }

    /* ---- Cursor glow (desktop / fine-pointer only) ---- */
    const glow = document.querySelector(".cursor-glow");
    if (glow && finePointer && !reduceMotion) {
      let mx = -500, my = -500, gx = -500, gy = -500, active = false;
      window.addEventListener(
        "pointermove",
        (e) => {
          mx = e.clientX;
          my = e.clientY;
          if (!active) { active = true; glow.classList.add("active"); }
        },
        { passive: true }
      );
      const loop = () => {
        gx += (mx - gx) * 0.12;
        gy += (my - gy) * 0.12;
        glow.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;
        requestAnimationFrame(loop);
      };
      requestAnimationFrame(loop);
    }

    /* ---- Profile portrait parallax (desktop / fine-pointer only) ---- */
    const portrait = document.querySelector(".hero-portrait");
    if (portrait && finePointer && !reduceMotion) {
      let tx = 0, ty = 0, px = 0, py = 0;
      window.addEventListener(
        "pointermove",
        (e) => {
          const r = portrait.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          tx = ((e.clientX - cx) / Math.max(r.width, 1)) * 12;
          ty = ((e.clientY - cy) / Math.max(r.height, 1)) * 12;
        },
        { passive: true }
      );
      const loopP = () => {
        px += (tx - px) * 0.07;
        py += (ty - py) * 0.07;
        portrait.style.transform = `translate3d(${px}px, ${py}px, 0)`;
        requestAnimationFrame(loopP);
      };
      requestAnimationFrame(loopP);
    }
  });
})();
