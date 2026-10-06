// Each product's architecture, drawn as a schematic: parts on a grid, wires routed between them. Parts are buttons, so
// hovering, tapping or tabbing to one lights up its wires and says what it does underneath.

/**
 * cols: grid columns. parts: [id, label, detail, col, row, rows?] — rows > 1 makes a tall part (the hub everything
 * goes through). wires: [from, to, "both"?]. note: what each part does, shown when it's selected.
 */
export const SCHEMATICS = {
  "opportunity-hunter": {
    cols: 3,
    intro: "Two things start work: you, in the browser, and a cron that repeats your hunts. The server scores listings and calls out to the services on the right.",
    parts: [
      ["web", "Web app", "Next.js 15", 1, 2],
      ["cron", "Hunt cron", "repeats searches", 1, 4],
      ["server", "Next.js server", "server actions, sessions", 2, 1, 5],
      ["jsearch", "JSearch", "licensed listings", 3, 1],
      ["sqlite", "SQLite", "on a persistent disk", 3, 2],
      ["voyage", "Voyage", "embeddings, cached", 3, 3],
      ["claude", "Claude", "profile from résumé", 3, 4],
      ["razorpay", "Razorpay", "30-day Pro pass", 3, 5],
    ],
    wires: [["web", "server"], ["cron", "server"], ["server", "jsearch"], ["server", "sqlite"], ["server", "voyage"], ["server", "claude"], ["server", "razorpay"]],
    notes: {
      web: "Your profile, matches with a 0–100 score and a plain-English reason, and the saved, applied and offer tracker.",
      cron: "Hunts repeat on a schedule, not only when someone happens to open the page.",
      server: "Scores each listing on skills, role, experience, location and salary, then re-ranks by what you save, apply to and reject. The 15-match weekly free cap is enforced here, never in the browser.",
      jsearch: "Listings come in through a source adapter, into one shared pool.",
      sqlite: "Users, listings, matches and the embedding cache, through better-sqlite3.",
      voyage: "Skills and descriptions are embedded once. The scoring loop reads the cache, never the network.",
      claude: "Drafts a profile from an imported résumé.",
      razorpay: "Pro is a 30-day pass, with webhook recovery if the checkout tab closes.",
    },
  },

  tailor: {
    cols: 3,
    intro: "One request in, one stream back. The route asks Claude for a single response and forwards it as it's written.",
    parts: [
      ["web", "Web app", "parses the stream", 1, 2],
      ["route", "Streaming route", "Next.js 15", 2, 1, 3],
      ["claude", "Claude Sonnet", "one delimited reply", 3, 1],
      ["sqlite", "SQLite", "accounts, quota", 3, 2],
      ["razorpay", "Razorpay", "Pro pass", 3, 3],
    ],
    wires: [["web", "route", "both"], ["route", "claude", "both"], ["route", "sqlite"], ["route", "razorpay"]],
    notes: {
      web: "Shows the score and gaps within seconds, while the rewritten résumé is still streaming in.",
      route: "Forwards Claude's text as it arrives. Auth, billing and the database come from Opportunity Hunter's engine.",
      claude: "Returns a small header (score, verdict, gaps) and then the résumé, using only facts already in the original.",
      sqlite: "Accounts, sessions and the free-tier quota.",
      razorpay: "Checkout for the Pro pass.",
    },
  },

  roamly: {
    cols: 3,
    intro: "A single Cloudflare Worker runs the whole app. Every AI call passes a budget check first, written as one SQL statement.",
    parts: [
      ["web", "Web app", "Next.js via vinext", 1, 2],
      ["auth", "Supabase Auth", "Google, email code", 1, 4],
      ["worker", "Cloudflare Worker", "budget-gated AI", 2, 1, 5],
      ["d1", "D1", "Drizzle, owner-scoped", 3, 1],
      ["claude", "Claude", "streamed, Zod-checked", 3, 2],
      ["razorpay", "Razorpay", "₹499 Plus pass", 3, 3],
      ["resend", "Resend", "trip invites", 3, 4],
      ["airbnb", "Airbnb", "search links only", 3, 5],
    ],
    wires: [["web", "worker"], ["auth", "worker"], ["worker", "d1"], ["worker", "claude", "both"], ["worker", "razorpay", "both"], ["worker", "resend"], ["worker", "airbnb"]],
    notes: {
      web: "The trip form and the itinerary, with days appearing as they're written.",
      auth: "Google and email-code sign-in.",
      worker: "Next.js on Cloudflare Workers. Generation is gated by a per-user daily and global monthly budget, charged on attempt so a retry loop can't drain it, and closed when unconfigured.",
      d1: "Trips and search history. Every query is scoped to its owner, so no trip is reachable by id alone.",
      claude: "Writes the itinerary. Output streams to the page and is Zod-validated on the way in and out.",
      razorpay: "The Plus pass, granted once whether the checkout or the webhook lands first.",
      resend: "Invite emails. Links are single-use tokens stored only as hashes, and accepting one is a POST, so email scanners can't spend it.",
      airbnb: "Stays link out to Airbnb search. Roamly never claims to confirm hotel inventory.",
    },
  },

  duely: {
    cols: 3,
    intro: "Everything runs through one Cloudflare Worker: four ways in on the left, four services it calls on the right, and an hourly cron for reminders.",
    parts: [
      ["web", "Website", "React 19 + Vite", 1, 1],
      ["app", "Phone app", "Expo, iOS + Android", 1, 2],
      ["email", "Email Routing", "forwarded receipts", 1, 3],
      ["gmail", "Gmail API", "read-only", 1, 4],
      ["worker", "Cloudflare Worker", "Hono, hourly cron", 2, 1, 4],
      ["d1", "D1", "Drizzle, sealed rows", 3, 1],
      ["claude", "Claude", "reads receipts", 3, 2],
      ["resend", "Resend", "email reminders", 3, 3],
      ["push", "Expo Push", "phone reminders", 3, 4],
    ],
    wires: [["web", "worker"], ["app", "worker"], ["email", "worker"], ["gmail", "worker"], ["worker", "d1"], ["worker", "claude", "both"], ["worker", "resend"], ["worker", "push"]],
    notes: {
      web: "The web app, served by the same Worker, so the API is same-origin.",
      app: "React Native app: sign-in by code, screenshot import, and push notifications.",
      email: "Receipts forwarded to a private address arrive at the Worker's email handler.",
      gmail: "Only for people who connect it: an hourly read-only search that opens just the matching messages. Disconnecting revokes the token at Google.",
      worker: "One deploy serves the API, the website and the email handler. The hourly cron claims each reminder in D1 before sending, so overlapping runs can't double-send.",
      d1: "Subscriptions, drafts and sessions. Payment details, notes, receipt text and the Gmail token are sealed with AES-256-GCM, bound to their row.",
      claude: "Reads receipts the sender rules don't recognise, behind per-person and monthly budgets charged on attempt.",
      resend: "Renewal reminder digests and sign-in codes.",
      push: "Reminders on the phone, sent only to phones whose sign-in is still active.",
    },
  },
};

/** How far a wire stays from a part's top and bottom edges when it can run straight across. */
const INSET = 10;

/**
 * The route for a wire between two parts, as SVG path data plus where it starts and ends and which way it's heading
 * there (for arrowheads). Rects are {left, top, right, bottom} in the board's coordinates. Wires leave a part's side
 * facing the other part; when the parts overlap vertically the wire runs straight across, otherwise it steps down
 * halfway between them.
 */
export function routeWire(a, b) {
  const midY = r => (r.top + r.bottom) / 2;
  const rightward = b.left >= a.right;
  const leftward = b.right <= a.left;
  if (rightward || leftward) {
    const x1 = rightward ? a.right : a.left;
    const x2 = rightward ? b.left : b.right;
    const dir = rightward ? "right" : "left";
    const inA = y => y >= a.top + INSET && y <= a.bottom - INSET;
    const inB = y => y >= b.top + INSET && y <= b.bottom - INSET;
    // A short part beside a tall one: run straight across at the short part's middle.
    for (const y of [midY(a), midY(b)]) {
      if (inA(y) && inB(y)) return { d: `M${x1} ${y}H${x2}`, start: { x: x1, y }, end: { x: x2, y }, startDir: flip(dir), endDir: dir };
    }
    const y1 = midY(a), y2 = midY(b), mx = (x1 + x2) / 2;
    return { d: `M${x1} ${y1}H${mx}V${y2}H${x2}`, start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, startDir: flip(dir), endDir: dir };
  }
  // Same column: down (or up) from one part to the next.
  const down = b.top >= a.bottom;
  const x = (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2;
  const y1 = down ? a.bottom : a.top;
  const y2 = down ? b.top : b.bottom;
  const dir = down ? "down" : "up";
  return { d: `M${x} ${y1}V${y2}`, start: { x, y: y1 }, end: { x, y: y2 }, startDir: flip(dir), endDir: dir };
}

function flip(dir) {
  return { right: "left", left: "right", down: "up", up: "down" }[dir];
}

/** A small arrowhead with its tip at `p`, pointing `dir`. */
export function arrowhead(p, dir, size = 6) {
  const h = size / 2;
  const pts = {
    right: [[p.x, p.y], [p.x - size, p.y - h], [p.x - size, p.y + h]],
    left: [[p.x, p.y], [p.x + size, p.y - h], [p.x + size, p.y + h]],
    down: [[p.x, p.y], [p.x - h, p.y - size], [p.x + h, p.y - size]],
    up: [[p.x, p.y], [p.x - h, p.y + size], [p.x + h, p.y + size]],
  }[dir];
  return `M${pts.map(([x, y]) => `${round(x)} ${round(y)}`).join("L")}Z`;
}

const round = n => Math.round(n * 10) / 10;
const SVG = "http://www.w3.org/2000/svg";

/** Draws `spec` into `figure` and wires up its interactions. */
export function mountSchematic(figure, spec, { animate = true } = {}) {
  const key = figure.dataset.schematic;
  const board = document.createElement("div");
  board.className = "schematic-board";
  board.style.setProperty("--cols", String(spec.cols));

  const svg = document.createElementNS(SVG, "svg");
  svg.classList.add("wires");
  svg.setAttribute("aria-hidden", "true");
  board.append(svg);

  const caption = document.createElement("figcaption");
  caption.id = `${key}-part`;
  caption.setAttribute("aria-live", "polite");

  const hubs = new Set(spec.parts.filter(p => (p[5] ?? 1) > 1).map(p => p[0]));
  const nodes = new Map();
  for (const [id, label, detail, col, row, rows = 1] of spec.parts) {
    const node = document.createElement("button");
    node.type = "button";
    node.className = hubs.has(id) ? "node is-hub" : "node";
    node.dataset.part = id;
    node.style.gridColumn = String(col);
    node.style.gridRow = `${row} / span ${rows}`;
    node.setAttribute("aria-pressed", "false");
    node.setAttribute("aria-describedby", caption.id);
    const name = document.createElement("span");
    name.textContent = label;
    const small = document.createElement("small");
    small.textContent = detail;
    node.append(name, small);
    board.append(node);
    nodes.set(id, { node, label });
  }

  const wires = spec.wires.map(([from, to, both], i) => {
    const path = document.createElementNS(SVG, "path");
    path.classList.add("wire");
    path.style.setProperty("--delay", `${(i * 0.07).toFixed(2)}s`);
    const heads = [document.createElementNS(SVG, "path")];
    if (both) heads.push(document.createElementNS(SVG, "path"));
    for (const head of heads) {
      head.classList.add("wire-head");
      head.style.setProperty("--delay", `${(i * 0.07).toFixed(2)}s`);
    }
    svg.append(path, ...heads);
    return { from, to, both: !!both, path, heads };
  });

  figure.replaceChildren(board, caption);

  const layout = () => {
    const origin = board.getBoundingClientRect();
    const rectOf = id => {
      const r = nodes.get(id).node.getBoundingClientRect();
      return { left: r.left - origin.left, top: r.top - origin.top, right: r.right - origin.left, bottom: r.bottom - origin.top };
    };
    svg.setAttribute("viewBox", `0 0 ${round(origin.width)} ${round(origin.height)}`);
    for (const w of wires) {
      const route = routeWire(rectOf(w.from), rectOf(w.to));
      w.path.setAttribute("d", route.d);
      w.path.style.setProperty("--len", `${Math.ceil(w.path.getTotalLength?.() ?? 400)}`);
      w.heads[0].setAttribute("d", arrowhead(route.end, route.endDir));
      if (w.both) w.heads[1].setAttribute("d", arrowhead(route.start, route.startDir));
    }
  };

  // Selecting a part: its wires and neighbours light up, and the caption says what it does.
  let pinned = null;
  const show = id => {
    for (const [pid, { node }] of nodes) {
      node.classList.toggle("is-active", pid === id);
      node.classList.toggle("is-linked", !!id && pid !== id && wires.some(w => (w.from === id && w.to === pid) || (w.to === id && w.from === pid)));
      node.setAttribute("aria-pressed", String(pid === pinned));
    }
    for (const w of wires) {
      const hot = !!id && (w.from === id || w.to === id);
      w.path.classList.toggle("is-hot", hot);
      for (const head of w.heads) head.classList.toggle("is-hot", hot);
    }
    if (id) {
      const strong = document.createElement("strong");
      strong.textContent = nodes.get(id).label;
      caption.replaceChildren(strong, document.createTextNode(`. ${spec.notes[id] ?? ""}`));
    } else {
      caption.textContent = spec.intro;
    }
  };
  show(null);

  for (const [id, { node }] of nodes) {
    node.addEventListener("pointerenter", e => { if (e.pointerType === "mouse") show(id); });
    node.addEventListener("pointerleave", e => { if (e.pointerType === "mouse") show(pinned); });
    node.addEventListener("focus", () => show(id));
    node.addEventListener("blur", () => show(pinned));
    node.addEventListener("click", () => {
      pinned = pinned === id ? null : id;
      show(pinned ?? id);
    });
  }
  board.addEventListener("keydown", e => {
    if (e.key === "Escape" && pinned) {
      pinned = null;
      show(null);
    }
  });

  layout();
  new ResizeObserver(layout).observe(board);
  document.fonts?.ready.then(layout);

  if (animate && "IntersectionObserver" in window) {
    figure.dataset.drawing = "";
    const io = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return;
      io.disconnect();
      layout();
      // Two frames: let the undrawn state paint, then let the wires draw in.
      requestAnimationFrame(() => requestAnimationFrame(() => {
        figure.dataset.drawn = "";
        delete figure.dataset.drawing;
      }));
    }, { threshold: 0.35 });
    io.observe(figure);
  }
  return { layout, show };
}
