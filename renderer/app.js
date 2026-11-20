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
const uid = () => Math.random().toString(36).slice(2, 8);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const toast = (m) => { const t = h('div', { class: 'toast', text: m }); document.body.append(t); setTimeout(() => t.remove(), 2400); };
const hex = (s, d) => (/^#[0-9a-f]{6}$/i.test(s) ? s : d);

// ---------- model ----------
// item: {id,type:'frame'|'rect'|'ellipse'|'text'|'line', name,x,y,w,h,fill,stroke,sw,r,op,text,fs,go,hidden,locked}
let doc = { title: 'Untitled design', items: [] };
let sel = new Set(), tool = 'select', zoom = 1, panX = 0, panY = 0, fileName = '';
let undoS = [], redoS = [], clip = null, preview = null;
const snapshot = () => JSON.stringify(doc);
function commit() { undoS.push(snapshot()); if (undoS.length > 100) undoS.shift(); redoS = []; }
function undo() { if (!undoS.length) return; redoS.push(snapshot()); doc = JSON.parse(undoS.pop()); sel.clear(); render(); }
function redo() { if (!redoS.length) return; undoS.push(snapshot()); doc = JSON.parse(redoS.pop()); sel.clear(); render(); }
const get = (id) => doc.items.find((i) => i.id === id);
const FILLS = ['#ffffff', '#e4e4e4', '#bdbdbd', '#8a8a8a', '#4a4a4a', '#262626', '#d9e0e6', '#e6e0d2', '#dce6dc', '#e8d9d9'];
const NAMES = { frame: 'Frame', rect: 'Rectangle', ellipse: 'Ellipse', text: 'Text', line: 'Line' };
function makeItem(type, x, y, w, hh) {
  const base = { id: uid(), type, name: NAMES[type] + ' ' + (doc.items.filter((i) => i.type === type).length + 1), x, y, w, h: hh, fill: '#d0d0d0', stroke: '#000000', sw: 0, r: 0, op: 1, text: '', fs: 16, go: '', tr: 'none', hidden: false, locked: false };
  if (type === 'frame') Object.assign(base, { fill: '#ffffff', r: 0 });
  if (type === 'text') Object.assign(base, { text: 'Text', fill: '#1a1a1a', h: 24, w: Math.max(w, 80) });
  if (type === 'line') Object.assign(base, { fill: 'none', stroke: '#8a8a8a', sw: 2 });
  if (type === 'rect') Object.assign(base, { r: 6 });
  return base;
}
function inside(i, f) { const cx = i.x + i.w / 2, cy = i.y + i.h / 2; return i !== f && cx >= f.x && cx <= f.x + f.w && cy >= f.y && cy <= f.y + f.h; }
// ---------- components + auto layout ----------
const kidsOf = (f) => doc.items.filter((c) => c !== f && !c.hidden && inside(c, f));
function detach(rootId) { for (const c of doc.items) { if (c.id === rootId) delete c.inst; if (c.instRoot === rootId) { delete c.instOf; delete c.instRoot; delete c.ov; } } }
const COPY = ['w', 'h', 'fill', 'stroke', 'sw', 'r', 'op', 'fs'];
function syncInstances() {
  for (const root of doc.items.filter((i) => i.inst)) {
    const m = get(root.inst);
    if (!m || !m.master) { detach(root.id); continue; }
    for (const k of COPY) root[k] = m[k]; root.al = m.al ? { ...m.al } : undefined; if (!root.ov && m.type === 'text') root.text = m.text;
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
    const ks = kidsOf(f).sort((a, b) => (v ? a.y - b.y : a.x - b.x)); if (!ks.length) continue;
    let pos = pad, cross = 0;
    for (const k of ks) { const main = v ? k.h : k.w; const sub = v ? k.w : k.h; cross = Math.max(cross, sub);
      const dx = (v ? f.x + 0 : f.x + pos) - k.x, dy = (v ? f.y + pos : f.y + 0) - k.y; // main axis
      if (v) k.y = f.y + pos; else k.x = f.x + pos; pos += main + gap; }
    const inner = (v ? f.w : f.h) - pad * 2; const box = hug ? cross : inner;
    for (const k of ks) { const sub = v ? k.w : k.h; const off = align === 'center' ? (box - sub) / 2 : align === 'end' ? box - sub : 0; if (v) k.x = f.x + pad + off; else k.y = f.y + pad + off; }
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
const toolBtns = {};
const TOOLS = [['select', 'Move'], ['frame', 'Frame'], ['rect', 'Rectangle'], ['ellipse', 'Ellipse'], ['line', 'Line'], ['text', 'Text']];
toolbar.append(btn('New', newDoc), btn('Open', openDoc), btn('Save', saveDoc, 'primary'), h('span', { class: 'sep' }));
TOOLS.forEach(([k, label]) => { const b = btn(label, () => setTool(k)); toolBtns[k] = b; toolbar.append(b); });
toolbar.append(h('span', { class: 'sep' }), btn('Undo', undo), btn('Redo', redo), btn('Duplicate', dupe), btn('Delete', del), h('span', { class: 'sep' }),
  btn('-', () => zoomBy(1 / 1.2), 'icon'), btn('+', () => zoomBy(1.2), 'icon'), btn('Fit', fit), h('span', { class: 'grow' }),
  btn('Preview', startPreview), btn('Export PNG', () => exportImg('png')), btn('Export SVG', () => exportImg('svg')));
function setTool(t) { tool = t; for (const k in toolBtns) toolBtns[k].classList.toggle('on', k === t); svg.style.cursor = t === 'select' ? 'default' : 'crosshair'; }

const svg = sv('svg', { width: '100%', height: '100%', style: 'display:block;touch-action:none;background:#1c1c1c' });
const world = sv('g'); const gItems = sv('g'), gUI = sv('g');
world.append(gItems, gUI); svg.append(world); stage.append(svg);
const toW = (e) => { const r = svg.getBoundingClientRect(); return { x: (e.clientX - r.left - panX) / zoom, y: (e.clientY - r.top - panY) / zoom }; };
function applyView() { world.setAttribute('transform', `translate(${panX} ${panY}) scale(${zoom})`); renderStatus(); }
function zoomBy(f, cx, cy) { const r = svg.getBoundingClientRect(); cx = cx ?? r.width / 2; cy = cy ?? r.height / 2; const nz = clamp(zoom * f, 0.05, 8); panX = cx - (cx - panX) * (nz / zoom); panY = cy - (cy - panY) * (nz / zoom); zoom = nz; render(); }
function fit() {
  const r = svg.getBoundingClientRect();
  if (!doc.items.length) { zoom = 1; panX = 40; panY = 40; render(); return; }
  const x0 = Math.min(...doc.items.map((i) => i.x)), y0 = Math.min(...doc.items.map((i) => i.y)), x1 = Math.max(...doc.items.map((i) => i.x + i.w)), y1 = Math.max(...doc.items.map((i) => i.y + i.h));
  zoom = clamp(Math.min((r.width - 80) / (x1 - x0), (r.height - 80) / (y1 - y0)), 0.05, 2);
  panX = (r.width - (x1 - x0) * zoom) / 2 - x0 * zoom; panY = (r.height - (y1 - y0) * zoom) / 2 - y0 * zoom; render();
}

// ---------- drawing ----------
function itemEl(i, forExport = false) {
  const g = sv('g'); g.dataset.id = i.id;
  if (i.hidden) return g;
  const common = { fill: i.fill, stroke: i.sw > 0 || i.type === 'line' ? i.stroke : 'none', 'stroke-width': i.sw, opacity: i.op };
  if (i.type === 'frame' || i.type === 'rect') {
    if (i.type === 'frame' && !forExport) { const t = sv('text', { x: i.x, y: i.y - 8, fill: '#9a9a9a', 'font-size': 12 / Math.max(zoom, 0.4), 'font-family': 'Segoe UI,Arial,sans-serif' }); t.textContent = (i.master ? '\u25C6 ' : i.inst ? '\u25C7 ' : '') + i.name; t.dataset.title = i.id; t.style.cursor = 'pointer'; g.append(t); }
    g.append(sv('rect', { x: i.x, y: i.y, width: i.w, height: i.h, rx: i.r, ...common }));
  } else if (i.type === 'ellipse') g.append(sv('ellipse', { cx: i.x + i.w / 2, cy: i.y + i.h / 2, rx: i.w / 2, ry: i.h / 2, ...common }));
  else if (i.type === 'line') {
    g.append(sv('line', { x1: i.x, y1: i.y, x2: i.x + i.w, y2: i.y + i.h, stroke: 'transparent', 'stroke-width': Math.max(10, i.sw) }));
    g.append(sv('line', { x1: i.x, y1: i.y, x2: i.x + i.w, y2: i.y + i.h, stroke: i.stroke, 'stroke-width': i.sw || 2, 'stroke-linecap': 'round', opacity: i.op }));
  } else if (i.type === 'text') {
    const lines = String(i.text).split('\n'); const t = sv('text', { x: i.x, y: i.y + i.fs, fill: i.fill, 'font-size': i.fs, 'font-family': 'Segoe UI,Arial,sans-serif', opacity: i.op });
    lines.forEach((ln, k) => { const ts = sv('tspan', { x: i.x, dy: k === 0 ? 0 : i.fs * 1.25 }); ts.textContent = ln || ' '; t.append(ts); });
    g.append(t);
    g.append(sv('rect', { x: i.x, y: i.y, width: i.w, height: i.h, fill: 'transparent' }));
  }
  if (i.go && !forExport) { const m = sv('circle', { cx: i.x + i.w, cy: i.y, r: 6 / Math.max(zoom, 0.5), fill: '#e0e0e0', stroke: '#222', 'pointer-events': 'none' }); g.append(m); }
  return g;
}
function render() {
  syncInstances(); applyLayouts();
  gItems.textContent = ''; gUI.textContent = '';
  for (const i of doc.items) gItems.append(itemEl(i));
  for (const id of sel) {
    const i = get(id); if (!i) continue;
    gUI.append(sv('rect', { x: i.x, y: i.y, width: i.w, height: i.h, fill: 'none', stroke: '#e6e6e6', 'stroke-width': 1.2 / zoom, 'pointer-events': 'none' }));
  }
  if (sel.size === 1) {
    const i = get([...sel][0]);
    if (i && !i.locked) {
      const pts = i.type === 'line' ? { a: [i.x, i.y], b: [i.x + i.w, i.y + i.h] } : { nw: [i.x, i.y], n: [i.x + i.w / 2, i.y], ne: [i.x + i.w, i.y], e: [i.x + i.w, i.y + i.h / 2], se: [i.x + i.w, i.y + i.h], s: [i.x + i.w / 2, i.y + i.h], sw: [i.x, i.y + i.h], w: [i.x, i.y + i.h / 2] };
      const cur = { nw: 'nwse', se: 'nwse', ne: 'nesw', sw: 'nesw', n: 'ns', s: 'ns', e: 'ew', w: 'ew', a: 'move', b: 'move' };
      for (const [k, [px, py]] of Object.entries(pts)) { const r = sv('rect', { x: px - 4 / zoom, y: py - 4 / zoom, width: 8 / zoom, height: 8 / zoom, fill: '#ffffff', stroke: '#222', 'stroke-width': 1 / zoom, style: `cursor:${cur[k]}${cur[k].length < 5 ? '-resize' : ''}` }); r.dataset.handle = k; gUI.append(r); }
    }
  }
  applyView(); renderLeft(); renderRight();
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
  right.append(h('h3', { text: 'Design' }), h('label', { class: 'field' }, 'Title', h('input', { type: 'text', value: doc.title, oninput: (e) => { doc.title = e.target.value; } })));
  const items = [...sel].map(get).filter(Boolean); if (!items.length) { right.append(h('h3', { text: 'Tips' }), h('div', { class: 'muted', style: 'font-size:12px;line-height:1.6;white-space:pre-line', text: 'Pick a tool or press its letter, then drag on the canvas.\nShift-click to select several.\nScroll to pan, Ctrl+scroll to zoom, hold Space to pan.\nGive a shape a Link to a frame, then press Preview to click through your prototype.' })); return; }
  const i = items[0];
  const num = (label, key) => h('label', { class: 'field' }, label, h('input', { type: 'number', value: Math.round(i[key] * 10) / 10, style: 'width:100%', onfocus: commit, onchange: (e) => { const v = +e.target.value; if (!isNaN(v)) { items.forEach((it) => { if (['w', 'h'].includes(key)) it[key] = Math.max(1, v); else it[key] = v; }); render(); } } }));
  right.append(h('h3', { text: 'Layout' }), h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:6px' }, num('X', 'x'), num('Y', 'y'), num('W', 'w'), num('H', 'h')));
  right.append(h('label', { class: 'field' }, 'Name', h('input', { type: 'text', value: i.name, onfocus: commit, oninput: (e) => { i.name = e.target.value; renderLeft(); } })));
  if (i.type !== 'line') {
    right.append(h('h3', { text: i.type === 'text' ? 'Text color' : 'Fill' }), h('div', { class: 'swatches' }, FILLS.map((c) => h('button', { style: `background:${c}`, onclick: () => { commit(); items.forEach((it) => { it.fill = c; }); render(); } }))));
  }
  right.append(h('h3', { text: 'Stroke' }), h('div', { class: 'swatches' }, ['#000000', '#4a4a4a', '#8a8a8a', '#e4e4e4', '#ffffff'].map((c) => h('button', { style: `background:${c}`, onclick: () => { commit(); items.forEach((it) => { it.stroke = c; if (!it.sw) it.sw = 1; }); render(); } }))));
  right.append(h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:6px' }, num('Stroke width', 'sw'), i.type === 'rect' || i.type === 'frame' ? num('Corner radius', 'r') : h('span')));
  const op = h('input', { type: 'range', min: 5, max: 100, value: Math.round(i.op * 100), oninput: () => { items.forEach((it) => (it.op = op.value / 100)); renderItemsOnly(); } }); op.addEventListener('pointerdown', commit);
  right.append(h('h3', { text: 'Opacity' }), op);
  if (i.type === 'text') {
    const ta = h('textarea', { rows: 3, style: 'width:100%' }); ta.value = i.text; ta.addEventListener('focus', commit, { once: true }); ta.addEventListener('input', () => { i.text = ta.value; if (i.instOf || i.inst) i.ov = true; const lines = ta.value.split('\n'); i.h = lines.length * i.fs * 1.25 + 4; i.w = Math.max(40, Math.max(...lines.map((l) => l.length)) * i.fs * 0.55); renderItemsOnly(); });
    right.append(h('h3', { text: 'Text' }), ta, num('Font size', 'fs'));
    right.lastChild.querySelector('input').addEventListener('change', () => { const lines = i.text.split('\n'); i.h = lines.length * i.fs * 1.25 + 4; render(); });
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
function del() { if (!sel.size) return; commit(); for (const id of sel) { const x = get(id); if (x && x.master) for (const c of doc.items.filter((y) => y.inst === id)) detach(c.id); if (x && x.inst) doc.items = doc.items.filter((y) => y.instRoot !== id); } doc.items = doc.items.filter((i) => !sel.has(i.id)); for (const i of doc.items) if (sel.has(i.go)) i.go = ''; sel.clear(); render(); }
function dupe() { const it = doc.items.filter((i) => sel.has(i.id)); if (!it.length) return; commit(); sel.clear(); for (const i of it) { if (i.instOf) continue; const c = { ...JSON.parse(JSON.stringify(i)), id: uid(), x: i.x + 24, y: i.y + 24, name: i.name + ' copy' }; delete c.master; doc.items.push(c); sel.add(c.id); } render(); }
function newDoc() { if (doc.items.length && !confirm('Discard the current design?')) return; doc = { title: 'Untitled design', items: [] }; sel.clear(); undoS = []; redoS = []; fileName = ''; render(); fit(); }

// ---------- pointer ----------
let drag = null, spaceDown = false;
svg.addEventListener('pointerdown', (ev) => {
  svg.setPointerCapture(ev.pointerId);
  if (ev.button === 1 || spaceDown) { drag = { mode: 'pan', sx: ev.clientX, sy: ev.clientY, px: panX, py: panY }; return; }
  const p = toW(ev);
  const hd = ev.target.dataset.handle;
  if (hd) { const i = get([...sel][0]); commit(); drag = { mode: 'resize', hd, i, o: { ...i }, p }; return; }
  if (tool !== 'select') { commit(); const it = makeItem(tool, p.x, p.y, 1, 1); if (tool === 'text') { it.w = 80; } doc.items.push(it); sel = new Set([it.id]); drag = { mode: 'draw', i: it, p, tool }; render(); return; }
  const node = ev.target.closest('[data-id]');
  let id = node ? node.dataset.id : null; let it = id && get(id);
  if (it && it.locked) { it = null; }
  if (it && it.type === 'frame' && !ev.target.dataset.title) {
    // clicking inside a frame selects a child if there is one under the pointer, else the frame only via its title
    const child = [...doc.items].reverse().find((c) => c !== it && c.type !== 'frame' && !c.hidden && !c.locked && p.x >= c.x && p.x <= c.x + c.w && p.y >= c.y && p.y <= c.y + c.h);
    if (child) it = child;
  }
  if (it) {
    if (ev.shiftKey) { sel.has(it.id) ? sel.delete(it.id) : sel.add(it.id); } else if (!sel.has(it.id)) sel = new Set([it.id]);
    const moving = [];
    for (const id2 of sel) { const m = get(id2); moving.push(m); if (m.type === 'frame') doc.items.filter((c) => inside(c, m) && !sel.has(c.id)).forEach((c) => moving.push(c)); }
    commit(); drag = { mode: 'move', p, orig: [...new Set(moving)].map((m) => ({ m, x: m.x, y: m.y })), moved: false }; render();
  } else { if (!ev.shiftKey) sel.clear(); const r = sv('rect', { fill: 'rgba(200,200,200,.12)', stroke: '#bdbdbd', 'stroke-dasharray': '4 3', 'stroke-width': 1 / zoom }); drag = { mode: 'marquee', p, r }; render(); gUI.append(r); }
});
svg.addEventListener('pointermove', (ev) => {
  if (!drag) return;
  if (drag.mode === 'pan') { panX = drag.px + ev.clientX - drag.sx; panY = drag.py + ev.clientY - drag.sy; applyView(); return; }
  const p = toW(ev);
  if (drag.mode === 'move') { const dx = p.x - drag.p.x, dy = p.y - drag.p.y; if (Math.abs(dx) + Math.abs(dy) > 0) drag.moved = true; for (const o of drag.orig) { o.m.x = Math.round(o.x + dx); o.m.y = Math.round(o.y + dy); } renderLite(); }
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
  if (d.mode === 'draw') {
    const i = d.i;
    if (d.tool === 'text') { i.w = 80; i.h = 24; }
    else if ((d.tool !== 'line' && (i.w < 4 || i.h < 4)) || (d.tool === 'line' && Math.abs(i.w) + Math.abs(i.h) < 4)) { if (d.tool === 'line') { i.w = 120; i.h = 0; } else { i.w = d.tool === 'frame' ? 375 : 120; i.h = d.tool === 'frame' ? 667 : 80; } }
    setTool('select'); render();
  } else if (d.mode === 'move' && !d.moved) { undoS.pop(); render(); }
  else if (d.mode === 'marquee') { d.r.remove(); if (d.box && d.box.w > 3) for (const i of doc.items) if (!i.hidden && i.x < d.box.x + d.box.w && i.x + i.w > d.box.x && i.y < d.box.y + d.box.h && i.y + i.h > d.box.y && i.type !== 'frame') sel.add(i.id); render(); }
  else render();
});
svg.addEventListener('wheel', (ev) => { ev.preventDefault(); const r = svg.getBoundingClientRect(); if (ev.ctrlKey || ev.metaKey) zoomBy(ev.deltaY < 0 ? 1.1 : 1 / 1.1, ev.clientX - r.left, ev.clientY - r.top); else { panX -= ev.deltaX; panY -= ev.deltaY; applyView(); } }, { passive: false });
document.addEventListener('keydown', (e) => {
  if (preview) { if (e.key === 'Escape') endPreview(); else if (e.key === 'Backspace' || e.key === 'ArrowLeft') previewBack(); return; }
  if (e.target.matches('input,textarea,select')) return;
  const k = e.key.toLowerCase();
  if (e.code === 'Space') { spaceDown = true; e.preventDefault(); }
  else if (e.ctrlKey && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
  else if (e.ctrlKey && k === 'y') { e.preventDefault(); redo(); }
  else if (e.ctrlKey && k === 'd') { e.preventDefault(); dupe(); }
  else if (e.ctrlKey && k === 's') { e.preventDefault(); saveDoc(); }
  else if (e.ctrlKey && k === 'o') { e.preventDefault(); openDoc(); }
  else if (e.ctrlKey && k === 'a') { e.preventDefault(); sel = new Set(doc.items.map((i) => i.id)); render(); }
  else if (e.ctrlKey && k === 'c') { const it = doc.items.filter((i) => sel.has(i.id)); if (it.length) { clip = JSON.stringify(it); toast('Copied'); } }
  else if (e.ctrlKey && k === 'v') { if (!clip) return; commit(); sel.clear(); for (const i of JSON.parse(clip)) { i.id = uid(); i.x += 24; i.y += 24; doc.items.push(i); sel.add(i.id); } render(); }
  else if (e.key === 'Delete' || e.key === 'Backspace') del();
  else if (e.key === 'Escape') { sel.clear(); setTool('select'); render(); }
  else if (e.key.startsWith('Arrow') && sel.size) { e.preventDefault(); const d = e.shiftKey ? 10 : 1; commit(); doc.items.filter((i) => sel.has(i.id)).forEach((i) => { if (e.key === 'ArrowLeft') i.x -= d; if (e.key === 'ArrowRight') i.x += d; if (e.key === 'ArrowUp') i.y -= d; if (e.key === 'ArrowDown') i.y += d; }); render(); }
  else if (!e.ctrlKey && 'vfrolt'.includes(k) && k.length === 1) setTool({ v: 'select', f: 'frame', r: 'rect', o: 'ellipse', l: 'line', t: 'text' }[k]);
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
const cleanItem = (i) => ({ id: String(i.id || uid()), type: NAMES[i.type] ? i.type : 'rect', name: String(i.name || 'Layer'), x: +i.x || 0, y: +i.y || 0, w: +i.w || 0, h: +i.h || 0, fill: i.fill === 'none' ? 'none' : hex(i.fill, '#d0d0d0'), stroke: hex(i.stroke, '#000000'), sw: Math.max(0, +i.sw || 0), r: Math.max(0, +i.r || 0), op: clamp(+i.op || 1, 0.05, 1), text: String(i.text || ''), fs: clamp(+i.fs || 16, 6, 400), go: String(i.go || ''), tr: ['fade', 'slide'].includes(i.tr) ? i.tr : 'none', master: !!i.master, inst: i.inst ? String(i.inst) : undefined, instOf: i.instOf ? String(i.instOf) : undefined, instRoot: i.instRoot ? String(i.instRoot) : undefined, ov: !!i.ov, al: i.al && ['v', 'h'].includes(i.al.dir) ? { dir: i.al.dir, gap: Math.max(0, +i.al.gap || 0), pad: Math.max(0, +i.al.pad || 0), align: ['center', 'end'].includes(i.al.align) ? i.al.align : 'start', hug: !!i.al.hug } : undefined, hidden: !!i.hidden, locked: !!i.locked });
async function openDoc(dropped) {
  const f = (dropped && dropped.data) ? dropped : (await window.host.openFiles({ filters: [['Frameout design', ['frameout', 'json']]] }))[0]; if (!f) return;
  try { const d = JSON.parse(new TextDecoder().decode(f.data)); if (!Array.isArray(d.items)) throw new Error('Not a Frameout file'); doc = { title: String(d.title || 'Untitled design'), items: d.items.map(cleanItem) }; fileName = f.name; sel.clear(); undoS = []; fit(); }
  catch (e) { toast('Cannot open: ' + e.message); }
}
async function saveDoc() { const r = await window.host.saveFile({ name: (doc.title || 'design') + '.frameout', filters: [['Frameout design', ['frameout']]], data: new TextEncoder().encode(JSON.stringify(doc, null, 1)) }); if (r) { fileName = r.name; toast('Saved ' + r.name); renderStatus(); } }
function exportTarget() { const f = sel.size === 1 ? get([...sel][0]) : null; if (f && f.type === 'frame') return { f, only: doc.items.filter((i) => i === f || inside(i, f)) }; const all = doc.items.filter((i) => !i.hidden); if (!all.length) return null; const x0 = Math.min(...all.map((i) => i.x)), y0 = Math.min(...all.map((i) => i.y)), x1 = Math.max(...all.map((i) => i.x + i.w)), y1 = Math.max(...all.map((i) => i.y + i.h)); return { f: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, only: all }; }
function exportSvgString() {
  const t = exportTarget(); if (!t) return null; const { f, only } = t;
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
(function sample() {
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
})();
setTool('select'); render(); setTimeout(fit, 30);
window.addEventListener('resize', () => applyView());
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', async (e) => {
  e.preventDefault();
  const f = [...(e.dataTransfer?.files || [])].find((x) => /.(frameout|json)$/i.test(x.name)); if (!f) { toast('Drop a .frameout file to open it'); return; }
  openDoc({ name: f.name, data: new Uint8Array(await f.arrayBuffer()) });
});
