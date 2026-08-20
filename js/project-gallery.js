/* =============================================================================
   LuxeVisuals — project gallery lightbox

   Powers the fullscreen media viewer on individual project pages
   (projects/<slug>/index.html). The gallery tiles themselves are generated
   at build time by scripts/build.js — this file only handles opening and
   closing the fullscreen viewer.
   ============================================================================= */

(() => {
  const items = document.querySelectorAll("#project-gallery .portfolio-item");
  if (!items.length) return;

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

  function openLightbox(type, src) {
    ensureLightbox();
    stage.innerHTML = "";
    let media;
    if (type === "video") {
      media = document.createElement("video");
      media.src = src;
      media.controls = true;
      media.autoplay = true;
      media.loop = true;
      media.playsInline = true;
    } else {
      media = document.createElement("img");
      media.src = src;
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

  items.forEach((item) => {
    item.addEventListener("click", () => openLightbox(item.dataset.type, item.dataset.src));
  });
})();
