'use strict';
const $ = (s, r = document) => r.querySelector(s);
const h = (tag, props = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v; else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  for (const c of kids.flat()) if (c != null) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
};
const NS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); return e; };
// Material Symbols (Outlined) style icons, fill-based, on a 24px grid. Path data in the style of Google's Material icons (Apache-2.0).
const ICONS = {
  home: 'M12 5.69l5 4.5V18h-2v-6H9v6H7v-7.81l5-4.5M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z',
  recent: 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
  star: 'M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z',
  starfill: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
  templates: 'M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z',
  settings: 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z',
  help: 'M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z',
  keyboard: 'M20 7v10H4V7h16m0-2H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2zm0 3h2v2h-2zM8 8h2v2H8zm0 3h2v2H8zm-3 0h2v2H5zm0-3h2v2H5zm3 6h8v2H8zm6-3h2v2h-2zm0-3h2v2h-2zm3 3h2v2h-2zm0-3h2v2h-2z',
  menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
  back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  plus: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
  folderplus: 'M20 6h-8l-2-2H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm0 12H4V6h5.17l2 2H20v10zm-8-4h2v2h2v-2h2v-2h-2v-2h-2v2h-2z',
  open: 'M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z',
  newdoc: 'M13 11h-2v3H8v2h3v3h2v-3h3v-2h-3zm1-9H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z',
  example: 'M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z',
  save: 'M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm2 16H5V5h11.17L19 7.83V19zm-7-7c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3zM6 6h9v4H6z',
  eye: 'M12 6c3.79 0 7.17 2.13 8.82 5.5C19.17 14.87 15.79 17 12 17s-7.17-2.13-8.82-5.5C4.83 8.13 8.21 6 12 6m0-2C7 4 2.73 7.11 1 11.5 2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4zm0 5c1.38 0 2.5 1.12 2.5 2.5S13.38 14 12 14s-2.5-1.12-2.5-2.5S10.62 9 12 9m0-2c-2.48 0-4.5 2.02-4.5 4.5S9.52 16 12 16s4.5-2.02 4.5-4.5S14.48 7 12 7z',
  download: 'M18 15v3H6v-3H4v3c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-3h-2zm-1-4l-1.41-1.41L13 12.17V4h-2v8.17L8.41 9.59 7 11l5 5 5-5z',
  image: 'M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.86 8.86l-3 3.87L9 13.14 6 17h12l-3.86-5.14z',
  code: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z',
  del: 'M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1zM18 7H6v12c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7z',
  panl: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 19H5V5h4v14zm10 0h-8V5h8v14z',
  panr: 'M5 3h14c1.1 0 2 .9 2 2v14c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V5c0-1.1.9-2 2-2zm10 16h4V5h-4v14zM5 19h8V5H5v14z',
};
// one fill-based 24px icon; `d` is path data, evenodd keeps cut-outs open for the hand-drawn tool glyphs
const fillIcon = (d, size = 20) => { const s = sv('svg', { viewBox: '0 0 24 24', width: size, height: size, fill: 'currentColor', 'aria-hidden': 'true', class: 'ms' }); s.append(sv('path', { d, 'fill-rule': 'evenodd' })); return s; };
const icon = (name, size = 20) => fillIcon(ICONS[name] || ICONS.plus, size);
const uid = () => Math.random().toString(36).slice(2, 8);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const toast = (m) => { const t = h('div', { class: 'toast', text: m }); document.body.append(t); setTimeout(() => t.remove(), 2400); };
const hex = (s, d) => (/^#[0-9a-f]{6}$/i.test(s) ? s : d);

// ---------- model ----------
// item: {id,type:'frame'|'rect'|'ellipse'|'text'|'line', name,x,y,w,h,fill,stroke,sw,r,op,text,fs,go,hidden,locked}
let doc = { id: uid(), title: 'Untitled design', items: [] };
let sel = new Set(), tool = 'select', zoom = 1, panX = 0, panY = 0, fileName = '';
let undoS = [], redoS = [], clip = null, preview = null;
const snapshot = () => JSON.stringify(doc);
// what a saved file holds (animated layers at rest), so a moved playhead is not an unsaved change
const fileSnap = () => JSON.stringify(restDoc());
let shownText = null;   // the text layer last edited in the Text box (see dropEmptyText)
// restEdit: a real change was made since the last full render, so animated layers may need their keys moved (syncRest)
let restEdit = false;
function commit() { undoS.push(snapshot()); if (undoS.length > 100) undoS.shift(); redoS = []; restEdit = true; }
// a pen path or a mouse drag in progress belongs to the history step being undone, so end it first
function endOps() { if (drag) { if (drag.r) drag.r.remove(); drag = null; } if (pen) { pen = null; setTool('select'); } }
// after undo/redo: keep the selected layers that still exist; outside Motion mode put animated layers at time 0
function restPose() { sel = new Set([...sel].filter((id) => get(id))); if (mode !== 'motion') applyPose(0); }
function undo() { endOps(); if (!undoS.length) return; redoS.push(snapshot()); doc = JSON.parse(undoS.pop()); restEdit = false; restPose(); render(); }
function redo() { endOps(); if (!redoS.length) return; undoS.push(snapshot()); doc = JSON.parse(redoS.pop()); restEdit = false; restPose(); render(); }
const get = (id) => doc.items.find((i) => i.id === id);
const FILLS = ['#ffffff', '#e4e4e4', '#bdbdbd', '#8a8a8a', '#4a4a4a', '#262626', '#d9e0e6', '#e6e0d2', '#dce6dc', '#e8d9d9'];
const NAMES = { frame: 'Frame', rect: 'Rectangle', ellipse: 'Ellipse', text: 'Text', line: 'Line', image: 'Image', polygon: 'Polygon', star: 'Star', path: 'Path' };
const FONTS = { sans: 'Segoe UI,Arial,sans-serif', serif: 'Georgia,Times New Roman,serif', mono: 'Consolas,Courier New,monospace' };
const IMG_OK = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+\/=]+$/;
function makeItem(type, x, y, w, hh) {
  const base = { id: uid(), type, name: NAMES[type] + ' ' + (doc.items.filter((i) => i.type === type).length + 1), x, y, w, h: hh, fill: '#d0d0d0', stroke: '#000000', sw: 0, r: 0, op: 1, text: '', fs: 16, go: '', tr: 'none', hidden: false, locked: false, rot: 0, ff: 'sans', fw: 400, ta: 'left' };
  if (type === 'frame') Object.assign(base, { fill: '#ffffff', r: 0 });
  if (type === 'text') Object.assign(base, { text: 'Text', fill: '#1a1a1a', h: 24, w: Math.max(w, 80) });
  if (type === 'line') Object.assign(base, { fill: 'none', stroke: '#8a8a8a', sw: 2 });
  if (type === 'rect') Object.assign(base, { r: 6 });
  if (type === 'polygon') Object.assign(base, { n: 3 });
  if (type === 'star') Object.assign(base, { n: 5 });
  if (type === 'path') Object.assign(base, { fill: 'none', stroke: '#8a8a8a', sw: 2, pts: [] });
  return base;
}
// a frame can only sit inside a bigger frame, so a frame that shrank (hug) never becomes a child of its own child
// the box a layer covers; a line drawn leftwards or upwards has a negative width or height
const bb = (i) => ({ x: Math.min(i.x, i.x + i.w), y: Math.min(i.y, i.y + i.h), w: Math.abs(i.w), h: Math.abs(i.h) });
function inside(i, f) { if (i === f || (i.type === 'frame' && i.w * i.h >= f.w * f.h)) return false; const cx = i.x + i.w / 2, cy = i.y + i.h / 2; return cx >= f.x && cx <= f.x + f.w && cy >= f.y && cy <= f.y + f.h; }
// ---------- components + auto layout ----------
const kidsOf = (f) => doc.items.filter((c) => c !== f && !c.hidden && inside(c, f));   // everything inside, nested frames' contents too
const descOf = (f) => doc.items.filter((c) => c !== f && inside(c, f));
// the frame an item belongs to: the smallest frame that contains it
const parentFrame = (c) => { let best = null; for (const f of doc.items) if (f.type === 'frame' && f !== c && inside(c, f) && (!best || f.w * f.h < best.w * best.h)) best = f; return best; };
const directKids = (f) => doc.items.filter((c) => c !== f && !c.hidden && inside(c, f) && parentFrame(c) === f);
// the item plus, for frames, everything inside (that is what moving, copying and deleting a frame mean)
function expand(ids) { const out = new Set(ids); for (const id of ids) { const f = get(id); if (f && f.type === 'frame') for (const c of descOf(f)) out.add(c.id); } return out; }
function detach(rootId) { for (const c of doc.items) { if (c.id === rootId) delete c.inst; if (c.instRoot === rootId) { delete c.instOf; delete c.instRoot; delete c.ov; } } }
const PART_MSG = 'Parts of an instance stay where the component puts them. Move the whole instance, or detach it to change this part.';
let partToast = 0;
const partAt = new Map();   // where each instance part was last put (not saved): a part found elsewhere was edited by hand
const COPY = ['w', 'h', 'fill', 'stroke', 'sw', 'r', 'op', 'fs', 'fill2', 'ga', 'ff', 'fw', 'ta'];
function syncInstances() {
  for (const root of doc.items.filter((i) => i.inst)) {
    const m = get(root.inst);
    if (!m || !m.master) { detach(root.id); continue; }
    for (const k of COPY) root[k] = m[k]; root.al = m.al ? { ...m.al } : undefined; root.sh = m.sh ? { ...m.sh } : undefined; if (!root.ov && m.type === 'text') root.text = m.text;
    if (m.type !== 'frame') continue;
    const mk = kidsOf(m).filter((c) => !c.inst && !c.instOf);
    const old = doc.items.filter((c) => c.instRoot === root.id);
    const keep = {}; for (const o of old) keep[o.instOf] = o;
    doc.items = doc.items.filter((c) => c.instRoot !== root.id);
    for (const mc of mk) {
      const o = keep[mc.id] || { ...JSON.parse(JSON.stringify(mc)), id: uid(), name: mc.name };
      const nx = root.x + (mc.x - m.x), ny = root.y + (mc.y - m.y);
      // an edit tried to move or resize the part itself (arrow keys, X/Y/W/H, align): it goes back, and say why once
      const was = partAt.get(o.id);
      if (restEdit && keep[mc.id] && was && (o.x !== was[0] || o.y !== was[1] || o.w !== was[2] || o.h !== was[3]) && Date.now() - partToast > 2500) { partToast = Date.now(); toast(PART_MSG); }
      for (const k of COPY) o[k] = mc[k]; if (!o.ov) o.text = mc.text; o.type = mc.type; o.name = mc.name;
      o.x = nx; o.y = ny; partAt.set(o.id, [o.x, o.y, o.w, o.h]); o.instOf = mc.id; o.instRoot = root.id; delete o.master; delete o.inst;
      doc.items.push(o);
    }
  }
}
function applyLayouts() {
  for (const f of doc.items.filter((i) => i.type === 'frame' && i.al && i.al.dir).sort((a, b) => a.w * a.h - b.w * b.h)) {
    const { dir, gap, pad, align, hug } = f.al; const v = dir === 'v';
    const ks = directKids(f).sort((a, b) => (v ? a.y - b.y : a.x - b.x)); if (!ks.length) continue;
    // work out what travels with each child (a nested frame takes its contents along) before anything moves
    const plan = ks.map((k) => ({ k, d: k.type === 'frame' ? descOf(k) : [] }));
    const put = (e, nx, ny) => { const dx = nx - e.k.x, dy = ny - e.k.y; if (!dx && !dy) return; for (const c of e.d) { c.x += dx; c.y += dy; } e.k.x = nx; e.k.y = ny; };
    let pos = pad, cross = 0;
    for (const e of plan) { const k = e.k; const main = v ? k.h : k.w; const sub = v ? k.w : k.h; cross = Math.max(cross, sub);
      if (v) put(e, k.x, f.y + pos); else put(e, f.x + pos, k.y); pos += main + gap; }
    const inner = (v ? f.w : f.h) - pad * 2; const box = hug ? cross : inner;
    for (const e of plan) { const k = e.k; const sub = v ? k.w : k.h; const off = align === 'center' ? (box - sub) / 2 : align === 'end' ? box - sub : 0; if (v) put(e, f.x + pad + off, k.y); else put(e, k.x, f.y + pad + off); }
    if (hug) { const main = pos - gap + pad; if (v) { f.h = Math.max(20, main); f.w = Math.max(20, cross + pad * 2); } else { f.w = Math.max(20, main); f.h = Math.max(20, cross + pad * 2); } }
  }
}
function makeComponent(i) { if (i.inst || i.instOf) { toast('Already an instance'); return; } commit(); i.master = true; render(); toast('Component created'); }
function insertInstance(m) {
  if (!m || !m.master) return; commit();
  const taken = doc.items.filter((i) => i.inst === m.id).map((i) => i.x + i.w); const x = Math.max(m.x + m.w, ...taken) + 40;
  const root = { ...JSON.parse(JSON.stringify(m)), id: uid(), x, y: m.y, name: m.name + ' instance', inst: m.id, go: m.go || '' }; delete root.master;
  doc.items.push(root); syncInstances(); sel = new Set([root.id]); render();
}
function framesOf(i) { return doc.items.filter((f) => f.type === 'frame' && inside(i, f)); }

// ---------- shell ----------
const app = $('#app');
const toolbar = h('div', { class: 'toolbar' });
const left = h('div', { class: 'sidebar' });
const stage = h('div', { class: 'stage', style: 'overflow:hidden;position:relative;padding:0' });
const right = h('div', { class: 'sidebar right', style: 'width:270px' });
const status = h('div', { class: 'status' });
app.append(toolbar, h('div', { class: 'main', style: 'flex:1;min-height:0;min-width:0;width:100%;overflow:hidden' }, left, stage, right), status);
const btn = (label, fn, cls = '') => h('button', { class: 'btn ' + cls, onclick: fn, text: label });
// top-bar button: our own fill icon (data-for tells kit.js not to add its line icon) + a label that kit.js hides unless "Aa" is on
function tbtn(label, ic, fn, cls = '', tip = label) {
  const b = h('button', { class: 'btn ' + cls, onclick: fn, title: tip, 'aria-label': label });
  const i = icon(ic, 20); i.classList.add('ic'); i.dataset.for = label; b.append(i, document.createTextNode(label)); return b;
}
const titleInput = h('input', { type: 'text', class: 'tbtitle', maxlength: 80, title: 'Design name', 'aria-label': 'Design name', placeholder: 'Untitled design', onfocus: () => { titleOld = doc.title || ''; }, onblur: () => { titleOld = null; }, oninput: (e) => { if (titleOld === null) titleOld = doc.title || ''; doc.title = e.target.value; syncTitle(); }, onchange: (e) => { if (!e.target.value.trim()) { doc.title = 'Untitled design'; e.target.value = doc.title; syncTitle(); } }, onkeydown: (e) => { e.stopPropagation(); if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') { doc.title = titleOld || doc.title; e.target.value = doc.title; syncTitle(); e.target.blur(); } } });
let titleOld = null;   // the title before the current edit in the top bar, for Escape
function syncTitle() { const r = document.querySelector('.rtitle'); if (r && r !== document.activeElement) r.value = doc.title; }
const exportBtn = tbtn('Export', 'download', (e) => openMenu(e.currentTarget, 'export', [['image', 'Export PNG', () => exportImg('png')], ['code', 'Export SVG', () => exportImg('svg')]], e.detail === 0));
exportBtn.dataset.menu = 'export'; exportBtn.setAttribute('aria-haspopup', 'menu');
toolbar.append(tbtn('Home', 'home', () => showHome('home'), '', 'Home (all designs)'), titleInput, h('span', { class: 'grow' }),
  tbtn('New', 'newdoc', newDoc, '', 'New design'), tbtn('Open', 'open', openDoc, '', 'Open a file (Ctrl+O)'), exportBtn,
  tbtn('Keyboard shortcuts', 'keyboard', () => showHelp()),
  tbtn('Preview', 'eye', startPreview, 'primary tonal', 'Preview the design'), tbtn('Save', 'save', saveDoc, 'primary', 'Save (Ctrl+S)'));
// a small menu anchored under (or above) a button; shares the "fly" slot so Esc / outside click close it
function openMenu(anchor, id, items, kb) {
  const was = fly && fly.dataset.g === 'menu:' + id; closeFly(); if (was) return;
  fly = h('div', { class: 'fly menu', role: 'menu', 'data-g': 'menu:' + id });
  for (const [ic, label, fn] of items) fly.append(h('button', { class: 'fi', role: 'menuitem', onclick: () => { closeFly(); fn(); } }, icon(ic, 20), h('span', { class: 'fl', text: label })));
  document.body.append(fly);
  const r = anchor.getBoundingClientRect(), w = fly.offsetWidth;
  fly.style.position = 'fixed'; fly.style.top = (r.bottom + 6) + 'px'; fly.style.left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + 'px';
  flyAnchor = anchor; if (kb) fly.classList.add('kb'); fly.querySelector('.fi').focus();
}
// ---------- images ----------
// shrinks the picture so a design stays small (it is stored inside the .frameout file), then makes an image layer
async function imageItemFromBytes(bytes, name) {
  try {
    const bmp = await createImageBitmap(new Blob([bytes]));
    const MAXPX = 1600, k = Math.min(1, MAXPX / Math.max(bmp.width, bmp.height));
    const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(bmp.width * k)); cv.height = Math.max(1, Math.round(bmp.height * k));
    const ctx = cv.getContext('2d'); ctx.drawImage(bmp, 0, 0, cv.width, cv.height);
    const png = /\.(png|gif|webp)$/i.test(name || '');
    let src = cv.toDataURL(png ? 'image/png' : 'image/jpeg', 0.88);
    if (src.length > 3e6) { const c2 = document.createElement('canvas'); c2.width = Math.round(cv.width / 2); c2.height = Math.round(cv.height / 2); c2.getContext('2d').drawImage(cv, 0, 0, c2.width, c2.height); src = c2.toDataURL('image/jpeg', 0.85); }
    if (!IMG_OK.test(src)) return null;
    const sc = Math.min(1, 600 / Math.max(bmp.width, bmp.height));
    const it = makeItem('image', 0, 0, Math.round(bmp.width * sc), Math.round(bmp.height * sc)); it.src = src; it.fill = 'none'; it.name = String(name || 'Image').replace(/\.[^.]+$/, '').slice(0, 40) || 'Image';
    return it;
  } catch (e) { return null; }
}
async function addImages(files) {
  const r = svg.getBoundingClientRect(); const c = toW({ clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 }); let n = 0, bad = 0;
  for (const f of files) {
    const it = await imageItemFromBytes(f.data, f.name); if (!it) { bad++; continue; }
    if (!n) commit(); it.x = Math.round(c.x - it.w / 2 + n * 24); it.y = Math.round(c.y - it.h / 2 + n * 24); doc.items.push(it); sel = new Set([it.id]); n++;
  }
  if (n) { setTool('select'); render(); } if (bad) toast(bad === 1 ? 'Could not read that picture' : bad + ' pictures could not be read');
}
async function pickImages() { const fs = await window.host.openFiles({ multi: true, maxBytes: 25 * 1024 * 1024, filters: [['Pictures', ['png', 'jpg', 'jpeg', 'webp', 'gif']]] }); if (fs && fs.length) addImages(fs.filter((f) => f.data)); }
// floating tool dock at the bottom of the canvas, like Figma: tools with a small arrow open a menu of related tools
// fill-based, Material Symbols Outlined style (same grid and weight as ICONS)
const DOCK_ICONS = {
  select: 'M6 3.5v15.2l4-3.9 2.6 5.9 2.7-1.2-2.6-5.8h5.6z',
  hand: 'M23 5.5V20c0 2.2-1.8 4-4 4h-7.3c-1.08 0-2.1-.43-2.85-1.19L1 14.83s1.26-1.23 1.3-1.25c.22-.19.49-.29.79-.29.22 0 .42.06.6.16.04.01 4.31 2.46 4.31 2.46V4c0-.83.67-1.5 1.5-1.5S11 3.17 11 4v7h1V1.5c0-.83.67-1.5 1.5-1.5S15 .67 15 1.5V11h1V2.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5V11h1V5.5c0-.83.67-1.5 1.5-1.5s1.5.67 1.5 1.5z',
  frame: 'M20 10V8h-4V4h-2v4h-4V4H8v4H4v2h4v4H4v2h4v4h2v-4h4v4h2v-4h4v-2h-4v-4h4zm-6 4h-4v-4h4v4z',
  rect: 'M18 4H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H6V6h12v12z',
  ellipse: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
  line: 'M4.4 18.2L18.2 4.4l1.4 1.4L5.8 19.6z',
  arrow: 'M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5z',
  polygon: 'M12 7.77L18.39 18H5.61L12 7.77M12 4L2 20h20L12 4z',
  star: ICONS.star,
  pen: 'M12 2L5.5 9.3 8.6 18h6.8l3.1-8.7zM11.25 4.8h1.5v5.5h-1.5zM12 10.6a1.4 1.4 0 1 1 0 2.8 1.4 1.4 0 0 1 0-2.8zM8.5 19.5h7V22h-7z',
  pencil: 'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM5.92 19H5v-.92l9.06-9.06.92.92L5.92 19zM20.71 5.63l-2.34-2.34c-.2-.2-.45-.29-.71-.29s-.51.1-.7.29l-1.83 1.83 3.75 3.75 1.83-1.83c.39-.39.39-1.02 0-1.41z',
  text: 'M5 4v3h5.5v12h3V7H19V4z',
  image: ICONS.image,
  undo: 'M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z',
  redo: 'M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z',
  dupe: 'M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z',
  del: ICONS.del,
  comp: 'M16.66 4.52l2.83 2.83-2.83 2.83-2.83-2.83 2.83-2.83M9 5v4H5V5h4m10 10v4h-4v-4h4M9 15v4H5v-4h4m7.66-13.31L11 7.34 16.66 13l5.66-5.66-5.66-5.65zM11 3H3v8h8V3zm10 10h-8v8h8v-8zm-10 0H3v8h8v-8z',
  zout: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z',
  zin: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z',
  fit: 'M17 4h3c1.1 0 2 .9 2 2v2h-2V6h-3V4zM4 8V6h3V4H4c-1.1 0-2 .9-2 2v2h2zm16 8v2h-3v2h3c1.1 0 2-.9 2-2v-2h-2zM7 18H4v-2H2v2c0 1.1.9 2 2 2h3v-2zM16 8H8c-.55 0-1 .45-1 1v6c0 .55.45 1 1 1h8c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 6H9v-4h6v4z',
  play: 'M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z',
  pause: 'M6 19h4V5H6v14zm8-14v14h4V5h-4z',
  keyf: 'M12 2.5L21.5 12 12 21.5 2.5 12z',
  caret: 'M7 10l5 5 5-5z',
  m_draw: 'M7 16c.55 0 1 .45 1 1 0 1.1-.9 2-2 2-.17 0-.33-.02-.5-.05.31-.55.5-1.21.5-1.95 0-.55.45-1 1-1M18.67 3c-.26 0-.51.1-.71.29L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41l-1.34-1.34c-.2-.2-.45-.29-.7-.29zM7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3z',
  m_design: 'M19 5v2h-4V5h4M9 5v6H5V5h4m10 8v6h-4v-6h4M9 17v2H5v-2h4M21 3h-8v6h8V3zM11 3H3v10h8V3zm10 8h-8v10h8V11zm-10 4H3v6h8v-6z',
  m_motion: 'M15 2c-2.71 0-5.05 1.54-6.22 3.78-1.28.67-2.34 1.72-3 3C3.54 9.95 2 12.29 2 15c0 3.87 3.13 7 7 7 2.71 0 5.05-1.54 6.22-3.78 1.28-.67 2.34-1.72 3-3C20.46 14.05 22 11.71 22 9c0-3.87-3.13-7-7-7zM9 20c-2.76 0-5-2.24-5-5 0-1.12.37-2.16 1-3 0 3.87 3.13 7 7 7-.84.63-1.88 1-3 1zm3-3c-2.76 0-5-2.24-5-5 0-1.12.37-2.16 1-3 0 3.86 3.13 6.99 7 7-.84.63-1.88 1-3 1zm4.7-3.3c-.53.19-1.1.3-1.7.3-2.76 0-5-2.24-5-5 0-.6.11-1.17.3-1.7.53-.19 1.1-.3 1.7-.3 2.76 0 5 2.24 5 5 0 .6-.11 1.17-.3 1.7zM19 12c0-3.86-3.13-6.99-7-7 .84-.63 1.87-1 3-1 2.76 0 5 2.24 5 5 0 1.12-.37 2.16-1 3z',
  m_dev: ICONS.code,
};
const dockIcon = (k, size = 20) => fillIcon(DOCK_ICONS[k] || ICONS.plus, size);
const dock = h('div', { class: 'dock', role: 'toolbar', 'aria-label': 'Tools' });
// tool groups: the first tool shows on the button, the others are in the menu next to it
const GROUPS = {
  move: [['select', 'Move', 'V'], ['hand', 'Hand tool', 'H']],
  frame: [['frame', 'Frame', 'F']],
  shape: [['rect', 'Rectangle', 'R'], ['line', 'Line', 'L'], ['arrow', 'Arrow', 'Shift+L'], ['ellipse', 'Ellipse', 'O'], ['polygon', 'Polygon', ''], ['star', 'Star', ''], ['image', 'Image…', 'Shift+I']],
  pen: [['pen', 'Pen', 'P'], ['pencil', 'Pencil', 'Shift+P']],
  text: [['text', 'Text', 'T']],
};
const grpCur = { move: 'select', frame: 'frame', shape: 'rect', pen: 'pen', text: 'text' };
const grpEls = {};
let fly = null;
let flyAnchor = null;
function closeFly(refocus) { if (fly) { fly.remove(); fly = null; } const a = flyAnchor; flyAnchor = null; if (refocus && a && a.isConnected) a.focus(); }
function toolLabel(k) { for (const g in GROUPS) for (const t of GROUPS[g]) if (t[0] === k) return t; return [k, k, '']; }
function pickTool(k) { closeFly(); if (k === 'image') pickImages(); else setTool(k); }
function openFly(g, anchor) {
  const was = fly && fly.dataset.g === g; closeFly(); if (was) return;
  fly = h('div', { class: 'fly', role: 'menu', 'data-g': g });
  for (const [k, label, key] of (grpEls[g] ? grpEls[g].list : GROUPS[g])) fly.append(h('button', { class: 'fi', role: 'menuitem', title: label, onclick: () => pickTool(k) }, h('span', { class: 'fck', text: k === grpCur[g] ? '✓' : '' }), dockIcon(k), h('span', { class: 'fl', text: label }), h('span', { class: 'fk', text: key })));
  const r = anchor.getBoundingClientRect(), sr = stage.getBoundingClientRect();
  fly.style.left = Math.max(8, r.left - sr.left - 6) + 'px'; fly.style.bottom = (sr.bottom - r.top + 8) + 'px';
  stage.append(fly); flyAnchor = anchor.querySelector('.dkc') || anchor;
}
document.addEventListener('pointerdown', (e) => { if (fly && !fly.contains(e.target) && !e.target.closest('.dkc,[data-menu]')) closeFly(); }, true);
function toolGroup(g, skip) {
  const list = GROUPS[g].filter((t) => !(skip || []).includes(t[0])), box = h('div', { class: 'dgt' });
  const main = h('button', { class: 'dk', onclick: () => setTool(grpCur[g]) });
  box.append(main); grpEls[g] = { main, list };
  if (list.length > 1) box.append(h('button', { class: 'dkc', title: 'More tools', 'aria-label': 'More ' + g + ' tools', onclick: (e) => openFly(g, e.currentTarget.parentNode) }, dockIcon('caret', 12)));
  return box;
}
const actGroup = (items) => h('div', { class: 'dg' }, items.map(([k, label, key, fn]) => h('button', { class: 'dk', title: label + (key ? ' (' + key + ')' : ''), 'aria-label': label, onclick: fn }, dockIcon(k))));
const MODES = [['draw', 'Draw mode', 'm_draw'], ['design', 'Design mode', 'm_design'], ['motion', 'Motion mode', 'm_motion'], ['dev', 'Dev mode', 'm_dev']];
let mode = 'design';
function buildDock() {
  closeFly(); dock.textContent = ''; for (const g in grpEls) delete grpEls[g];
  const compFn = () => { const i = doc.items.find((x) => sel.has(x.id)); if (sel.size === 1 && i) makeComponent(i); else toast('Select one layer first'); };
  const edit = actGroup([['undo', 'Undo', 'Ctrl+Z', () => undo()], ['redo', 'Redo', 'Ctrl+Y', () => redo()], ['dupe', 'Duplicate', 'Ctrl+D', () => dupe()], ['del', 'Delete', 'Del', () => del()]]);
  // zoom lives in the floating .zoomctl pill (top right of the canvas), so the dock only holds tools and edits
  const wrap = (...els) => { const d = h('div', { class: 'dg' }); els.forEach((e) => d.append(e)); return d; };
  if (mode === 'design') dock.append(wrap(toolGroup('move'), toolGroup('frame'), toolGroup('shape'), toolGroup('pen'), toolGroup('text')), edit, actGroup([['comp', 'Create component', '', compFn], ['play', 'Preview', '', () => startPreview()]]));
  else if (mode === 'draw') dock.append(wrap(toolGroup('move'), toolGroup('pen'), toolGroup('shape', ['image'])), edit);
  else if (mode === 'motion') dock.append(wrap(toolGroup('move')), actGroup([['undo', 'Undo', 'Ctrl+Z', () => undo()], ['redo', 'Redo', 'Ctrl+Y', () => redo()]]));
  else dock.append(wrap(toolGroup('move')));
  const md = h('div', { class: 'dg modes', role: 'group', 'aria-label': 'Mode' }); for (const [m, label, ic] of MODES) md.append(h('button', { class: 'dk' + (m === mode ? ' on' : ''), title: label, 'aria-label': label, 'aria-pressed': m === mode ? 'true' : 'false', 'data-mode': m, onclick: () => setMode(m) }, dockIcon(ic)));
  dock.append(md); refreshDock();
}
function refreshDock() {
  for (const g in grpEls) { const { main, list } = grpEls[g]; const k = grpCur[g], [, label, key] = toolLabel(k); main.textContent = ''; main.append(dockIcon(k)); main.title = label + (key ? ' (' + key + ')' : ''); main.setAttribute('aria-label', label); main.classList.toggle('on', tool === k && list.some((t) => t[0] === k)); }
}
stage.append(dock);
const zoomPct = h('button', { class: 'zk zpct', title: 'Zoom to 100%', 'aria-label': 'Zoom to 100%', onclick: () => zoomBy(1 / zoom), text: '100%' });
const zk = (ic, label, fn) => h('button', { class: 'zk', title: label, 'aria-label': label, onclick: fn }, dockIcon(ic, 20));
stage.append(h('div', { class: 'zoomctl', role: 'group', 'aria-label': 'Zoom' }, zk('zout', 'Zoom out', () => zoomBy(1 / 1.2)), zoomPct, zk('zin', 'Zoom in', () => zoomBy(1.2)), zk('fit', 'Fit to screen', () => fit())));
// is this tool in the dock of the current mode (so its shortcut may pick it)?
const offered = (t) => Object.values(grpEls).some((g) => g.list.some((x) => x[0] === t));
function setTool(t) {
  if (pen && t !== 'pen') penFinish(false);
  tool = t; for (const g in GROUPS) if (GROUPS[g].some((x) => x[0] === t)) grpCur[g] = t;
  refreshDock(); svg.style.cursor = t === 'select' ? 'default' : t === 'hand' ? 'grab' : 'crosshair';
}

const svg = sv('svg', { width: '100%', height: '100%', style: 'display:block;touch-action:none;background:var(--canvas)' });
const world = sv('g'); const gItems = sv('g'), gUI = sv('g');
world.append(gItems, gUI); svg.append(world); stage.append(svg);
const toW = (e) => { const r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left - panX) / zoom, y: (e.clientY - r.top - panY) / zoom }; };
function applyView() { world.setAttribute('transform', `translate(${panX} ${panY}) scale(${zoom})`); renderStatus(); }
function zoomBy(f, cx, cy) { const r = svg.getBoundingClientRect(); cx = cx ?? r.width / 2; cy = cy ?? r.height / 2; const nz = clamp(zoom * f, 0.05, 8); panX = cx - (cx - panX) * (nz / zoom); panY = cy - (cy - panY) * (nz / zoom); zoom = nz; render(); }
function fit() {
  const r = svg.getBoundingClientRect();
  if (!doc.items.length) { zoom = 0.5; panX = r.width / 2; panY = r.height / 2; render(); return; }
  const B = doc.items.map(bb), x0 = Math.min(...B.map((b) => b.x)), y0 = Math.min(...B.map((b) => b.y)), x1 = Math.max(...B.map((b) => b.x + b.w)), y1 = Math.max(...B.map((b) => b.y + b.h));
  zoom = clamp(Math.min((r.width - 80) / Math.max(1, x1 - x0), (r.height - 80) / Math.max(1, y1 - y0)), 0.05, 2);
  panX = (r.width - (x1 - x0) * zoom) / 2 - x0 * zoom; panY = (r.height - (y1 - y0) * zoom) / 2 - y0 * zoom; render();
}

// ---------- drawing ----------
// corner points of a regular polygon, or of a star (outer and inner points alternate)
function polyPts(i) {
  const n = i.n || (i.type === 'star' ? 5 : 3), cx = i.x + i.w / 2, cy = i.y + i.h / 2, rx = i.w / 2, ry = i.h / 2, out = [];
  const m = i.type === 'star' ? n * 2 : n;
  for (let k = 0; k < m; k++) { const a = -Math.PI / 2 + (2 * Math.PI * k) / m, f = i.type === 'star' && k % 2 ? 0.4 : 1; out.push((cx + rx * f * Math.cos(a)).toFixed(2) + ',' + (cy + ry * f * Math.sin(a)).toFixed(2)); }
  return out.join(' ');
}
// a path stores its points as 0..1 inside its box, so moving and resizing the box moves and resizes the path
function pathD(i) {
  const P = (i.pts || []).map(([u, v]) => [i.x + u * i.w, i.y + v * i.h]); if (P.length < 2) return P.length ? `M${P[0][0]} ${P[0][1]}` : '';
  let d = `M${P[0][0]} ${P[0][1]}`;
  if (i.sm && P.length > 2) { for (let k = 1; k < P.length - 1; k++) d += ` Q${P[k][0]} ${P[k][1]} ${(P[k][0] + P[k + 1][0]) / 2} ${(P[k][1] + P[k + 1][1]) / 2}`; d += ` L${P[P.length - 1][0]} ${P[P.length - 1][1]}`; }
  else for (let k = 1; k < P.length; k++) d += ` L${P[k][0]} ${P[k][1]}`;
  return d + (i.cl ? ' Z' : '');
}
function pathFit(i, abs) {
  const x0 = Math.min(...abs.map((p) => p[0])), y0 = Math.min(...abs.map((p) => p[1])), x1 = Math.max(...abs.map((p) => p[0])), y1 = Math.max(...abs.map((p) => p[1]));
  i.x = x0; i.y = y0; i.w = Math.max(1, x1 - x0); i.h = Math.max(1, y1 - y0); i.pts = abs.map((p) => [(p[0] - x0) / i.w, (p[1] - y0) / i.h]);
}
function itemEl(i, forExport = false) {
  const g = sv('g'); g.dataset.id = i.id;
  if (i.hidden) return g;
  if (i.rot && i.type !== 'frame') g.setAttribute('transform', `rotate(${i.rot} ${i.x + i.w / 2} ${i.y + i.h / 2})`);
  let paint = i.fill;
  if (i.fill2 && i.type !== 'line' && i.type !== 'text' && i.type !== 'image') {
    const th = ((i.ga === undefined ? 90 : i.ga) * Math.PI) / 180, gid = 'gr-' + i.id;
    const defs = sv('defs'), lg = sv('linearGradient', { id: gid, x1: 0.5 - 0.5 * Math.cos(th), y1: 0.5 - 0.5 * Math.sin(th), x2: 0.5 + 0.5 * Math.cos(th), y2: 0.5 + 0.5 * Math.sin(th) });
    lg.append(sv('stop', { offset: 0, 'stop-color': i.fill }), sv('stop', { offset: 1, 'stop-color': i.fill2 })); defs.append(lg); g.append(defs); paint = `url(#${gid})`;
  }
  const common = { fill: paint, stroke: i.sw > 0 || i.type === 'line' ? i.stroke : 'none', 'stroke-width': i.sw, opacity: i.op };
  if (i.sh && i.type !== 'line') {
    const fid = 'sh-' + i.id, defs = sv('defs'), f = sv('filter', { id: fid, x: '-50%', y: '-50%', width: '200%', height: '200%' });
    f.append(sv('feDropShadow', { dx: i.sh.x, dy: i.sh.y, stdDeviation: i.sh.b / 2, 'flood-color': '#000000', 'flood-opacity': i.sh.o })); defs.append(f); g.append(defs); common.filter = `url(#${fid})`;
  }
  if (i.type === 'frame' || i.type === 'rect') {
    if (i.type === 'frame' && !forExport) { const t = sv('text', { x: i.x, y: i.y - 8, fill: '#9a9a9a', 'font-size': 12 / Math.max(zoom, 0.4), 'font-family': 'Segoe UI,Arial,sans-serif' }); t.textContent = (i.master ? '\u25C6 ' : i.inst ? '\u25C7 ' : '') + i.name; t.dataset.title = i.id; t.style.cursor = 'pointer'; g.append(t); }
    g.append(sv('rect', { x: i.x, y: i.y, width: i.w, height: i.h, rx: i.r, ...common }));
  } else if (i.type === 'ellipse') g.append(sv('ellipse', { cx: i.x + i.w / 2, cy: i.y + i.h / 2, rx: i.w / 2, ry: i.h / 2, ...common }));
  else if (i.type === 'image') {
    const o = { x: i.x, y: i.y, width: i.w, height: i.h, preserveAspectRatio: 'none', opacity: i.op };
    if (i.src) o.href = i.src; if (common.filter) o.filter = common.filter;
    if (i.r > 0) { const cid = 'cl-' + i.id, defs = sv('defs'), cp = sv('clipPath', { id: cid }); cp.append(sv('rect', { x: i.x, y: i.y, width: i.w, height: i.h, rx: i.r })); defs.append(cp); g.append(defs); o['clip-path'] = `url(#${cid})`; }
    g.append(sv('image', o)); if (!i.src) g.append(sv('rect', { x: i.x, y: i.y, width: i.w, height: i.h, fill: '#555', opacity: 0.5 }));
  }
  else if (i.type === 'line') {
    g.append(sv('line', { x1: i.x, y1: i.y, x2: i.x + i.w, y2: i.y + i.h, stroke: 'transparent', 'stroke-width': Math.max(10, i.sw) }));
    g.append(sv('line', { x1: i.x, y1: i.y, x2: i.x + i.w, y2: i.y + i.h, stroke: i.stroke, 'stroke-width': i.sw || 2, 'stroke-linecap': 'round', opacity: i.op }));
    if (i.ah && (i.w || i.h)) { const a = Math.atan2(i.h, i.w), L = Math.max(10, (i.sw || 2) * 4), ex = i.x + i.w, ey = i.y + i.h; g.append(sv('path', { d: `M${ex - L * Math.cos(a - 0.5)} ${ey - L * Math.sin(a - 0.5)} L${ex} ${ey} L${ex - L * Math.cos(a + 0.5)} ${ey - L * Math.sin(a + 0.5)}`, fill: 'none', stroke: i.stroke, 'stroke-width': i.sw || 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: i.op })); }
  } else if (i.type === 'polygon' || i.type === 'star') {
    g.append(sv('polygon', { points: polyPts(i), 'stroke-linejoin': 'round', ...common }));
  } else if (i.type === 'path') {
    const d = pathD(i);
    g.append(sv('path', { d, fill: 'none', stroke: 'transparent', 'stroke-width': Math.max(10, i.sw) }));
    g.append(sv('path', { d, ...common, fill: i.cl ? paint : 'none', stroke: i.stroke, 'stroke-width': i.sw || 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
  } else if (i.type === 'text') {
    const lines = String(i.text).split('\n'), ta = i.ta || 'left', ax = ta === 'center' ? i.x + i.w / 2 : ta === 'right' ? i.x + i.w : i.x;
    const t = sv('text', { x: ax, y: i.y + i.fs, fill: i.fill, 'font-size': i.fs, 'font-family': FONTS[i.ff] || FONTS.sans, opacity: i.op });
    if (i.fw === 700) t.setAttribute('font-weight', '700'); if (ta !== 'left') t.setAttribute('text-anchor', ta === 'center' ? 'middle' : 'end'); if (common.filter) t.setAttribute('filter', common.filter);
    lines.forEach((ln, k) => { const ts = sv('tspan', { x: ax, dy: k === 0 ? 0 : i.fs * 1.25 }); ts.textContent = ln || ' '; t.append(ts); });
    g.append(t);
    g.append(sv('rect', { x: i.x, y: i.y, width: i.w, height: i.h, fill: 'transparent' }));
  }
  if (i.go && !forExport) { const m = sv('circle', { cx: i.x + i.w, cy: i.y, r: 6 / Math.max(zoom, 0.5), fill: '#e0e0e0', stroke: '#222', 'pointer-events': 'none' }); g.append(m); }
  return g;
}
function render() {
  if (document.activeElement !== titleInput) { titleInput.value = doc.title || ''; titleOld = null; }
  dropEmptyText(); syncInstances(); applyLayouts(); if (restEdit) { syncRest(); if (!drag) restEdit = false; }
  gItems.textContent = ''; gUI.textContent = '';
  for (const i of doc.items) gItems.append(itemEl(i));
  for (const id of sel) {
    const i = get(id); if (!i || i.hidden) continue; const b = bb(i);   // a hidden layer stays selected (layer list) but draws nothing on the canvas
    const ol = sv('rect', { x: b.x, y: b.y, width: b.w, height: b.h, fill: 'none', stroke: '#e6e6e6', 'stroke-width': 1.2 / zoom, 'pointer-events': 'none' }); if (i.rot && i.type !== 'frame') ol.setAttribute('transform', `rotate(${i.rot} ${i.x + i.w / 2} ${i.y + i.h / 2})`); gUI.append(ol);
  }
  if (mode === 'dev') {
    for (const i of doc.items) if (i.rd && !i.hidden) gUI.append(sv('circle', { cx: i.x + i.w, cy: i.y, r: 7 / zoom, fill: '#3ecf8e', stroke: '#0b2a1c', 'stroke-width': 1 / zoom, 'pointer-events': 'none' }));
    if (sel.size === 1) { const d = get([...sel][0]); if (d) devGuides(d); }
  }
  if (sel.size === 1 && mode !== 'dev') {
    const i = get([...sel][0]);
    if (i && !i.locked && !i.hidden && !(i.rot && i.type !== 'frame')) {
      const pts = i.type === 'line' ? { a: [i.x, i.y], b: [i.x + i.w, i.y + i.h] } : { nw: [i.x, i.y], n: [i.x + i.w / 2, i.y], ne: [i.x + i.w, i.y], e: [i.x + i.w, i.y + i.h / 2], se: [i.x + i.w, i.y + i.h], s: [i.x + i.w / 2, i.y + i.h], sw: [i.x, i.y + i.h], w: [i.x, i.y + i.h / 2] };
      const cur = { nw: 'nwse', se: 'nwse', ne: 'nesw', sw: 'nesw', n: 'ns', s: 'ns', e: 'ew', w: 'ew', a: 'move', b: 'move' };
      for (const [k, [px, py]] of Object.entries(pts)) { const r = sv('rect', { x: px - 4 / zoom, y: py - 4 / zoom, width: 8 / zoom, height: 8 / zoom, fill: '#ffffff', stroke: '#222', 'stroke-width': 1 / zoom, style: `cursor:${cur[k]}${cur[k].length < 5 ? '-resize' : ''}` }); r.dataset.handle = k; gUI.append(r); }
    }
  }
  applyView(); if (!lite) renderLeft(); renderRight(); if (!noTl) renderTimeline();
}
function renderStatus() { status.textContent = ''; status.append(h('span', { text: fileName || 'Not saved to a file yet' }), h('span', { class: 'grow' }), h('span', { text: doc.items.length + ' layers' })); zoomPct.textContent = Math.round(zoom * 100) + '%'; }
// NotebookLM-style panel header: title + a round button that folds the panel away (kit.js grip brings it back)
function phead(title, side) {
  const hide = 'Hide ' + title.toLowerCase() + ' panel';
  return h('div', { class: 'phead' }, h('h2', { class: 'ptitle', text: title }),
    h('button', { class: 'pbtn', title: hide, 'aria-label': hide, onclick: () => { if (window.lkPanel) window.lkPanel(side); } }, icon(side === 'left' ? 'panl' : 'panr', 20)));
}
function renderLeft() {
  left.textContent = '';
  left.append(phead('Layers', 'left'));
  const list = h('div', { class: 'list' });
  [...doc.items].reverse().forEach((i) => {
    const row = h('div', { class: 'item' + (sel.has(i.id) ? ' sel' : ''), style: 'display:flex;gap:4px;align-items:center;cursor:pointer;padding:3px 6px', onclick: (e) => { if (e.shiftKey) { sel.has(i.id) ? sel.delete(i.id) : sel.add(i.id); } else sel = new Set([i.id]); render(); } },
      h('span', { class: 'grow', style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;' + (i.hidden ? 'opacity:.45' : ''), text: (i.master ? '\u25C6 ' : i.inst || i.instOf ? '\u25C7 ' : '') + (i.type === 'frame' ? '# ' : '') + i.name }),
      h('button', { class: 'btn', style: 'padding:0 5px;font-size:11px', title: 'Show or hide', onclick: (e) => { e.stopPropagation(); commit(); i.hidden = !i.hidden; render(); }, text: i.hidden ? 'Show' : 'Hide' }),
      h('button', { class: 'btn', style: 'padding:0 5px;font-size:11px', title: 'Lock or unlock', onclick: (e) => { e.stopPropagation(); commit(); i.locked = !i.locked; render(); }, text: i.locked ? 'Unlock' : 'Lock' }));
    list.append(row);
  });
  if (!doc.items.length) list.append(h('div', { class: 'muted', style: 'padding:8px', text: 'Draw a frame (F) to start a screen, then add shapes and text.' }));
  left.append(list);
  const masters = doc.items.filter((m) => m.master);
  left.append(h('h3', { text: 'Components' }));
  if (!masters.length) left.append(h('div', { class: 'muted', style: 'padding:4px 8px;font-size:12px', text: 'Select a layer and press Create component.' }));
  for (const m of masters) left.append(h('div', { class: 'item', style: 'display:flex;gap:4px;align-items:center;padding:3px 6px' }, h('span', { class: 'grow', style: 'overflow:hidden;text-overflow:ellipsis;white-space:nowrap', text: '\u25C6 ' + m.name }), btn('Insert', () => insertInstance(m))));
}
// a number typed in the right panel: empty or not a number puts the old value back (returns null)
function numIn(el, old, round) { const raw = String(el.value).trim(), v = +raw; if (raw === '' || !Number.isFinite(v)) { el.value = Math.round(old * round) / round; return null; } return v; }
// keep panel numbers in a range that draws: sizes at least 1 (a line may point any way), no negative stroke or corners
function fitNum(key, v, it) {
  if (key === 'w' || key === 'h') return it.type === 'line' ? clamp(v, -1e5, 1e5) : clamp(v, 1, 1e5);
  if (key === 'sw') return clamp(v, 0, 500); if (key === 'r') return clamp(v, 0, 1e5); if (key === 'fs') return clamp(v, 6, 400);
  return clamp(v, -1e6, 1e6);
}
const TIPS = {
  design: 'Pick a tool or press its letter, then drag on the canvas.\nShift-click to select several.\nScroll to pan, Ctrl+scroll to zoom, hold Space to pan.\nGive a shape a Link to a frame, then press Preview to click through your prototype.',
  draw: 'Pick the pen, pencil or a shape, then draw on the canvas.\nPen: click to add points, click the first point to close the shape, press Enter to finish.\nScroll to pan, Ctrl+scroll to zoom, hold Space to pan.',
  motion: 'Click a layer to animate it.\nPut the playhead on a time and press Add keyframe. Move the playhead, change the layer and add another keyframe.\nTurn on Auto keyframe to record changes by themselves, then press Play.',
};
// a number field changed from the keyboard (arrow keys or Enter) keeps the focus when the panel is rebuilt
let keyNum = null;
right.addEventListener('keydown', (e) => { if (e.target.matches('input[type=number]') && /^(Enter|ArrowUp|ArrowDown)$/.test(e.key)) { keyNum = e.target; setTimeout(() => { keyNum = null; }, 0); } }, true);
function renderRight() {
  const a = document.activeElement, all = () => [...right.querySelectorAll('input[type=number]')];
  const keep = a && a === keyNum ? { n: all().indexOf(a), l: (a.closest('label') || {}).textContent } : null;
  buildRight();
  if (keep) { const el = all()[keep.n]; if (el && (el.closest('label') || {}).textContent === keep.l) el.focus(); }
}
// a text layer emptied in the Text box is invisible, so it goes away once it is no longer selected.
// It joins the history step of that edit, so one undo brings the old text back.
function dropEmptyText() {
  const t = shownText; if (!t || sel.has(t.id)) return; shownText = null;
  const c = get(t.id); if (!c || c.type !== 'text' || String(c.text || '').trim()) return;
  doc.items = doc.items.filter((x) => x !== c); for (const x of doc.items) if (x.go === t.id) x.go = '';
  if (doc.motion) delete doc.motion.tracks[t.id];
}
function buildRight() {
  right.textContent = '';
  if (mode === 'dev') { right.append(phead('Code', 'right')); renderDev(); return; }
  right.append(phead(mode === 'motion' ? 'Motion' : 'Design', 'right'), h('label', { class: 'field' }, 'Title', h('input', { type: 'text', class: 'rtitle', maxlength: 80, value: doc.title, oninput: (e) => { doc.title = e.target.value; titleInput.value = doc.title; }, onchange: (e) => { if (!e.target.value.trim()) { doc.title = 'Untitled design'; e.target.value = doc.title; titleInput.value = doc.title; } } })));
  const items = [...sel].map(get).filter(Boolean); if (!items.length) { right.append(h('h3', { text: 'Tips' }), h('div', { class: 'muted', style: 'font-size:12px;line-height:1.6;white-space:pre-line', text: TIPS[mode] || TIPS.design })); return; }
  const i = items[0];
  let nameUndo = false;
  const num = (label, key) => h('label', { class: 'field' }, label, h('input', { type: 'number', value: Math.round(i[key] * 10) / 10, style: 'width:100%', onchange: (e) => { const v = numIn(e.target, i[key], 10); if (v === null) return; commit(); items.forEach((it) => { it[key] = fitNum(key, v, it); }); autoKeyFor(items); render(); } }));
  right.append(h('h3', { text: 'Layout' }), h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:6px' }, num('X', 'x'), num('Y', 'y'), num('W', 'w'), num('H', 'h')));
  right.append(h('label', { class: 'field' }, 'Name', h('input', { type: 'text', value: i.name, oninput: (e) => { if (!nameUndo) { commit(); nameUndo = true; } i.name = e.target.value; renderLeft(); }, onchange: (e) => { if (!e.target.value.trim()) { i.name = NAMES[i.type] || 'Layer'; e.target.value = i.name; renderLeft(); render(); } } })));
  if (i.type !== 'line') {
    right.append(h('h3', { text: i.type === 'text' ? 'Text color' : 'Fill' }), h('div', { class: 'swatches' }, FILLS.map((c) => h('button', { style: `background:${c}`, onclick: () => { commit(); items.forEach((it) => { it.fill = c; }); render(); } }))));
  }
  right.append(h('h3', { text: 'Stroke' }), h('div', { class: 'swatches' }, ['#000000', '#4a4a4a', '#8a8a8a', '#e4e4e4', '#ffffff'].map((c) => h('button', { style: `background:${c}`, onclick: () => { commit(); items.forEach((it) => { it.stroke = c; if (!it.sw) it.sw = 1; }); render(); } }))));
  right.append(h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:6px' }, num('Stroke width', 'sw'), i.type === 'rect' || i.type === 'frame' ? num('Corner radius', 'r') : h('span')));
  const op = h('input', { type: 'range', min: 5, max: 100, value: Math.round(i.op * 100), oninput: () => { items.forEach((it) => (it.op = op.value / 100)); renderItemsOnly(); } }); op.addEventListener('pointerdown', commit); op.addEventListener('change', () => { autoKeyFor(items); render(); });
  right.append(h('h3', { text: 'Opacity' }), op);
  const chk = (label, on, fn) => h('label', { class: 'field', style: 'flex-direction:row;gap:6px;align-items:center' }, h('input', { type: 'checkbox', checked: !!on, onchange: (e) => { commit(); fn(e.target.checked); render(); } }), label);
  const numTo = (label, val, fn, step) => h('label', { class: 'field' }, label, h('input', { type: 'number', step: step || 1, value: Math.round(val * 100) / 100, style: 'width:100%', onchange: (e) => { const v = numIn(e.target, val, 100); if (v === null) return; commit(); fn(clamp(v, -1e6, 1e6)); autoKeyFor(items); render(); } }));
  if (i.type === 'polygon' || i.type === 'star') right.append(h('h3', { text: i.type === 'star' ? 'Star' : 'Polygon' }), numTo(i.type === 'star' ? 'Points (3 to 12)' : 'Sides (3 to 12)', i.n || (i.type === 'star' ? 5 : 3), (v) => items.forEach((it) => { if (it.type === 'polygon' || it.type === 'star') it.n = clamp(Math.round(v), 3, 12); })));
  if (i.type === 'path') right.append(h('h3', { text: 'Path' }), chk('Closed shape', i.cl, (on) => items.forEach((it) => { if (it.type === 'path') { it.cl = on; if (on && it.fill === 'none') it.fill = '#d0d0d0'; } })), chk('Smooth curve', i.sm, (on) => items.forEach((it) => { if (it.type === 'path') it.sm = on; })));
  if (i.type === 'line') right.append(h('h3', { text: 'Line end' }), chk('Arrow head', i.ah, (on) => items.forEach((it) => { if (it.type === 'line') it.ah = on; })));
  if (i.type === 'frame') right.append(h('h3', { text: 'Frame size' }), h('select', { style: 'width:100%', 'aria-label': 'Frame size preset', onchange: (e) => { const t = SIZES.flatMap((g) => g[1]).find((x) => x[0] === e.target.value); if (t && t[1]) { commit(); i.w = t[1]; i.h = t[2]; render(); } } }, h('option', { value: '', text: 'Choose a preset…' }), ...SIZES.map(([g, list]) => h('optgroup', { label: g }, list.filter((t) => t[1]).map((t) => h('option', { value: t[0], text: t[0] + ' (' + t[1] + ' × ' + t[2] + ')' }))))));
  if (i.type !== 'frame') right.append(h('h3', { text: 'Rotation' }), numTo('Degrees', i.rot || 0, (v) => items.forEach((it) => { if (it.type !== 'frame') it.rot = clamp(v, -360, 360); })));
  if (!['line', 'text', 'image'].includes(i.type)) {
    right.append(h('h3', { text: 'Gradient' }), chk('Fade to a second color', i.fill2, (on) => items.forEach((it) => { it.fill2 = on ? (it.fill2 || '#4a4a4a') : ''; if (on && it.ga === undefined) it.ga = 90; })));
    if (i.fill2) right.append(h('div', { class: 'swatches' }, FILLS.map((c) => h('button', { style: `background:${c}`, onclick: () => { commit(); items.forEach((it) => { it.fill2 = c; }); render(); } }))), numTo('Angle (90 = top to bottom)', i.ga === undefined ? 90 : i.ga, (v) => items.forEach((it) => { it.ga = v; })));
  }
  if (i.type !== 'line') {
    right.append(h('h3', { text: 'Shadow' }), chk('Drop shadow', i.sh, (on) => items.forEach((it) => { it.sh = on ? (it.sh || { x: 0, y: 4, b: 12, o: 0.25 }) : undefined; })));
    if (i.sh) right.append(h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:6px' }, numTo('X', i.sh.x, (v) => items.forEach((it) => { if (it.sh) it.sh.x = v; })), numTo('Y', i.sh.y, (v) => items.forEach((it) => { if (it.sh) it.sh.y = v; })), numTo('Blur', i.sh.b, (v) => items.forEach((it) => { if (it.sh) it.sh.b = Math.max(0, v); })), numTo('Strength (0.02 to 1)', i.sh.o, (v) => items.forEach((it) => { if (it.sh) it.sh.o = clamp(v, 0.02, 1); }), 0.05)));
  }
  if (i.type === 'text') {
    const ta = h('textarea', { rows: 3, style: 'width:100%' }); ta.value = i.text; ta.addEventListener('input', commit, { once: true }); ta.addEventListener('input', () => { i.text = ta.value; if (i.instOf || i.inst) i.ov = true; const lines = ta.value.split('\n'); i.h = lines.length * i.fs * 1.25 + 4; if ((i.ta || 'left') === 'left') i.w = Math.max(40, Math.max(...lines.map((l) => l.length)) * i.fs * 0.55); renderItemsOnly(); });
    if (!i.instOf && !i.inst) ta.addEventListener('input', () => { shownText = i; }, { once: true });
    right.append(h('h3', { text: 'Text' }), ta, num('Font size', 'fs'));
    if (focusText) { focusText = false; setTimeout(() => { const t = right.querySelector('textarea'); if (t) { t.focus(); t.select(); } }, 80); }
    right.lastChild.querySelector('input').addEventListener('change', () => { for (const it of items) { if (it.type !== 'text') continue; const lines = it.text.split('\n'); it.h = lines.length * it.fs * 1.25 + 4; if ((it.ta || 'left') === 'left') it.w = Math.max(40, Math.max(...lines.map((l) => l.length)) * it.fs * 0.55); } render(); });
    right.append(h('h3', { text: 'Font' }), h('select', { style: 'width:100%', 'aria-label': 'Font', onchange: (e) => { commit(); items.forEach((it) => { it.ff = e.target.value; }); render(); } }, [['sans', 'Sans-serif'], ['serif', 'Serif'], ['mono', 'Monospace']].map(([v, t]) => h('option', { value: v, text: t, selected: (i.ff || 'sans') === v }))),
      h('div', { style: 'display:flex;gap:4px;margin-top:6px;flex-wrap:wrap' }, h('button', { class: 'btn' + (i.fw === 700 ? ' primary' : ''), text: 'Bold', onclick: () => { commit(); const on = i.fw !== 700; items.forEach((it) => { it.fw = on ? 700 : 400; }); render(); } }),
        h('span', { class: 'muted', style: 'align-self:center;margin:0 2px', text: 'Align' }), [['left', 'Left'], ['center', 'Center'], ['right', 'Right']].map(([v, t]) => h('button', { class: 'btn' + ((i.ta || 'left') === v ? ' primary' : ''), text: t, onclick: () => { commit(); items.forEach((it) => { it.ta = v; }); render(); } }))));
  }
  const frames = doc.items.filter((f) => f.type === 'frame' && f !== i);
  if (frames.length) right.append(h('h3', { text: 'Prototype link' }), h('select', { style: 'width:100%', onchange: (e) => { commit(); items.forEach((it) => (it.go = e.target.value)); render(); } }, h('option', { value: '', text: 'None' }), ...frames.map((f) => h('option', { value: f.id, text: 'Go to ' + f.name, selected: i.go === f.id }))), h('select', { style: 'width:100%', onchange: (e) => { commit(); items.forEach((it) => (it.tr = e.target.value)); } }, ...[['none', 'Instant'], ['fade', 'Fade'], ['slide', 'Slide in']].map(([v, t]) => h('option', { value: v, text: t, selected: (i.tr || 'none') === v }))));
  right.append(h('h3', { text: 'Component' }));
  if (i.master) right.append(h('div', { class: 'muted', style: 'font-size:12px', text: 'Main component. Changes here update every instance.' }), btn('Insert instance', () => insertInstance(i)), btn('Remove component', () => { commit(); for (const c of doc.items.filter((x) => x.inst === i.id)) detach(c.id); delete i.master; render(); }));
  else if (i.inst) right.append(btn('Go to main', () => { sel = new Set([i.inst]); render(); }), btn('Detach instance', () => { commit(); detach(i.id); render(); }));
  else if (i.instOf) right.append(h('div', { class: 'muted', style: 'font-size:12px', text: 'Part of an instance. Text can be edited, the rest follows the main component.' }));
  else right.append(btn('Create component', () => makeComponent(i)));
  if (i.type === 'frame') {
    const al = i.al || { dir: '', gap: 12, pad: 16, align: 'start', hug: false };
    const set = (patch) => { commit(); i.al = { ...al, ...patch }; if (!i.al.dir) delete i.al; render(); };
    right.append(h('h3', { text: 'Auto layout' }),
      h('select', { style: 'width:100%', onchange: (e) => set({ dir: e.target.value }) }, ...[['', 'Off'], ['v', 'Vertical stack'], ['h', 'Horizontal stack']].map(([v, t]) => h('option', { value: v, text: t, selected: (al.dir || '') === v }))));
    if (al.dir) right.append(h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:6px' },
      h('label', { class: 'field' }, 'Gap', h('input', { type: 'number', value: al.gap, style: 'width:100%', onchange: (e) => set({ gap: clamp(+e.target.value || 0, 0, 10000) }) })),
      h('label', { class: 'field' }, 'Padding', h('input', { type: 'number', value: al.pad, style: 'width:100%', onchange: (e) => set({ pad: clamp(+e.target.value || 0, 0, 10000) }) }))),
      h('select', { style: 'width:100%', onchange: (e) => set({ align: e.target.value }) }, ...[['start', 'Align start'], ['center', 'Align center'], ['end', 'Align end']].map(([v, t]) => h('option', { value: v, text: t, selected: al.align === v }))),
      h('label', { class: 'field', style: 'flex-direction:row;gap:6px;align-items:center' }, h('input', { type: 'checkbox', checked: !!al.hug, onchange: (e) => set({ hug: e.target.checked }) }), 'Hug contents'));
  }
  right.append(h('h3', { text: 'Arrange' }), h('div', { class: 'ptools', style: 'display:flex;flex-wrap:wrap;gap:4px' }, btn('Front', () => order('front')), btn('Back', () => order('back')), btn('Forward', () => order('up')), btn('Backward', () => order('down'))));
  if (items.length > 1) right.append(h('h3', { text: 'Align' }), h('div', { style: 'display:flex;flex-wrap:wrap;gap:4px' }, ['Left', 'Center', 'Right', 'Top', 'Middle', 'Bottom'].map((a) => btn(a, () => align(a.toLowerCase())))));
}
function renderItemsOnly() { syncInstances(); applyLayouts(); gItems.textContent = ''; for (const i of doc.items) gItems.append(itemEl(i)); }
// ---------- motion (keyframe animation) ----------
const ESS = { linear: (u) => u, in: (u) => u * u, out: (u) => 1 - (1 - u) * (1 - u), inout: (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2) };
const KEYS = ['x', 'y', 'w', 'h', 'rot', 'op'];
let autoKey = false, playhead = 0, playing = false, playRaf = 0, motionEase = 'inout', noTl = false, tlRefs = null;
const tl = h('div', { class: 'tl' }); stage.append(tl);
function cleanMotion(m) {
  if (!m || typeof m !== 'object') return undefined;
  const out = { dur: clamp(+m.dur || 2000, 200, 60000), loop: !!m.loop, tracks: {} };
  if (m.tracks && typeof m.tracks === 'object') for (const id of Object.keys(m.tracks).slice(0, 2000)) {
    const k = m.tracks[id]; if (!Array.isArray(k)) continue;
    const list = k.slice(0, 300).filter((e) => e && Number.isFinite(+e.t)).map((e) => { const o = { t: clamp(Math.round(+e.t), 0, 60000), e: ESS[e.e] ? e.e : 'linear' }; for (const key of KEYS) o[key] = Number.isFinite(+e[key]) ? +e[key] : 0; return o; }).sort((a, b) => a.t - b.t);
    if (list.length) out.tracks[String(id)] = list;
  }
  return out;
}
const hasMotion = () => doc.motion && Object.keys(doc.motion.tracks || {}).length > 0;
function poseOf(k, t) {
  if (t <= k[0].t) return k[0]; const L = k[k.length - 1]; if (t >= L.t) return L;
  let b = 1; while (k[b].t < t) b++; const a = k[b - 1], c = k[b], u = ESS[c.e || 'linear']((t - a.t) / (c.t - a.t)), o = {};
  for (const key of KEYS) o[key] = a[key] + (c[key] - a[key]) * u; return o;
}
function applyPose(t) { if (!hasMotion()) return; for (const id of Object.keys(doc.motion.tracks)) { const it = get(id), k = doc.motion.tracks[id]; if (!it || !k.length) continue; const p = poseOf(k, t); for (const key of KEYS) it[key] = key === 'op' ? clamp(p[key], 0.05, 1) : p[key]; } }
// what is written to a file: every animated layer at time 0 (its resting place), not wherever the playhead happens to be
function restDoc() {
  if (!hasMotion()) return doc;
  const c = JSON.parse(JSON.stringify(doc)); for (const id of Object.keys(c.motion.tracks)) { const it = c.items.find((x) => x.id === id), k = c.motion.tracks[id]; if (it && k.length) { const p = poseOf(k, 0); for (const key of KEYS) it[key] = key === 'op' ? clamp(p.op, 0.05, 1) : p[key]; } } return c;
}
// outside Motion mode an animated layer shows its time-0 pose; if it was moved or changed there (Design mode,
// layer panel, align...), shift all its keyframes by the same amount so the change is kept and the animation follows.
// render() runs this only after a real edit (restEdit), never on opening a design. What an auto-layout frame sets
// (a child's place, a hugging frame's size) is not an edit. Opacity keys are not cut to 0..1 here (the pose shown is),
// so raising and lowering opacity again gives the same keys back.
function syncRest() {
  if (mode === 'motion' || playing || !hasMotion()) return;
  for (const id of Object.keys(doc.motion.tracks)) {
    const it = get(id), k = doc.motion.tracks[id]; if (!it || !k.length) continue; const p = poseOf(k, 0);
    const pf = it.hidden ? null : parentFrame(it), placed = !!(pf && pf.al && pf.al.dir), hugs = !!(it.type === 'frame' && it.al && it.al.dir && it.al.hug && directKids(it).length);
    for (const key of KEYS) {
      if ((placed && (key === 'x' || key === 'y')) || (hugs && (key === 'w' || key === 'h'))) continue;
      const cur = key === 'rot' ? it.rot || 0 : it[key], shown = key === 'op' ? clamp(p.op, 0.05, 1) : p[key];
      if (!Number.isFinite(cur - shown) || Math.abs(cur - shown) <= 1e-6) continue;
      const d = cur - p[key]; if (Number.isFinite(d)) for (const e of k) e[key] += d;
    }
  }
}
// a shorter duration cuts each track at the new end: keys after it go, and a key at the end keeps the pose it had there
function trimKeys(m) {
  for (const id of Object.keys(m.tracks)) {
    const k = m.tracks[id]; if (!k.length || k[k.length - 1].t <= m.dur) continue;
    const p = poseOf(k, m.dur), e = { t: m.dur, e: (k.find((x) => x.t > m.dur) || {}).e || 'linear' }; for (const key of KEYS) e[key] = p[key];
    m.tracks[id] = k.filter((x) => x.t < m.dur).concat(e);
  }
}
function keyAt(it) {
  const m = doc.motion || (doc.motion = { dur: 2000, loop: false, tracks: {} }); const k = m.tracks[it.id] || (m.tracks[it.id] = []);
  for (let n = k.length - 1; n >= 0; n--) if (Math.abs(k[n].t - playhead) < 20) k.splice(n, 1);
  const e = { t: Math.round(playhead), e: motionEase }; for (const key of KEYS) e[key] = key === 'rot' ? it.rot || 0 : it[key]; k.push(e); k.sort((a, b) => a.t - b.t);
}
function addKey() {
  const it = sel.size === 1 ? get([...sel][0]) : null; if (!it) { toast('Select one layer first'); return; }
  commit(); keyAt(it); render();
}
// with Auto keyframe on, changing a layer in Motion mode records a keyframe at the playhead by itself
function autoKeyFor(list) { if (mode !== 'motion' || !autoKey) return; for (const it of list) if (it && it.type !== undefined) keyAt(it); }
function delKey() {
  const it = sel.size === 1 ? get([...sel][0]) : null, k = it && doc.motion && doc.motion.tracks[it.id]; if (!k) { toast('No keyframe on this layer'); return; }
  const n = k.findIndex((e) => Math.abs(e.t - playhead) < 20); if (n < 0) { toast('Move the playhead onto a keyframe'); return; }
  commit(); k.splice(n, 1); if (!k.length) delete doc.motion.tracks[it.id]; render();
}
const fmtT = (ms) => (ms / 1000).toFixed(2) + ' s';
function updateTl() { if (!tlRefs) return; const d = (doc.motion && doc.motion.dur) || 2000; tlRefs.time.textContent = fmtT(playhead) + ' / ' + fmtT(d); tlRefs.range.value = playhead; tlRefs.phs.forEach((p) => { p.style.left = (playhead / d) * 100 + '%'; }); tlRefs.play.textContent = playing ? 'Pause' : 'Play'; }
function scrub() { applyPose(playhead); noTl = true; render(); noTl = false; updateTl(); }
function startPlay() {
  if (!hasMotion()) { toast('Add a keyframe first'); return; }
  const m = doc.motion; if (playhead >= m.dur) playhead = 0; playing = true; let t0 = performance.now() - playhead;
  const tick = (now) => {
    if (!playing) return; let t = now - t0;
    if (t >= m.dur) { if (m.loop) { t0 = now; t = 0; } else { playhead = m.dur; applyPose(playhead); stopPlay(); return; } }
    playhead = t; applyPose(t); noTl = true; renderItemsOnly(); noTl = false; gUI.textContent = ''; updateTl(); playRaf = requestAnimationFrame(tick);
  };
  gUI.textContent = ''; playRaf = requestAnimationFrame(tick); updateTl();
}
function stopPlay() { playing = false; if (playRaf) cancelAnimationFrame(playRaf); playRaf = 0; render(); }
function renderTimeline() {
  stage.classList.toggle('motion', mode === 'motion'); tl.style.display = mode === 'motion' ? 'flex' : 'none';
  if (mode !== 'motion') { tl.textContent = ''; tlRefs = null; return; }
  const m = doc.motion || { dur: 2000, loop: false, tracks: {} }; tl.textContent = '';
  const time = h('span', { class: 'tlt' }), play = h('button', { class: 'btn primary', onclick: () => (playing ? stopPlay() : startPlay()) });
  const range = h('input', { type: 'range', class: 'tlr', min: 0, max: m.dur, step: 10, value: playhead, 'aria-label': 'Playhead', oninput: (e) => { if (playing) stopPlay(); playhead = +e.target.value; scrub(); } });
  const sel1 = sel.size === 1 ? get([...sel][0]) : null, ek = sel1 && m.tracks[sel1.id] && m.tracks[sel1.id].find((e) => Math.abs(e.t - playhead) < 20);
  const ease = h('select', { 'aria-label': 'Easing', onchange: (ev) => { motionEase = ev.target.value; if (ek) { commit(); ek.e = motionEase; } } }, [['linear', 'Linear'], ['in', 'Ease in'], ['out', 'Ease out'], ['inout', 'Ease in-out']].map(([v, t]) => h('option', { value: v, text: t, selected: (ek ? ek.e : motionEase) === v })));
  const phs = [];
  const tracks = Object.keys(m.tracks).map((id) => ({ id, it: get(id) })).filter((r) => r.it).map(({ id, it }) => {
    const lane = h('div', { class: 'lane' }); const ph = h('div', { class: 'ph' }); phs.push(ph); lane.append(ph);
    for (const e of m.tracks[id]) lane.append(h('button', { class: 'kfd' + (sel.has(id) && Math.abs(e.t - playhead) < 20 ? ' on' : ''), style: `left:${(e.t / m.dur) * 100}%`, title: it.name + ' at ' + fmtT(e.t), 'aria-label': 'Keyframe at ' + fmtT(e.t), onclick: () => { sel = new Set([id]); playhead = e.t; scrub(); renderTimeline(); } }, dockIcon('keyf', 10)));
    return h('div', { class: 'trk' }, h('span', { class: 'trn', text: it.name }), lane);
  });
  tl.append(h('div', { class: 'tlh' }, play, time, h('label', { class: 'tlf' }, 'Duration (s)', h('input', { type: 'number', min: 0.2, max: 60, step: 0.5, value: m.dur / 1000, style: 'width:64px', onchange: (ev) => { const v = +ev.target.value; if (!(v >= 0.2 && v <= 60)) { ev.target.value = m.dur / 1000; return; } commit(); const mm = doc.motion || (doc.motion = { dur: 2000, loop: false, tracks: {} }); mm.dur = Math.round(v * 1000); trimKeys(mm); if (playhead > mm.dur) playhead = mm.dur; render(); } })),
    h('label', { class: 'tlf' }, h('input', { type: 'checkbox', 'aria-label': 'Auto keyframe', checked: autoKey, onchange: (ev) => { autoKey = ev.target.checked; } }), 'Auto keyframe'), h('label', { class: 'tlf' }, h('input', { type: 'checkbox', checked: !!m.loop, onchange: (ev) => { commit(); const mm = doc.motion || (doc.motion = { dur: 2000, loop: false, tracks: {} }); mm.loop = ev.target.checked; } }), 'Loop'), h('span', { class: 'tlf' }, 'Easing', ease), btn('Add keyframe', addKey, 'primary'), btn('Delete keyframe', delKey)), range,
    h('div', { class: 'tracks' }, tracks.length ? tracks : h('div', { class: 'muted', style: 'padding:6px 4px;font-size:12px', text: 'Select a layer, put the playhead on a time, press Add keyframe. Move the playhead, change the layer (position, size, rotation or opacity) and add another keyframe.' })));
  tlRefs = { time, range, play, phs }; updateTl();
}
function setMode(m) {
  if (m === mode) return; if (pen) penFinish(false); if (playing) stopPlay();
  if (mode === 'motion') { playhead = 0; applyPose(0); }
  mode = m; closeFly(); buildDock(); setTool(m === 'draw' ? 'pen' : 'select'); sel = new Set([...sel].filter((id) => get(id))); render();
}
// ---------- dev mode (inspect) ----------
const px = (n) => Math.round(n * 100) / 100 + 'px';
function cssOf(i) {
  const pf = parentFrame(i), ox = pf ? i.x - pf.x : i.x, oy = pf ? i.y - pf.y : i.y, L = ['position: absolute;', 'left: ' + px(ox) + ';', 'top: ' + px(oy) + ';'];
  if (i.type === 'line') { const len = Math.hypot(i.w, i.h), deg = (Math.atan2(i.h, i.w) * 180) / Math.PI; L.push('width: ' + px(len) + ';', 'height: ' + px(i.sw || 2) + ';', 'background: ' + i.stroke + ';', 'transform-origin: 0 0;', 'transform: rotate(' + Math.round(deg * 100) / 100 + 'deg);'); }
  else {
    L.push('width: ' + px(i.w) + ';', 'height: ' + px(i.h) + ';');
    if (i.type === 'text') { L.push('color: ' + i.fill + ';', 'font-family: ' + FONTS[i.ff || 'sans'] + ';', 'font-size: ' + px(i.fs) + ';', 'font-weight: ' + (i.fw || 400) + ';', 'text-align: ' + (i.ta || 'left') + ';', 'line-height: 1.25;'); }
    else {
      if (i.fill2) L.push('background: linear-gradient(' + Math.round((i.ga === undefined ? 90 : i.ga) + 90) + 'deg, ' + i.fill + ', ' + i.fill2 + ');'); else if (i.fill !== 'none' && i.type !== 'image') L.push('background: ' + i.fill + ';');
      if (i.sw > 0) L.push('border: ' + px(i.sw) + ' solid ' + i.stroke + ';');
      if (i.type === 'ellipse') L.push('border-radius: 50%;'); else if (i.r > 0) L.push('border-radius: ' + px(i.r) + ';');
      if (['polygon', 'star', 'path'].includes(i.type)) L.push('/* ' + NAMES[i.type].toLowerCase() + ': use "Copy SVG" for the exact shape */');
    }
    if (i.rot && i.type !== 'frame') L.push('transform: rotate(' + i.rot + 'deg);');
  }
  if (i.op < 1) L.push('opacity: ' + Math.round(i.op * 100) / 100 + ';');
  if (i.sh && i.type !== 'line') L.push('box-shadow: ' + i.sh.x + 'px ' + i.sh.y + 'px ' + i.sh.b + 'px rgba(0, 0, 0, ' + i.sh.o + ');');
  return L.join('\n');
}
async function copyText(t, what) { try { await navigator.clipboard.writeText(t); toast('Copied ' + what); } catch (e) { toast('Could not copy. Select the text and press Ctrl+C.'); } }
function svgOfItem(i) { const g = itemEl(i, true), b = bb(i), root = sv('svg', { xmlns: NS, width: b.w || 1, height: b.h || 1, viewBox: `${b.x} ${b.y} ${b.w || 1} ${b.h || 1}` }); root.append(g); return new XMLSerializer().serializeToString(root); }
function devGuides(i) {
  const pf = parentFrame(i); if (!pf) return; const fs = 11 / zoom, col = '#f2555a';
  const L = (x1, y1, x2, y2, t) => { if (Math.abs(x2 - x1) + Math.abs(y2 - y1) < 1) return; gUI.append(sv('line', { x1, y1, x2, y2, stroke: col, 'stroke-width': 1 / zoom, 'pointer-events': 'none' })); const tx = sv('text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 3 / zoom, fill: col, 'font-size': fs, 'text-anchor': 'middle', 'pointer-events': 'none', 'font-family': 'Segoe UI,Arial,sans-serif' }); tx.textContent = Math.round(t); gUI.append(tx); };
  const cx = i.x + i.w / 2, cy = i.y + i.h / 2;
  L(pf.x, cy, i.x, cy, i.x - pf.x); L(i.x + i.w, cy, pf.x + pf.w, cy, pf.x + pf.w - i.x - i.w); L(cx, pf.y, cx, i.y, i.y - pf.y); L(cx, i.y + i.h, cx, pf.y + pf.h, pf.y + pf.h - i.y - i.h);
}
function renderDev() {
  right.append(h('h3', { text: 'Dev mode' }));
  const i = sel.size === 1 ? get([...sel][0]) : null;
  const row = (k, v) => h('div', { class: 'devr' }, h('span', { class: 'muted', text: k }), h('span', { text: v }));
  if (i) {
    const pf = parentFrame(i);
    right.append(h('h3', { text: i.name + ' · ' + NAMES[i.type] }), row('Size', Math.round(i.w) + ' × ' + Math.round(i.h)), row('Position', Math.round(pf ? i.x - pf.x : i.x) + ', ' + Math.round(pf ? i.y - pf.y : i.y) + (pf ? ' in ' + pf.name : '')));
    if (pf) right.append(row('Left / Top', Math.round(i.x - pf.x) + ' / ' + Math.round(i.y - pf.y)), row('Right / Bottom', Math.round(pf.x + pf.w - i.x - i.w) + ' / ' + Math.round(pf.y + pf.h - i.y - i.h)));
    if (i.master) right.append(row('Component', 'Main component (' + doc.items.filter((x) => x.inst === i.id).length + ' instances)')); else if (i.inst) right.append(row('Component', 'Instance of ' + ((get(i.inst) || {}).name || 'deleted')));
    const css = cssOf(i); let noteUndo = false;
    right.append(h('h3', { text: 'CSS' }), h('pre', { class: 'code', tabindex: 0, text: css }), h('div', { style: 'display:flex;gap:4px;flex-wrap:wrap' }, btn('Copy CSS', () => copyText(css, 'CSS')), btn('Copy SVG', () => copyText(svgOfItem(i), 'SVG')), btn('Export PNG', () => exportImg('png')), btn('Export SVG', () => exportImg('svg'))));
    right.append(h('h3', { text: 'Annotation' }), h('textarea', { rows: 3, style: 'width:100%', 'aria-label': 'Note for developers', placeholder: 'Note for developers…', oninput: (e) => { if (!noteUndo) { commit(); noteUndo = true; } i.note = e.target.value.slice(0, 500); } }, i.note || ''), h('label', { class: 'field', style: 'flex-direction:row;gap:6px;align-items:center' }, h('input', { type: 'checkbox', checked: !!i.rd, onchange: (e) => { commit(); i.rd = e.target.checked; render(); } }), 'Ready for dev'));
  } else right.append(h('div', { class: 'muted', style: 'font-size:12px;line-height:1.6', text: 'Click a layer to see its size, position, CSS and distances to its frame.' }));
  const colors = new Map(); for (const x of doc.items) { for (const c of [x.fill, x.fill2, x.sw > 0 || x.type === 'line' ? x.stroke : '']) if (/^#[0-9a-f]{6}$/i.test(c || '')) colors.set(c.toLowerCase(), (colors.get(c.toLowerCase()) || 0) + 1); }
  right.append(h('h3', { text: 'Colors in this design' }), colors.size ? h('div', { class: 'tokens' }, [...colors].sort((a, b) => b[1] - a[1]).slice(0, 24).map(([c, n]) => h('button', { class: 'tok', title: 'Copy ' + c + ' (used ' + n + '×)', onclick: () => copyText(c, c) }, h('span', { class: 'sw', style: 'background:' + c }), c))) : h('div', { class: 'muted', style: 'font-size:12px', text: 'No colors yet.' }));
  const ready = doc.items.filter((x) => x.rd).length; right.append(h('div', { class: 'muted', style: 'font-size:12px;margin-top:8px', text: ready + ' of ' + doc.items.length + ' layers marked ready for dev' }));
}

// ---------- actions ----------
// a layer inside a frame always draws after (on top of) that frame, or the frame's fill would hide it
function parentsFirst(list) {
  const out = [], placed = new Set(), wait = new Map();
  const put = (i) => { out.push(i); placed.add(i.id); const w = wait.get(i.id); if (w) { wait.delete(i.id); w.forEach(put); } };
  for (const i of list) { const pf = parentFrame(i); if (pf && !placed.has(pf.id)) { if (!wait.has(pf.id)) wait.set(pf.id, []); wait.get(pf.id).push(i); } else put(i); }
  for (const w of wait.values()) w.forEach(put);
  return out;
}
function order(how) {
  const blk = expand(sel);   // a frame moves together with everything inside it
  const ids = doc.items.filter((i) => blk.has(i.id)); if (!ids.length) return; const before = doc.items.map((i) => i.id).join(); commit();
  const rest = doc.items.filter((i) => !blk.has(i.id));
  if (how === 'front') doc.items = [...rest, ...ids]; else if (how === 'back') doc.items = [...ids, ...rest];
  else { const idx = doc.items.indexOf(ids[0]); const t = clamp(idx + (how === 'up' ? 1 : -1), 0, doc.items.length - ids.length); doc.items = rest; doc.items.splice(t, 0, ...ids); }
  doc.items = parentsFirst(doc.items); if (doc.items.map((i) => i.id).join() === before) undoS.pop();
  render();
}
function align(a) {
  const it = [...sel].map(get).filter(Boolean); if (it.length < 2) return; commit();
  const B = it.map(bb), x0 = Math.min(...B.map((b) => b.x)), x1 = Math.max(...B.map((b) => b.x + b.w)), y0 = Math.min(...B.map((b) => b.y)), y1 = Math.max(...B.map((b) => b.y + b.h));
  it.forEach((i, n) => { const b = B[n]; if (a === 'left') i.x += x0 - b.x; else if (a === 'right') i.x += x1 - b.w - b.x; else if (a === 'center') i.x += (x0 + x1) / 2 - b.w / 2 - b.x; else if (a === 'top') i.y += y0 - b.y; else if (a === 'bottom') i.y += y1 - b.h - b.y; else if (a === 'middle') i.y += (y0 + y1) / 2 - b.h / 2 - b.y; });
  render();
}
function del() {
  if (!sel.size) return; const own = new Set([...sel].filter((id) => { const x = get(id); return x && !x.instOf; }));
  if (!own.size) { toast('Parts of an instance follow the main component. Detach the instance to delete them.'); return; }
  commit(); const ids = expand(own);
  for (const id of ids) { const x = get(id); if (x && x.master) for (const c of doc.items.filter((y) => y.inst === id)) detach(c.id); if (x && x.inst) doc.items = doc.items.filter((y) => y.instRoot !== id); }
  doc.items = doc.items.filter((i) => !ids.has(i.id)); for (const i of doc.items) if (ids.has(i.go)) i.go = '';
  if (doc.motion) for (const id of Object.keys(doc.motion.tracks)) if (!get(id)) delete doc.motion.tracks[id];
  sel.clear(); render();
}
// copies of the chosen items and, for frames, everything inside them; returns the new ids of the chosen ones
function cloneSet(chosen, dx, dy) {
  const all = expand(chosen), map = new Map(), out = [];
  for (const i of doc.items) { if (!all.has(i.id) || i.instOf) continue; const c = JSON.parse(JSON.stringify(i)); c.id = uid(); c.x += dx; c.y += dy; delete c.master; if (chosen.has(i.id)) c.name = i.name + ' copy'; map.set(i.id, c); out.push(c); }
  for (const c of out) if (map.has(c.go)) c.go = map.get(c.go).id;   // links between copied screens follow the copies
  return { out, roots: [...chosen].filter((id) => map.has(id)).map((id) => map.get(id).id) };
}
// where copies go: shapes nudge down-right, screens (frames) go in the free space to the right of the originals
function copyOffset(rootIds) {
  const roots = [...rootIds].map(get).filter(Boolean), fr = roots.filter((r) => r.type === 'frame'); if (!fr.length) return [24, 24];
  const x0 = Math.min(...fr.map((f) => f.x)), x1 = Math.max(...fr.map((f) => f.x + f.w)), step = x1 - x0 + 40; let dx = step;
  const others = doc.items.filter((f) => f.type === 'frame');
  for (let n = 0; n < 50 && fr.some((f) => others.some((o) => o !== f && !rootIds.has(o.id) && Math.abs(o.x - (f.x + dx)) < 2 && Math.abs(o.y - f.y) < 2)); n++) dx += step;
  return [dx, 0];
}
function dupe() { if (!sel.size) return; commit(); const [ox, oy] = copyOffset(sel); const r = cloneSet(new Set(sel), ox, oy); doc.items.push(...r.out); sel = new Set(r.roots); render(); }
function newDoc() { newBlank(); }
// pen tool: click to add corners, click the first point (or press Enter / double-click) to finish
function penSync() { pathFit(pen.it, pen.abs); renderLite(); }
function penAdd(p) {
  if (!pen) { commit(); const it = makeItem('path', p.x, p.y, 1, 1); doc.items.push(it); sel = new Set([it.id]); pen = { it, abs: [[p.x, p.y]] }; penSync(); return; }
  const l = pen.abs[pen.abs.length - 1], f = pen.abs[0];
  if (Math.hypot(p.x - l[0], p.y - l[1]) < 4 / zoom) { penFinish(false); return; }
  if (pen.abs.length >= 3 && Math.hypot(p.x - f[0], p.y - f[1]) < 8 / zoom) { penFinish(true); return; }
  pen.abs.push([p.x, p.y]); penSync();
}
function penFinish(close) {
  if (!pen) return; const { it, abs } = pen; pen = null;
  if (abs.length < 2) { doc.items = doc.items.filter((x) => x !== it); undoS.pop(); sel.clear(); }
  else if (close) { it.cl = true; it.fill = '#d0d0d0'; }
  setTool('select'); render();
}

// ---------- pointer ----------
let drag = null, spaceDown = false, focusText = false, pen = null;
svg.addEventListener('mousedown', (ev) => { if (ev.detail !== 2) return; const t = sel.size === 1 ? doc.items.find((x) => sel.has(x.id)) : null; if (t && t.type === 'text') { focusText = true; render(); } });
svg.addEventListener('pointerdown', (ev) => {
  if (ev.button === 2) return;
  svg.setPointerCapture(ev.pointerId);
  if (ev.button === 1 || spaceDown || tool === 'hand') { drag = { mode: 'pan', sx: ev.clientX, sy: ev.clientY, px: panX, py: panY }; return; }
  const p = toW(ev);
  if (playing) { stopPlay(); return; }
  if (tool === 'pen') { penAdd(p); return; }
  if (tool === 'pencil') { const redo0 = redoS; commit(); const it = makeItem('path', p.x, p.y, 1, 1); it.sm = true; it.pts = [[0, 0]]; doc.items.push(it); sel = new Set([it.id]); drag = { mode: 'pencil', it, abs: [[p.x, p.y]], redo0 }; render(); return; }
  const hd = mode === 'dev' ? null : ev.target.dataset.handle;
  if (hd && get([...sel][0]) && get([...sel][0]).instOf) { toast(PART_MSG); return; }
  if (hd) { const i = get([...sel][0]); const redo0 = redoS; commit(); drag = { mode: 'resize', hd, i, o: { ...i }, p, redo0 }; return; }
  if (tool !== 'select' && mode !== 'dev') { const redo0 = redoS; commit(); const ty = tool === 'arrow' ? 'line' : tool; const it = makeItem(ty, p.x, p.y, 1, 1); if (tool === 'arrow') { it.ah = true; it.name = 'Arrow ' + (doc.items.filter((x) => x.type === 'line' && x.ah).length + 1); } if (tool === 'text') { it.w = 80; } doc.items.push(it); sel = new Set([it.id]); drag = { mode: 'draw', i: it, p, tool: ty, redo0 }; render(); return; }
  const node = ev.target.closest('[data-id]');
  let id = node ? node.dataset.id : null; let it = id && get(id);
  if (it && it.locked) { it = null; }
  if (it && it.type === 'frame' && !ev.target.dataset.title) {
    // clicking inside a frame selects a child if there is one under the pointer, else the frame only via its title
    const child = [...doc.items].reverse().find((c) => c !== it && c.type !== 'frame' && !c.hidden && !c.locked && p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h);
    if (child) it = child;
  }
  // a part of a component instance follows its component: a click on it picks the whole instance (pick the part in the layer list)
  if (it && it.instOf && !sel.has(it.id)) { const r = get(it.instRoot); if (r && !r.locked) it = r; }
  if (it && mode === 'dev') { sel = new Set([it.id]); render(); return; }
  if (mode === 'dev') { sel.clear(); render(); return; }
  if (it) {
    if (ev.shiftKey) { sel.has(it.id) ? sel.delete(it.id) : sel.add(it.id); } else if (!sel.has(it.id)) sel = new Set([it.id]);
    const moving = [];
    for (const id2 of sel) { const m = get(id2); if (!m || m.locked) continue; moving.push(m); if (m.type === 'frame') doc.items.filter((c) => inside(c, m) && !sel.has(c.id)).forEach((c) => moving.push(c)); }
    const roots = new Set(moving.map((m) => m.id)), free = moving.filter((m) => !m.instOf || roots.has(m.instRoot));
    if (!free.length && moving.length) { toast(PART_MSG); render(); return; } // only parts of instances: they stay where their component puts them
    moving.length = 0; moving.push(...free);
    if (!moving.length) { render(); return; } // only locked layers: select them, nothing to move
    const redo0 = redoS; commit(); drag = { mode: 'move', p, orig: [...new Set(moving)].map((m) => ({ m, x: m.x, y: m.y })), moved: false, redo0 }; render();
  } else { if (!ev.shiftKey) sel.clear(); const r = sv('rect', { fill: 'rgba(200,200,200,.12)', stroke: '#bdbdbd', 'stroke-dasharray': '4 3', 'stroke-width': 1 / zoom }); drag = { mode: 'marquee', p, r }; render(); gUI.append(r); }
});
svg.addEventListener('pointermove', (ev) => {
  if (pen && !drag) { const p = toW(ev), l = pen.abs[pen.abs.length - 1]; gUI.querySelectorAll('.rb').forEach((e) => e.remove()); const r = sv('line', { class: 'rb', x1: l[0], y1: l[1], x2: p.x, y2: p.y, stroke: '#e6e6e6', 'stroke-width': 1.2 / zoom, 'stroke-dasharray': `${4 / zoom} ${3 / zoom}`, 'pointer-events': 'none' }); gUI.append(r); return; }
  if (!drag) return;
  if (drag.mode === 'pencil') { const p = toW(ev), l = drag.abs[drag.abs.length - 1]; if (Math.hypot(p.x - l[0], p.y - l[1]) >= 2 / zoom) { drag.abs.push([p.x, p.y]); pathFit(drag.it, drag.abs); renderLite(); } return; }
  if (drag.mode === 'pan') { panX = drag.px + ev.clientX - drag.sx; panY = drag.py + ev.clientY - drag.sy; applyView(); return; }
  const p = toW(ev);
  if (drag.mode === 'move') {
    let dx = p.x - drag.p.x, dy = p.y - drag.p.y; if (Math.abs(dx) + Math.abs(dy) > 0) drag.moved = true;
    const guides = [];
    if (!ev.altKey) { // snap the moving group's edges/centres to other items' edges/centres
      const ms = new Set(drag.orig.map((o) => o.m)); const others = doc.items.filter((c) => !ms.has(c) && !c.hidden && c.type !== 'line');
      let bx0 = Infinity, by0 = Infinity, bx1 = -Infinity, by1 = -Infinity;
      for (const o of drag.orig) { const b = bb({ x: o.x, y: o.y, w: o.m.w, h: o.m.h }); bx0 = Math.min(bx0, b.x); by0 = Math.min(by0, b.y); bx1 = Math.max(bx1, b.x + b.w); by1 = Math.max(by1, b.y + b.h); }
      const th = 5 / zoom; const best = (mine, targets) => { let b = null; for (const m of mine) for (const t of targets) { const d = t - m; if (Math.abs(d) <= th && (!b || Math.abs(d) < Math.abs(b.d))) b = { d, at: t }; } return b; };
      const xs = [], ys = []; for (const c of others) { xs.push(c.x, c.x + c.w / 2, c.x + c.w); ys.push(c.y, c.y + c.h / 2, c.y + c.h); }
      const sx = best([bx0 + dx, (bx0 + bx1) / 2 + dx, bx1 + dx], xs), sy = best([by0 + dy, (by0 + by1) / 2 + dy, by1 + dy], ys);
      if (sx) { dx += sx.d; guides.push({ v: true, at: sx.at }); } if (sy) { dy += sy.d; guides.push({ v: false, at: sy.at }); }
    }
    for (const o of drag.orig) { o.m.x = Math.round(o.x + dx); o.m.y = Math.round(o.y + dy); } renderLite();
    for (const g of guides) gUI.append(sv('line', { class: 'sg', x1: g.v ? g.at : -1e5, x2: g.v ? g.at : 1e5, y1: g.v ? -1e5 : g.at, y2: g.v ? 1e5 : g.at, stroke: '#ff3d8b', 'stroke-width': 1 / zoom, 'pointer-events': 'none' }));
  }
  else if (drag.mode === 'draw') {
    const i = drag.i; let w = p.x - drag.p.x, hh = p.y - drag.p.y;
    if (drag.tool === 'line') { i.x = drag.p.x; i.y = drag.p.y; i.w = w; i.h = hh; if (ev.shiftKey) { if (Math.abs(w) > Math.abs(hh)) i.h = 0; else i.w = 0; } }
    else if (drag.tool === 'text') { i.x = drag.p.x; i.y = drag.p.y; }
    else { if (ev.shiftKey) hh = Math.sign(hh || 1) * Math.abs(w); i.x = Math.round(Math.min(drag.p.x, drag.p.x + w)); i.y = Math.round(Math.min(drag.p.y, drag.p.y + hh)); i.w = Math.max(1, Math.round(Math.abs(w))); i.h = Math.max(1, Math.round(Math.abs(hh))); }
    renderLite();
  } else if (drag.mode === 'resize') {
    const { i, o, hd } = drag; const dx = p.x - drag.p.x, dy = p.y - drag.p.y;
    if (i.type === 'line') { if (hd === 'a') { i.x = o.x + dx; i.y = o.y + dy; i.w = o.w - dx; i.h = o.h - dy; } else { i.w = o.w + dx; i.h = o.h + dy; } }
    else {
      let { x, y, w, h: hh } = o;
      if (hd.includes('e')) w = Math.max(2, o.w + dx); if (hd.includes('s')) hh = Math.max(2, o.h + dy);
      if (hd.includes('w')) { w = Math.max(2, o.w - dx); x = o.x + o.w - w; } if (hd.includes('n')) { hh = Math.max(2, o.h - dy); y = o.y + o.h - hh; }
      if (ev.shiftKey && hd.length === 2) { const ratio = o.w / o.h; hh = w / ratio; if (hd.includes('n')) y = o.y + o.h - hh; }
      Object.assign(i, { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(hh) });
    }
    renderLite();
  } else if (drag.mode === 'marquee') {
    const x = Math.min(p.x, drag.p.x), y = Math.min(p.y, drag.p.y), w = Math.abs(p.x - drag.p.x), hh = Math.abs(p.y - drag.p.y);
    ['x', 'y', 'width', 'height'].forEach((a, k) => drag.r.setAttribute(a, [x, y, w, hh][k])); drag.box = { x, y, w, h: hh };
  }
});
let lite = false;
function renderLite() { lite = true; try { render(); } finally { lite = false; } }
// Escape (or a lost pointer) during a drag: put everything back as it was when the drag began
function cancelDrag() {
  if (!drag) return false; const d = drag; drag = null;
  if (d.mode === 'marquee') d.r.remove();
  else if (d.mode !== 'pan' && undoS.length) { doc = JSON.parse(undoS.pop()); if (d.redo0) redoS = d.redo0; sel = new Set([...sel].filter((id) => get(id))); if (d.mode === 'draw' || d.mode === 'pencil') setTool('select'); }
  render(); return true;
}
svg.addEventListener('pointercancel', cancelDrag);
window.addEventListener('blur', () => { spaceDown = false; });
svg.addEventListener('pointerup', () => {
  if (!drag) return; const d = drag; drag = null;
  if ((d.mode === 'move' && d.moved) || d.mode === 'resize') autoKeyFor([...sel].map(get));
  if (d.mode === 'pencil') { if (d.abs.length < 2) { doc.items = doc.items.filter((x) => x !== d.it); undoS.pop(); if (d.redo0) redoS = d.redo0; sel.clear(); } setTool('select'); render(); return; }
  if (d.mode === 'draw') {
    const i = d.i;
    if (d.tool === 'text') { i.w = 80; i.h = 24; focusText = true; }
    else if ((d.tool !== 'line' && (i.w < 4 || i.h < 4)) || (d.tool === 'line' && Math.abs(i.w) + Math.abs(i.h) < 4)) { if (d.tool === 'line') { i.w = 120; i.h = 0; } else { i.w = d.tool === 'frame' ? 375 : 120; i.h = d.tool === 'frame' ? 667 : d.tool === 'polygon' || d.tool === 'star' ? 120 : 80; } }
    setTool('select'); render();
  } else if ((d.mode === 'move' && !d.moved) || (d.mode === 'resize' && ['x', 'y', 'w', 'h'].every((k) => d.i[k] === d.o[k]))) { undoS.pop(); redoS = d.redo0; render(); }
  else if (d.mode === 'marquee') { d.r.remove(); if (d.box && (d.box.w > 3 || d.box.h > 3)) for (const i of doc.items) { const b = bb(i); if (!i.hidden && !i.locked && b.x < d.box.x + d.box.w && b.x + b.w > d.box.x && b.y < d.box.y + d.box.h && b.y + b.h > d.box.y && i.type !== 'frame') sel.add(i.id); } render(); }
  else render();
});
svg.addEventListener('wheel', (ev) => { ev.preventDefault(); const r = svg.getBoundingClientRect(); if (ev.ctrlKey || ev.metaKey) zoomBy(ev.deltaY < 0 ? 1.1 : 1 / 1.1, ev.clientX - r.left, ev.clientY - r.top); else { panX -= ev.deltaX; panY -= ev.deltaY; applyView(); } }, { passive: false });
document.addEventListener('keydown', (e) => {
  if (homeOpen) { if (e.key === 'Escape' && session && !document.querySelector('.modal-back')) closeHome(); return; }
  if (preview) { if (e.key === 'Escape') endPreview(); else if (e.key === 'Backspace' || e.key === 'ArrowLeft') previewBack(); return; }
  if (fly && !document.querySelector('.modal-back')) { // open menu: Esc closes it and gives focus back, arrows move between items
    if (e.key === 'Escape') { e.preventDefault(); closeFly(true); return; }
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && fly.contains(e.target)) { e.preventDefault(); fly.classList.add('kb'); const it = [...fly.querySelectorAll('.fi')], i = it.indexOf(e.target); it[(i + (e.key === 'ArrowDown' ? 1 : it.length - 1)) % it.length].focus(); return; }
    return; // any other key belongs to the menu: Tab, Enter and Space keep their normal job, shortcuts wait until it closes
  }
  if (e.target.matches('input,textarea,select')) return;
  // Delete on a focused Hide/Lock/Insert button in the layer list is not meant for the selected layers
  if ((e.key === 'Delete' || e.key === 'Backspace') && e.target.matches('button') && left.contains(e.target)) return;
  // a focused button keeps Space and Enter (they press it); other shortcuts still work after clicking one
  if (document.querySelector('.modal-back') || (!e.ctrlKey && !e.metaKey && (e.target.matches('[contenteditable]') || (e.target.matches('button') && (e.key === 'Enter' || e.code === 'Space'))))) return;
  const k = e.key.toLowerCase();
  if (mode === 'dev' && ((e.ctrlKey && (k === 'd' || k === 'v')) || e.key === 'Delete' || e.key === 'Backspace' || e.key.startsWith('Arrow'))) return;
  if (e.code === 'Space') { spaceDown = true; e.preventDefault(); }
  else if (e.ctrlKey && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (e.ctrlKey && k === 'y') { e.preventDefault(); redo(); }
  else if (e.ctrlKey && k === 'd') { e.preventDefault(); dupe(); }
  else if (e.ctrlKey && k === 's') { e.preventDefault(); saveDoc(); }
  else if (e.ctrlKey && k === 'o') { e.preventDefault(); openDoc(); }
  else if (e.ctrlKey && k === 'a') { e.preventDefault(); sel = new Set(doc.items.filter((i) => !i.locked).map((i) => i.id)); render(); }
  else if (e.ctrlKey && k === 'c') { if (sel.size) { const ex = expand(sel), items = doc.items.filter((i) => ex.has(i.id) && !i.instOf); if (!items.length) { toast('Parts of an instance cannot be copied. Copy the whole instance instead.'); return; } clip = JSON.stringify({ items, roots: [...sel], off: copyOffset(sel) }); toast('Copied'); } }
  else if (e.ctrlKey && k === 'v') { if (!clip) return; const c = JSON.parse(clip), map = new Map(); if (!c.items || !c.items.length) return; commit(); sel.clear(); for (const i of c.items) { const o = i.id; i.id = uid(); i.x += (c.off || [24, 24])[0]; i.y += (c.off || [24, 24])[1]; delete i.master; map.set(o, i); } for (const i of map.values()) { if (map.has(i.go)) i.go = map.get(i.go).id; doc.items.push(i); } for (const r of c.roots) if (map.has(r)) sel.add(map.get(r).id); render(); }
  else if (e.shiftKey && k === 'i') { if (offered('image')) pickImages(); }
  else if (e.key === 'Delete' || e.key === 'Backspace') del();
  else if (e.key === 'Enter' && pen) { penFinish(false); }
  else if (e.key === 'Escape') { if (fly) { closeFly(); return; } if (cancelDrag()) return; if (pen) { penFinish(false); return; } sel.clear(); setTool('select'); render(); }
  else if (e.key.startsWith('Arrow') && sel.size) { e.preventDefault(); const d = e.shiftKey ? 10 : 1; commit(); doc.items.filter((i) => sel.has(i.id) && !i.locked).forEach((i) => { if (e.key === 'ArrowLeft') i.x -= d; if (e.key === 'ArrowRight') i.x += d; if (e.key === 'ArrowUp') i.y -= d; if (e.key === 'ArrowDown') i.y += d; }); autoKeyFor(doc.items.filter((i) => sel.has(i.id) && !i.locked)); render(); }
  else if (!e.ctrlKey && e.shiftKey && (k === 'l' || k === 'p')) { const t = k === 'l' ? 'arrow' : 'pencil'; if (offered(t)) setTool(t); }
  else if (!e.ctrlKey && 'vhfrolpt'.includes(k) && k.length === 1) { const t = { v: 'select', h: 'hand', f: 'frame', r: 'rect', o: 'ellipse', l: 'line', p: 'pen', t: 'text' }[k]; if (offered(t)) setTool(t); }
});
document.addEventListener('keyup', (e) => { if (e.code === 'Space') spaceDown = false; });
// a toolbar or dock button clicked with the mouse lets go of focus, so Space pans the canvas instead of pressing it again
document.addEventListener('pointerup', (e) => { const b = e.target.closest && e.target.closest('.toolbar button,.dock button'); if (b) setTimeout(() => { if (document.activeElement === b) b.blur(); }, 0); });

// ---------- prototype preview ----------
function startPreview() {
  const frames = doc.items.filter((f) => f.type === 'frame' && !f.hidden); if (!frames.length) { toast('Add a frame first'); return; }
  endSession();
  const s0 = sel.size ? get([...sel][0]) : null, start = s0 && s0.type === 'frame' && !s0.hidden ? s0 : frames[0];
  const back = h('div', { class: 'modal-back pv', style: 'flex-direction:column;gap:16px' });
  preview = { back, frame: start, hist: [], hot: false };
  document.body.append(back); showPreviewFrame(start, 'none', true);
}
window.addEventListener('resize', () => { if (preview && preview.frame) showPreviewFrame(preview.frame, 'none', true); });
function endPreview() { preview?.back.remove(); preview = null; }
function previewBack() { if (!preview || !preview.hist.length) return; const f = get(preview.hist.pop()); if (f) showPreviewFrame(f, 'fade', true); }
function showPreviewFrame(f, how = 'none', noPush = false) {
  if (!noPush && preview.frame && preview.frame !== f) preview.hist.push(preview.frame.id);
  preview.frame = f; const back = preview.back; back.textContent = '';
  const maxW = window.innerWidth - 60, maxH = window.innerHeight - 100; const sc = Math.min(maxW / f.w, maxH / f.h, 1.5);
  const s = sv('svg', { width: f.w * sc, height: f.h * sc, viewBox: `${f.x} ${f.y} ${f.w} ${f.h}`, style: 'background:#fff;box-shadow:0 0 0 1px #000' });
  s.append(sv('clipPath', { id: 'pvc' })); s.firstChild.append(sv('rect', { x: f.x, y: f.y, width: f.w, height: f.h }));
  const g = sv('g', { 'clip-path': 'url(#pvc)' }); s.append(g);
  g.append(itemEl({ ...f, name: '' }, true));
  for (const i of doc.items) {
    if (i === f || !inside(i, f) || i.hidden) continue; const el = itemEl(i, true);
    if (i.go && get(i.go)) { el.style.cursor = 'pointer'; el.addEventListener('click', () => showPreviewFrame(get(i.go), i.tr || 'none')); if (preview.hot) g.append(el), g.append(sv('rect', { x: i.x, y: i.y, width: i.w, height: i.h, fill: 'rgba(120,120,120,.25)', stroke: '#777', 'stroke-dasharray': '4 3', 'pointer-events': 'none' })); else g.append(el); }
    else g.append(el);
  }
  const backB = btn('Back', previewBack); backB.disabled = !preview.hist.length;
  const bar = h('div', { class: 'row pvbar' }, backB, h('span', { class: 'pvname', text: f.name }), btn(preview.hot ? 'Hide hotspots' : 'Show hotspots', () => { preview.hot = !preview.hot; showPreviewFrame(f, 'none', true); }), btn('Restart', () => { preview.hist = []; showPreviewFrame(doc.items.find((x) => x.type === 'frame' && !x.hidden), 'none', true); }), btn('Close preview', endPreview));
  back.append(s, bar);
  if (how === 'fade' && s.animate) s.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240 });
  else if (how === 'slide' && s.animate) s.animate([{ transform: 'translateX(60px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'ease-out' });
}

// ---------- files ----------
const cleanItem = (i) => ({ id: String(i.id || uid()), type: NAMES[i.type] ? i.type : 'rect', name: String(i.name || 'Layer'), x: +i.x || 0, y: +i.y || 0, w: +i.w || 0, h: +i.h || 0, fill: i.fill === 'none' ? 'none' : hex(i.fill, '#d0d0d0'), stroke: hex(i.stroke, '#000000'), sw: Math.max(0, +i.sw || 0), r: Math.max(0, +i.r || 0), op: clamp(+i.op || 1, 0.05, 1), text: String(i.text || ''), fs: clamp(+i.fs || 16, 6, 400), go: String(i.go || ''), tr: ['fade', 'slide'].includes(i.tr) ? i.tr : 'none', master: !!i.master, inst: i.inst ? String(i.inst) : undefined, instOf: i.instOf ? String(i.instOf) : undefined, instRoot: i.instRoot ? String(i.instRoot) : undefined, ov: !!i.ov, al: i.al && ['v', 'h'].includes(i.al.dir) ? { dir: i.al.dir, gap: Math.max(0, +i.al.gap || 0), pad: Math.max(0, +i.al.pad || 0), align: ['center', 'end'].includes(i.al.align) ? i.al.align : 'start', hug: !!i.al.hug } : undefined, hidden: !!i.hidden, locked: !!i.locked, rot: clamp(+i.rot || 0, -360, 360), fill2: /^#[0-9a-f]{6}$/i.test(i.fill2) ? i.fill2 : '', ga: clamp(Number.isFinite(+i.ga) && i.ga !== undefined ? +i.ga : 90, -360, 360), sh: i.sh && typeof i.sh === 'object' ? { x: clamp(+i.sh.x || 0, -200, 200), y: clamp(+i.sh.y || 0, -200, 200), b: clamp(+i.sh.b || 0, 0, 200), o: clamp(+i.sh.o || 0.25, 0.02, 1) } : undefined, ff: FONTS[i.ff] ? i.ff : 'sans', fw: +i.fw === 700 ? 700 : 400, ta: ['center', 'right'].includes(i.ta) ? i.ta : 'left', n: clamp(Math.round(+i.n || (i.type === 'star' ? 5 : 3)), 3, 12), ah: !!i.ah, cl: !!i.cl, sm: !!i.sm, pts: i.type === 'path' && Array.isArray(i.pts) ? i.pts.slice(0, 3000).map((p) => [clamp(+(p && p[0]) || 0, 0, 1), clamp(+(p && p[1]) || 0, 0, 1)]) : undefined, note: String(i.note || '').slice(0, 500), rd: !!i.rd, src: i.type === 'image' && typeof i.src === 'string' && i.src.length < 12e6 && IMG_OK.test(i.src) ? i.src : undefined });
async function openDoc(dropped) {
  const f = (dropped && dropped.data) ? dropped : (await window.host.openFiles({ filters: [['Frameout design', ['frameout', 'json']]] }))[0]; if (!f) return;
  try { const d = JSON.parse(new TextDecoder().decode(f.data)); if (!Array.isArray(d.items)) throw new Error('Not a Frameout file'); startDesign({ id: String(d.id || uid()).slice(0, 24), title: String(d.title || 'Untitled design'), items: d.items.map(cleanItem), motion: cleanMotion(d.motion) }); fileName = f.name; renderStatus(); }
  catch (e) { toast('Cannot open: ' + e.message); }
}
async function saveDoc() {
  const snap = fileSnap(), bytes = new TextEncoder().encode(JSON.stringify(JSON.parse(snap), null, 1)); // savedSnap is what went into the file
  if (fileBind) { try { const n = await window.host.folders.save(fileBind.key, fileBind.name, bytes, true); savedSnap = snap; toast('Saved ' + n + ' in ' + fileBind.folder); renderStatus(); } catch (e) { fileBind = null; toast('Could not save to the folder. Choose another place.'); return saveDoc(); } return; }
  const r = await window.host.saveFile({ name: (doc.title || 'design') + '.frameout', filters: [['Frameout design', ['frameout']]], data: bytes }); if (r) { savedSnap = snap; fileName = r.name; toast('Saved ' + r.name); renderStatus(); } }
function exportTarget(forced) { const f = forced || (sel.size === 1 ? get([...sel][0]) : null); if (f && f.type === 'frame') return { f, only: doc.items.filter((i) => i === f || inside(i, f)) }; const all = doc.items.filter((i) => !i.hidden); if (!all.length) return null; const B = all.map(bb), x0 = Math.min(...B.map((b) => b.x)), y0 = Math.min(...B.map((b) => b.y)), x1 = Math.max(...B.map((b) => b.x + b.w)), y1 = Math.max(...B.map((b) => b.y + b.h)); return { f: { x: x0, y: y0, w: Math.max(1, x1 - x0), h: Math.max(1, y1 - y0) }, only: all }; }
function exportSvgString(forced) {
  const t = exportTarget(forced); if (!t) return null; const { f, only } = t;
  const root = sv('svg', { xmlns: NS, width: f.w, height: f.h, viewBox: `${f.x} ${f.y} ${f.w} ${f.h}` });
  const clip = sv('clipPath', { id: 'ec' }); clip.append(sv('rect', { x: f.x, y: f.y, width: f.w, height: f.h })); root.append(clip);
  root.append(sv('rect', { x: f.x, y: f.y, width: f.w, height: f.h, fill: only.some((i) => i.type === 'frame') ? '#ffffff' : '#ffffff' }));
  const g = sv('g', { 'clip-path': 'url(#ec)' }); for (const i of only) g.append(itemEl(i, true)); root.append(g);
  return { str: new XMLSerializer().serializeToString(root), w: f.w, h: f.h };
}
async function exportImg(kind) {
  const r = exportSvgString(); if (!r) { toast('Nothing to export'); return; }
  if (kind === 'svg') { const s = await window.host.saveFile({ name: (doc.title || 'design') + '.svg', filters: [['SVG', ['svg']]], data: new TextEncoder().encode(r.str) }); if (s) toast('Saved ' + s.name); return; }
  // a canvas has size limits; very large designs are scaled down to fit (at most 16000 px a side, 64 million pixels)
  const sc = Math.min(r.w > 3000 ? 1 : 2, 16000 / r.w, 16000 / r.h, Math.sqrt(64e6 / (r.w * r.h)));
  let blob = null;
  try {
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(r.str); await img.decode();
    const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.round(r.w * sc)); cv.height = Math.max(1, Math.round(r.h * sc)); const ctx = cv.getContext('2d'); ctx.scale(sc, sc); ctx.drawImage(img, 0, 0, r.w, r.h);
    blob = await new Promise((x) => cv.toBlob(x, 'image/png'));
  } catch (e) { blob = null; }
  if (!blob) { toast('Could not make the PNG. Try exporting one frame.'); return; }
  const s = await window.host.saveFile({ name: (doc.title || 'design') + '.png', filters: [['PNG image', ['png']]], data: new Uint8Array(await blob.arrayBuffer()) }); if (s) toast('Saved ' + s.name + (sc < 1 ? ' (scaled down to fit)' : ''));
}

// sample: two linked screens
function sampleDoc() {
  const keep = doc; doc = { id: uid(), title: 'Mobile app', items: [] };
  const f1 = makeItem('frame', 0, 0, 375, 667); f1.name = 'Home';
  const f2 = makeItem('frame', 475, 0, 375, 667); f2.name = 'Details'; f2.fill = '#e4e4e4';
  const t1 = makeItem('text', 28, 56, 200, 40); t1.text = 'Good morning'; t1.fs = 28; t1.fill = '#1a1a1a'; t1.h = 36; t1.w = 220;
  const c1 = makeItem('rect', 28, 130, 319, 120); c1.fill = '#4a4a4a'; c1.r = 16;
  const ct = makeItem('text', 52, 170, 200, 30); ct.text = 'Today: 3 tasks'; ct.fs = 20; ct.fill = '#f2f2f2'; ct.h = 28; ct.w = 180;
  const b1 = makeItem('rect', 28, 560, 319, 52); b1.fill = '#262626'; b1.r = 26; b1.go = f2.id;
  const bt = makeItem('text', 140, 574, 100, 24); bt.text = 'See details'; bt.fs = 16; bt.fill = '#ffffff'; bt.w = 100; bt.h = 24;
  const t2 = makeItem('text', 503, 56, 200, 40); t2.text = 'Details'; t2.fs = 28; t2.h = 36; t2.w = 120;
  const e2 = makeItem('ellipse', 503, 120, 80, 80); e2.fill = '#8a8a8a';
  const b2 = makeItem('rect', 503, 560, 319, 52); b2.fill = '#262626'; b2.r = 26; b2.go = f1.id;
  const bt2 = makeItem('text', 640, 574, 60, 24); bt2.text = 'Back'; bt2.fs = 16; bt2.fill = '#ffffff'; bt2.w = 50; bt2.h = 24;
  doc.items = [f1, f2, t1, c1, ct, b1, bt, t2, e2, b2, bt2]; doc.title = 'Mobile app'; doc.items.forEach((i, k) => { if (i.type === 'text') i.name = i.text; else if (i.type === 'rect') i.name = i.go ? 'Button' : 'Card'; });
  const out = doc; doc = keep; return out;
}
// ---------- home screen ----------
const RECENT_KEY = 'frameout.recent';
let homeOpen = false, session = false, lastSaved = '';
const home = h('div', { class: 'home' }); app.append(home);
const readRecent = () => { try { const r = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]'); return Array.isArray(r) ? r.filter((e) => e && e.id && typeof e.doc === 'string') : []; } catch (e) { return []; } };
// when the disk store is full, the oldest designs that are not starred go first, then the oldest starred ones;
// the open design (cur) is never dropped, only its picture as a last try. Says whether the list was written.
function writeRecent(list, cur) {
  const st = readStars(); list = list.slice();
  const drop = (keep) => { for (let k = list.length - 1; k >= 0; k--) if (list[k].id !== cur && !keep(list[k])) { list.splice(k, 1); return true; } return false; };
  for (;;) {
    try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); return true; } catch (e) {
      if (drop((x) => st.has(x.id)) || drop(() => false)) continue;
      const c = list.find((x) => x.id === cur); if (c && c.svg) { c.svg = ''; continue; } return false;
    }
  }
}
let recentOk = true;   // false when the last autosave could not keep the open design in Recent
// keeps the open design in the Recent list (like Figma drafts), with a small picture of its first screen
function autosave() {
  if (!session || !doc.items.length) return;
  if (!doc.id) doc.id = uid();
  const s = JSON.stringify(restDoc()); if (s === lastSaved) return;
  let svgStr = ''; try { const fr = doc.items.find((i) => i.type === 'frame' && !i.hidden); const r = exportSvgString(fr || null); svgStr = r ? r.str : ''; } catch (e) { /* no picture */ }
  const list = readRecent().filter((e) => e.id !== doc.id);
  list.unshift({ id: doc.id, title: doc.title || 'Untitled design', time: Date.now(), svg: svgStr, doc: s });
  recentOk = writeRecent(keepRecent(list, getSet('recentMax')), doc.id); lastSaved = recentOk ? s : '';
}
// starred designs: a list of Recent ids, kept on this computer. Starred ones never drop off the Recent cap.
const STAR_KEY = 'frameout.starred';
function readStars() { try { const r = JSON.parse(localStorage.getItem(STAR_KEY) || '[]'); return new Set(Array.isArray(r) ? r.filter((x) => typeof x === 'string') : []); } catch (e) { return new Set(); } }
function writeStars(set) { try { localStorage.setItem(STAR_KEY, JSON.stringify([...set])); } catch (e) { /* not saved */ } }
function toggleStar(id) { const s = readStars(); if (s.has(id)) s.delete(id); else s.add(id); writeStars(s); renderHome(); }
function keepRecent(list, n) { const st = readStars(); return list.filter((e, k) => k < n || st.has(e.id)); }
const SET_KEY = 'frameout.settings', SET_DEF = { recentMax: 12, openOn: 'home', sideShut: false };
function getSet(k) { try { const s = JSON.parse(localStorage.getItem(SET_KEY) || '{}'); const v = s && s[k]; if (k === 'recentMax') return [6, 12, 24].includes(v) ? v : SET_DEF[k]; if (k === 'openOn') return v === 'last' ? 'last' : 'home'; if (k === 'sideShut') return v === true; } catch (e) { /* defaults */ } return SET_DEF[k]; }
function putSet(k, v) { try { const s = JSON.parse(localStorage.getItem(SET_KEY) || '{}') || {}; s[k] = v; localStorage.setItem(SET_KEY, JSON.stringify(s)); } catch (e) { /* not saved */ } }
let homeTab = 'home';
function showHome(tab) { endSession(); autosave(); homeOpen = true; if (tab) homeTab = tab; home.style.display = 'flex'; for (const k in folderThumbs) delete folderThumbs[k]; renderHome(); loadFolders().then(() => { if (homeOpen) renderHome(); }); }
function closeHome() { homeOpen = false; home.style.display = 'none'; }
let folders = [], fileBind = null;
function newBlank(target) {
  if (target && !target.key) target = null; const d = { id: uid(), title: 'Untitled design', items: [] };
  endSession(); mode = 'design'; playhead = 0; buildDock(); startDesign(d); if (target) newInFolder(target.key, target.name, d);
}
function endSession() { if (pen) penFinish(false); endOps(); if (playing) stopPlay(); }
function startDesign(d, bind) { endSession(); if (mode !== 'design') { mode = 'design'; buildDock(); } playhead = 0; autosave(); fileBind = bind || null; doc = d; sel.clear();
  if (doc.motion) { for (const id of Object.keys(doc.motion.tracks)) if (!get(id)) delete doc.motion.tracks[id]; applyPose(0); } undoS = []; redoS = []; restEdit = false; fileName = ''; savedSnap = fileSnap(); lastSaved = ''; session = true; closeHome(); render(); fit(); }
function openRecent(e) {
  try { const d = JSON.parse(e.doc); if (!Array.isArray(d.items)) throw new Error('damaged'); startDesign({ id: e.id, title: String(d.title || e.title || 'Untitled design'), items: d.items.map(cleanItem), motion: cleanMotion(d.motion) }); }
  catch (err) { toast('Cannot open this design'); }
}
function removeRecent(id) { writeRecent(readRecent().filter((e) => e.id !== id)); const s = readStars(); if (s.delete(id)) writeStars(s); renderHome(); }
function ago(t) { const d = new Date(t), now = new Date(); const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime(); const diff = Math.round((day(now) - day(d)) / 86400000); const hm = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); return diff <= 0 ? 'Today ' + hm : diff === 1 ? 'Yesterday ' + hm : d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }); }
function thumbBox(svgStr, cls = '') { const box = h('div', { class: 'thumb ' + cls }); if (svgStr) box.append(h('img', { src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr), alt: '' })); else box.append(h('span', { class: 'muted', text: 'Empty' })); return box; }
// starter templates, built in code so they stay small and work offline
const TEMPLATES = [
  ['Mobile app', 'Two linked screens with a button', () => sampleDoc()],
  ['Login screen', 'Phone, two fields and a button', () => tpl('Login screen', [['frame', 0, 0, 393, 852, { name: 'Login', fill: '#ffffff' }], ['text', 32, 120, 300, 44, { text: 'Welcome back', fs: 32, fill: '#1a1a1a' }], ['text', 32, 172, 320, 24, { text: 'Sign in to continue', fs: 16, fill: '#6b6b6b' }], ['rect', 32, 260, 329, 52, { name: 'Email field', fill: '#f0f0f0', r: 12 }], ['text', 48, 274, 200, 24, { text: 'Email', fs: 16, fill: '#8a8a8a' }], ['rect', 32, 328, 329, 52, { name: 'Password field', fill: '#f0f0f0', r: 12 }], ['text', 48, 342, 200, 24, { text: 'Password', fs: 16, fill: '#8a8a8a' }], ['rect', 32, 412, 329, 52, { name: 'Button', fill: '#262626', r: 26 }], ['text', 150, 426, 100, 24, { text: 'Sign in', fs: 16, fill: '#ffffff' }]])],
  ['Landing page', 'Desktop page with a hero and three cards', () => tpl('Landing page', [['frame', 0, 0, 1440, 1024, { name: 'Landing', fill: '#ffffff' }], ['rect', 0, 0, 1440, 72, { name: 'Nav', fill: '#f4f4f4' }], ['text', 64, 22, 160, 28, { text: 'Brand', fs: 22, fill: '#1a1a1a' }], ['text', 220, 150, 1000, 80, { text: 'A clear headline goes here', fs: 64, fill: '#1a1a1a' }], ['text', 360, 250, 720, 60, { text: 'One or two lines that explain what this is and who it is for.', fs: 20, fill: '#6b6b6b' }], ['rect', 600, 340, 240, 56, { name: 'Button', fill: '#262626', r: 28 }], ['text', 668, 356, 120, 24, { text: 'Get started', fs: 18, fill: '#ffffff' }], ['rect', 120, 520, 360, 320, { name: 'Card', fill: '#ececec', r: 20 }], ['rect', 540, 520, 360, 320, { name: 'Card', fill: '#ececec', r: 20 }], ['rect', 960, 520, 360, 320, { name: 'Card', fill: '#ececec', r: 20 }]])],
  ['Dashboard', 'Wireframe with sidebar, stats and a chart', () => tpl('Dashboard', [['frame', 0, 0, 1280, 800, { name: 'Dashboard', fill: '#f6f6f6' }], ['rect', 0, 0, 220, 800, { name: 'Sidebar', fill: '#262626' }], ['text', 28, 28, 160, 28, { text: 'Dashboard', fs: 20, fill: '#ffffff' }], ['rect', 260, 40, 230, 110, { name: 'Stat', fill: '#ffffff', r: 14 }], ['rect', 515, 40, 230, 110, { name: 'Stat', fill: '#ffffff', r: 14 }], ['rect', 770, 40, 230, 110, { name: 'Stat', fill: '#ffffff', r: 14 }], ['rect', 1025, 40, 230, 110, { name: 'Stat', fill: '#ffffff', r: 14 }], ['rect', 260, 180, 995, 360, { name: 'Chart', fill: '#ffffff', r: 14 }], ['rect', 260, 570, 995, 190, { name: 'Table', fill: '#ffffff', r: 14 }]])],
  ['Instagram quote', 'Square post with big text', () => tpl('Instagram quote', [['frame', 0, 0, 1080, 1080, { name: 'Post', fill: '#262626' }], ['text', 120, 380, 840, 240, { text: 'Write your quote here.', fs: 72, fill: '#ffffff' }], ['text', 120, 940, 400, 36, { text: '@yourname', fs: 28, fill: '#a0a0a0' }]])],
  ['Slide 16:9', 'Title slide, 1920 by 1080', () => tpl('Slide', [['frame', 0, 0, 1920, 1080, { name: 'Slide', fill: '#ffffff' }], ['text', 160, 380, 1400, 120, { text: 'Slide title', fs: 96, fill: '#1a1a1a' }], ['text', 160, 530, 1200, 50, { text: 'Subtitle or speaker', fs: 36, fill: '#6b6b6b' }]])],
];
function tpl(title, specs) {
  const keep = doc; doc = { id: uid(), title, items: [] };
  for (const [type, x, y, w, hh, p] of specs) { const it = makeItem(type, x, y, w, hh); Object.assign(it, p); if (type === 'text') { it.w = w; it.h = hh; if (!it.name) it.name = it.text; } doc.items.push(it); }
  const out = doc; doc = keep; return out;
}
function docThumb(d) { const keep = doc; let s = ''; try { doc = d; const fr = d.items.find((i) => i.type === 'frame'); const r = exportSvgString(fr || null); s = r ? r.str : ''; } catch (e) { /* no picture */ } doc = keep; return s; }
function newCard(ic, name, sub, fn) { return h('button', { class: 'hcard', onclick: fn }, h('div', { class: 'thumb plus' }, icon(ic, 40)), h('div', { class: 'hname', text: name }), h('div', { class: 'hsub', text: sub })); }
const folderThumbs = {};
const FOLDERS_UI = false; // folders hidden on request; the code and any saved folders stay
function homeFolderCards() {
  if (!FOLDERS_UI || !folders.length) return [];
  const row = h('div', { class: 'home-row' });
  for (const f of folders) {
    if (!folderThumbs[f.path]) { folderThumbs[f.path] = { files: [] }; window.host.folders.files(f.path).then((r) => { folderThumbs[f.path] = { files: r.files.slice(0, 3).map(parseDesignFile).filter(Boolean) }; if (homeOpen && homeTab === 'home') renderHome(); }).catch(() => {}); }
    const th = h('div', { class: 'fthumbs' }); const fl = folderThumbs[f.path].files; for (let k = 0; k < 3; k++) th.append(fl[k] ? thumbBox(fl[k].svg) : h('div', { class: 'thumb' }));
    row.append(h('button', { class: 'hcard fcard', onclick: () => { homeTab = 'folder:' + f.path; loadFolderFiles(f.path); renderHome(); } }, th, h('div', { class: 'hname' }, h('span', { class: 'hic' }, icon('open')), ' ' + f.name), h('div', { class: 'hsub', text: (f.count === 1 ? '1 design' : f.count + ' designs') + ' · ' + ago(f.mtime) })));
  }
  return [h('h2', { text: 'Folders' }), row];
}
const byTime = (list) => [...list].sort((a, b) => (+b.time || 0) - (+a.time || 0));
function recentGrid(list) {
  const stars = readStars(), grid = h('div', { class: 'home-grid' });
  for (const e of list) {
    const on = stars.has(e.id), name = e.title || 'Untitled design';
    grid.append(h('div', { class: 'hcard', tabindex: 0, role: 'button', 'aria-label': 'Open ' + name, onclick: () => openRecent(e), onkeydown: (ev) => { if (ev.key === 'Enter' && ev.target === ev.currentTarget) openRecent(e); } },
      thumbBox(e.svg), h('div', { class: 'hname', text: name }), h('div', { class: 'hsub', text: 'Edited ' + ago(e.time) }),
      h('div', { class: 'hacts' },
        h('button', { class: 'hib hstar' + (on ? ' on' : ''), title: on ? 'Remove star' : 'Star', 'aria-label': on ? 'Remove star' : 'Star', 'aria-pressed': on ? 'true' : 'false', onclick: (ev) => { ev.stopPropagation(); toggleStar(e.id); }, onkeydown: (ev) => ev.stopPropagation() }, icon(on ? 'starfill' : 'star', 20)),
        h('button', { class: 'hib hrm', title: 'Remove from recent', 'aria-label': 'Remove from recent', onclick: (ev) => { ev.stopPropagation(); removeRecent(e.id); }, onkeydown: (ev) => ev.stopPropagation() }, icon('del', 20)))));
  }
  return grid;
}
const empty = (ic, title, sub) => h('div', { class: 'hempty' }, icon(ic, 40), h('div', { class: 'hname', text: title }), h('div', { class: 'hsub', text: sub }));
const secHead = (title, extra) => h('div', { class: 'hsechd' }, h('h2', { text: title }), h('span', { class: 'grow' }), extra || null);
function homeHome() {
  const recent = byTime(readRecent()), more = recent.length > 6;
  return [h('div', { class: 'home-row' },
    newCard('plus', 'New design', 'Start with an empty canvas', () => newBlank()),
    newCard('open', 'Open file', 'A .frameout file from your computer', () => openDoc()),
    newCard('example', 'Example', 'Two linked mobile screens to explore', () => startDesign(sampleDoc()))),
  ...homeFolderCards(),
  secHead('Recent designs', more ? h('button', { class: 'btn text', onclick: () => { homeTab = 'recent'; renderHome(); }, text: 'View all' }) : null),
  recent.length ? recentGrid(recent.slice(0, 6)) : empty('recent', 'No designs yet', 'Designs you work on appear here, with a small picture, and are kept on this computer.')];
}
function homeRecent() {
  const recent = byTime(readRecent());
  return [h('div', { class: 'hsub', style: 'margin:-8px 2px 18px', text: recent.length === 1 ? '1 design, newest first' : recent.length + ' designs, newest first' }),
    recent.length ? recentGrid(recent) : empty('recent', 'No designs yet', 'Designs you work on appear here, with a small picture, and are kept on this computer.')];
}
function homeStarred() {
  const st = readStars(), list = byTime(readRecent().filter((e) => st.has(e.id)));
  return [list.length ? recentGrid(list) : empty('star', 'No starred designs', 'Press the star on a design to keep it here. Starred designs are never dropped from Recent.')];
}
// keyboard shortcuts, the same keys the editor listens for
const SHORTCUTS = [
  ['Tools', [['V', 'Move'], ['H', 'Hand'], ['F', 'Frame'], ['R', 'Rectangle'], ['O', 'Ellipse'], ['L', 'Line'], ['Shift+L', 'Arrow'], ['P', 'Pen'], ['Shift+P', 'Pencil'], ['T', 'Text'], ['Shift+I', 'Image']]],
  ['Edit', [['Ctrl+Z', 'Undo'], ['Ctrl+Y', 'Redo'], ['Ctrl+C', 'Copy'], ['Ctrl+V', 'Paste'], ['Ctrl+D', 'Duplicate'], ['Del', 'Delete'], ['Ctrl+A', 'Select all'], ['Arrows', 'Nudge 1 px'], ['Shift+Arrows', 'Nudge 10 px'], ['Enter', 'Finish pen path'], ['Esc', 'Deselect or close']]],
  ['File and view', [['Ctrl+S', 'Save'], ['Ctrl+O', 'Open'], ['Scroll', 'Pan'], ['Space', 'Hold to pan'], ['Ctrl+Scroll', 'Zoom']]],
];
function showHelp() {
  if (document.querySelector('.modal-back.help')) return;
  const back = h('div', { class: 'modal-back help' }); const close = () => back.remove();
  const cols = h('div', { class: 'keys' }, SHORTCUTS.map(([g, list]) => h('div', { class: 'kgrp' }, h('h3', { text: g }), list.map(([k, what]) => h('div', { class: 'krow' }, h('span', { text: what }), h('span', { class: 'kk' }, k.split('+').map((x) => h('kbd', { text: x }))))))));
  back.append(h('div', { class: 'modal wide', role: 'dialog', 'aria-label': 'Keyboard shortcuts' }, h('h2', { text: 'Keyboard shortcuts' }), cols, h('div', { class: 'frow', style: 'margin:0;justify-content:flex-end' }, h('button', { class: 'btn primary', text: 'Close', onclick: close }))));
  back.addEventListener('pointerdown', (e) => { if (e.target === back) close(); });
  document.body.append(back);
}
function homeTemplates() {
  const grid = h('div', { class: 'home-grid' });
  for (const [name, sub, make] of TEMPLATES) grid.append(h('button', { class: 'hcard', onclick: () => startDesign(make()) }, thumbBox(docThumb(make())), h('div', { class: 'hname', text: name }), h('div', { class: 'hsub', text: sub })));
  if (folderView.key !== 'templates') loadFolderFiles('templates');
  const mine = h('div', { class: 'home-grid' }, folderView.key === 'templates' ? folderView.files.map((f) => fileCard(f, () => startDesign({ id: uid(), title: f.doc.title, items: f.doc.items.map((i) => ({ ...i })), motion: f.doc.motion ? JSON.parse(JSON.stringify(f.doc.motion)) : undefined }), h('div', { class: 'hacts' }, h('button', { class: 'hib hrm', title: 'Remove template', 'aria-label': 'Remove template', onkeydown: (ev) => ev.stopPropagation(), onclick: async (ev) => { ev.stopPropagation(); if (confirm('Remove this template? Your original project file is not touched.')) { try { await window.host.folders.del('templates', f.name); } catch (e) { toast('Could not remove it'); } loadFolderFiles('templates'); } } }, icon('del', 20))))) : []);
  return [h('div', { class: 'muted', style: 'margin:-6px 2px 12px', text: 'Start from a ready layout. Everything in it can be edited.' }), grid,
    h('div', { class: 'frow', style: 'margin-top:26px' }, h('h2', { style: 'margin:0', text: 'My templates' }), h('span', { class: 'grow' }), btn('Add your project', () => importInto('templates'), 'primary')),
    h('div', { class: 'muted', style: 'margin:6px 2px 12px', text: 'Upload a .frameout file and it becomes a template you can start new designs from. A copy is kept inside Frameout.' }),
    folderView.key === 'templates' && !folderView.files.length && !folderView.loading ? h('div', { class: 'muted', style: 'padding:4px 2px', text: 'No templates of your own yet.' }) : mine];
}
function homeSettings() {
  const row = (label, sub, ctl) => h('div', { class: 'srow' }, h('div', {}, h('div', { text: label }), h('div', { class: 'hsub', text: sub })), h('span', { class: 'grow' }), ctl);
  const pick = (opts, cur, fn) => h('div', { class: 'seg' }, opts.map(([v, t]) => h('button', { class: 'btn' + (v === cur ? ' primary' : ''), text: t, onclick: () => { fn(v); renderHome(); } })));
  let bytes = 0; try { bytes = (localStorage.getItem(RECENT_KEY) || '').length; } catch (e) { /* unknown */ }
  const mb = bytes > 1e6 ? (bytes / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(bytes / 1000)) + ' KB';
  return [h('div', { class: 'settings' },
    row('When Frameout opens', 'Show this home screen, or jump back into the design you edited last.', pick([['home', 'Home'], ['last', 'Last design']], getSet('openOn'), (v) => putSet('openOn', v))),
    row('Recent designs to keep', 'More designs use more space on this computer. Older ones drop off first. Starred designs are always kept.', pick([[6, '6'], [12, '12'], [24, '24']], getSet('recentMax'), (v) => { putSet('recentMax', v); writeRecent(keepRecent(readRecent(), v)); })),
    row('Space used by Recent', mb + ' on this computer. Saved .frameout files are not affected.', btn('Clear recent', () => { if (!readRecent().length) return; if (confirm('Remove all designs from Recent, starred ones too? Files you saved are not touched.')) { writeRecent([]); writeStars(new Set()); renderHome(); toast('Recent cleared'); } })),
    row('Privacy', 'Frameout never connects to the internet. Your designs stay on this computer.', h('span')),
    row('About', 'Frameout, part of the Lookout apps. Works fully offline.', h('span')))];
}
// ---------- folders (real folders on this computer) ----------
let folderView = { key: '', files: [], missing: false, loading: false };
async function loadFolders() { try { folders = await window.host.folders.list(); } catch (e) { folders = []; } }
async function loadFolderFiles(key) {
  folderView = { key, files: [], missing: false, loading: true };
  try { const r = await window.host.folders.files(key); folderView = { key, files: r.files.map((f) => parseDesignFile(f)).filter(Boolean), missing: r.missing, loading: false }; } catch (e) { folderView = { key, files: [], missing: true, loading: false }; }
  if (key !== 'templates') delete folderThumbs[key];
  if (homeOpen && homeTab === (key === 'templates' ? 'templates' : 'folder:' + key)) renderHome();
}
function parseDesignFile(f) {
  try { const d = JSON.parse(f.text); if (!d || !Array.isArray(d.items)) return null; const dd = { id: String(d.id || uid()).slice(0, 24), title: String(d.title || f.name.replace(/\.frameout$/i, '')), items: d.items.map(cleanItem), motion: cleanMotion(d.motion) }; return { name: f.name, mtime: f.mtime, doc: dd, svg: docThumb(dd) }; } catch (e) { return null; }
}
function addFolder() {
  const back = h('div', { class: 'modal-back' }); const close = () => back.remove();
  const inp = h('input', { class: 'fname', placeholder: 'Folder name', maxlength: 60, 'aria-label': 'Folder name' });
  const go = h('button', { class: 'btn primary', disabled: true, text: 'Create' });
  const make = async () => { const n = inp.value.trim(); if (!n) return; try { const r = await window.host.folders.create(n); folders = r.list; close(); homeTab = 'folder:' + r.path; loadFolderFiles(r.path); renderHome(); } catch (e) { toast('Could not create the folder'); } };
  inp.addEventListener('input', () => { go.disabled = !inp.value.trim(); });
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') make(); if (e.key === 'Escape') close(); });
  go.onclick = make;
  back.append(h('div', { class: 'modal', role: 'dialog', 'aria-label': 'New folder' }, h('h2', { text: 'New folder' }), h('div', { class: 'muted', text: 'A folder is a category for your designs, like Website or Mobile app.' }), inp, h('div', { class: 'frow', style: 'margin:0;justify-content:flex-end' }, h('button', { class: 'btn', text: 'Cancel', onclick: close }), go)));
  back.addEventListener('pointerdown', (e) => { if (e.target === back) close(); });
  document.body.append(back); inp.focus();
}
async function removeFolder(p) { const fo = folders.find((x) => x.path === p); if (!confirm('Delete the folder "' + (fo ? fo.name : '') + '" and the designs in it? They go to the Recycle Bin.')) return; folders = await window.host.folders.remove(p); homeTab = 'home'; renderHome(); }
async function importInto(key) { try { const n = await window.host.folders.import(key); if (n) toast(n === 1 ? 'Added 1 file' : 'Added ' + n + ' files'); } catch (e) { toast('Could not add files'); } loadFolderFiles(key); }
function openFromFolder(key, folderName, f) { const d = { id: f.doc.id, title: f.doc.title, items: f.doc.items.map((i) => ({ ...i })), motion: f.doc.motion }; startDesign(d, { key, name: f.name, folder: folderName }); }
async function newInFolder(key, folderName, d) { const bytes = new TextEncoder().encode(JSON.stringify(d, null, 1)); try { const n = await window.host.folders.save(key, d.title + '.frameout', bytes, false); fileBind = { key, name: n, folder: folderName }; savedSnap = fileSnap(); } catch (e) { toast('Could not save into the folder'); } }
function fileCard(f, fn, extra) { return h('div', { class: 'hcard', tabindex: 0, role: 'button', onclick: fn, onkeydown: (ev) => { if (ev.key === 'Enter') fn(); } }, thumbBox(f.svg), h('div', { class: 'hname', text: f.doc.title }), h('div', { class: 'hsub', text: f.name + ' · ' + ago(f.mtime) }), extra || null); }
function homeFolder(key) {
  const fo = folders.find((x) => x.path === key);
  if (!fo) return [h('div', { class: 'muted', text: 'This folder is not in your list any more.' })];
  if (folderView.key !== key) { loadFolderFiles(key); return [h('div', { class: 'muted', text: 'Loading…' })]; }
  const grid = h('div', { class: 'home-grid' }, folderView.files.map((f) => fileCard(f, () => openFromFolder(key, fo.name, f))));
  return [h('div', { class: 'frow' }, h('span', { class: 'muted', text: folderView.files.length === 1 ? '1 design' : folderView.files.length + ' designs' }), h('span', { class: 'grow' }), btn('Delete folder', () => removeFolder(key))),
    folderView.loading ? h('div', { class: 'muted', text: 'Loading…' }) : folderView.missing ? h('div', { class: 'muted', text: 'This folder cannot be found. It may have been moved or deleted.' }) : folderView.files.length ? grid : h('div', { class: 'muted', style: 'padding:8px 2px', text: 'Nothing here yet. Press New design to make the first one.' })];
}
function renderHome() {
  home.textContent = '';
  // drawer categories (ruling): Home, Recent, Starred, Templates; Settings and Help pinned at the bottom
  const tabs = [['home', 'Home', 'home'], ['recent', 'Recent', 'recent'], ['starred', 'Starred', 'star'], ['templates', 'Templates', 'templates']];
  if (!['home', 'recent', 'starred', 'templates', 'settings'].includes(homeTab) && !(FOLDERS_UI && homeTab.startsWith('folder:'))) homeTab = 'home';
  const shut = getSet('sideShut');
  const tab = (id, name, ic) => h('button', { class: 'htab' + (homeTab === id ? ' on' : ''), title: name, 'aria-current': homeTab === id ? 'page' : null, onclick: () => { homeTab = id; renderHome(); } }, h('span', { class: 'hic' }, icon(homeTab === id && ic === 'star' ? 'starfill' : ic)), h('span', { class: 'hlabel', text: name }));
  const side = h('nav', { class: 'home-side' + (shut ? ' shut' : ''), 'aria-label': 'Frameout home' },
    h('div', { class: 'home-logo' }, h('button', { class: 'htab hbar', title: shut ? 'Open sidebar' : 'Close sidebar', 'aria-label': 'Toggle sidebar', onclick: () => { putSet('sideShut', !shut); renderHome(); } }, h('span', { class: 'hic' }, icon('menu'))), h('img', { class: 'hlabel hmark', src: 'brand.svg', alt: '' }), h('span', { class: 'hlabel', text: 'Frameout' })),
    h('button', { class: 'hnew', title: 'New design', 'aria-label': 'New design', onclick: () => newBlank() }, icon('plus', 24), h('span', { class: 'hlabel', text: 'New design' })),
    session ? h('button', { class: 'htab hback', title: 'Back to design', onclick: closeHome }, h('span', { class: 'hic' }, icon('back')), h('span', { class: 'hlabel', text: 'Back to design' })) : null,
    h('div', { class: 'hnav' }, tabs.map(([id, name, ic]) => tab(id, name, ic))),
    ...(FOLDERS_UI ? [    h('div', { class: 'hsec' }, h('span', { class: 'hlabel', text: 'Folders' }), h('button', { class: 'hplus', title: 'New folder', 'aria-label': 'New folder', onclick: addFolder }, icon('plus', 16))),
    h('div', { class: 'hfolders' }, folders.map((f) => h('button', { class: 'htab' + (homeTab === 'folder:' + f.path ? ' on' : ''), title: f.path, onclick: () => { homeTab = 'folder:' + f.path; loadFolderFiles(f.path); renderHome(); } }, h('span', { class: 'hic' }, icon('open')), h('span', { class: 'hlabel', text: f.name })))), 
    shut ? h('button', { class: 'htab', title: 'New folder', onclick: addFolder }, h('span', { class: 'hic' }, icon('folderplus'))) : (folders.length ? h('span') : h('button', { class: 'htab', onclick: addFolder }, h('span', { class: 'hic' }, icon('folderplus')), h('span', { class: 'hlabel', text: 'New folder' })))] : []),
    h('span', { class: 'grow' }),
    h('div', { class: 'hnav hfoot' }, tab('settings', 'Settings', 'settings'), h('button', { class: 'htab', title: 'Help', onclick: () => showHelp() }, h('span', { class: 'hic' }, icon('help')), h('span', { class: 'hlabel', text: 'Help' }))));
  const isF = FOLDERS_UI && homeTab.startsWith('folder:'), fkey = isF ? homeTab.slice(7) : '', fo = isF ? folders.find((x) => x.path === fkey) : null;
  const body = homeTab === 'templates' ? homeTemplates() : homeTab === 'settings' ? homeSettings() : homeTab === 'recent' ? homeRecent() : homeTab === 'starred' ? homeStarred() : isF ? homeFolder(fkey) : homeHome();
  const TITLES = { home: 'Welcome to Frameout', recent: 'Recent', starred: 'Starred', templates: 'Templates', settings: 'Settings' };
  const head = h('div', { class: 'home-head' + (homeTab === 'home' ? ' hero' : '') }, h('div', {}, h('h1', { text: isF ? (fo ? fo.name : 'Folder') : TITLES[homeTab] }),
    homeTab === 'home' ? h('div', { class: 'hlead', text: 'Design screens, link them into a prototype and bring them to life with motion.' }) : null),
    h('span', { class: 'grow' }), isF && fo ? btn('New design', () => newBlank({ key: fkey, name: fo.name }), 'primary') : null);
  home.append(side, h('div', { class: 'home-main' }, h('div', { class: 'home-in' }, head, ...body)));
}
const SIZES = [
  ['Phone', [['iPhone', 393, 852], ['Android', 360, 800], ['Small phone', 320, 568]]],
  ['Tablet', [['iPad portrait', 768, 1024], ['iPad landscape', 1024, 768]]],
  ['Desktop (PC)', [['Desktop', 1440, 1024], ['Laptop', 1280, 800], ['Wireframe', 1024, 768]]],
  ['Social', [['Instagram post', 1080, 1080], ['Instagram portrait', 1080, 1350], ['Instagram story', 1080, 1920], ['YouTube thumbnail', 1280, 720], ['Facebook cover', 820, 312]]],
  ['Canvas', [['Blank canvas', 0, 0]]]];
setInterval(autosave, 3000); window.addEventListener('pagehide', autosave);
buildDock(); setTool('select'); render(); loadFolders().then(() => { if (homeOpen) renderHome(); }); showHome();
if (getSet('openOn') === 'last') { const r = readRecent()[0]; if (r) openRecent(r); }
window.addEventListener('resize', () => applyView());
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', async (e) => {
  e.preventDefault();
  const f = [...(e.dataTransfer?.files || [])].find((x) => /\.(frameout|json)$/i.test(x.name)); if (!f) { toast('Drop a .frameout file to open it'); return; }
  openDoc({ name: f.name, data: new Uint8Array(await f.arrayBuffer()) });
});

let savedSnap = null;
setTimeout(() => { if (savedSnap === null) savedSnap = fileSnap(); }, 0);
// an empty design is not held back: there is nothing to lose, and autosave keeps no copy of it in Recent
window.addEventListener('beforeunload', (e) => {
  if (savedSnap !== null && doc.items.length && fileSnap() !== savedSnap) {
    autosave(); // keep the latest changes in Recent, and tell the close question whether that worked
    try { window.host.closeNote(!recentOk || !doc.items.length); } catch (err) { /* older shell */ }
    e.preventDefault(); e.returnValue = '';
  }
});
