document.addEventListener("DOMContentLoaded", () => {
  const sectionTargets = Array.from(document.querySelectorAll(".section-target"));
  const sectionPrev = document.getElementById("section-prev");
  const sectionNext = document.getElementById("section-next");
  const slide2Layout = document.querySelector(".slide-2-layout");
  const viewportExpandButton = slide2Layout?.querySelector(".viewport-expand-button");
  const slide5 = document.getElementById("slide-5");
  const slide5Prev = document.getElementById("slide5-prev");
  const slide5Next = document.getElementById("slide5-next");
  const slide5Counter = document.getElementById("slide5-counter");
  const slide5Pages = Array.from(document.querySelectorAll(".slide5-page"));
  let currentSlide5Page = 0;

  viewportExpandButton?.addEventListener("click", () => {
    const isExpanded = slide2Layout.classList.toggle("is-viewport-expanded");
    viewportExpandButton.setAttribute("aria-pressed", String(isExpanded));
    viewportExpandButton.setAttribute("aria-label", isExpanded ? "Restore text area" : "Expand viewport");
  });

  function updateSlide5Page() {
    slide5Pages.forEach((page, index) => {
      const isCurrent = index === currentSlide5Page;
      page.style.display = isCurrent ? "flex" : "none";

      page.querySelectorAll('video[data-autoplay="true"]').forEach((video) => {
        if (isCurrent) {
          video.play();
        } else {
          video.pause();
          video.currentTime = 0;
        }
      });
    });

    if (slide5Counter) {
      slide5Counter.innerText = `Page ${currentSlide5Page + 1} / ${slide5Pages.length}`;
    }
  }

  function moveSlide5Page(direction) {
    const nextPage = currentSlide5Page + direction;
    if (nextPage < 0 || nextPage >= slide5Pages.length) {
      return false;
    }

    currentSlide5Page = nextPage;
    updateSlide5Page();
    return true;
  }

  slide5Prev?.addEventListener("click", () => moveSlide5Page(-1));
  slide5Next?.addEventListener("click", () => moveSlide5Page(1));

  function getCurrentSectionIndex() {
    if (!sectionTargets.length) {
      return 0;
    }
    const currentTop = window.scrollY + (window.innerHeight * 0.065) + 1; // offset for the header
    return sectionTargets.reduce((currentIndex, target, index) => {
      return target.offsetTop <= currentTop ? index : currentIndex;
    }, 0);
  }

  function moveSection(direction) {
    if (!sectionTargets.length) {
      return;
    }
    const currentIndex = getCurrentSectionIndex();
    if (sectionTargets[currentIndex] === slide5 && moveSlide5Page(direction)) {
      return;
    }
    const nextIndex = Math.max(0, Math.min(sectionTargets.length - 1, currentIndex + direction));
    sectionTargets[nextIndex].scrollIntoView({ behavior: "smooth", block: "start" });
  }

  sectionPrev?.addEventListener("click", () => moveSection(-1));
  sectionNext?.addEventListener("click", () => moveSection(1));

  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveSection(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveSection(1);
    }
  });
});