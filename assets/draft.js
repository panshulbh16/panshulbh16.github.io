const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const desktop = window.matchMedia('(min-width: 901px)');
const grid = document.querySelector('.perspective-grid');
const board = document.querySelector('.bento');
const cards = [...document.querySelectorAll('.card')];
let queued = false;

function render() {
  queued = false;
  const enabled = !motion.matches;
  const wide = desktop.matches;
  const vh = window.innerHeight;
  document.documentElement.classList.toggle('motion-ready', enabled);
  const lift = wide ? Math.min(window.scrollY, 900) * .14 : Math.min(window.scrollY, 500) * .08;
  grid.style.transform = enabled
    ? `translateY(${-lift}px) rotateX(${15 - Math.min(window.scrollY / (wide ? 35 : 25), 15)}deg) rotateY(-24deg) rotateZ(12deg)`
    : '';
  // Phones: a card taller than the screen sticks only once its bottom is in view, so nothing gets covered unread.
  const stick = wide ? 86 : 72;
  cards.forEach(card => {
    card.style.setProperty('--stick', wide || !enabled ? '' : `${Math.min(stick, vh - card.offsetHeight - 12)}px`);
  });
  const boardTop = board.getBoundingClientRect().top;
  const positions = cards.map(card => boardTop + card.offsetTop);
  cards.forEach((card, index) => {
    const overlap = enabled && index < cards.length - 1
      ? Math.max(0, Math.min(1, (vh - positions[index + 1]) / (vh - stick))) : 0;
    card.style.transform = overlap ? `scale(${1 - overlap * (wide ? .18 : .1)})` : '';
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
