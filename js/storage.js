// All persistence is local. Private browsing or full storage must not stop a game.
const fallback = new Map();
export function read(key, initial = null) {
  if (fallback.has(key)) return fallback.get(key);
  try { const value = localStorage.getItem(key); return value === null ? initial : JSON.parse(value); }
  catch { return fallback.has(key) ? fallback.get(key) : initial; }
}
export function write(key, value) {
  fallback.set(key, value);
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export function record(key) {
  const n = Number(read('best_' + key, 0));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
export function saveBest(key, value) {
  if (Number.isFinite(value) && value > record(key)) write('best_' + key, value);
}
export function saveFewest(key, moves) {
  const previous = record(key);
  if (moves > 0 && (!previous || moves < previous)) write('best_' + key, moves);
}
export function clearRecords(keys) {
  for (const key of keys) {
    fallback.delete('best_' + key);
    try { localStorage.removeItem('best_' + key); } catch { /* unavailable storage */ }
  }
}
export function favorites() {
  const items = read('favorites', []);
  return Array.isArray(items) ? items.filter(x => typeof x === 'string') : [];
}
