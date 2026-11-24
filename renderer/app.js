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
const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
  templates: '<rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="5" rx="2"/><rect x="13" y="11" width="8" height="10" rx="2"/><rect x="3" y="14" width="8" height="7" rx="2"/>',
  settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  back: '<path d="M10 6l-6 6 6 6M4 12h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  folderplus: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 11v5M9.5 13.5h5"/>',
  open: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  example: '<rect x="3" y="4" width="7" height="14" rx="2"/><rect x="14" y="6" width="7" height="14" rx="2"/><path d="M10 11h4"/>',
};
const icon = (name, size = 18) => { const s = sv('svg', { viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }); const d = new DOMParser().parseFromString('<svg xmlns="' + NS + '">' + ICONS[name] + '</svg>', 'image/svg+xml').documentElement; for (const n of [...d.childNodes]) s.append(document.importNode(n, true)); return s; };
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
function commit() { undoS.push(snapshot()); if (undoS.length > 100) undoS.shift(); redoS = []; }
function undo() { if (!undoS.length) return; redoS.push(snapshot()); doc = JSON.parse(undoS.pop()); sel.clear(); render(); }
function redo() { if (!redoS.length) return; undoS.push(snapshot()); doc = JSON.parse(redoS.pop()); sel.clear(); render(); }
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
      for (const k of COPY) o[k] = mc[k]; if (!o.ov) o.text = mc.text; o.type = mc.type; o.name = mc.name;
      o.x = root.x + (mc.x - m.x); o.y = root.y + (mc.y - m.y); o.instOf = mc.id; o.instRoot = root.id; delete o.master; delete o.inst;
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
const titleInput = h('input', { type: 'text', class: 'tbtitle', maxlength: 80, title: 'Design name', 'aria-label': 'Design name', placeholder: 'Untitled design', oninput: (e) => { doc.title = e.target.value; }, onchange: (e) => { if (!e.target.value.trim()) { doc.title = 'Untitled design'; e.target.value = doc.title; } }, onkeydown: (e) => { e.stopPropagation(); if (e.key === 'Enter') e.target.blur(); } });
toolbar.append(btn('Home', () => showHome('home')), btn('New', newDoc), btn('Open', openDoc), btn('Save', saveDoc, 'primary'));
toolbar.append(h('span', { class: 'grow' }), titleInput,
  btn('Preview', startPreview), btn('Export PNG', () => exportImg('png')), btn('Export SVG', () => exportImg('svg')));
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
const DOCK_ICONS = {
  select: '<path d="M5 3l14 7-6 2-2 6z"/>',
  hand: '<path d="M8 13V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3l-2-4a1.5 1.5 0 0 1 2.4-1.7L8 14"/>',
  frame: '<path d="M7 3v18M17 3v18M3 7h18M3 17h18"/>',
  rect: '<rect x="4" y="5" width="16" height="14" rx="2"/>',
  ellipse: '<circle cx="12" cy="12" r="8"/>',
  line: '<path d="M5 19L19 5"/>',
  arrow: '<path d="M5 19L19 5M9 5h10v10"/>',
  polygon: '<path d="M12 4l9 16H3z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  pen: '<path d="M12 21l-6-8 3-9h6l3 9z"/><circle cx="12" cy="11" r="1.5"/><path d="M12 12.5V21"/>',
  pencil: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
  text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-8 8"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H10a6 6 0 0 0 0 12h3"/>',
  dupe: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  del: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/>',
  comp: '<path d="M12 3l4 4-4 4-4-4zM12 13l4 4-4 4-4-4zM3 8l4 4-4 4M21 8l-4 4 4 4"/>',
  zout: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8 11h6"/>',
  zin: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5M8 11h6M11 8v6"/>',
  fit: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  keyf: '<path d="M12 4l7 8-7 8-7-8z"/>',
  caret: '<path d="M7 10l5 5 5-5"/>',
  m_draw: '<path d="M4 18c3-9 5 3 8-4s5-6 8-8"/>',
  m_design: '<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4z"/><path d="M16.5 13v7M13 16.5h7"/>',
  m_motion: '<path d="M3 6h18M3 12h11M3 18h6"/><circle cx="19" cy="12" r="2"/>',
  m_dev: '<path d="M8 8l-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
};
const dockIcon = (k, size = 18) => { const ico = sv('svg', { viewBox: '0 0 24 24', width: size, height: size, fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }); for (const n of [...new DOMParser().parseFromString('<svg xmlns="' + NS + '">' + DOCK_ICONS[k] + '</svg>', 'image/svg+xml').documentElement.childNodes]) ico.append(document.importNode(n, true)); return ico; };
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
function closeFly() { if (fly) { fly.remove(); fly = null; } }
function toolLabel(k) { for (const g in GROUPS) for (const t of GROUPS[g]) if (t[0] === k) return t; return [k, k, '']; }
function pickTool(k) { closeFly(); if (k === 'image') pickImages(); else setTool(k); }
function openFly(g, anchor) {
  const was = fly && fly.dataset.g === g; closeFly(); if (was) return;
  fly = h('div', { class: 'fly', role: 'menu', 'data-g': g });
  for (const [k, label, key] of (grpEls[g] ? grpEls[g].list : GROUPS[g])) fly.append(h('button', { class: 'fi', role: 'menuitem', title: label, onclick: () => pickTool(k) }, h('span', { class: 'fck', text: k === grpCur[g] ? '✓' : '' }), dockIcon(k), h('span', { class: 'fl', text: label }), h('span', { class: 'fk', text: key })));
  const r = anchor.getBoundingClientRect(), sr = stage.getBoundingClientRect();
  fly.style.left = Math.max(8, r.left - sr.left - 6) + 'px'; fly.style.bottom = (sr.bottom - r.top + 8) + 'px';
  stage.append(fly);
}
document.addEventListener('pointerdown', (e) => { if (fly && !fly.contains(e.target) && !e.target.closest('.dkc')) closeFly(); }, true);
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
  const zoomG = actGroup([['zout', 'Zoom out', '', () => zoomBy(1 / 1.2)], ['zin', 'Zoom in', '', () => zoomBy(1.2)], ['fit', 'Fit to screen', '', () => fit()]]);
  const wrap = (...els) => { const d = h('div', { class: 'dg' }); els.forEach((e) => d.append(e)); return d; };
  if (mode === 'design') dock.append(wrap(toolGroup('move'), toolGroup('frame'), toolGroup('shape'), toolGroup('pen'), toolGroup('text')), edit, actGroup([['comp', 'Create component', '', compFn], ['zout', 'Zoom out', '', () => zoomBy(1 / 1.2)], ['zin', 'Zoom in', '', () => zoomBy(1.2)], ['fit', 'Fit to screen', '', () => fit()]]), actGroup([['play', 'Preview', '', () => startPreview()]]));
  else if (mode === 'draw') dock.append(wrap(toolGroup('move'), toolGroup('pen'), toolGroup('shape', ['image'])), edit, zoomG);
  else if (mode === 'motion') dock.append(wrap(toolGroup('move')), actGroup([['undo', 'Undo', 'Ctrl+Z', () => undo()], ['redo', 'Redo', 'Ctrl+Y', () => redo()]]), zoomG);
  else dock.append(wrap(toolGroup('move')), zoomG);
  const md = h('div', { class: 'dg modes', role: 'group', 'aria-label': 'Mode' }); for (const [m, label, ic] of MODES) md.append(h('button', { class: 'dk' + (m === mode ? ' on' : ''), title: label, 'aria-label': label, 'aria-pressed': m === mode ? 'true' : 'false', 'data-mode': m, onclick: () => setMode(m) }, dockIcon(ic)));
  dock.append(md); refreshDock();
}
function refreshDock() {
  for (const g in grpEls) { const { main, list } = grpEls[g]; const k = grpCur[g], [, label, key] = toolLabel(k); main.textContent = ''; main.append(dockIcon(k)); main.title = label + (key ? ' (' + key + ')' : ''); main.setAttribute('aria-label', label); main.classList.toggle('on', tool === k && list.some((t) => t[0] === k)); }
}
stage.append(dock);
function setTool(t) {
  if (pen && t !== 'pen') penFinish(false);
  tool = t; for (const g in GROUPS) if (GROUPS[g].some((x) => x[0] === t)) grpCur[g] = t;
  refreshDock(); svg.style.cursor = t === 'select' ? 'default' : t === 'hand' ? 'grab' : 'crosshair';
}

const svg = sv('svg', { width: '100%', height: '100%', style: 'display:block;touch-action:none;background:#1c1c1c' });
const world = sv('g'); const gItems = sv('g'), gUI = sv('g');
world.append(gItems, gUI); svg.append(world); stage.append(svg);
const toW = (e) => { const r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left - panX) / zoom, y: (e.clientY - r.top - panY) / zoom }; };
function applyView() { world.setAttribute('transform', `translate(${panX} ${panY}) scale(${zoom})`); renderStatus(); }
function zoomBy(f, cx, cy) { const r = svg.getBoundingClientRect(); cx = cx ?? r.width / 2; cy = cy ?? r.height / 2; const nz = clamp(zoom * f, 0.05, 8); panX = cx - (cx - panX) * (nz / zoom); panY = cy - (cy - panY) * (nz / zoom); zoom = nz; render(); }
function fit() {
  const r = svg.getBoundingClientRect();
  if (!doc.items.length) { zoom = 0.5; panX = r.width / 2; panY = r.height / 2; render(); return; }
  const x0 = Math.min(...doc.items.map((i) => i.x)), y0 = Math.min(...doc.items.map((i) => i.y)), x1 = Math.max(...doc.items.map((i) => i.x + i.w)), y1 = Math.max(...doc.items.map((i) => i.y + i.h));
  zoom = clamp(Math.min((r.width - 80) / (x1 - x0), (r.height - 80) / (y1 - y0)), 0.05, 2);
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
  if (document.activeElement !== titleInput) titleInput.value = doc.title || '';
  syncInstances(); applyLayouts();
  gItems.textContent = ''; gUI.textContent = '';
  for (const i of doc.items) gItems.append(itemEl(i));
  for (const id of sel) {
    const i = get(id); if (!i) continue;
    const ol = sv('rect', { x: i.x, y: i.y, width: i.w, height: i.h, fill: 'none', stroke: '#e6e6e6', 'stroke-width': 1.2 / zoom, 'pointer-events': 'none' }); if (i.rot && i.type !== 'frame') ol.setAttribute('transform', `rotate(${i.rot} ${i.x + i.w / 2} ${i.y + i.h / 2})`); gUI.append(ol);
  }
  if (mode === 'dev') {
    for (const i of doc.items) if (i.rd && !i.hidden) gUI.append(sv('circle', { cx: i.x + i.w, cy: i.y, r: 7 / zoom, fill: '#3ecf8e', stroke: '#0b2a1c', 'stroke-width': 1 / zoom, 'pointer-events': 'none' }));
    if (sel.size === 1) { const d = get([...sel][0]); if (d) devGuides(d); }
  }
  if (sel.size === 1 && mode !== 'dev') {
    const i = get([...sel][0]);
    if (i && !i.locked && !(i.rot && i.type !== 'frame')) {
      const pts = i.type === 'line' ? { a: [i.x, i.y], b: [i.x + i.w, i.y + i.h] } : { nw: [i.x, i.y], n: [i.x + i.w / 2, i.y], ne: [i.x + i.w, i.y], e: [i.x + i.w, i.y + i.h / 2], se: [i.x + i.w, i.y + i.h], s: [i.x + i.w / 2, i.y + i.h], sw: [i.x, i.y + i.h], w: [i.x, i.y + i.h / 2] };
      const cur = { nw: 'nwse', se: 'nwse', ne: 'nesw', sw: 'nesw', n: 'ns', s: 'ns', e: 'ew', w: 'ew', a: 'move', b: 'move' };
      for (const [k, [px, py]] of Object.entries(pts)) { const r = sv('rect', { x: px - 4 / zoom, y: py - 4 / zoom, width: 8 / zoom, height: 8 / zoom, fill: '#ffffff', stroke: '#222', 'stroke-width': 1 / zoom, style: `cursor:${cur[k]}${cur[k].length < 5 ? '-resize' : ''}` }); r.dataset.handle = k; gUI.append(r); }
    }
  }
  applyView(); renderLeft(); renderRight(); if (!noTl) renderTimeline();
}
function renderStatus() { status.textContent = ''; status.append(h('span', { text: fileName || 'Untitled' }), h('span', { class: 'grow' }), h('span', { text: doc.items.length + ' layers' }), h('span', { text: Math.round(zoom * 100) + '%' })); }
function renderLeft() {
  left.textContent = '';
  left.append(h('h3', { text: 'Layers' }));
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
function renderRight() {
  right.textContent = '';
  if (mode === 'dev') { right.append(h('h3', { text: 'Design' })); renderDev(); return; }
  right.append(h('h3', { text: 'Design' }), h('label', { class: 'field' }, 'Title', h('input', { type: 'text', value: doc.title, oninput: (e) => { doc.title = e.target.value; } })));
  const items = [...sel].map(get).filter(Boolean); if (!items.length) { right.append(h('h3', { text: 'Tips' }), h('div', { class: 'muted', style: 'font-size:12px;line-height:1.6;white-space:pre-line', text: 'Pick a tool or press its letter, then drag on the canvas.\nShift-click to select several.\nScroll to pan, Ctrl+scroll to zoom, hold Space to pan.\nGive a shape a Link to a frame, then press Preview to click through your prototype.' })); return; }
  const i = items[0];
  let nameUndo = false;
  const num = (label, key) => h('label', { class: 'field' }, label, h('input', { type: 'number', value: Math.round(i[key] * 10) / 10, style: 'width:100%', onchange: (e) => { const v = +e.target.value; if (!isNaN(v)) { commit(); items.forEach((it) => { if (['w', 'h'].includes(key)) it[key] = Math.max(1, v); else it[key] = v; }); autoKeyFor(items); render(); } } }));
  right.append(h('h3', { text: 'Layout' }), h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:6px' }, num('X', 'x'), num('Y', 'y'), num('W', 'w'), num('H', 'h')));
  right.append(h('label', { class: 'field' }, 'Name', h('input', { type: 'text', value: i.name, oninput: (e) => { if (!nameUndo) { commit(); nameUndo = true; } i.name = e.target.value; renderLeft(); } })));
  if (i.type !== 'line') {
    right.append(h('h3', { text: i.type === 'text' ? 'Text color' : 'Fill' }), h('div', { class: 'swatches' }, FILLS.map((c) => h('button', { style: `background:${c}`, onclick: () => { commit(); items.forEach((it) => { it.fill = c; }); render(); } }))));
  }
  right.append(h('h3', { text: 'Stroke' }), h('div', { class: 'swatches' }, ['#000000', '#4a4a4a', '#8a8a8a', '#e4e4e4', '#ffffff'].map((c) => h('button', { style: `background:${c}`, onclick: () => { commit(); items.forEach((it) => { it.stroke = c; if (!it.sw) it.sw = 1; }); render(); } }))));
  right.append(h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:6px' }, num('Stroke width', 'sw'), i.type === 'rect' || i.type === 'frame' ? num('Corner radius', 'r') : h('span')));
  const op = h('input', { type: 'range', min: 5, max: 100, value: Math.round(i.op * 100), oninput: () => { items.forEach((it) => (it.op = op.value / 100)); renderItemsOnly(); } }); op.addEventListener('pointerdown', commit); op.addEventListener('change', () => { autoKeyFor(items); render(); });
  right.append(h('h3', { text: 'Opacity' }), op);
  const chk = (label, on, fn) => h('label', { class: 'field', style: 'flex-direction:row;gap:6px;align-items:center' }, h('input', { type: 'checkbox', checked: !!on, onchange: (e) => { commit(); fn(e.target.checked); render(); } }), label);
  const numTo = (label, val, fn, step) => h('label', { class: 'field' }, label, h('input', { type: 'number', step: step || 1, value: Math.round(val * 100) / 100, style: 'width:100%', onchange: (e) => { const v = +e.target.value; if (!isNaN(v)) { commit(); fn(v); autoKeyFor(items); render(); } } }));
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
    right.append(h('h3', { text: 'Text' }), ta, num('Font size', 'fs'));
    if (focusText) { focusText = false; setTimeout(() => { const t = right.querySelector('textarea'); if (t) { t.focus(); t.select(); } }, 80); }
    right.lastChild.querySelector('input').addEventListener('change', () => { const lines = i.text.split('\n'); i.h = lines.length * i.fs * 1.25 + 4; render(); });
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
      h('label', { class: 'field' }, 'Gap', h('input', { type: 'number', value: al.gap, style: 'width:100%', onchange: (e) => set({ gap: Math.max(0, +e.target.value || 0) }) })),
      h('label', { class: 'field' }, 'Padding', h('input', { type: 'number', value: al.pad, style: 'width:100%', onchange: (e) => set({ pad: Math.max(0, +e.target.value || 0) }) }))),
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
  const c = JSON.parse(JSON.stringify(doc)); for (const id of Object.keys(c.motion.tracks)) { const it = c.items.find((x) => x.id === id), k = c.motion.tracks[id]; if (it && k.length) { const p = poseOf(k, 0); for (const key of KEYS) it[key] = p[key]; } } return c;
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
  tl.append(h('div', { class: 'tlh' }, play, time, h('label', { class: 'tlf' }, 'Duration (s)', h('input', { type: 'number', min: 0.2, max: 60, step: 0.5, value: m.dur / 1000, style: 'width:64px', onchange: (ev) => { const v = +ev.target.value; if (!(v >= 0.2 && v <= 60)) { ev.target.value = m.dur / 1000; return; } commit(); const mm = doc.motion || (doc.motion = { dur: 2000, loop: false, tracks: {} }); mm.dur = Math.round(v * 1000); if (playhead > mm.dur) playhead = mm.dur; render(); } })),
    h('label', { class: 'tlf' }, h('input', { type: 'checkbox', 'aria-label': 'Auto keyframe', checked: autoKey, onchange: (ev) => { autoKey = ev.target.checked; } }), 'Auto keyframe'), h('label', { class: 'tlf' }, h('input', { type: 'checkbox', checked: !!m.loop, onchange: (ev) => { commit(); const mm = doc.motion || (doc.motion = { dur: 2000, loop: false, tracks: {} }); mm.loop = ev.target.checked; } }), 'Loop'), h('span', { class: 'tlf' }, 'Easing', ease), btn('Add keyframe', addKey, 'primary'), btn('Delete keyframe', delKey)), range,
    h('div', { class: 'tracks' }, tracks.length ? tracks : h('div', { class: 'muted', style: 'padding:6px 4px;font-size:12px', text: 'Select a layer, put the playhead on a time, press Add keyframe. Move the playhead, change the layer (position, size, rotation or opacity) and add another keyframe.' })));
  tlRefs = { time, range, play, phs }; updateTl();
}
function setMode(m) {
  if (m === mode) return; if (pen) penFinish(false); if (playing) stopPlay();
  if (mode === 'motion') { playhead = 0; applyPose(0); }
  mode = m; closeFly(); buildDock(); setTool(m === 'draw' ? 'pen' : 'select'); sel.clear(); render();
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
function svgOfItem(i) { const g = itemEl(i, true), root = sv('svg', { xmlns: NS, width: i.w || 1, height: i.h || 1, viewBox: `${i.x} ${i.y} ${i.w || 1} ${i.h || 1}` }); root.append(g); return new XMLSerializer().serializeToString(root); }
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
function order(how) {
  const ids = doc.items.filter((i) => sel.has(i.id)); if (!ids.length) return; commit();
  const rest = doc.items.filter((i) => !sel.has(i.id));
  if (how === 'front') doc.items = [...rest, ...ids]; else if (how === 'back') doc.items = [...ids, ...rest];
  else { const idx = doc.items.indexOf(ids[0]); const t = clamp(idx + (how === 'up' ? 1 : -1), 0, doc.items.length - ids.length); doc.items = rest; doc.items.splice(t, 0, ...ids); }
  render();
}
function align(a) {
  const it = [...sel].map(get).filter(Boolean); if (it.length < 2) return; commit();
  const x0 = Math.min(...it.map((i) => i.x)), x1 = Math.max(...it.map((i) => i.x + i.w)), y0 = Math.min(...it.map((i) => i.y)), y1 = Math.max(...it.map((i) => i.y + i.h));
  for (const i of it) { if (a === 'left') i.x = x0; else if (a === 'right') i.x = x1 - i.w; else if (a === 'center') i.x = (x0 + x1) / 2 - i.w / 2; else if (a === 'top') i.y = y0; else if (a === 'bottom') i.y = y1 - i.h; else if (a === 'middle') i.y = (y0 + y1) / 2 - i.h / 2; }
  render();
}
function del() {
  if (!sel.size) return; commit(); const ids = expand(sel);
  for (const id of ids) { const x = get(id); if (x && x.master) for (const c of doc.items.filter((y) => y.inst === id)) detach(c.id); if (x && x.inst) doc.items = doc.items.filter((y) => y.instRoot !== id); }
  doc.items = doc.items.filter((i) => !ids.has(i.id)); for (const i of doc.items) if (ids.has(i.go)) i.go = ''; sel.clear(); render();
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
  svg.setPointerCapture(ev.pointerId);
  if (ev.button === 1 || spaceDown || tool === 'hand') { drag = { mode: 'pan', sx: ev.clientX, sy: ev.clientY, px: panX, py: panY }; return; }
  const p = toW(ev);
  if (playing) { stopPlay(); return; }
  if (tool === 'pen') { penAdd(p); return; }
  if (tool === 'pencil') { commit(); const it = makeItem('path', p.x, p.y, 1, 1); it.sm = true; it.pts = [[0, 0]]; doc.items.push(it); sel = new Set([it.id]); drag = { mode: 'pencil', it, abs: [[p.x, p.y]] }; render(); return; }
  const hd = mode === 'dev' ? null : ev.target.dataset.handle;
  if (hd) { const i = get([...sel][0]); commit(); drag = { mode: 'resize', hd, i, o: { ...i }, p }; return; }
  if (tool !== 'select' && mode !== 'dev') { commit(); const ty = tool === 'arrow' ? 'line' : tool; const it = makeItem(ty, p.x, p.y, 1, 1); if (tool === 'arrow') { it.ah = true; it.name = 'Arrow ' + (doc.items.filter((x) => x.type === 'line' && x.ah).length + 1); } if (tool === 'text') { it.w = 80; } doc.items.push(it); sel = new Set([it.id]); drag = { mode: 'draw', i: it, p, tool: ty }; render(); return; }
  const node = ev.target.closest('[data-id]');
  let id = node ? node.dataset.id : null; let it = id && get(id);
  if (it && it.locked) { it = null; }
  if (it && it.type === 'frame' && !ev.target.dataset.title) {
    // clicking inside a frame selects a child if there is one under the pointer, else the frame only via its title
    const child = [...doc.items].reverse().find((c) => c !== it && c.type !== 'frame' && !c.hidden && !c.locked && p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h);
    if (child) it = child;
  }
  if (it && mode === 'dev') { sel = new Set([it.id]); render(); return; }
  if (mode === 'dev') { sel.clear(); render(); return; }
  if (it) {
    if (ev.shiftKey) { sel.has(it.id) ? sel.delete(it.id) : sel.add(it.id); } else if (!sel.has(it.id)) sel = new Set([it.id]);
    const moving = [];
    for (const id2 of sel) { const m = get(id2); moving.push(m); if (m.type === 'frame') doc.items.filter((c) => inside(c, m) && !sel.has(c.id)).forEach((c) => moving.push(c)); }
    commit(); drag = { mode: 'move', p, orig: [...new Set(moving)].map((m) => ({ m, x: m.x, y: m.y })), moved: false }; render();
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
      for (const o of drag.orig) { bx0 = Math.min(bx0, o.x); by0 = Math.min(by0, o.y); bx1 = Math.max(bx1, o.x + o.m.w); by1 = Math.max(by1, o.y + o.m.h); }
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
function renderLite() { renderItemsOnly(); render(); }
svg.addEventListener('pointerup', () => {
  if (!drag) return; const d = drag; drag = null;
  if ((d.mode === 'move' && d.moved) || d.mode === 'resize') autoKeyFor([...sel].map(get));
  if (d.mode === 'pencil') { if (d.abs.length < 2) { doc.items = doc.items.filter((x) => x !== d.it); undoS.pop(); sel.clear(); } setTool('select'); render(); return; }
  if (d.mode === 'draw') {
    const i = d.i;
    if (d.tool === 'text') { i.w = 80; i.h = 24; focusText = true; }
    else if ((d.tool !== 'line' && (i.w < 4 || i.h < 4)) || (d.tool === 'line' && Math.abs(i.w) + Math.abs(i.h) < 4)) { if (d.tool === 'line') { i.w = 120; i.h = 0; } else { i.w = d.tool === 'frame' ? 375 : 120; i.h = d.tool === 'frame' ? 667 : d.tool === 'polygon' || d.tool === 'star' ? 120 : 80; } }
    setTool('select'); render();
  } else if (d.mode === 'move' && !d.moved) { undoS.pop(); render(); }
  else if (d.mode === 'marquee') { d.r.remove(); if (d.box && d.box.w > 3) for (const i of doc.items) if (!i.hidden && i.x < d.box.x + d.box.w && i.x + i.w > d.box.x && i.y < d.box.y + d.box.h && i.y + i.h > d.box.y && i.type !== 'frame') sel.add(i.id); render(); }
  else render();
});
svg.addEventListener('wheel', (ev) => { ev.preventDefault(); const r = svg.getBoundingClientRect(); if (ev.ctrlKey || ev.metaKey) zoomBy(ev.deltaY < 0 ? 1.1 : 1 / 1.1, ev.clientX - r.left, ev.clientY - r.top); else { panX -= ev.deltaX; panY -= ev.deltaY; applyView(); } }, { passive: false });
document.addEventListener('keydown', (e) => {
  if (homeOpen) { if (e.key === 'Escape' && session && !document.querySelector('.modal-back')) closeHome(); return; }
  if (preview) { if (e.key === 'Escape') endPreview(); else if (e.key === 'Backspace' || e.key === 'ArrowLeft') previewBack(); return; }
  if (e.target.matches('input,textarea,select')) return;
  if (document.querySelector('.modal-back') || (!e.ctrlKey && !e.metaKey && e.target.matches('button,[contenteditable]'))) return;
  const k = e.key.toLowerCase();
  if (e.code === 'Space') { spaceDown = true; e.preventDefault(); }
  else if (e.ctrlKey && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (e.ctrlKey && k === 'y') { e.preventDefault(); redo(); }
  else if (e.ctrlKey && k === 'd') { e.preventDefault(); dupe(); }
  else if (e.ctrlKey && k === 's') { e.preventDefault(); saveDoc(); }
  else if (e.ctrlKey && k === 'o') { e.preventDefault(); openDoc(); }
  else if (e.ctrlKey && k === 'a') { e.preventDefault(); sel = new Set(doc.items.map((i) => i.id)); render(); }
  else if (e.ctrlKey && k === 'c') { if (sel.size) { const ex = expand(sel); clip = JSON.stringify({ items: doc.items.filter((i) => ex.has(i.id) && !i.instOf), roots: [...sel], off: copyOffset(sel) }); toast('Copied'); } }
  else if (e.ctrlKey && k === 'v') { if (!clip) return; commit(); const c = JSON.parse(clip), map = new Map(); sel.clear(); for (const i of c.items) { const o = i.id; i.id = uid(); i.x += (c.off || [24, 24])[0]; i.y += (c.off || [24, 24])[1]; delete i.master; map.set(o, i); } for (const i of map.values()) { if (map.has(i.go)) i.go = map.get(i.go).id; doc.items.push(i); } for (const r of c.roots) if (map.has(r)) sel.add(map.get(r).id); render(); }
  else if (e.shiftKey && k === 'i') { pickImages(); }
  else if (e.key === 'Delete' || e.key === 'Backspace') del();
  else if (e.key === 'Enter' && pen) { penFinish(false); }
  else if (e.key === 'Escape') { if (fly) { closeFly(); return; } if (pen) { penFinish(false); return; } sel.clear(); setTool('select'); render(); }
  else if (e.key.startsWith('Arrow') && sel.size) { e.preventDefault(); const d = e.shiftKey ? 10 : 1; commit(); doc.items.filter((i) => sel.has(i.id)).forEach((i) => { if (e.key === 'ArrowLeft') i.x -= d; if (e.key === 'ArrowRight') i.x += d; if (e.key === 'ArrowUp') i.y -= d; if (e.key === 'ArrowDown') i.y += d; }); autoKeyFor(doc.items.filter((i) => sel.has(i.id))); render(); }
  else if (!e.ctrlKey && e.shiftKey && (k === 'l' || k === 'p')) setTool(k === 'l' ? 'arrow' : 'pencil');
  else if (!e.ctrlKey && mode !== 'dev' && 'vhfrolpt'.includes(k) && k.length === 1) { const t = { v: 'select', h: 'hand', f: 'frame', r: 'rect', o: 'ellipse', l: 'line', p: 'pen', t: 'text' }[k]; if (mode === 'design' || ['select', 'hand', 'rect', 'ellipse', 'line', 'pen'].includes(t)) setTool(t); }
});
document.addEventListener('keyup', (e) => { if (e.code === 'Space') spaceDown = false; });

// ---------- prototype preview ----------
function startPreview() {
  const frames = doc.items.filter((f) => f.type === 'frame' && !f.hidden); if (!frames.length) { toast('Add a frame first'); return; }
  const start = (sel.size && get([...sel][0])?.type === 'frame' ? get([...sel][0]) : frames[0]);
  const back = h('div', { class: 'modal-back', style: 'background:#141414;flex-direction:column;gap:10px' });
  preview = { back, frame: start, hist: [], hot: false };
  document.body.append(back); showPreviewFrame(start, 'none', true);
}
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
    if (i === f || i.type === 'frame' || !inside(i, f) || i.hidden) continue; const el = itemEl(i, true);
    if (i.go && get(i.go)) { el.style.cursor = 'pointer'; el.addEventListener('click', () => showPreviewFrame(get(i.go), i.tr || 'none')); if (preview.hot) g.append(el), g.append(sv('rect', { x: i.x, y: i.y, width: i.w, height: i.h, fill: 'rgba(120,120,120,.25)', stroke: '#777', 'stroke-dasharray': '4 3', 'pointer-events': 'none' })); else g.append(el); }
    else g.append(el);
  }
  const bar = h('div', { class: 'row' }, btn('Back', previewBack), h('span', { class: 'muted', text: f.name }), btn(preview.hot ? 'Hide hotspots' : 'Show hotspots', () => { preview.hot = !preview.hot; showPreviewFrame(f, 'none', true); }), btn('Restart', () => { preview.hist = []; showPreviewFrame(doc.items.find((x) => x.type === 'frame' && !x.hidden), 'none', true); }), btn('Close preview', endPreview));
  back.append(s, bar);
  if (how === 'fade' && s.animate) s.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 240 });
  else if (how === 'slide' && s.animate) s.animate([{ transform: 'translateX(60px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 260, easing: 'ease-out' });
}

// ---------- files ----------
const cleanItem = (i) => ({ id: String(i.id || uid()), type: NAMES[i.type] ? i.type : 'rect', name: String(i.name || 'Layer'), x: +i.x || 0, y: +i.y || 0, w: +i.w || 0, h: +i.h || 0, fill: i.fill === 'none' ? 'none' : hex(i.fill, '#d0d0d0'), stroke: hex(i.stroke, '#000000'), sw: Math.max(0, +i.sw || 0), r: Math.max(0, +i.r || 0), op: clamp(+i.op || 1, 0.05, 1), text: String(i.text || ''), fs: clamp(+i.fs || 16, 6, 400), go: String(i.go || ''), tr: ['fade', 'slide'].includes(i.tr) ? i.tr : 'none', master: !!i.master, inst: i.inst ? String(i.inst) : undefined, instOf: i.instOf ? String(i.instOf) : undefined, instRoot: i.instRoot ? String(i.instRoot) : undefined, ov: !!i.ov, al: i.al && ['v', 'h'].includes(i.al.dir) ? { dir: i.al.dir, gap: Math.max(0, +i.al.gap || 0), pad: Math.max(0, +i.al.pad || 0), align: ['center', 'end'].includes(i.al.align) ? i.al.align : 'start', hug: !!i.al.hug } : undefined, hidden: !!i.hidden, locked: !!i.locked, rot: clamp(+i.rot || 0, -360, 360), fill2: /^#[0-9a-f]{6}$/i.test(i.fill2) ? i.fill2 : '', ga: clamp(Number.isFinite(+i.ga) && i.ga !== undefined ? +i.ga : 90, -360, 360), sh: i.sh && typeof i.sh === 'object' ? { x: clamp(+i.sh.x || 0, -200, 200), y: clamp(+i.sh.y || 0, -200, 200), b: clamp(+i.sh.b || 0, 0, 200), o: clamp(+i.sh.o || 0.25, 0.02, 1) } : undefined, ff: FONTS[i.ff] ? i.ff : 'sans', fw: +i.fw === 700 ? 700 : 400, ta: ['center', 'right'].includes(i.ta) ? i.ta : 'left', n: clamp(Math.round(+i.n || (i.type === 'star' ? 5 : 3)), 3, 12), ah: !!i.ah, cl: !!i.cl, sm: !!i.sm, pts: i.type === 'path' && Array.isArray(i.pts) ? i.pts.slice(0, 3000).map((p) => [clamp(+(p && p[0]) || 0, 0, 1), clamp(+(p && p[1]) || 0, 0, 1)]) : undefined, note: String(i.note || '').slice(0, 500), rd: !!i.rd, src: i.type === 'image' && typeof i.src === 'string' && i.src.length < 12e6 && IMG_OK.test(i.src) ? i.src : undefined });
async function openDoc(dropped) {
  const f = (dropped && dropped.data) ? dropped : (await window.host.openFiles({ filters: [['Frameout design', ['frameout', 'json']]] }))[0]; if (!f) return;
  try { const d = JSON.parse(new TextDecoder().decode(f.data)); if (!Array.isArray(d.items)) throw new Error('Not a Frameout file'); autosave(); doc = { id: String(d.id || uid()).slice(0, 24), title: String(d.title || 'Untitled design'), items: d.items.map(cleanItem), motion: cleanMotion(d.motion) }; fileName = f.name; fileBind = null; sel.clear(); undoS = []; savedSnap = snapshot(); session = true; closeHome(); fit(); }
  catch (e) { toast('Cannot open: ' + e.message); }
}
async function saveDoc() {
  const bytes = new TextEncoder().encode(JSON.stringify(restDoc(), null, 1));
  if (fileBind) { try { const n = await window.host.folders.save(fileBind.key, fileBind.name, bytes, true); savedSnap = snapshot(); toast('Saved ' + n + ' in ' + fileBind.folder); renderStatus(); } catch (e) { fileBind = null; toast('Could not save to the folder. Choose another place.'); return saveDoc(); } return; }
  const r = await window.host.saveFile({ name: (doc.title || 'design') + '.frameout', filters: [['Frameout design', ['frameout']]], data: bytes }); if (r) { savedSnap = snapshot(); fileName = r.name; toast('Saved ' + r.name); renderStatus(); } }
function exportTarget(forced) { const f = forced || (sel.size === 1 ? get([...sel][0]) : null); if (f && f.type === 'frame') return { f, only: doc.items.filter((i) => i === f || inside(i, f)) }; const all = doc.items.filter((i) => !i.hidden); if (!all.length) return null; const x0 = Math.min(...all.map((i) => i.x)), y0 = Math.min(...all.map((i) => i.y)), x1 = Math.max(...all.map((i) => i.x + i.w)), y1 = Math.max(...all.map((i) => i.y + i.h)); return { f: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, only: all }; }
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
  const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(r.str); await img.decode();
  const sc = r.w > 3000 ? 1 : 2; const cv = document.createElement('canvas'); cv.width = Math.round(r.w * sc); cv.height = Math.round(r.h * sc); const ctx = cv.getContext('2d'); ctx.scale(sc, sc); ctx.drawImage(img, 0, 0, r.w, r.h);
  const blob = await new Promise((x) => cv.toBlob(x, 'image/png'));
  const s = await window.host.saveFile({ name: (doc.title || 'design') + '.png', filters: [['PNG image', ['png']]], data: new Uint8Array(await blob.arrayBuffer()) }); if (s) toast('Saved ' + s.name);
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
function writeRecent(list) { for (;;) { try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); return; } catch (e) { if (list.length <= 1) return; list = list.slice(0, -1); } } }
// keeps the open design in the Recent list (like Figma drafts), with a small picture of its first screen
function autosave() {
  if (!session || !doc.items.length) return;
  if (!doc.id) doc.id = uid();
  const s = JSON.stringify(restDoc()); if (s === lastSaved) return; lastSaved = s;
  let svgStr = ''; try { const fr = doc.items.find((i) => i.type === 'frame' && !i.hidden); const r = exportSvgString(fr || null); svgStr = r ? r.str : ''; } catch (e) { /* no picture */ }
  const list = readRecent().filter((e) => e.id !== doc.id);
  list.unshift({ id: doc.id, title: doc.title || 'Untitled design', time: Date.now(), svg: svgStr, doc: s });
  writeRecent(list.slice(0, getSet('recentMax')));
}
const SET_KEY = 'frameout.settings', SET_DEF = { recentMax: 12, openOn: 'home', sideShut: false };
function getSet(k) { try { const s = JSON.parse(localStorage.getItem(SET_KEY) || '{}'); const v = s && s[k]; if (k === 'recentMax') return [6, 12, 24].includes(v) ? v : SET_DEF[k]; if (k === 'openOn') return v === 'last' ? 'last' : 'home'; if (k === 'sideShut') return v === true; } catch (e) { /* defaults */ } return SET_DEF[k]; }
function putSet(k, v) { try { const s = JSON.parse(localStorage.getItem(SET_KEY) || '{}') || {}; s[k] = v; localStorage.setItem(SET_KEY, JSON.stringify(s)); } catch (e) { /* not saved */ } }
let homeTab = 'home';
function showHome(tab) { autosave(); homeOpen = true; if (tab) homeTab = tab; home.style.display = 'flex'; for (const k in folderThumbs) delete folderThumbs[k]; renderHome(); loadFolders().then(() => { if (homeOpen) renderHome(); }); }
function closeHome() { homeOpen = false; home.style.display = 'none'; }
let folders = [], fileBind = null;
function newBlank(target) {
  if (target && !target.key) target = null; const d = { id: uid(), title: 'Untitled design', items: [] };
  mode = 'design'; playhead = 0; buildDock(); startDesign(d); if (target) newInFolder(target.key, target.name, d);
}
function startDesign(d, bind) { if (mode === 'motion') { if (playing) stopPlay(); } if (mode !== 'design') { mode = 'design'; buildDock(); } playhead = 0;  autosave(); fileBind = bind || null; doc = d; sel.clear(); undoS = []; redoS = []; fileName = ''; savedSnap = snapshot(); lastSaved = ''; session = true; closeHome(); render(); fit(); }
function openRecent(e) {
  try { const d = JSON.parse(e.doc); if (!Array.isArray(d.items)) throw new Error('damaged'); startDesign({ id: e.id, title: String(d.title || e.title || 'Untitled design'), items: d.items.map(cleanItem), motion: cleanMotion(d.motion) }); }
  catch (err) { toast('Cannot open this design'); }
}
function removeRecent(id) { writeRecent(readRecent().filter((e) => e.id !== id)); renderHome(); }
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
function homeFolderCards() {
  if (!folders.length) return [];
  const row = h('div', { class: 'home-row' });
  for (const f of folders) {
    if (!folderThumbs[f.path]) { folderThumbs[f.path] = { files: [] }; window.host.folders.files(f.path).then((r) => { folderThumbs[f.path] = { files: r.files.slice(0, 3).map(parseDesignFile).filter(Boolean) }; if (homeOpen && homeTab === 'home') renderHome(); }).catch(() => {}); }
    const th = h('div', { class: 'fthumbs' }); const fl = folderThumbs[f.path].files; for (let k = 0; k < 3; k++) th.append(fl[k] ? thumbBox(fl[k].svg) : h('div', { class: 'thumb' }));
    row.append(h('button', { class: 'hcard fcard', onclick: () => { homeTab = 'folder:' + f.path; loadFolderFiles(f.path); renderHome(); } }, th, h('div', { class: 'hname' }, h('span', { class: 'hic' }, icon('open')), ' ' + f.name), h('div', { class: 'hsub', text: (f.count === 1 ? '1 design' : f.count + ' designs') + ' · ' + ago(f.mtime) })));
  }
  return [h('h2', { text: 'Folders' }), row];
}
function homeHome() {
  const recent = readRecent();
  const grid = h('div', { class: 'home-grid' });
  for (const e of recent) {
    grid.append(h('div', { class: 'hcard', tabindex: 0, role: 'button', onclick: () => openRecent(e), onkeydown: (ev) => { if (ev.key === 'Enter') openRecent(e); } },
      thumbBox(e.svg), h('div', { class: 'hname', text: e.title || 'Untitled design' }), h('div', { class: 'hsub', text: 'Edited ' + ago(e.time) }),
      h('button', { class: 'btn hrm', title: 'Remove from recent', onclick: (ev) => { ev.stopPropagation(); removeRecent(e.id); }, text: 'Remove' })));
  }
  return [h('h2', { text: 'Start' }), h('div', { class: 'home-row' },
    newCard('plus', 'New design', 'Start with an empty canvas', () => newBlank()),
    newCard('open', 'Open file', 'A .frameout file from your computer', () => openDoc()),
    newCard('example', 'Example', 'Two linked mobile screens to explore', () => startDesign(sampleDoc()))),
  ...homeFolderCards(),
  h('h2', { text: 'Recent' }), recent.length ? grid : h('div', { class: 'muted', style: 'padding:8px 2px', text: 'Designs you work on appear here, with a small picture, and are kept on this computer.' })];
}
function homeTemplates() {
  const grid = h('div', { class: 'home-grid' });
  for (const [name, sub, make] of TEMPLATES) grid.append(h('button', { class: 'hcard', onclick: () => startDesign(make()) }, thumbBox(docThumb(make())), h('div', { class: 'hname', text: name }), h('div', { class: 'hsub', text: sub })));
  if (folderView.key !== 'templates') loadFolderFiles('templates');
  const mine = h('div', { class: 'home-grid' }, folderView.key === 'templates' ? folderView.files.map((f) => fileCard(f, () => startDesign({ id: uid(), title: f.doc.title, items: f.doc.items.map((i) => ({ ...i })) }), h('button', { class: 'btn hrm', title: 'Remove this template', onclick: async (ev) => { ev.stopPropagation(); if (confirm('Remove this template? Your original project file is not touched.')) { try { await window.host.folders.del('templates', f.name); } catch (e) { toast('Could not remove it'); } loadFolderFiles('templates'); } }, text: 'Remove' }))) : []);
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
    row('Recent designs to keep', 'More designs use more space on this computer. Older ones drop off first.', pick([[6, '6'], [12, '12'], [24, '24']], getSet('recentMax'), (v) => { putSet('recentMax', v); writeRecent(readRecent().slice(0, v)); })),
    row('Space used by Recent', mb + ' on this computer. Saved .frameout files are not affected.', btn('Clear recent', () => { if (!readRecent().length) return; if (confirm('Remove all designs from Recent? Files you saved are not touched.')) { writeRecent([]); renderHome(); toast('Recent cleared'); } })),
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
async function newInFolder(key, folderName, d) { const bytes = new TextEncoder().encode(JSON.stringify(d, null, 1)); try { const n = await window.host.folders.save(key, d.title + '.frameout', bytes, false); fileBind = { key, name: n, folder: folderName }; savedSnap = snapshot(); } catch (e) { toast('Could not save into the folder'); } }
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
  const tabs = [['home', 'Home', 'home'], ['templates', 'Templates', 'templates'], ['settings', 'Settings', 'settings']];
  const shut = getSet('sideShut');
  const side = h('nav', { class: 'home-side' + (shut ? ' shut' : '') },
    h('div', { class: 'home-logo' }, h('button', { class: 'htab hbar', title: shut ? 'Open sidebar' : 'Close sidebar', 'aria-label': 'Toggle sidebar', onclick: () => { putSet('sideShut', !shut); renderHome(); } }, h('span', { class: 'hic' }, icon('menu'))), h('span', { class: 'hlabel', text: 'Frameout' })),
    tabs.map(([id, name, ic]) => h('button', { class: 'htab' + (homeTab === id ? ' on' : ''), title: name, onclick: () => { homeTab = id; renderHome(); } }, h('span', { class: 'hic' }, icon(ic)), h('span', { class: 'hlabel', text: name }))),
    h('div', { class: 'hsec' }, h('span', { class: 'hlabel', text: 'Folders' }), h('button', { class: 'hplus', title: 'New folder', 'aria-label': 'New folder', onclick: addFolder }, icon('plus', 16))),
    h('div', { class: 'hfolders' }, folders.map((f) => h('button', { class: 'htab' + (homeTab === 'folder:' + f.path ? ' on' : ''), title: f.path, onclick: () => { homeTab = 'folder:' + f.path; loadFolderFiles(f.path); renderHome(); } }, h('span', { class: 'hic' }, icon('open')), h('span', { class: 'hlabel', text: f.name })))), 
    shut ? h('button', { class: 'htab', title: 'New folder', onclick: addFolder }, h('span', { class: 'hic' }, icon('folderplus'))) : (folders.length ? h('span') : h('button', { class: 'htab', onclick: addFolder }, h('span', { class: 'hic' }, icon('folderplus')), h('span', { class: 'hlabel', text: 'New folder' }))),
    h('span', { class: 'grow' }), session ? h('button', { class: 'htab', onclick: closeHome }, h('span', { class: 'hic' }, icon('back')), h('span', { class: 'hlabel', text: 'Back to design' })) : h('span'));
  const isF = homeTab.startsWith('folder:'), fkey = isF ? homeTab.slice(7) : '', fo = isF ? folders.find((x) => x.path === fkey) : null;
  const body = homeTab === 'templates' ? homeTemplates() : homeTab === 'settings' ? homeSettings() : isF ? homeFolder(fkey) : homeHome();
  home.append(side, h('div', { class: 'home-main' }, h('div', { class: 'home-in' },
    h('div', { class: 'home-head' }, h('h1', { text: homeTab === 'templates' ? 'Templates' : homeTab === 'settings' ? 'Settings' : isF ? (fo ? fo.name : 'Folder') : 'Home' }), h('span', { class: 'grow' }), homeTab === 'templates' || homeTab === 'settings' ? h('span') : btn('New design', () => newBlank(isF && fo ? { key: fkey, name: fo.name } : null), 'primary')), ...body)));
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
setTimeout(() => { if (savedSnap === null) savedSnap = snapshot(); }, 0);
window.addEventListener('beforeunload', (e) => { if (savedSnap !== null && snapshot() !== savedSnap) { e.preventDefault(); e.returnValue = ''; } });
