const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktop = window.matchMedia('(min-width: 901px)');
const grid = document.querySelector('.perspective-grid');
const board = document.querySelector('.bento');
const cards = [...document.querySelectorAll('.card')];
let queued = false;

function render() {
  queued = false;
  const enabled = !motion.matches && desktop.matches;
  document.documentElement.classList.toggle('motion-ready', enabled);
  grid.style.transform = enabled
    ? `translateY(${-Math.min(window.scrollY, 900) * .14}px) rotateX(${15 - Math.min(window.scrollY / 35, 15)}deg) rotateY(-24deg) rotateZ(12deg)`
    : '';
  const boardTop = board.getBoundingClientRect().top;
  const positions = cards.map(card => boardTop + card.offsetTop);
  cards.forEach((card, index) => {
    const overlap = enabled && index < cards.length - 1
      ? Math.max(0, Math.min(1, (window.innerHeight - positions[index + 1]) / (window.innerHeight - 86))) : 0;
    card.style.transform = overlap ? `scale(${1 - overlap * .18})` : '';
    card.style.filter = overlap ? `brightness(${1 - overlap * .4})` : '';
    card.inert = false;
  });
}
function schedule() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(render);
}
window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', schedule);
motion.addEventListener('change', schedule);
desktop.addEventListener('change', schedule);
render();
