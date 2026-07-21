document.addEventListener("DOMContentLoaded", () => {
  const sectionTargets = Array.from(document.querySelectorAll(".section-target"));
  const sectionPrev = document.getElementById("section-prev");
  const sectionNext = document.getElementById("section-next");

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