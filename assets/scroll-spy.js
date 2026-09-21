/** Highlight the section that contains a probe 32% down the viewport. */
export function pickActiveSection(sections, { scrollY, viewportHeight }) {
  if (!sections.length) return null;

  const probe = scrollY + Math.round(viewportHeight * 0.32);
  let current = sections[0].id;
  for (let i = 0; i < sections.length; i++) {
    const start = sections[i].top;
    const end = i + 1 < sections.length ? sections[i + 1].top : Number.POSITIVE_INFINITY;
    if (probe >= start && probe < end) current = sections[i].id;
  }

  const last = sections[sections.length - 1];
  if (last.top < scrollY + viewportHeight + 8) current = last.id;
  return current;
}
