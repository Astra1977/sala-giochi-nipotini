export const random = (a, b) => a + Math.random() * (b - a);
export function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
export function button(parent, text, fn, className = 'btn') {
  const b = document.createElement('button');
  b.type = 'button'; b.className = className; b.textContent = text;
  b.onclick = fn; parent.append(b); return b;
}
export function context(play, info, tip, persistence) {
  const cleaners = [];
  let disposed = false;
  return {
    play, info, tip, ...persistence,
    makeButton: (text, fn) => button(play, text, fn),
    onCleanup(fn) { cleaners.push(fn); },
    delay(fn, ms) {
      const id = setTimeout(() => { if (!disposed) fn(); }, ms);
      cleaners.push(() => clearTimeout(id)); return id;
    },
    every(fn, ms) {
      const id = setInterval(() => { if (!disposed) fn(); }, ms);
      cleaners.push(() => clearInterval(id)); return id;
    },
    listen(target, event, fn, options) {
      target.addEventListener(event, fn, options);
      cleaners.push(() => target.removeEventListener(event, fn, options));
    },
    frames(fn) {
      let previous = performance.now(), id;
      const tick = now => {
        if (disposed) return;
        const dt = Math.min(.05, (now - previous) / 1000);
        previous = now;
        if (fn(dt, now) !== false) id = requestAnimationFrame(tick);
      };
      id = requestAnimationFrame(tick);
      cleaners.push(() => cancelAnimationFrame(id));
    },
    dispose() {
      disposed = true;
      for (const clean of cleaners.reverse()) clean();
    }
  };
}
export function board(ctx) {
  const el = document.createElement('div'); el.className = 'gameBoard';
  ctx.play.append(el); return el;
}
export function mission(parent) {
  const el = document.createElement('p'); el.className = 'mission'; parent.append(el); return el;
}
export function movement(ctx, parent, move, surface) {
  const directions = { ArrowUp: [0,-1], ArrowLeft: [-1,0], ArrowDown: [0,1], ArrowRight: [1,0] };
  const controls = document.createElement('div'); controls.className = 'dpad';
  controls.setAttribute('aria-label', 'Comandi di movimento');
  Object.entries(directions).forEach(([key, dir], i) => {
    const b = button(controls, ['↑','←','↓','→'][i], () => move(...dir), '');
    b.setAttribute('aria-label', { ArrowUp:'Su', ArrowLeft:'Sinistra', ArrowDown:'Giù', ArrowRight:'Destra' }[key]);
  });
  parent.append(controls);
  ctx.listen(window, 'keydown', e => {
    if (!directions[e.key] || /SELECT|INPUT/.test(e.target.tagName)) return;
    e.preventDefault(); move(...directions[e.key]);
  });
  if (surface) {
    let from = null;
    ctx.listen(surface, 'pointerdown', e => {
      from = { x:e.clientX, y:e.clientY, id:e.pointerId };
      surface.setPointerCapture(e.pointerId);
    });
    ctx.listen(surface, 'pointerup', e => {
      if (!from || from.id !== e.pointerId) return;
      const dx = e.clientX-from.x, dy = e.clientY-from.y; from = null;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) return;
      if (Math.abs(dx) > Math.abs(dy)) move(Math.sign(dx), 0);
      else move(0, Math.sign(dy));
    });
    ctx.listen(surface, 'pointercancel', () => { from = null; });
  }
}
