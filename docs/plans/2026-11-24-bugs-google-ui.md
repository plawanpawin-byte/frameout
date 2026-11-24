# Frameout: Google-style UI + full bug sweep

Spec: the user's request (2026-11-24, Thai): "Fix every bug — I see more bugs than I can describe. Find them yourself by
trying hard to break the app, then fix them. Make the UI look very much like Google's own apps (NotebookLM, AI Studio,
Gemini): the bars, the icons, the layout, the theme, Google UI/UX. Also decide which categories should be added to the bar."
No written spec beyond that; rulings are provisional and logged in D:/Lookout-apps/NOTES.md.

## Global Constraints

- App: D:/Lookout-apps/frameout (Electron, plain JS, no build step, no framework). Files: main.js, preload.js,
  renderer/index.html, renderer/kit.js (shared icon kit + toolbar helpers), renderer/lookout.css (shared base styles),
  renderer/app.css (Frameout styles), renderer/app.js (everything else; a global classic script).
- CSP in index.html: no external fonts, scripts or images. Icons must be inline SVG (Material Symbols "Outlined"
  path data is allowed: Apache-2.0). Font stack stays "Google Sans Text","Google Sans",Roboto,... (no download).
- Dark theme only, Google dark palette already in lookout.css (--bg #131314, surfaces #1e1f20/#282a2c/#333537,
  accent #a8c7fa, accent ink #062e6f). Keep using these tokens; you may add tokens.
- Do not change the .frameout file format or saved-data keys in a way that breaks existing designs.
- Keep FOLDERS_UI = false (user asked for no folders).
- All UI text in plain English, short. No emoji in UI.
- Test harness: `bash D:/Lookout-apps/_tools/run-fo.sh <steps.js> <logname>` runs D:/Lookout-apps/_tools/<steps.js>
  (module.exports = [{code, wait, input, shot}]) in the real app; `code` is evaluated in the renderer, `input` is a list
  of Electron sendInputEvent events, `shot` saves a PNG. Results go to D:/Lookout-apps/_tools/test/out/<logname>.log.res,
  renderer console to <logname>.log. Set LK_USERDATA=<fresh dir under D:/Lookout-apps/_tools/test/> for a clean profile.
  `sel` is a Set. Example step files: D:/Lookout-apps/_tools/st-fo-base.js, st-fo-snap.js, st-fo-autokey.js.
- Commit on branch google-ui in D:/Lookout-apps/frameout. Do not push, do not release, do not bump the version.

## Task 1: Google-style UI (home + editor chrome)

Restyle Frameout so it reads like NotebookLM / Gemini / AI Studio (dark):
- Editor layout like NotebookLM: the left panel, the canvas and the right panel are separate rounded surface
  containers (radius ~16px, surface #1e1f20 or similar) sitting on the --bg background with ~8px gutters; each panel has
  a header row (title + icon button to collapse). No hard 1px divider lines between regions.
- Top app bar ~56px: product mark + "Frameout" at left, the design title in the middle or left (editable, like
  Gemini/NotebookLM title), circular 40px icon buttons with tooltips, one primary pill action (Save) and a
  "Preview" / "Export" style action, Home reachable. Status bar may stay but should be quiet or folded into the panels.
- Home like Gemini/NotebookLM: left navigation drawer with a prominent rounded "New design" button at the top
  (Gemini "New chat" style), pill-shaped nav items with Material-style outlined icons, active item with tonal fill.
  Decide and add useful categories to the nav (ruling to log): at least Home, Recent (all saved designs, newest first),
  Starred (designs the user starred from a card's star button; store the starred list in localStorage), Templates,
  and Settings + Help (keyboard shortcuts) pinned at the bottom. Cards with 16px+ radius, hover state, Google-like
  section headers. Home greeting/title area like NotebookLM's "Welcome" header is welcome.
- Icons: replace the line icons used in the home nav, top bar, dock and panel headers with Material Symbols Outlined
  style SVGs (consistent 20/24px, fill-based, weight ~400). Keep tooltips and aria-labels.
- Floating dock at the bottom of the canvas stays, restyled as a Google-like floating toolbar (rounded 16-28px,
  elevation, tonal selected state).
- Modals, menus (.fly), inputs, toasts: Google Material 3 dark look (rounded 28px dialogs, 12px menus, filled tonal
  inputs with clear focus ring).
- Everything must still work: every button reachable, collapse/restore panels, grips, motion timeline, preview,
  templates, settings, labels toggle (Aa). Take before/after screenshots of home, editor (design), motion and
  preview and save them under D:/Lookout-apps/_tools/test/out/gui-*.png.

## Task 2: Break-it bug sweep

Try hard to break Frameout and fix every bug found. Cover at least: every dock tool (select, frame, rect/ellipse/line
etc., pen, text, image), drawing with tiny/zero/negative drags, multi-select, shift-click, marquee, move/resize/rotate,
snapping, undo/redo across all operations (including after mode switches and deletes), copy/paste/duplicate,
delete, layer panel (rename, hide, lock, reorder), components, links + Preview mode (enter/exit, clicking links,
Escape), motion mode (keyframes, auto keyframe, play/loop, scrub, delete keyframe, duration edits, switching modes
while playing), dev/code mode (copy CSS/SVG), export, save/open/new, home <-> editor round trips, templates, settings,
window resize to small sizes, zoom extremes, keyboard shortcuts while typing in inputs, text editing, empty documents,
very many items, rapid repeated clicks. Watch the renderer console log for every uncaught error. For each bug: write
a harness step that reproduces it, see it fail, fix, see it pass. Keep a list of bugs found/fixed in the report.
