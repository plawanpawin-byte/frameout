'use strict';
// Frameout main process. Local-only: no network access, files only via user-chosen dialogs.
const { app, BrowserWindow, ipcMain, dialog, session, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const TITLE = 'Frameout';
if (process.env.LK_USERDATA) app.setPath('userData', process.env.LK_USERDATA); // test runs only
const granted = new Map(); // opaque id -> absolute path the user picked in a dialog
let win = null;

function grant(p) {
  const id = crypto.randomBytes(8).toString('hex');
  granted.set(id, p);
  return id;
}
function pathOf(id) {
  const p = granted.get(String(id));
  if (!p) throw new Error('Path was not granted by the user');
  return p;
}
module.exports = { grant, pathOf };

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 900, minHeight: 600,
    title: TITLE, backgroundColor: '#262626', autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, sandbox: true, nodeIntegration: false,
      webSecurity: true, allowRunningInsecureContent: false, spellcheck: false,
    },
  });
  Menu.setApplicationMenu(null);
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  // the page blocks closing while the design has changes that are not in a file; ask instead of doing nothing
  win.webContents.on('will-prevent-unload', (e) => {
    const c = dialog.showMessageBoxSync(win, { type: 'question', buttons: ['Close without saving', 'Cancel'], defaultId: 1, cancelId: 1, noLink: true, title: TITLE,
      message: 'This design has changes that are not saved to a file.', detail: 'A copy is kept in Recent designs on the home screen.' });
    if (c === 0) e.preventDefault();
  });
  win.on('closed', () => { win = null; });
}

const filters = (list) => (list || []).map((f) => ({ name: f[0], extensions: f[1] }));

ipcMain.handle('file:open', async (_e, opts = {}) => {
  const r = await dialog.showOpenDialog(win, {
    properties: ['openFile', ...(opts.multi ? ['multiSelections'] : [])],
    filters: filters(opts.filters),
  });
  if (r.canceled) return [];
  const out = [];
  for (const p of r.filePaths) {
    const st = fs.statSync(p);
    const item = { id: grant(p), name: path.basename(p), size: st.size };
    if (opts.read !== false && st.size <= (opts.maxBytes || 512 * 1024 * 1024)) item.data = fs.readFileSync(p);
    out.push(item);
  }
  return out;
});

function safeName(n) {
  const t = String(n || 'untitled').replace(/[\\/:*?"<>|\x00-\x1f]+/g, '_').replace(/^[ .]+|[ .]+$/g, '');
  return /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i.test(t) || !t ? '_' + t : t;
}

ipcMain.handle('file:save', async (_e, opts = {}) => {
  const r = await dialog.showSaveDialog(win, {
    defaultPath: safeName(opts.name), filters: filters(opts.filters),
  });
  if (r.canceled || !r.filePath) return null;
  if (opts.data) fs.writeFileSync(r.filePath, Buffer.from(opts.data));
  return { id: grant(r.filePath), name: path.basename(r.filePath) };
});

ipcMain.handle('file:write', async (_e, id, data) => {
  fs.writeFileSync(pathOf(id), Buffer.from(data));
  return true;
});

ipcMain.handle('file:read', async (_e, id) => fs.readFileSync(pathOf(id)));


// ---------- folders: real folders on this computer that the user picked ----------
// The list lives in userData/folders.json and only grows through the folder dialog. 'templates' is the app's own folder for "My templates".
const FOLDER_FILE = () => path.join(app.getPath('userData'), 'folders.json');
const TPL_DIR = () => path.join(app.getPath('userData'), 'templates');
const MAX_READ = 6 * 1024 * 1024;
function readFolders() { try { const l = JSON.parse(fs.readFileSync(FOLDER_FILE(), 'utf8')); return Array.isArray(l) ? l.filter((p) => typeof p === 'string') : []; } catch (_) { return []; } }
function writeFolders(l) { fs.mkdirSync(path.dirname(FOLDER_FILE()), { recursive: true }); fs.writeFileSync(FOLDER_FILE(), JSON.stringify(l)); }
const FOLDERS_DIR = () => path.join(app.getPath('userData'), 'folders');
const inOwn = (p) => path.resolve(p).toLowerCase().startsWith(path.resolve(FOLDERS_DIR()).toLowerCase() + path.sep);
function folderInfo(p) {
  let count = 0, mtime = 0; try { for (const n of fs.readdirSync(p)) if (isDesign(n)) { count++; mtime = Math.max(mtime, fs.statSync(path.join(p, n)).mtimeMs); } if (!mtime) mtime = fs.statSync(p).mtimeMs; } catch (_) { /* missing */ }
  return { path: p, name: path.basename(p) || p, exists: fs.existsSync(p), count, mtime, own: inOwn(p) };
}
function dirOf(key) {
  if (key === 'templates') { fs.mkdirSync(TPL_DIR(), { recursive: true }); return TPL_DIR(); }
  const k = path.resolve(String(key));
  if (!readFolders().some((p) => path.resolve(p).toLowerCase() === k.toLowerCase())) throw new Error('Folder was not chosen by the user');
  return k;
}
const isDesign = (n) => /\.frameout$/i.test(n);
function uniqueIn(dir, name) {
  const base = safeName(name).replace(/\.frameout$/i, '') || 'design';
  let n = base + '.frameout', i = 2;
  while (fs.existsSync(path.join(dir, n))) n = base + ' ' + (i++) + '.frameout';
  return n;
}
ipcMain.handle('folders:list', () => readFolders().map(folderInfo));
ipcMain.handle('folders:add', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Choose a folder for your designs (you can make a new one in this window)', properties: ['openDirectory', 'createDirectory'] });
  if (r.canceled || !r.filePaths.length) return readFolders().map(folderInfo);
  const l = readFolders(); for (const p of r.filePaths) if (!l.some((x) => path.resolve(x).toLowerCase() === path.resolve(p).toLowerCase())) l.push(p);
  writeFolders(l); return l.map(folderInfo);
});
ipcMain.handle('folders:create', (_e, name) => {
  const base = safeName(String(name || '')).replace(/\.+$/, '').trim().slice(0, 60); if (!base) throw new Error('Name needed');
  fs.mkdirSync(FOLDERS_DIR(), { recursive: true }); let n = base, i = 2; while (fs.existsSync(path.join(FOLDERS_DIR(), n))) n = base + ' ' + (i++);
  const p = path.join(FOLDERS_DIR(), n); fs.mkdirSync(p); const l = readFolders(); l.push(p); writeFolders(l); return { list: l.map(folderInfo), path: p };
});
ipcMain.handle('folders:remove', async (_e, p) => { const k = path.resolve(String(p)).toLowerCase(); if (inOwn(p) && readFolders().some((x) => path.resolve(x).toLowerCase() === k) && fs.existsSync(p)) { try { await shell.trashItem(path.resolve(p)); } catch (_) { /* keep the files if the bin fails */ } } writeFolders(readFolders().filter((x) => path.resolve(x).toLowerCase() !== k)); return readFolders().map(folderInfo); });
ipcMain.handle('folders:files', (_e, key) => {
  const dir = dirOf(key); const out = [];
  let names = []; try { names = fs.readdirSync(dir); } catch (_) { return { missing: true, files: [] }; }
  for (const n of names) {
    if (!isDesign(n)) continue;
    try { const st = fs.statSync(path.join(dir, n)); if (!st.isFile()) continue; out.push({ name: n, mtime: st.mtimeMs, size: st.size, text: st.size <= MAX_READ ? fs.readFileSync(path.join(dir, n), 'utf8') : '' }); } catch (_) { /* skip */ }
  }
  out.sort((a, b) => b.mtime - a.mtime); return { missing: false, files: out };
});
ipcMain.handle('folders:import', async (_e, key) => {
  const dir = dirOf(key);
  const r = await dialog.showOpenDialog(win, { title: 'Add Frameout files', properties: ['openFile', 'multiSelections'], filters: [{ name: 'Frameout design', extensions: ['frameout', 'json'] }] });
  if (r.canceled) return 0; let n = 0;
  for (const p of r.filePaths) { try { if (fs.statSync(p).size > MAX_READ) continue; const t = fs.readFileSync(p, 'utf8'); const d = JSON.parse(t); if (!d || !Array.isArray(d.items)) continue; fs.writeFileSync(path.join(dir, uniqueIn(dir, path.basename(p).replace(/\.json$/i, ''))), t); n++; } catch (_) { /* not a design */ } }
  return n;
});
ipcMain.handle('folders:save', (_e, key, name, data, overwrite) => {
  const dir = dirOf(key); const n = overwrite && isDesign(name) ? safeName(name) : uniqueIn(dir, name);
  fs.writeFileSync(path.join(dir, n), Buffer.from(data)); return n;
});
ipcMain.handle('folders:delete', async (_e, key, name) => { if (key !== 'templates' || !isDesign(name)) throw new Error('Not allowed'); const f = path.join(dirOf(key), path.basename(String(name))); if (fs.existsSync(f)) await shell.trashItem(f); return true; });
ipcMain.handle('folders:open', (_e, key) => shell.openPath(dirOf(key)));

ipcMain.handle('app:info', () => ({ name: TITLE, version: app.getVersion() }));



app.whenReady().then(() => {
  // Hard network kill-switch: this app never talks to the internet.
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*', 'ftp://*/*'] }, (_d, cb) => cb({ cancel: true }));
  session.defaultSession.setPermissionRequestHandler((_wc, perm, cb) => cb(false));
  createWindow();
});
app.on('window-all-closed', () => app.quit());
