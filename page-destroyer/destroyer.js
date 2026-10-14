(() => {
  if (window.__pageDestroyer) {
    window.__pageDestroyer.exit();
    return;
  }

  const R = (a, b) => a + Math.random() * (b - a);
  const TAU = Math.PI * 2;
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const TOOLS = [
    { id: "hammer", icon: "🔨", label: "Hammer", key: "1" },
    { id: "gun", icon: "🔫", label: "Gun", key: "2" },
    { id: "saw", icon: "🪚", label: "Chainsaw", key: "3" },
    { id: "fire", icon: "🔥", label: "Fire", key: "4" }
  ];

  const CSS = `
    :host { all: initial; }
    canvas { position: fixed; inset: 0; width: 100vw; height: 100vh; display: block; }
    .dmg { pointer-events: none; }
    .fx { pointer-events: auto; cursor: none; touch-action: none; }
    .bar {
      position: fixed; left: 50%; bottom: 20px; transform: translateX(-50%);
      display: flex; align-items: stretch; gap: 4px; padding: 7px;
      border-radius: 18px;
      background: rgba(18, 18, 24, 0.5);
      backdrop-filter: blur(16px) saturate(1.5);
      -webkit-backdrop-filter: blur(16px) saturate(1.5);
      border: 1px solid rgba(255, 255, 255, 0.16);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255,255,255,0.12);
      font: 500 13px/1 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      color: #fff; pointer-events: auto; user-select: none; -webkit-user-select: none;
      animation: rise .35s cubic-bezier(.2,.9,.3,1.2) both;
    }
    .bar button {
      all: unset; cursor: pointer; display: flex; flex-direction: column; align-items: center;
      justify-content: center; gap: 5px; padding: 8px 10px; border-radius: 12px; min-width: 54px;
      transition: background .15s, transform .1s;
    }
    .bar button:hover { background: rgba(255, 255, 255, 0.12); }
    .bar button:active { transform: scale(.94); }
    .bar button:focus-visible { outline: 2px solid rgba(255,255,255,.7); outline-offset: -2px; }
    .bar button.on { background: rgba(255, 255, 255, 0.24); box-shadow: inset 0 0 0 1px rgba(255,255,255,.35); }
    .ic { font-size: 22px; line-height: 1; }
    .lb { font-size: 11px; opacity: .85; letter-spacing: .01em; }
    .sep { width: 1px; background: rgba(255,255,255,.18); margin: 6px 3px; }
    .score { display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 5px; padding: 0 10px; min-width: 88px; }
    .score b { font-size: 16px; font-weight: 700; font-variant-numeric: tabular-nums; }
    .score span { font-size: 10px; opacity: .7; text-transform: uppercase; letter-spacing: .08em; }
    .hint {
      position: fixed; top: 18px; left: 50%; transform: translateX(-50%);
      padding: 10px 16px; border-radius: 999px;
      background: rgba(18, 18, 24, 0.55);
      backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
      border: 1px solid rgba(255,255,255,.16);
      color: #fff; font: 500 13px/1.2 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      pointer-events: none; white-space: nowrap; animation: hint 4.5s ease forwards;
    }
    kbd { font: 600 11px/1 ui-monospace, monospace; padding: 2px 5px; border-radius: 5px; background: rgba(255,255,255,.18); }
    @keyframes rise { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
    @keyframes hint { 0% { opacity: 0; } 8% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; } }
    @media (max-width: 560px) {
      .bar { bottom: calc(10px + env(safe-area-inset-bottom, 0px)); padding: 4px; gap: 1px; max-width: calc(100vw - 16px); border-radius: 14px; }
      .bar button { min-width: 34px; padding: 7px 4px; border-radius: 10px; }
      .ic { font-size: 19px; }
      .lb, .sep { display: none; }
      .score { min-width: 58px; padding: 0 4px; }
      .score b { font-size: 14px; }
      .hint { font-size: 12px; white-space: normal; text-align: center; width: max-content; max-width: calc(100vw - 32px); }
    }
  `;

  const host = document.createElement("div");
  host.setAttribute("data-page-destroyer", "");
  host.style.cssText = "position:fixed;inset:0;z-index:2147483646;pointer-events:none;";
  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
    <style>${CSS}</style>
    <canvas class="dmg"></canvas>
    <canvas class="fx"></canvas>
    <div class="bar" role="toolbar" aria-label="Page Destroyer">
      ${TOOLS.map(t => `<button data-tool="${t.id}" title="${t.label} (${t.key})" aria-label="${t.label}"><span class="ic">${t.icon}</span><span class="lb">${t.label}</span></button>`).join("")}
      <div class="sep"></div>
      <div class="score"><b class="val">$0</b><span>damage</span></div>
      <div class="sep"></div>
      <button data-act="mute" title="Sound (M)" aria-label="Toggle sound"><span class="ic snd">🔊</span><span class="lb">Sound</span></button>
      <button data-act="clean" title="Repair (C)" aria-label="Repair page"><span class="ic">🧹</span><span class="lb">Repair</span></button>
      <button data-act="exit" title="Exit (Esc)" aria-label="Exit"><span class="ic">✖️</span><span class="lb">Exit</span></button>
    </div>
    <div class="hint">Pick a weapon · click or drag to destroy · <kbd>1</kbd>–<kbd>4</kbd> switch · <kbd>Esc</kbd> exit</div>
  `;
  (document.body || document.documentElement).appendChild(host);

  const dmgC = root.querySelector(".dmg");
  const fxC = root.querySelector(".fx");
  const valEl = root.querySelector(".val");
  const sndEl = root.querySelector(".snd");
  let dctx, fctx;
  let W = window.innerWidth, H = window.innerHeight;
  const dpr = Math.min(2, Math.max(1, window.devicePixelRatio || 1));
  let fitted = false;

  function fit() {
    let old = null;
    if (fitted) {
      old = document.createElement("canvas");
      old.width = dmgC.width;
      old.height = dmgC.height;
      old.getContext("2d").drawImage(dmgC, 0, 0);
    }
    W = window.innerWidth;
    H = window.innerHeight;
    for (const c of [dmgC, fxC]) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    }
    dctx = dmgC.getContext("2d");
    fctx = fxC.getContext("2d");
    dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (old) {
      dctx.save();
      dctx.setTransform(1, 0, 0, 1, 0, 0);
      dctx.drawImage(old, 0, 0);
      dctx.restore();
    }
    fitted = true;
  }
  fit();

  const sfx = (() => {
    let ac = null, master = null, nb = null, muted = false, loop = null;
    function ctx() {
      if (!ac) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ac = new AC();
        master = ac.createGain();
        master.gain.value = muted ? 0 : 0.7;
        master.connect(ac.destination);
        nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
        const d = nb.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      if (ac.state === "suspended") ac.resume();
      return ac;
    }
    function noise(dur, type, f, gain, q = 0.7, delay = 0) {
      const a = ctx(); if (!a) return;
      const t = a.currentTime + delay;
      const s = a.createBufferSource(); s.buffer = nb; s.loop = true;
      const fl = a.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
      const g = a.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(fl); fl.connect(g); g.connect(master);
      s.start(t, Math.random()); s.stop(t + dur + 0.05);
    }
    function tone(f1, f2, dur, gain, type = "sine", delay = 0) {
      const a = ctx(); if (!a) return;
      const t = a.currentTime + delay;
      const o = a.createOscillator(); o.type = type;
      o.frequency.setValueAtTime(f1, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + dur);
      const g = a.createGain();
      g.gain.setValueAtTime(gain, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.05);
    }
    function stopLoop() {
      if (!loop || !ac) { loop = null; return; }
      const t = ac.currentTime;
      loop.g.gain.cancelScheduledValues(t);
      loop.g.gain.setValueAtTime(loop.g.gain.value, t);
      loop.g.gain.linearRampToValueAtTime(0, t + 0.12);
      loop.nodes.forEach(n => { try { n.stop(t + 0.15); } catch (e) {} });
      loop = null;
    }
    function startLoop(kind) {
      stopLoop();
      const a = ctx(); if (!a) return;
      const g = a.createGain(); g.gain.value = 0; g.connect(master);
      const nodes = [];
      if (kind === "saw") {
        const o = a.createOscillator(); o.type = "sawtooth"; o.frequency.value = 70;
        const lfo = a.createOscillator(); lfo.frequency.value = 26;
        const lg = a.createGain(); lg.gain.value = 16;
        lfo.connect(lg); lg.connect(o.frequency);
        const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1500;
        o.connect(f); f.connect(g);
        const s = a.createBufferSource(); s.buffer = nb; s.loop = true;
        const nf = a.createBiquadFilter(); nf.type = "bandpass"; nf.frequency.value = 2600;
        const ng = a.createGain(); ng.gain.value = 0.3;
        s.connect(nf); nf.connect(ng); ng.connect(g);
        o.start(); lfo.start(); s.start();
        nodes.push(o, lfo, s);
        g.gain.linearRampToValueAtTime(0.32, a.currentTime + 0.08);
        loop = { kind, g, nodes, o };
      } else if (kind === "fire") {
        const s = a.createBufferSource(); s.buffer = nb; s.loop = true;
        const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 650;
        s.connect(f); f.connect(g); s.start();
        nodes.push(s);
        g.gain.linearRampToValueAtTime(0.55, a.currentTime + 0.15);
        loop = { kind, g, nodes };
      }
    }
    return {
      hammer() { tone(170, 38, 0.28, 0.9); noise(0.12, "lowpass", 1500, 0.7); noise(0.4, "highpass", 3800, 0.16, 0.7, 0.02); },
      gun() { noise(0.08, "bandpass", 1400, 1, 0.9); tone(190, 48, 0.07, 0.45, "square"); },
      tink() { tone(R(2700, 3500), R(2400, 3000), 0.06, 0.05, "triangle"); },
      crackle() { noise(0.03, "highpass", 2600, 0.12); },
      sawLoad(speed) { if (loop && loop.kind === "saw" && ac) loop.o.frequency.setTargetAtTime(70 + Math.min(90, speed), ac.currentTime, 0.05); },
      startLoop, stopLoop,
      toggleMute() { muted = !muted; if (master) master.gain.value = muted ? 0 : 0.7; return muted; },
      close() { stopLoop(); if (ac) { try { ac.close(); } catch (e) {} } }
    };
  })();

  let score = 0, shown = 0;
  function addScore(v) { score += v; }

  let shakeAmt = 0, shaking = false;
  const html = document.documentElement;
  const prevTranslate = html.style.translate;
  function shake(a) { if (!reducedMotion) shakeAmt = Math.min(14, shakeAmt + a); }

  const parts = [];
  function debris(x, y, n) {
    for (let i = 0; i < n; i++) {
      const a = R(0, TAU), sp = R(120, 520);
      parts.push({ type: "shard", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 180, life: R(0.6, 1.2), max: 1.2, rot: R(0, TAU), vr: R(-12, 12), size: R(3, 8), shade: R(190, 255) | 0 });
    }
    for (let i = 0; i < n / 2; i++) {
      const a = R(0, TAU), sp = R(20, 90);
      parts.push({ type: "dust", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: R(0.5, 0.9), max: 0.9, size: R(6, 16) });
    }
  }
  function sparks(x, y, n, dir) {
    for (let i = 0; i < n; i++) {
      const a = dir != null ? dir + R(-0.7, 0.7) : R(0, TAU), sp = R(200, 650);
      parts.push({ type: "spark", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: R(0.2, 0.5), max: 0.5 });
    }
  }
  function flame(x, y) {
    parts.push({ type: "flame", x: x + R(-10, 10), y: y + R(-6, 6), vx: R(-30, 30), vy: R(-160, -60), life: R(0.4, 0.9), max: 0.9, size: R(10, 24) });
  }

  function strokePath(ctx, pts, w) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x + 0.9, y + 0.9) : ctx.moveTo(x + 0.9, y + 0.9)));
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = Math.max(0.6, w * 0.6);
    ctx.stroke();
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.strokeStyle = "rgba(14,14,20,0.85)";
    ctx.lineWidth = w;
    ctx.stroke();
  }

  function crackRay(x, y, ang, len, w, depth) {
    let px = x, py = y, a = ang, traveled = 0;
    const pts = [[px, py]];
    while (traveled < len) {
      const step = R(6, 16);
      a += R(-0.35, 0.35);
      px += Math.cos(a) * step;
      py += Math.sin(a) * step;
      traveled += step;
      pts.push([px, py]);
      if (depth < 2 && Math.random() < 0.12) {
        crackRay(px, py, a + R(-0.9, 0.9), (len - traveled) * R(0.3, 0.6), w * 0.6, depth + 1);
      }
    }
    strokePath(dctx, pts, w);
    return pts;
  }

  function hammer(x, y) {
    const n = Math.floor(R(7, 12));
    const base = R(0, TAU);
    const rays = [];
    for (let i = 0; i < n; i++) {
      const a = base + i * (TAU / n) + R(-0.25, 0.25);
      rays.push(crackRay(x, y, a, R(60, 200), R(1.2, 2.2), 0));
    }
    for (const rr of [R(16, 28), R(42, 72)]) {
      const ring = rays.map(pts => pts.find(([px, py]) => Math.hypot(px - x, py - y) >= rr) || null);
      for (let i = 0; i < n; i++) {
        const p = ring[i], q = ring[(i + 1) % n];
        if (!p || !q || Math.random() > 0.75) continue;
        const mx = (p[0] + q[0]) / 2 + R(-4, 4), my = (p[1] + q[1]) / 2 + R(-4, 4);
        strokePath(dctx, [p, [mx, my], q], R(0.8, 1.4));
      }
    }
    const g = dctx.createRadialGradient(x, y, 0, x, y, 24);
    g.addColorStop(0, "rgba(0,0,0,0.6)");
    g.addColorStop(0.35, "rgba(30,30,36,0.35)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    dctx.fillStyle = g;
    dctx.beginPath(); dctx.arc(x, y, 24, 0, TAU); dctx.fill();
    debris(x, y, 18);
    shake(9);
    sfx.hammer();
    addScore(R(120, 320));
  }

  function bullet(x, y) {
    x += R(-7, 7); y += R(-7, 7);
    const r = R(3.5, 5.5);
    const k = Math.floor(R(3, 7));
    for (let i = 0; i < k; i++) crackRay(x, y, R(0, TAU), R(8, 28), 0.9, 2);
    const g = dctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
    g.addColorStop(0, "#050505");
    g.addColorStop(0.36, "rgba(10,10,10,0.95)");
    g.addColorStop(0.44, "rgba(255,255,255,0.55)");
    g.addColorStop(0.6, "rgba(60,60,60,0.3)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    dctx.fillStyle = g;
    dctx.beginPath(); dctx.arc(x, y, r * 2.6, 0, TAU); dctx.fill();
    parts.push({ type: "shell", x: x + 18, y: y - 6, vx: R(120, 320), vy: R(-420, -260), life: 2.2, max: 2.2, rot: R(0, TAU), vr: R(-20, 20), bounced: 0 });
    sparks(x, y, 3);
    shake(2.5);
    sfx.gun();
    addScore(R(25, 70));
  }

  function sawCut(ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy);
    if (d < 1) return;
    const nx = -dy / d, ny = dx / d;
    const steps = Math.max(1, Math.floor(d / 4));
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps, j = i === 0 || i === steps ? 0 : R(-2.4, 2.4);
      pts.push([ax + dx * t + nx * j, ay + dy * t + ny * j]);
    }
    dctx.lineCap = "round";
    dctx.lineJoin = "round";
    dctx.beginPath();
    pts.forEach(([x, y], i) => (i ? dctx.lineTo(x, y) : dctx.moveTo(x, y)));
    dctx.strokeStyle = "rgba(12,9,6,0.92)";
    dctx.lineWidth = R(7, 9);
    dctx.stroke();
    dctx.beginPath();
    pts.forEach(([x, y], i) => (i ? dctx.lineTo(x + nx * 4, y + ny * 4) : dctx.moveTo(x + nx * 4, y + ny * 4)));
    dctx.strokeStyle = "rgba(255,255,255,0.35)";
    dctx.lineWidth = 1.2;
    dctx.stroke();
    sparks(bx, by, 4, Math.atan2(-dy, -dx));
    shake(0.8);
    addScore(d * R(0.4, 0.8));
  }

  function scorch(x, y) {
    const r = R(22, 40);
    const g = dctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, "rgba(18,8,2,0.22)");
    g.addColorStop(0.5, "rgba(80,34,6,0.10)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    dctx.fillStyle = g;
    dctx.beginPath(); dctx.arc(x, y, r, 0, TAU); dctx.fill();
    if (Math.random() < 0.25) {
      dctx.fillStyle = "rgba(0,0,0,0.45)";
      dctx.beginPath(); dctx.arc(x + R(-r, r) * 0.6, y + R(-r, r) * 0.6, R(1, 2.5), 0, TAU); dctx.fill();
    }
    addScore(R(3, 9));
  }

  function drawParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= dt;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      const k = p.life / p.max;
      if (p.type === "flame") { p.vy -= 60 * dt; p.size *= 1 - 0.6 * dt; }
      else if (p.type === "dust") { p.vx *= 0.96; p.vy *= 0.96; p.size += 20 * dt; }
      else { p.vy += 1100 * dt; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.rot != null) p.rot += p.vr * dt;
      if (p.type === "shell" && p.y > H - 6 && p.vy > 0) {
        p.y = H - 6; p.vy *= -0.38; p.vx *= 0.6;
        if (p.bounced++ < 2) sfx.tink();
      }

      fctx.save();
      if (p.type === "shard") {
        fctx.translate(p.x, p.y); fctx.rotate(p.rot);
        fctx.globalAlpha = Math.min(1, k * 1.5);
        fctx.fillStyle = `rgb(${p.shade},${p.shade},${Math.min(255, p.shade + 10)})`;
        fctx.strokeStyle = "rgba(0,0,0,0.35)";
        fctx.beginPath(); fctx.moveTo(0, -p.size); fctx.lineTo(p.size * 0.8, p.size * 0.6); fctx.lineTo(-p.size * 0.6, p.size * 0.4); fctx.closePath();
        fctx.fill(); fctx.stroke();
      } else if (p.type === "dust") {
        fctx.globalAlpha = k * 0.35;
        fctx.fillStyle = "rgb(150,150,150)";
        fctx.beginPath(); fctx.arc(p.x, p.y, p.size, 0, TAU); fctx.fill();
      } else if (p.type === "spark") {
        fctx.globalCompositeOperation = "lighter";
        fctx.globalAlpha = k;
        fctx.strokeStyle = "rgb(255,190,80)";
        fctx.lineWidth = 2;
        fctx.beginPath(); fctx.moveTo(p.x, p.y); fctx.lineTo(p.x - p.vx * 0.02, p.y - p.vy * 0.02); fctx.stroke();
      } else if (p.type === "shell") {
        fctx.translate(p.x, p.y); fctx.rotate(p.rot);
        fctx.globalAlpha = Math.min(1, k * 2);
        fctx.fillStyle = "#d4a73c"; fctx.fillRect(-4, -1.5, 8, 3);
        fctx.fillStyle = "#8a6420"; fctx.fillRect(2.5, -1.5, 1.5, 3);
      } else if (p.type === "flame") {
        fctx.globalCompositeOperation = "lighter";
        const g = fctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        g.addColorStop(0, `rgba(255,240,170,${0.9 * k})`);
        g.addColorStop(0.4, `rgba(255,140,30,${0.6 * k})`);
        g.addColorStop(1, "rgba(200,30,0,0)");
        fctx.fillStyle = g;
        fctx.beginPath(); fctx.arc(p.x, p.y, p.size, 0, TAU); fctx.fill();
      }
      fctx.restore();
    }
  }

  let mx = W / 2, my = H / 2, inside = false, down = false, lastX = 0, lastY = 0;
  let gunT = 0, fireT = 0, swing = 0, recoil = 0;

  function drawCursor() {
    if (!inside) return;
    const t = TOOLS.find(x => x.id === tool);
    fctx.save();
    fctx.textAlign = "center";
    fctx.textBaseline = "middle";
    if (tool === "gun") {
      fctx.strokeStyle = "rgba(255,40,40,0.9)";
      fctx.lineWidth = 1.5;
      fctx.beginPath(); fctx.arc(mx, my, 11, 0, TAU); fctx.stroke();
      fctx.beginPath();
      fctx.moveTo(mx - 17, my); fctx.lineTo(mx - 5, my); fctx.moveTo(mx + 5, my); fctx.lineTo(mx + 17, my);
      fctx.moveTo(mx, my - 17); fctx.lineTo(mx, my - 5); fctx.moveTo(mx, my + 5); fctx.lineTo(mx, my + 17);
      fctx.stroke();
      fctx.font = "26px system-ui, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";
      fctx.translate(mx + 34 + recoil * 8, my + 26 + recoil * 4);
      fctx.scale(-1, 1);
      fctx.fillText(t.icon, 0, 0);
    } else {
      let ox = 16, oy = -16, rot = 0;
      if (tool === "hammer") rot = -0.5 + swing * 1.1;
      if (tool === "saw" && down) { ox += R(-2, 2); oy += R(-2, 2); }
      if (tool === "fire") { ox = 4; oy = -22; }
      fctx.font = "34px system-ui, 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";
      fctx.translate(mx, my);
      fctx.rotate(rot);
      fctx.fillText(t.icon, ox, oy);
      fctx.rotate(-rot);
      fctx.fillStyle = "rgba(255,255,255,0.9)";
      fctx.strokeStyle = "rgba(0,0,0,0.6)";
      fctx.beginPath(); fctx.arc(0, 0, 2.5, 0, TAU); fctx.fill(); fctx.stroke();
    }
    fctx.restore();
  }

  let lastFrame = performance.now(), raf = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    if (down && tool === "gun") {
      gunT -= dt;
      while (gunT <= 0) { bullet(mx, my); gunT += 0.075; recoil = 1; }
    }
    if (down && tool === "fire") {
      fireT -= dt;
      if (fireT <= 0) { scorch(mx, my); fireT = 0.03; }
      for (let i = 0; i < 3; i++) flame(mx, my);
      if (Math.random() < 0.25) sfx.crackle();
    }
    if (down && tool === "saw" && Math.random() < 0.3) sparks(mx, my, 1);

    fctx.clearRect(0, 0, W, H);
    drawParts(dt);
    drawCursor();

    if (shakeAmt > 0.3) {
      html.style.translate = `${R(-shakeAmt, shakeAmt).toFixed(1)}px ${R(-shakeAmt, shakeAmt).toFixed(1)}px`;
      shakeAmt *= 0.8;
      shaking = true;
    } else if (shaking) {
      html.style.translate = prevTranslate;
      shakeAmt = 0;
      shaking = false;
    }
    swing *= 0.82;
    recoil *= 0.7;

    if (Math.abs(score - shown) >= 1) {
      shown += (score - shown) * 0.2;
      if (Math.abs(score - shown) < 1) shown = score;
      valEl.textContent = "$" + Math.round(shown).toLocaleString("en-US");
    }
    raf = requestAnimationFrame(frame);
  }

  let tool = "hammer";
  function setTool(id) {
    tool = id;
    down = false;
    sfx.stopLoop();
    root.querySelectorAll("[data-tool]").forEach(b => b.classList.toggle("on", b.dataset.tool === id));
  }
  setTool("hammer");

  function clean() {
    dctx.save();
    dctx.setTransform(1, 0, 0, 1, 0, 0);
    dctx.clearRect(0, 0, dmgC.width, dmgC.height);
    dctx.restore();
    parts.length = 0;
    score = 0; shown = 0;
    valEl.textContent = "$0";
  }

  function toggleMute() {
    sndEl.textContent = sfx.toggleMute() ? "🔇" : "🔊";
  }

  function onDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    try { fxC.setPointerCapture(e.pointerId); } catch (err) {}
    down = true; inside = true;
    mx = e.clientX; my = e.clientY; lastX = mx; lastY = my;
    if (tool === "hammer") { hammer(mx, my); swing = 1; }
    else if (tool === "gun") { gunT = 0; }
    else if (tool === "saw") { sfx.startLoop("saw"); }
    else if (tool === "fire") { sfx.startLoop("fire"); fireT = 0; }
  }
  function onMove(e) {
    inside = true;
    mx = e.clientX; my = e.clientY;
    if (down && tool === "saw") {
      const d = Math.hypot(mx - lastX, my - lastY);
      if (d >= 3) {
        sawCut(lastX, lastY, mx, my);
        sfx.sawLoad(d * 6);
        lastX = mx; lastY = my;
      }
    }
  }
  function onUp() {
    if (!down) return;
    down = false;
    sfx.stopLoop();
  }
  function onLeave() { if (!down) inside = false; }

  fxC.addEventListener("pointerdown", onDown);
  fxC.addEventListener("pointermove", onMove);
  fxC.addEventListener("pointerup", onUp);
  fxC.addEventListener("pointercancel", onUp);
  fxC.addEventListener("pointerleave", onLeave);
  fxC.addEventListener("contextmenu", e => e.preventDefault());

  root.querySelector(".bar").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    if (b.dataset.tool) setTool(b.dataset.tool);
    else if (b.dataset.act === "mute") toggleMute();
    else if (b.dataset.act === "clean") clean();
    else if (b.dataset.act === "exit") exit();
  });

  function onKey(e) {
    const k = e.key;
    if (k === "Escape") exit();
    else if (k >= "1" && k <= "4") setTool(TOOLS[+k - 1].id);
    else if (k === "c" || k === "C") clean();
    else if (k === "m" || k === "M") toggleMute();
    else return;
    e.preventDefault();
    e.stopPropagation();
  }
  window.addEventListener("keydown", onKey, true);
  window.addEventListener("resize", fit);
  window.addEventListener("blur", onUp);

  function exit() {
    cancelAnimationFrame(raf);
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("resize", fit);
    window.removeEventListener("blur", onUp);
    html.style.translate = prevTranslate;
    sfx.close();
    host.remove();
    delete window.__pageDestroyer;
  }

  window.__pageDestroyer = { exit };
  raf = requestAnimationFrame(frame);
})();
