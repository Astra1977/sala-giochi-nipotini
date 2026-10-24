// Only Sound and U from Andrea core.js; no menu, accounts or other games.
import { read } from '../../storage.js';
export function roadUtilities() {
const Store = { get: read };
const Sound = {
  ac: null,
  on: Store.get('cg_sound', true),
  unlock() {
    try {
      if (!this.ac) { const A = window.AudioContext || window.webkitAudioContext; if (A) this.ac = new A(); }
      if (this.ac && this.ac.state === 'suspended') this.ac.resume();
    } catch (e) { /* niente */ }
  },
  tone(f, d = 0.12, type = 'sine', v = 0.15, delay = 0) {
    if (!this.on || !this.ac) return;
    try {
      const t = this.ac.currentTime + delay;
      const o = this.ac.createOscillator(), g = this.ac.createGain();
      o.type = type; o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(this.ac.destination);
      o.start(t); o.stop(t + d + 0.02);
    } catch (e) { /* niente */ }
  },
  good() { this.tone(660, 0.1, 'triangle'); this.tone(990, 0.15, 'triangle', 0.15, 0.07); },
  bad() { this.tone(200, 0.25, 'sawtooth', 0.07); this.tone(140, 0.3, 'sawtooth', 0.07, 0.1); },
  pop() { this.tone(500 + Math.random() * 300, 0.07, 'square', 0.05); },
  slice() { this.tone(1200, 0.06, 'triangle', 0.08); this.tone(700, 0.08, 'triangle', 0.06, 0.03); },
  ring() { this.tone(1318, 0.08, 'square', 0.05); this.tone(1760, 0.12, 'square', 0.05, 0.06); },
  note(f) { this.tone(f, 0.35, 'triangle', 0.22); },
  win() { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.15, i * 0.12)); },
};

/* ---------- Utilità ---------- */
const U = {
  rand: (a, b) => a + Math.random() * (b - a),
  ri: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: arr => arr[Math.floor(Math.random() * arr.length)],
  shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; },
  el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; },
  esc: s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
  fmt(sec) { sec = Math.max(0, Math.floor(sec)); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); },
  vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* niente */ } },
  hearts: (n, max = 3) => '❤️'.repeat(Math.max(0, n)) + '🤍'.repeat(Math.max(0, max - n)),
};


return { Sound, U };
}
