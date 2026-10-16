// Project videos play silently while hovered (pointer) or while on screen (touch); the poster shows otherwise.
// A reduced-motion preference keeps the poster still.
(() => {
  const videos = document.querySelectorAll(".window-video");
  if (!videos.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const play = (v) => { v.play().catch(() => {}); };
  const stop = (v) => { v.pause(); };
  const hover = matchMedia("(hover: hover)").matches;
  videos.forEach((v) => {
    const card = v.closest(".card") || v;
    if (hover) {
      card.addEventListener("pointerenter", () => play(v));
      card.addEventListener("pointerleave", () => stop(v));
    }
  });
  if (!hover && "IntersectionObserver" in window) {
    const seen = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting && e.intersectionRatio > 0.6 ? play(e.target) : stop(e.target)));
    }, { threshold: [0, 0.6, 1] });
    videos.forEach((v) => seen.observe(v));
  }
})();
