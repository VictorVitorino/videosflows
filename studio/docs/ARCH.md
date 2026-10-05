# ARCH — Canteiro architecture map for builders (F1–F11)

Scope: how "Canteiro · Acervo de Apresentações A&M" is built today, where each planned feature plugs in (file + function + line), and what each change can break.
Sources read in full: `editor.html`, `editor.js`, `runtime.js`, `runtime.css`, `cover.html/css/js`, `assemble.py`, `qa-gate.sh`, `test.js`, `test2.js`, `test-core.js`, `test-cover.js`. Companion specs: `docs/TMG-FEATURES.md` (player índice, rail, chapter card, resumo, ampliar) and `docs/DTS-CONTROLS.md` (effect layers and player dock). This document does not repeat their UI specs; it maps them onto the code and reconciles them.

Every claim marked **(measured)** was checked in Chromium 141 (Playwright) on a private copy of the studio. Probe scripts are in `SP/qa-understand/arch-analyst/` (`p1-model.js` … `p6-f0.js`). Screenshots are in `SHOTS/` = `/tmp/claude-0/-home-user-videosflows/d1659d46-7fc1-552e-ba5d-02ae16117f1f/scratchpad/qa-understand/arch-analyst/shots/`.
`SP` = `/tmp/claude-0/-home-user-videosflows/d1659d46-7fc1-552e-ba5d-02ae16117f1f/scratchpad`. Line numbers refer to the sources as of this analysis (editor.js 1551 lines, runtime.js 484, runtime.css 387, cover.js 636, editor.html 415).

---

## 0. TL;DR — the 15 rules builders must not miss

1. **Baseline is green.** `qa-gate.sh` gives **GATE PASS**: test.js, test2.js, test-core.js (117 checks) and test-cover.js (100 checks), in **5 min 07 s** (measured). Any feature must end with GATE PASS plus its own `test-sNN-*.js`.
2. **Never run the gate in the original folder while someone else is testing.** `assemble.py` overwrites `AM-Studio-Editor.html`. The tests write `shots/`, `shots-cover/` and `saved*.html`, and they reload the HTML from disk during the run.
3. **New deck/slide/anim fields are silently dropped on open, draft restore and slide paste** (measured, §3.4). `safeDeck`/`safeSlide`/`safeEl` (editor.js 137–170) are allow-lists. TMG-FEATURES §4.3 says "export already serialises any slide field". That is true for save and undo, **false for reopen**. Do **F0** first (§10). It is prototyped and verified green.
4. **Unknown *element-level* keys and any `data.*` keys pass through without checks** (measured). `safeEl` does `o = clone(e)`. Any new element or data string that reaches markup must be allow-listed in `safeEl`/`DATA_TOKENS` **and** escaped at render.
5. **The exported HTML must never contain the substrings `onerror`, `onmouseover` or `onclick`.** Test CR-04 (test-core) greps the whole export. This includes comments in runtime/xedit code. Use `addEventListener`, never `el.onclick =`.
6. **`</script` must not appear in runtime/editor/cover/extension code.** `assemble.py` asserts it. Build tags with `var S = 'script'` as `exportHTML` does.
7. **Ribbon at 1280 px has 7 px free; at 1440 px, 17 px** (measured, §13). test-core asserts no ribbon or top-bar overflow at 1280×720. New ribbon buttons require consolidation (§13).
8. **Text-based test locators are case-insensitive substrings.** In **Inserir** exactly one item may contain "forma". In the element context menu exactly one may contain "alinhar". In **Editar** exactly one "colar" and one "desfazer". In **Arquivo** exactly one "abrir…". The first three Inserir items must stay Título / Subtítulo / Texto corrido, and the first Arquivo item "Início (capa)" (§9.5).
9. **Ribbon selectors that tests click must survive:** `[data-add=arrow]`, `[data-menu=mText]`→`[data-text=title]`, `[data-menu=mShape]`→`[data-shape=chevron]`, `#bFx`→`[data-ins=counter]`, `#bModels`→`#mSearch`/`#modelsBody [data-ins=raci|swot]`, `#fxArrow`→`#mVar [data-v=accountable]`, `#bDup #bFront #bSave #bPlay #bNew #bHome #title`.
10. **Cover is pinned:** exactly 6 `.cv-opt` (keys 1–6, 3-column arrow navigation), exactly **5 templates** (7/7/6/6/6 slides), home/projects/manual fit **without scroll** at 1024–1440 widths, no horizontal scroll at 390. History (F2) must not add a `.cv-opt` or a cover template (§11 F2).
11. **Player invariants:** `.amp-pos` text starts with the zero-padded number (`/^01/`). Esc exits present mode when no layer is open. No chapter card on the *initial* `go(start)`, or Shift+F5 → Esc → `#bHome` breaks. `.amp-slide` count = slide count in the export.
12. **The player key handler swallows Space typed inside a contenteditable** in the exported file (measured: 01/07 → 02/07, `defaultPrevented=true`). This blocks F10 notes editing and F11. Fixed in F0.
13. **`file://` pages share one origin in Chromium** (measured). The exported decks and the editor see the same `localStorage` (the export saw `amStudio.draft`) and the same IndexedDB. `file://` is a **secure context** and `showSaveFilePicker` exists (measured). Use this for F2/F10/F11.
14. **Keymap conflict between the two companion specs:** TMG binds **G = Índice**, DTS binds **G = Glow**. Resolution in §12: Glow → **B** ("Brilho").
15. **The modal (`#modal`) is not a form host.** Its capture handler turns **Enter** into "confirm and close", Tab cycles only buttons, and Ctrl+A is blocked (editor.js 1410–1418). Do not put search inputs or textareas in `#modal` without extending that handler (F2, F10).

---

## 1. Files and build

| File | Role | Shipped in exported deck? |
|---|---|---|
| `editor.html` (415 l.) | Editor shell: CSS for the editor UI, DOM skeleton, placeholders `/*%%RTCSS%%*/`, `/*%%RTJS%%*/`, `/*%%EDITOR%%*/`, `%%WM_W%%` | no |
| `editor.js` (1551 l.) | Editor IIFE → `window.AMStudio` | no |
| `runtime.js` (484 l.) | Renderer + FX registry + player IIFE → `window.AMRT` | **yes** (copied verbatim) |
| `runtime.css` (387 l.) | Stage, animations, components, player | **yes** |
| `cover.html/.css/.js` | Start screen ("capa") → `window.AMCover` | no |
| `assemble.py` | Builds `AM-Studio-Editor.html` (≈431 KB, logos as base64) | — |
| `qa-gate.sh` | assemble + all suites | — |
| `*.v1.*`, `*.v2.*`, `models.js`, `saved*.html` | **Legacy, not in the build** (`assemble.py` never reads them). Do not edit them expecting an effect. | — |

**assemble.py** (19 lines), in order:
1. Replaces logo placeholders (`%%LOGO_PERF_W%%`, `%%LOGO_PERF_N%%`, `%%WM_W%%`, `%%WM_N%%`) with data URIs in editor.js, cover.js, cover.html and editor.html. Brand PNGs come from `../am/brand/`.
2. `assert '</script' not in (rt+js+cjs).lower()`.
3. Inlines runtime CSS/JS and editor JS into `editor.html`.
4. Injects `cover.css` into `<head>` and `cover.html` after `<body>`. Appends `<script id="am-cover">` before `</body>`.

**Resulting script order** in `AM-Studio-Editor.html`: `<script id="am-runtime">` (AMRT) → editor `<script>` (AMStudio, runs immediately; `buildModels(); buildDrawer(); renderAll()` at editor.js 1520) → `<script id="am-cover">` (boot on DOMContentLoaded or immediately; reads `window.AMStudio`).

**Exported file** (`exportHTML`, editor.js 1475–1480), measured at about 105 KB for 1 slide:
- `<style>` + runtime.css. **No id** today.
- `<style>html,body{…background:#00192b}</style>`
- `<div id="am-player">`
- `<script type="application/json" id="am-deck-data">` with the deck JSON (`<` escaped as `<`).
- `<script>` + runtime.js. **No id** today.
- `<script>AMRT.player(JSON.parse(…), …, {brand: <wordmark data-URI>})</script>`
- The Google Fonts `<link>` (Inter, JetBrains Mono, Roboto 300–700, Roboto Condensed 400/700).

In the export: `AMRT` is defined, `AMStudio` is undefined, bar buttons are `prev`, `next`, `full` (measured).
`openFile` (1487) and `cover.readDeck` (cover.js 36) recognise a saved deck **only** by `/am-deck-data/` plus `getElementById('am-deck-data')`. Keep that id and `type="application/json"` forever.

---

## 2. Globals, load order, event ownership

| Global | Defined in | Notes |
|---|---|---|
| `window.AMRT` | runtime.js 2–484 | `{W:1280, H:720, FX, FONTS, shapeBody, renderEl, renderSlide, runFx, lineBox, player, esc}` (483). F0 adds `util`. |
| `window.AMStudio` | editor.js 1529–1550 | Public API (§7.13). test-core "API completa" requires 36 keys. |
| `window.AMCover` | cover.js 629 | `{open(s?: 'manual'|'tpl'), openManual(), close(), isOpen(), templates[], buildTemplate(i)}` |

**Keyboard listeners, in dispatch order**:

| # | Listener | Where | Behaviour |
|---|---|---|---|
| 1 | `window` keydown **capture**, modal | editor.js 1410 | When `#modal.open`: `stopImmediatePropagation`. Esc cancels. **Enter confirms whatever has focus.** Tab cycles `#modal button` only. Space prevented outside the modal. F1/F5/Ctrl+S/O/D/P/A prevented. |
| 2 | `window` keydown **capture**, cover | cover.js 558 | When the cover is open (and no modal): `stopPropagation`. Handles F5, Esc, F1/?, digits 1–9 (home/tpl), arrows, **Backspace = back** (non-home views), Tab trap. |
| 3 | `document` keydown, editor | editor.js 1059–1098 | Ignored when a modal or the cover is open. **F5/Shift+F5 handled even while presenting**; everything else returns when `presenting()`. Order: menus → F10/ContextMenu → F1 → Ctrl+S/O/D → contenteditable (Esc blurs) → typing fields → Ctrl+Z/Y/C/X/V/D/A → Esc → focused control (`onControl`) → Delete → Enter → type-to-edit → ? → arrows (nudge or slide). |
| 4 | `document` keydown, player | runtime.js 460–468 | Added per `player()`, removed in `destroy()`. Ignores only `input|textarea|select` (F0 adds contenteditable and modifiers). |

**Pointer**: `#cv` pointerdown (648) selects, moves, resizes, marquees; `wrap` dblclick (751) edits; `document` contextmenu (1375); `document` pointerdown (602) closes menus.

**Z-index stack (measured)**:
- `#sel` 30 (inside `#wrap`) < `#drawer` 35 < `.menu` 40 < `#banner` 45 < `#cover` 70 < `.xmenu` 75 < `#presenter` 80 < `#modal` 200 < `#toast` 210.
- Inside `#presenter`, `.amp` is `position:fixed; z-index:50`.
- The editor CSS also has `.prevov` 25 (preview overlay inside `#wrap`) and `#marq` 33.

---

## 3. Data model

### 3.1 Deck
```js
{ v: 1, app: 'AM Studio', title: 'Nova apresentação', slides: [Slide, …] }   // newDeck(), editor.js 92
```
Coordinates are **logical 1280×720** (`AMRT.W/H`). Rendering converts to `%` (position/size, `P()`) and **`cqw`** (font sizes, paddings, `CQ()`) inside `.am-stage{container-type:size}`. The same deck is therefore pixel-proportional at any size: thumbnails, canvas, drawer previews, player.

### 3.2 Slide
```js
{ id: 'e…', bg: '#FFFFFF', tr: 'fade'|'slide'|'zoom'|'none', bgImg?: 'data:image/…', bgImgOp?: 0..1, els: [El, …] }   // mkSlide, editor.js 91
```
`els` order = z-order (`z-index = index+1`, renderEl 377). Layout presets `LAYOUTS` (editor.js 58–90): `blank-light`, `blank-dark`, `cover`, `content`, `section`, `kpis`, `closing`.

### 3.3 Element (common + per type)
| Field | Types | Notes |
|---|---|---|
| `id` | all | `uid()` = `'e'+7 chars`. Must match `/^[\w-]{1,40}$/` (safeEl). |
| `type` | — | `'text'|'shape'|'line'|'image'|'fx'` (anything else is dropped by `safeEl`) |
| `x,y,w,h` | not line | logical px; `w,h ≥ 8` |
| `x1,y1,x2,y2` | line | Box derived by `lineBox()` (runtime 28): pad = max(14, strokeW·4) |
| `rot` (deg), `opacity` (0–1) | not line | on `.am-rot` / `.am-fxw` |
| `html` | text, shape | Sanitised by `cleanHTML` (editor.js 787; tag allow-list B/I/U/S/SUB/SUP/BR/SPAN/DIV/P/FONT/UL/OL/LI/SMALL/MARK; `style` without url/expression) |
| `font, size, weight, color, align, valign, lh, ls, italic, upper` | text, shape | `TEXT` presets at editor.js 21–28 |
| `bg, radius` | text | text background box |
| `shape, fill, stroke, strokeW, radius, shadow, dash` | shape | `SHAPES` (editor.js 465): rect, round, pill, ellipse, triangle, diamond, para, chevron, arrow |
| `stroke, strokeW, headStart, headEnd, dash` | line | |
| `src, fit, radius, shadow` | image | `safeSrc`: `data:image/`, `http(s):`, `blob:` |
| `kind, variant, data` | fx | `kind` ∈ `AMRT.FX`. `variant` ∈ `FX[kind].variants` (else deleted). `data.panel==='white'` wraps a model in a white panel (runtime 367). |
| `anim` | all | `{in, delay, dur, loop, hover}` (§5.2) |

### 3.4 What survives which path (measured, `p1-model.js`)
| Path | Code | deck.id/nav/comments | slide.notes/sec/title/kind | new `anim.*` keys | unknown el keys (`zoom`, `locked`, `name`) | unknown `data.*` |
|---|---|---|---|---|---|---|
| Undo/redo | `restore(JSON)` 122 | kept | kept | kept | kept | kept |
| Save → file | `exportHTML` 1476 | written | written | written | written | written |
| Open file / drop .html | `openFile` → `loadDeck` → `safeDeck` | **dropped** | **dropped** | **dropped** | kept | kept |
| Draft restore (banner, cover option 3) | `loadDeck(getDraft())` | **dropped** | **dropped** | **dropped** | kept | kept |
| Paste slide (Ctrl+V on thumbnails) | `pastePayload` → `safeSlide` 901 | n/a | **dropped** | **dropped** | kept | kept |
| Paste elements | `safeEl` 908 | n/a | n/a | **dropped** | kept | kept |
| localStorage draft (raw) | `commit` 118 | kept | kept | kept | kept | kept |

After F0 (§10), all rows read "kept" for the allow-listed fields (measured, `p6-f0.js`).

### 3.5 Proposed new optional fields (agreed across specs; all backward compatible)
| Field | Owner | Validation in F0 |
|---|---|---|
| `deck.id` | F2 history, F10 notes key, F11 local edits | `/^[\w-]{1,40}$/`. **Assign in `newDeck()` and in `loadDeck()` when missing** (F2). |
| `deck.created`, `deck.updated` | F2, F11 | finite numbers |
| `deck.nav = {chapters:bool}` | F9 | normalised to `{chapters: x !== false}` |
| `deck.comments = [{id, text, author?, slide?, x?, y?, ts, done?}]` | F11 | text ≤4000 and non-blank, author ≤80, x/y clamped to 1280×720, max 2000 |
| `slide.notes` (≤4000), `slide.sec` (≤80), `slide.secSub` (≤160), `slide.title` (≤160), `slide.kind='section'` | F9, F10 | strings truncated, kind exact |
| `slide.tr='wipe'` | F9 | already passes (`/^\w{1,12}$/`) |
| `anim.spd rep step emph emphAt rest lift glow gcol sweep depth` | F8 | DTS-CONTROLS §5.1 lists |
| line `curve`, `headS`, `headE`, `dashS` | F4 | **add** to `safeEl` with token allow-lists (not in F0) |
| `data.*` for new kinds (`icon`, `color`, `bg`, `motion`…) | F3/F5/F6/F7 | Add style-affecting keys to `DATA_TOKENS` (editor.js 134) **and** escape at render |

---

## 4. FX registry contract (`AMRT.FX`, runtime.js 58–358)

There are 21 kinds today (measured): **12 models** (`model:true`: bars, timeline, process, raci, riskmap, swot, matrix, cardgrid, maturity, linechart, donut, gauge; 42 variants) and **9 plain components** (counter, progress, beacon, headline, card, holo, glass, quote, amlines). Categories: Matrizes, Riscos, Cards, Evolução, Gráficos, Indicadores (models); Números & dados, Destaques, Cards, Marca A&M (components).

```js
FX.kind = {
  name: 'Matriz SWOT',                 // card title, props header, elName()
  cat: 'Matrizes',                     // drawer group; models: MUST be in buildModels order[] (editor.js 1111) or the card is invisible
  model: true,                         // true → Modelos tab (+ variants UI, white panel on dark slides); false → Efeitos tab
  kw: 'swot fofa forças …',            // search keywords (normalised, accent-free) — models only
  label: function (el) { … },          // optional: per-element name → AMRT.fxLabel(el) (props header + "Ampliar" footer); SmartArt → 'SmartArt · Processo'
  w: 980, h: 470,                      // default size (logical px) for mkFx
  variant: 'quadrants',                // default variant (models)
  variants: [[key, label, description], …],   // chips "Efeito do modelo", #mVar menu, drawer card pills; CSS class fxv-<key>
  anim: { in: 'fade', hover: 'lift', dur: 1600 },   // defaults merged into el.anim by mkFx (editor.js 49)
  data: { … },                         // default content (cloned)
  fields: [[key, label, type?], …],    // props panel "Conteúdo" (editor.js 350–358)
  tip: 'Clique numa letra…',           // optional hint (props + variant menu)
  html: function (d, w, h, el) { return '<div class="fx …">…</div>'; }   // pure; d = el.data, w/h = current logical size
};
```

**Field types / codecs** (renderProps 350–357, input handler 409–415, `rowsToText`/`textToRows` 426–437):
| type | UI | stored as |
|---|---|---|
| *(none)* / `'text'` | `<input type=text>` | string |
| `'number'` | `<input type=number step=any>` (`data-n`) | number |
| `'area'` | `<textarea>` | string (renderers split with `lines()`: `\n` **or `;`**) |
| `'lines'` | textarea, `data-codec="lines"` | **array of trimmed non-empty lines.** Leading indentation is lost (blocks tree input for F6). |
| `'rows:a|b:n|*c'` | textarea, one row per line, columns split by `|` | `[{a:'', b:0, c:[…]}]`. `:n` = number (comma decimals accepted). `*c` = rest of the columns as an array. |
| `'sel:v=Label|v2=Label2'` | `<select>` | string |

Plus the automatic toggle `data.panel` ("Painel branco") for `model:true` (358).

**`html()` rules** (follow the existing models):
- Root `<div class="fx …">` (`.fx{position:absolute;inset:0;overflow:hidden}`; add `overflow:visible` inline when labels may spill).
- Style classes `fx-dark|fx-light|fx-ice|fx-clear`.
- Sizes: `CQ(px)` for fonts and paddings; `P(v,total)` for positions; SVG `viewBox="0 0 w h"` with the current w/h.
- Text: always `esc()`. Editable-in-place text uses `E(path, txt, cls)` → `<span data-e="path">`. A double-click on it starts `startFxEdit` (editor.js 714), which writes `setPath(el.data, path, text)`. Optional `data-ep="= "` on that span = a prefix hidden on screen that `startFxEdit` puts back when it commits (unless the typed text already starts with it) — SmartArt Venn's `= Interseção` pill uses it so inline editing never loses the marker.
- Optional `label: function (el) { return 'SmartArt · Processo'; }` = per-element name. `AMRT.fxLabel(el)` returns it (falls back to `name`, then `'Elemento'`) and is what both `elName()` in the editor and the player's "Ampliar" footer show, so the two always agree.
- Clickable cycling cell: `data-cyc="path"` (RACI letters, startMove `up` 709).
- Cycling highlight in the presentation: root `data-cycle="g"` plus children `data-g="k"`. `runFx` adds `.cy-active` and rotates `.cy-on` every 2200 ms after 1900 ms.
- Counters: `data-count`, `data-dec`, `data-from`, `data-pre`, `data-suf`. `runFx` animates 1500 ms (ease-out-expo), starting at `--d` + 250 ms.
- Variant: `fxv-<variant>` on the root. Helper `VV(el, kind)`.
- **CSS for internals lives in runtime.css and must be scoped `.am-in …`** with delays `calc(var(--d,0ms) + …)` so the element's start delay applies. The stage switches `am-pre`→`am-in` to (re)play.

**Private helpers inside the IIFE** (used by models): `esc, P, CQ, fmt, fmtN, lines, E, arr, VV, num`. F0 exports them as `AMRT.util` so new kinds can live in separate files (§10.3).

**Where FX definitions surface in the editor**:
| Surface | Code | Picks |
|---|---|---|
| Modelos tab | `buildModels()` 1110–1117 | `model:true`, grouped by `cat` in **`order = ['Matrizes','Riscos','Cards','Evolução','Gráficos','Indicadores']`** |
| Efeitos tab | `buildDrawer()` 1134–1143 | `!model`, grouped by `cat` in insertion order, after the "Animar o elemento selecionado" chips |
| Preview slide for a card | `previewSlide(k)` 1102–1109 | Dark background for counter/holo/glass/amlines/quote or `data.style==='dark'`; glass gets 2 blobs |
| Insert | `insertFx(kind, style, at)` 563–570 | models: `el.variant = default`; on dark slides `data.panel='white'` **except timeline, process, bars** |
| Props | `renderProps()` 344–359 | variants chips + "▶ Ver efeito no slide" + `tip` + fields |
| Effect pill on canvas | `drawSel()` 216–222 (`#fxArrow`) → `openVarMenu()` 587–594 (`#mVar`) | variants for models, else `ANIM_IN` |
| Clipboard plain text | `dataText()` 838, `NOTEXT` 837 | All string data except tokens |

---

## 5. Rendering and animation system (runtime)

### 5.1 DOM of one element (`renderEl`, runtime.js 371–390)
```
div.am-el.am-t-<type>[.am-k-<kind>] [data-id] [data-in] style="left/top/width/height:% ; z-index ; --d:<delay>ms ; --t:<dur>ms"
  div.am-rot                       (transform: rotate(rot))
    div.am-fxw [data-loop] [data-hover]   (opacity, border-radius = CQ(radius) for image/fx/text)
      <content(el,w,h)>            text: .am-text>.am-tx | shape: <svg>+.am-text | line: <svg> with .am-hit + .am-ln (+.am-head) | image: img.am-img | fx: FX.html()
```
- `--t` defaults to 700 ms (1000 ms for `draw`).
- The editor queries only `.am-el[data-id]` and `.am-tx` (grep-verified). `.am-fxw` and `.am-rot` are used by runtime.css (lines 6–7, 33–50) and `bindTilt` (426–427).
- DTS-CONTROLS §5.2 adds a `.am-hv` wrapper between `.am-rot` and `.am-fxw`. If you do this, **also** add `.am-hv` to the size rule at runtime.css line 6 (`.am-rot,.am-fxw{position:relative;width:100%;height:100%}`), or content with `inset:0` collapses to 0 height. Rewrite line 47 `:has(>.am-fxw[data-hover=tilt])` to target `.am-hv`.

### 5.2 Animation vocabulary today
| Kind | Values | Where defined |
|---|---|---|
| Entrance `anim.in` | none, fade, rise, left, right, zoom, focus, wipe, draw | Labels `ANIM_IN` editor.js 318; tips `ANIM_TIP` 317; CSS runtime.css 12–31 |
| Loop `anim.loop` | none, pulse, float, glow, shimmer | Chips **hard-coded** in renderProps 385; CSS 33–41 (on `.am-fxw[data-loop]`) |
| Hover `anim.hover` | none, lift, zoom, glow, tilt | Chips hard-coded in renderProps 386; CSS 43–50 (**only under `.am-play`**); tilt JS in `bindTilt` |
| Slide transition `slide.tr` | fade, slide, zoom, none | seg in renderProps 337; CSS 137–141 |
| Component internals | 42 model variants + fixed animations of the 9 components | runtime.css 51–132, 159–381 |

The "draw" entrance only animates `.am-ln` paths (lines, `amlines`). The rule "draw only for line/amlines, else wipe" is **hard-coded in 6 places**: editor.js 396 (`applyProp` toast), 441 (`setVariant`), 522 and 531 (`seq`), 590 (`openVarMenu` filter), 1167 (drawer chip). F3 icons with drawable paths should go through a helper `canDraw(el)`.

Known bug (DTS-CONTROLS §4.1, measured there): loop and hover both set `transform` on `.am-fxw`, so a looping element ignores its hover.

### 5.3 Play lifecycle
- `renderSlide(slide, {play})` (391): `.am-stage.am-edit` (editor canvas, thumbnails: static, everything visible) or `.am-stage.am-play.am-pre` (elements with `data-in` at opacity 0).
- **To (re)play**: remove `am-in`, add `am-pre`, force reflow (`void st.offsetWidth`), remove `am-pre`, add `am-in`, then `clean = runFx(st)`. Used by `player.go` (453), `previewEl` (459), `playPreviews` (1148).
- `runFx(st)` (401–423) returns a cleanup that cancels RAFs and timers and strips `cy-*` classes. **Always keep and call the cleanup.** CR-12 asserts zero DOM mutations in `#modelsBody` for 2.5 s once the cover is open.
- Reduced motion (runtime.css 383–387): every `.am-stage *` animation and transition collapses to 0.01 ms × 1 iteration, and `[data-loop]` and the beacon rings are disabled. Anything outside `.am-stage` (player overlays, editor gallery chrome) needs its own reduced-motion rule.

### 5.4 Player (`player(deck, root, opts)`, runtime.js 437–482)
- `opts`: `start` (index), `noHash` (editor: true), `brand` (wordmark URI), `onExit` (editor only: adds "Sair (Esc)").
- Markup (441):
  - `.amp > .amp-view > .amp-deck` (16:9, `width:min(100vw, (100vh-52px)*16/9)`, CSS 136);
  - `.amp-prog` (2 px orange, `bottom:52px`, CSS 158);
  - `.amp-bar` = grid(1fr auto 1fr): `.amp-brand` | `.amp-c` (`prev` · `.amp-pos` · `next`) | `.amp-r` (`exit`?, `full`).
- **All slides are rendered up front** (444–447): one `.amp-slide[data-tr]` > `.am-stage` each.
- `go(i)` (449–458): clamp; same index is a no-op; `clean()`; toggle `.on`; replay (§5.3); update `.amp-pos` (`<b>01</b> / 07`), prev/next disabled, progress width, `history.replaceState('#/N')` unless `noHash`.
- `key(e)` (460–467): → PageDown Space Enter = next; ← PageUp Backspace = previous; Home; End; F = fullscreen; Esc = `onExit`.
- Click (469–474): `[data-a]` buttons; otherwise clicks on the deck in the right 18 % go next and the left 18 % go previous.
- `bindTilt(deckEl)`; hash routing `#/N` (`hashchange`); `go(start)`.
- Returns `{go, destroy}`. **F8/F9/F10/F11 need more**, e.g. `{go, destroy, cur(), deck, list, root, on(evt,fn)}`. Extend the returned object and keep `go`/`destroy` unchanged.
- Editor present mode: `present(start)` (editor.js 1469): closes the drawer, opens `#presenter`, `RT.player(clone(deck), pr, {start, noHash:true, brand, onExit})`.

---

## 6. Undo / commit rules (editor)

- `commit()` (111–121): `JSON.stringify(deck)` compared with `last`. If different: push `last` to `hist` (max 50), clear `fut`, `updUndo()`, `renderThumb(cur)`, and after a 500 ms debounce write `localStorage['amStudio.draft']` (only if < 4.5 M chars, else a one-time toast).
- **Mutate the model, re-render, then `commit()` exactly once per user action.** Live edits (typing in a props field, dragging) mutate without committing; the `change` or `pointerup` commits.
  - `applyProp(path, val, live)` (391): `s.` paths re-render the stage; element paths `rerenderEl`.
  - `nudge` commits after 400 ms (1021).
  - `flush()` (124) commits pending nudges/blurred fields before undo, slide change, save and open.
- `undo()/redo()` (130–131) call `restore(json)` (122), which reloads the deck **without** `safeDeck` (raw JSON) and re-renders all.
- `loadDeck(d)` (171) **resets history** (`hist.length = 0`) and runs `safeDeck`. `isBlank()` (1447) = 1 white slide, no elements, no bgImg, title "Nova apresentação", **no history**. Used by open/new to decide on confirmation.
- `holdProps` (319) prevents re-rendering the panel while finishing a text edit from a panel click.
- `renderAll()` = thumbs + stage + props. `renderStage()` also calls `stopPreview()` and `fit()`.
- Non-visual slide fields (`notes`, `sec`, `title`) should **not** go through `applyProp('s.…')` (it calls `renderStage()` on every keystroke). Special-case them: `setPath` + commit on `change`.

---

## 7. Editor UI map

Screenshot `SHOTS/a03-props-model-selected.png`: model selected, props panel, `#fxArrow` pill. Other views: `SHOTS/a02-editor-template-slide2.png`, `SHOTS/a12-props-slide.png` (no selection), `SHOTS/a05-props-animation-section.png`.

### 7.1 Layout (editor.html 20)
`body` grid: rows `54px 50px 1fr`, columns `var(--side-w) 1fr 304px` (`--side-w` default 196px, adjustable since S18), areas `top / rib / side cv props`.
- `#top` (313–328): brand, `#mbar` (7 menus), `#bHome`, `#title`, `#bUndo` `#bRedo`, spacer, `#bNew` `#bOpen` `#bPlay` `#bSave`, hidden file inputs `#fOpen` `#fImg` `#fBg` (unused).
- `#rib` (330–353): 4 groups (§7.5).
- `#side` (386–389): `#sideHd` (« recolher) + `#sideMini` (faixa recolhida) + `#thumbs` + `#addSlide` + `#sideSplit` (divisória; S18).
- `#cv` (391–394): `#wrap` (`#drophint`, `#sel`, `#marq`; stage inserted first) + `#hint`. `fit()` (180) sizes `#wrap` to `(cv − 56) × (cv − 72)` at 16:9.
- `#props` (396).
- `#drawer` (398–404).
- `#banner`, `#toast`, `#modal`, `#presenter` (405–408).

### 7.2 Selection and zones
`selIds`/`selId` (95, `pick` 103); `zone` ∈ `canvas|thumbs|panel` (`setZone` 109). Thumbnail focus changes copy/paste/delete/duplicate to act on slides.

### 7.3 Props panel (`renderProps`, 320–389)
Three branches:
- **(a) multi-selection** (323–333);
- **(b) nothing selected = slide panel** (334–340): sections Fundo · Transição ao entrar · Animações do slide + help text. **Add F9 "Capítulo" and F10 "Resumo do slide" here, before the help text.**
- **(c) one element** (342–388), sections in this order:
  - header with front/back/dup/del;
  - *Efeito do modelo* (variants);
  - *Conteúdo* (fields);
  - *Posição* (line: X1..Y2) **or** *Posição e tamanho* + *Alinhar no slide*;
  - *Forma* (shape);
  - *Texto* (text/shape);
  - *Imagem*;
  - *Cantos* (fx);
  - **Animação** (entrance select, delay, duration, loop chips, hover chips, "▶ Ver animação no slide"). **F8 layers go into this last section.**

Builder helpers (243–253): `fld(label, inner)`, `num(path, v, step, min, max)`, `txtIn`, `area`, `selIn(path, v, opts, isNum)`, `swatches(path, v, none)` (palette `SW`, 9), `seg(path, v, opts)`, `tog(path, v, label)`.
DOM conventions read by the delegated handlers (409–425):
- `data-p` (input → `applyProp(live)`, change → commit);
- `data-n` (number);
- `data-codec`;
- `data-set` + `data-v` (+ `data-b` = boolean) for click-to-set;
- `data-var` (variant);
- `data-act` → `act(a)` (512–537: del, dup, copy, cut, front/back/top/bottom, al-*, dist-*, seqsel, preset-*, replace, bgimg, bgimgdel, seq, noanim, preview, pvel). **New panel buttons should add `act()` cases.**

### 7.4 Preview overlay
`previewEl(el)` (451–462):
- clones `el` into `.prevov` (a transparent play stage over the canvas);
- hides the real node (`.previewing{opacity:0}`), replays, runs `runFx`;
- auto-stops after 4.2 s (7.2 s if it cycles).

`stopPreview()` (446) runs on any canvas pointerdown, keydown, `setSel` and `renderStage`. The clone keeps the same `id`, so you can preview **a candidate effect without touching the model**: `previewEl(Object.assign(clone(el), {anim: Object.assign({}, el.anim, {in: 'zoom'})}))`. Note that the z-index uses `slide().els.indexOf(el)`, which is −1 for a clone; pass the index.

### 7.5 Ribbon (`#rib`, editor.html 330–353) and old `.menu` popovers (355–384)
| Group | Buttons (selector) | Width at 1280 px (measured) |
|---|---|---|
| 1 Inserir | `[data-menu=mText]` 87 · `[data-menu=mShape]` 99 · `[data-add=line]` 71 · `[data-add=arrow]` 64 · `[data-add=image]` 85 · `[data-menu=mCard]` 90 · `[data-menu=mBrand]` 124 | 641 |
| 2 Biblioteca | `#bModels` 91 · `#bFx` 80 (label "Efeitos" ≤1420) | 182 |
| 3 Editar | `#bFront` 76 · `#bBack` 64 · `#bDup` 70 · `#bDel` 82 | 307 |
| 4 | `#bPreview` 103 ("Deste slide" ≤1420) | 111 |

Handlers:
- `#rib` click (575–582): `data-menu` → `toggleMenu`; `data-add` → `line`/`arrow`/`image`.
- `.menu button` click (604–612): `data-text` → `insertText`; `data-shape` → `mkShape`; `data-fx` (+`data-style`) → `insertFx`; `data-brand`; `data-layout`.
- `#shapeGrid` is generated from `SHAPES` (603). `#mSlide` comes from `LAYOUTS` (613). `#mVar` is the variant/entrance menu.
- Old menus have their own keyboard handling (`oldMenuKey` 1034).
- Responsive label rules: editor.html 299–308. ≤1420 px hides `.lbl` and shows `.lbs`.

### 7.6 App menus (`MENUS`, editor.js 1300–1351) and context menus (1352–1388)
Item schema (`buildX` 1198):
- `{t, ic|raw, k, fn, dis, sub: items|fn, keepEdit, id}`;
- `{sep:1}`;
- `{hd:'Título'}`.

Icons come from `IC` (261–311; 24×24 stroke paths; `svgI(k)`). Menus are functions, evaluated on open.

| Menu | Current items (order matters for tests) |
|---|---|
| `file` | **Início (capa)** · sep · Nova apresentação · **Abrir…** (Ctrl+O) · Salvar apresentação · sep · Apresentar · sep · Recomeçar apresentação… |
| `edit` | Desfazer · Refazer · sep · Recortar · Copiar · **Colar** · Duplicar · sep · Selecionar tudo · Apagar seleção / **Apagar slide** · sep · Limpar slide (text-editing variant at 1309–1318) |
| `insert` | **Título · Subtítulo em destaque · Texto corrido** · **Forma ▸** (`shapeItems`) · sep · Linha · Seta · Imagem… · Cards ▸ · Marca A&M ▸ · sep · Modelos… · Efeitos… |
| `slide` | Novo slide ▸ (`layoutItems`) · Duplicar · sep · Copiar slide · Colar slide · Apagar slide · sep · Mover para cima / baixo |
| `arrange` | Frente/Trás/Topo/Fundo · sep · **Alinhar ▸** · Distribuir ▸ |
| `present` | Do início (F5) · Do slide atual (Shift+F5) |
| `help` | Atalhos de teclado (F1) · Manual da obra |
| ctx element `ctxElItems` 1352 | [Editar texto] · Recortar · Copiar · Colar · Duplicar · Apagar · sep · **Trazer para frente** · Enviar para trás · sep · **Alinhar ▸** · [Distribuir ▸] |
| ctx canvas `ctxCanvasItems` 1363 | Colar · Inserir texto aqui · Inserir modelo… · sep · Novo slide · Selecionar tudo |
| ctx thumbnail `ctxThumbItems` 1368 | Novo slide depois · Duplicar slide · sep · Copiar/Colar/Apagar slide · sep · Mover |

The shortcut list `HK` (1425–1430) is **the single source** for the F1 modal and the cover manual (`S.HK`). Add new shortcuts there.

### 7.7 Biblioteca drawer (`#drawer`)
- Tabs `.dtabs [data-tab=models|fx]`. `setTab` (1126) toggles `#modelsBody` / `#dSearch` / `#drawerBody` and sets title and subtitle.
- `openDrawer(v, tab)` (1151): open/close/toggle; `playPreviews()` now and **every 5.2 s**; on close calls each card's `_clean`.
- `playPreviews` (1144) skips when the cover is open or the tab is hidden. It re-renders every card's stage (21 cards ≈ 12 ms, measured).
- Card markup: `.fxi[draggable][data-k][data-kw] > .pv + .ft(button[data-ins]) [+ .vl pills]`. Drag payload is `text/plain` `'amfx:'+kind`, handled by `wrap` drop (1182–1193).
- Models click (1161): `insertFx`, then `openDrawer(false)`, then toast, then `previewEl` after 250 ms.
- Fx tab clicks (1164–1168): `data-ins` → insertFx; `data-anim` → apply to all selected, commit, **then `present(cur)` (opens full presentation)**.
- Search `#mSearch` (1119): AND of normalised words against `data-kw`; hides empty groups; `#mEmpty`.

Screenshots: `SHOTS/a06-drawer-models.png` and `SHOTS/a07-drawer-fx.png`.

### 7.8 Save / open / draft
- `save(quiet)` (1481): `endEdit`, `flush`, Blob of `exportHTML()`, download `slug(title).html`.
- `openPicker` (1449) confirms when not blank. `#fOpen` change → `openFile`. Dropping a deck file on the canvas confirms, then `openFile`.
- Draft:
  - written by `commit`;
  - start banner (1521–1528) shown if the draft has any element;
  - `newPresentation` clears it;
  - the cover reads it via `getDraft`.
- `beforeunload` prompt when `hist.length` (1517).

### 7.9 Public API (`window.AMStudio`, 1529–1550)
`deck` (getter), `exportHTML`, `present`, `goSlide`, `insertFx`, `addSlide`, `select`, `setVariant`, `previewEl`, `W`, `H`, `BRAND`, `LAYOUTS`, `uid`, `clone`, `toast`, `mk{slide,text,shape,line,image,brand,fx}`, `newDeck`, `loadDeck`, `openFile`, `pickFile`, `openDrawer`, `renderAll`, `commit`, `isEmpty`, `cur` (getter), `HK`, `save`, `getDraft`, `clearDraft`, `hideDraftBanner`, `selected`, `selectMany`, `copy`, `cut`, `paste`, `clearSlide`, `resetDeck`, `showHelp`, `closeMenus`, `confirm(o) → Promise<bool>`.
**Adding keys is safe. Removing or renaming any of the 36 checked keys fails test-core "API completa".**

---

## 8. Cover (`cover.js`)

- Views: `home` (6 options), `tpl` (5 templates + 7-thumbnail strip), `help` (manual). `cover.dataset.view` is read by tests.
- `showView(v)` (482) toggles `#cvHome/#cvTpl/#cvHelp`, plays or pauses the crane scene and focuses.
- `open(opts)` (501) and `close()` (519) handle the `cv-lock` class, focus restore and `clearPreviews()`.
- `guard(title, fn)` (461) asks for confirmation (`#cvConfirm`) before replacing a non-empty work or a saved draft.
- `act(k)` (443):
  - 1 = new;
  - 2 = templates;
  - 3 = resume (back to the current work, or draft);
  - 4 = open file;
  - 5 = Almoxarifado (blank + Modelos drawer);
  - 6 = manual.
- Templates `TPL` (250–349) are built from `S.mk.*` (title/head/capa/fim helpers 205–248).
- Key handler (558): see §2. Note: **Backspace = back** and **`?`/F1 = manual** in non-home views. A future text input in the cover must be guarded.
- Layout: `.cv-menu` 3 columns (cover.css 50); `.cv-tgrid` 5 columns (142); `.cv-strip-row` 7 columns (158); top-right `.cv-topr` (24) holds `#cvLog` ("Diário de obra · date") and `#cvResume`.

---

## 9. Tests and the QA gate

### 9.1 Suites
| Suite | What |
|---|---|
| `test.js` | Smoke: text/shape/arrow/counter, layouts, seq animation, undo/redo, present, save, open the export, reopen |
| `test2.js` | Models drawer, search, RACI interactions, all model kinds on slides, present all, save/reopen |
| `test-core.js` | 117 checks: clipboard, multi-selection, align/distribute, thumbnails, context and app menus, keyboard, modals, F1/F5, API, resize/guides, save/open, 1280 layout, review regressions (IX/CR/CI/VB) |
| `test-cover.js` | 100 checks: cover open/keys/views, 5 templates slide by slide (overlap/overflow via `slideCheck`), draft, open/drop, Almoxarifado, viewports 1440/1280/1366/1024/390, reduced motion |

The whole gate runs in 5 min 07 s (measured); per-suite times were not measured.

### 9.2 How the gate decides (qa-gate.sh)
`run()` marks **FAIL** when the exit code ≠ 0 **or** the output matches `FAIL|pageerror|"errs": \[[^]]|"failed": \[[^]]|FALHAS: [1-9]`. Measured quirks:
- A pretty-printed non-empty `"errs": [\n …` and the compact `{"errs":["x"]}` are **not** caught by the regex. **Your test must `process.exit(1)` on any failure, including console errors.**
- The uppercase substring `FAIL` anywhere in the output fails the suite, even inside a passing check name.
- Each suite gets `timeout 900` s. New suites are picked up by the glob `test-s[0-9][0-9]*.js` (e.g. `test-s01-gallery.js`), in `ls` order, after the 4 core suites.

### 9.3 Template for a new suite (verified with the gate's `run()`: PASS normally, FAIL when a check fails)
File: `SP/qa-understand/arch-analyst/test-s99-template.js`. Copy it to `studio/test-sNN-<feature>.js`. It includes:
- local font routing (`AM_FONTS_DIR` or `../fonts2`);
- a `check(name, ok, info)` collector;
- a console/pageerror collector;
- `L(x,y)` logical→screen mapping from `#wrap`;
- export-and-open of the exported file in a second page;
- the CR-04 grep;
- `process.exit(failed?1:0)`.

Helpers worth copying from test-core:
- `els()`, `selected()`, `center(id)`;
- `openMenu(k)`;
- `menuItem(label)`, `subItem(parent, label)`.

From test-cover: `open({vp, reduce, draft, q})` and `slideCheck(p)`, the overlap/overflow detector. **Reuse `slideCheck` for every new model, chart and SmartArt at its default size.**

### 9.4 Running safely
```bash
# private copy (never the shared folder): assemble.py needs ../am/brand, fonts routing uses ../fonts2
W=$SP/qa-understand/<you>/w; mkdir -p $W/studio && cp $SP/studio/{assemble.py,qa-gate.sh,editor.*,runtime.*,cover.*,test*.js} $W/studio/
ln -sfn $SP/am $W/am; ln -sfn $SP/fonts2 $W/fonts2; cd $W/studio && bash qa-gate.sh
```

### 9.5 Invariants pinned by tests (do not break)
| Invariant | Test |
|---|---|
| Inserir menu: items 1–3 = Título, Subtítulo em destaque, **Texto corrido** (ArrowDown×2 from Título → "Texto corrido", Enter inserts text) | test-core §10 |
| Inserir: exactly **one** item whose text contains "forma" (case-insensitive). It opens a submenu whose **first** item containing "Retângulo" creates a `shape`. **Forbidden new labels**: Formas…, Informação, Transformação, Plataforma, Formato… | test-core §1 (strict `hover()`) |
| Element context menu: exactly one item containing "trazer para frente" and one containing "alinhar" | test-core §9 |
| Editar menu: exactly one "desfazer", one "colar"; with the thumbnail focused, one "apagar slide" | test-core §10, CR-07, IX-12 |
| Arquivo menu: first item "Início (capa)"; exactly one item containing "abrir…" (**not** "Reabrir…") | test-core §14, IX-01 |
| Ribbon/top bar: no overflow at 1280×720; `#bSave` inside the viewport | test-core §16 |
| Selectors: `[data-add=arrow]`, `[data-menu=mText]`, `[data-text=title]`, `[data-menu=mShape]`, `[data-shape=chevron]`, `#bFx`, `[data-ins=counter]`, `#bModels`, `#mSearch`, `#modelsBody .fxi[data-k]`, `[data-ins=raci|swot]`, `#fxArrow`, `#mVar [data-v=accountable]`, `#bDup`, `#bFront`, `#bNew`, `#bSave`, `#bPlay`, `#bHome`, `#title`, `#thumbs .th[data-i] .box`, `#props [data-p="data.value"]`, `#props .sw button[data-v]` | test.js, test2.js, test-core |
| `#modelsBody` gets 0 mutations for 2.5 s after the cover opens over an open drawer | CR-12 |
| Export contains no `onerror|onmouseover|onclick` | CR-04 |
| Player: `.amp-pos` starts with `01`/`02`; Esc exits; `#presenter.open` toggles | test-core §13 |
| Exported file: `.amp-slide` count = slide count; ArrowRight navigates | test.js |
| Cover: 6 `.cv-opt` with keys 1–6; arrows → ↓ ← ↑ = 2,5,4,1 (3-column grid); 5 templates with 7/7/6/6/6 slides and no overlap; fits without scroll ≥1024; no horizontal scroll at 390; option 3 loads the draft; option 5 opens the Modelos tab | test-cover |
| Zero console errors in all suites | all |

---

## 10. F0 — foundation (do first; prototype verified green)

Patch script: `SP/qa-understand/arch-analyst/f0-patch.py <studio_dir>`. It is anchor-checked: every replacement asserts exactly one match.
Result on a private copy: **GATE PASS** (see §15). `p6-f0.js` proves the round-trip and the extension mechanism.

### 10.1 Allow-list the new fields (editor.js)
- Helpers after `numOr` (135): `safeStr(v,n)`, `pickN(v,list,def)`.
- `safeEl` after line 151: the DTS anim keys (`spd rep step emph emphAt rest lift glow gcol sweep depth`) with value lists.
- `safeSlide` before 163: `notes` (4000), `sec` (80), `secSub` (160), `title` (160) and `kind==='section'`.
- New `safeComment(c)`.
- `safeDeck` (166): `id` (`/^[\w-]{1,40}$/`), `nav.chapters`, `created`, `updated`, `comments` (max 2000).

Measured after the patch: loadDeck and save→reopen keep `id`, `nav`, `comments` (blank and bad-id comments normalised), `notes`, `sec`, `secSub`, `title`, `kind`, `spd`, `step`, `emph`, `glow`. Out-of-list `sweep:7` becomes 0.

### 10.2 Player key guard (runtime.js `key()`, 460)
```js
var kt = e.target;
if (kt && (/input|textarea|select/i.test(kt.tagName) || kt.isContentEditable)) return;
if (e.ctrlKey || e.metaKey || e.altKey) return;   // Ctrl+S / Ctrl+Z belong to the edit layer (F11)
```
Measured: Space inside a contenteditable in the export is no longer prevented and does not navigate.

### 10.3 Extension files and `AMRT.util`
- `runtime.js` return (483) adds `util: {E, arr, VV, num, fmt, fmtN, CQ, P, lines, textHTML}`.
- `assemble.py` now:
  - appends `sorted(glob('rt-*.js'))` to runtime.js and `rt-*.css` to runtime.css, **inside** `#am-runtime` / `#am-runtime-css`, so exports carry them;
  - injects `xedit.js` as `<script type="text/plain" id="am-xedit">` (inert in the editor; F11 copies its text into the export);
  - injects `history.js` as `<script id="am-history">` before the cover script;
  - extends the `</script` assertion to all of them.
- Without these files the build only differs by the runtime/editor edits (434 KB).
- Pattern for a new kind (measured working: drawer card, insert, export, render):
```js
/* rt-30-charts.js */
(function (R) { 'use strict'; var U = R.util;
  R.FX.waterfall = { name: 'Gráfico ponte (waterfall)', cat: 'Gráficos', model: true, kw: 'ponte waterfall bridge variação ebitda', w: 900, h: 380, variant: 'build',
    variants: [['build', 'Degrau a degrau', 'Cada barra entra a partir da anterior.'], ['total', 'Total em destaque', 'O total final acende em laranja.']],
    data: { … }, fields: [['items', 'Barras (rótulo | valor)', 'rows:t|v:n']],
    html: function (d, w, h, el) { var v = U.VV(el, 'waterfall'); return '<div class="fx fxwf fxv-' + v + '">…</div>'; } };
})(window.AMRT);
```
- File naming: `rt-10-shapes.js`, `rt-20-icons.js`, `rt-30-charts.js`, `rt-40-smartart.js`, `rt-50-models.js` (+ matching `.css`). One file per feature lets builders work without merge conflicts in runtime.js. The player (F8/F9/F10/F11 player parts) stays in runtime.js; give it **one owner at a time**.
- Reduced motion: the global `.am-stage *{…!important}` rule covers stage content in any file; overlays outside the stage need their own `@media (prefers-reduced-motion:reduce)`.

### 10.3b Status: F0 applied in step S0 (what actually shipped, beyond the prototype)
- **Model** (editor.js `safeEl/safeSlide/safeComment/safeDeck`): everything in §10.1, plus element tokens `EL_TOKENS` (`curve` straight|elbow|curve, `dashS` dash|dot|dashdot|long, `headS`/`headE` arrow|open|dot|diamond|bar, `look` flat|outline|accent|topbar|header|gradient) and `bend` clamped to 0.05–0.95; `DATA_TOKENS` += `name trig accent bg stroke pair layout mode sort` (string values must match `TOKEN_RE` or `COLOR_RE`, so **free text must not use these keys**; render free text with `esc()`/`U.E()`).
- **deck.id**: `newDeck()` sets it, `loadDeck()` assigns one when missing, cover templates get a fresh one per load (`AMStudio.newId()`).
- **Runtime** (`AMRT`): `util = {E, arr, VV, num, fmt, fmtN, CQ, P, lines, textHTML, esc, nid}` (`nid(prefix)` = unique id per render for clipPath/mask/gradient); `AMRT.lineSVG` exposed and, like `AMRT.shapeBody`, called **through `AMRT`** by `content()`, so an `rt-*.js` can wrap either; `AMRT.hooks.player` = functions called with the player handle `{go, cur(), deck, root, deckEl, opts, onDestroy(fn), destroy}` before the first slide plays. The player returns that same handle (`go`/`destroy` unchanged).
- **Key guard**: inputs/textarea/select/contentEditable ignored; Ctrl/⌘/Alt ignored except AltGr. Full map: `docs/KEYMAP.md`.
- **assemble.py**: `rt-*.js`/`rt-*.css` concatenated (sorted, `;` between JS files) inside `#am-runtime`/`#am-runtime-css`; `ed-*.js` → one `<script id="am-ed-…">` each after the editor script; `ed-*.css` → `<style id="am-ed-css">`; `xedit.js` inert; `history.js` → `#am-history`. Build fails on a syntax error (`node --check`), on `</script`/`</style`, or on `onerror|onmouseover|onclick` (any case) in runtime + `rt-*` + xedit.
- **Gate**: decided only by exit codes; new suites start from `test-sNN-template.js`; `test-s00.js` proves all of the above.

### 10.4 Recommended (not in the prototype): one registry for animation vocabularies
Move `ANIM_IN`, `ANIM_TIP` and the hard-coded loop/hover/transition chip lists (editor.js 317–318, 337, 385–386, 1137) into `AMRT.ANIMS = {in:[[k,label,tip,cat]], loop:[…], hover:[…], tr:[…], emph:[…]}`. The editor keeps `ANIM_IN = RT.ANIMS.in.map(...)` so `drawSel`/`openVarMenu`/`buildDrawer` keep working. F1 (gallery), F8 (new effects), props chips and the drawer then read one list.

---

## 11. Feature map — extension points and risks

Notation: `E:` = editor.js, `R:` = runtime.js, `C:` = runtime.css, `H:` = editor.html, `V:` = cover.js. Order recommended: F0 → F1 → F2 → F3 → F4 → F5 → F6 → F7 → F8 → F9 → F10 → F11 (the user's order). Each step ends with `test-sNN-*.js` plus GATE PASS. F1 must be data-driven (§10.4) so F3/F8 additions appear in it automatically.

### F1 — Effects gallery in boxes with live preview + choose/discard
**What exists.** The Efeitos tab (`#drawerBody`) shows 8 entrance chips **without preview**, which apply immediately and open full-screen presentation (E:1167), plus 9 component cards. Loop and hover chips live only in the props panel (E:385–386), also without preview.

**Extension points**:
- `buildDrawer()` E:1134: replace the chips row with box groups:
  - Entrada;
  - Ênfase contínua (loop);
  - Ao passar o mouse (hover);
  - Transição de slide;
  - later F8: Ênfase / Camadas.

  Keep the component cards and their `button[data-ins]` (**test.js clicks `[data-ins=counter]` after `#bFx`**).
- `previewSlide(k)` E:1102: add `previewAnim(kind, value)` returning `{bg, els:[sampleEl]}`. Sample = a navy card or KPI filling ~70 % of the box, with `anim` set to the candidate.
- `playPreviews()` E:1144 and `openDrawer()` E:1151:
  - **do not** re-render ~40 boxes every 5.2 s;
  - play a box on `pointerenter`/`focus`/click, and once in a staggered pass when the tab opens;
  - use an `IntersectionObserver` so off-screen boxes are not played;
  - store and call `card._clean` (CR-12).
- Hover demo: runtime.css hover rules are `:hover`-only (C:44–50). Add `:is(:hover,.am-hov)` so a clicked box can show the hover effect. DTS-CONTROLS plans the same selector.
- Try-then-choose:
  - click a box →
    - if elements are selected, `previewEl(candidateClone)` (§7.4) on the real slide;
    - else play inside the box only;
  - show a decision bar (`.fxdec`, sticky at the drawer bottom): "**Usar este efeito**" (primary) / "**Descartar**". "Usar" is disabled with the hint "Selecione um elemento no slide" when nothing is selected.
  - "Usar" mutates all selected elements, then `rerenderEl`, then **one** `commit()`, then toast "Efeito aplicado · Ctrl+Z desfaz".
  - "Descartar" = `stopPreview()`; the model is untouched.
  - Remove the `present(cur)` jump.
- The pill menu `#mVar` (E:587–599) can get a footer link "Ver todos em caixas…" → `openDrawer(true,'fx')` with the current element selected.

**Risks**:
- (a) CR-12 mutation check. Gallery timers and observers must stop on drawer close **and** when the cover opens (`coverOpen()` guard).
- (b) `stopPreview()` runs on any keydown and canvas pointerdown. Clicking "Usar" inside the drawer must not stop the preview first (drawer pointerdown only sets the zone, which is fine).
- (c) The drawer is `min(560px,92vw)` wide. Box grid: 3 columns ≥520 px, 2 columns below; boxes are 16:9.
- (d) Keyboard: boxes are `<button>`s. The editor ignores keys on focused controls (`onControl`, E:1085), so Enter and Space are native; Esc closes the drawer (E:1084).
- (e) test2 uses `#modelsBody` only. Keep the Modelos tab untouched.

### F1 status: shipped in step S1 (what actually exists now)
- **One vocabulary** `AMRT.ANIMS = {in, loop, hover, tr}` in runtime.js, rows `[key, label, what it does, when to use, only?]` (`only`: `'ln'` = drawable strokes via the editor's `canDraw(el)`, `'tx'` = text/shape). The editor derives `ANIM_IN`/`ANIM_TIP` from it; the props chips (loop, hover), the slide-panel transition chips (now chips, not a seg), the `#mVar` entrance menu and the gallery all read it. A new family (e.g. F8 `emph`) only needs `AMRT.ANIMS.emph = [...]` + CSS: the gallery shows it (chip "Ênfase") and "Usar" writes `anim.emph`.
- **New effects (runtime.css, prefixed `amx*` / `ampx*`)**: entradas `iris diag wipeup drop pop land flip grow words` ("Palavra a palavra" splits `.am-tx` text nodes into `.amx-w` spans **only in play stages** — `renderSlide(…,{play:true})` —, never in `.am-edit`, so saved HTML never changes); contínuos `beacon flow drift breathe wiggle beat`; mouse `spot sheen ring uline lean inzoom`; transições `navy iris up blur` (`.amp-deck:has(>.amp-slide.on[data-tr=…])` drives the outgoing slide). Totals: 17 entradas, 10 contínuos, 10 mouse, 7 transições.
- **Loop/hover conflict fixed** (DTS §4.1): `amPulse`/`amFloat` and all new loops animate the individual `scale`/`translate`/`rotate` properties, so a hover `transform` composes (test S01-41). F8 may still move hover rules to `.am-hv`.
- **`.am-hov`** simulates hover: every hover rule is `:is(:hover,.am-hov)` (same specificity as before). The F8 tour can reuse it. `AMRT.bindTilt(root)` is exported. Shapes' `.am-fxw` now carries the same corner radius as their SVG body (ellipse 50 %, pill, round, rect with radius), so Reflexo, Sinalizar, Contorno and Varrer luz follow the shape. FX components without their own `radius` copy the card's corner onto `.am-fxw` (inline radius of the first `.fx` child, or `FX_RAD` for `.fxh .fxg .fxcd .fxq .fx-panel`), so the rings follow the KPI counter, cards and quotes too.
- **Gallery** (editor.js, "vitrine de efeitos"): items = ANIMS families + `AMRT.FX` (`!model` → "Componentes", one box per kind or per variant; `model` → "Modelos animados", one box per variant). `GX_SAMPLE` picks the sample (card, text, line, badge, photo, bar, trio). IntersectionObserver (root `#drawerBody`) renders a box the first time it is visible and adds `.gx-off` (CSS paused) when it leaves; one 200 ms ticker replays entrances, toggles hover/transition boxes; `gxRun()` stops it when the drawer closes or switches tab, `gxTick` pauses (`.gx-paused`) under the cover or a hidden tab. The old fx-tab chips (`data-anim`, apply + `present()`) are gone; component boxes keep `button[data-ins]` ("Inserir" quick insert, test.js).
- **Provador** (`#gxProv`, sibling of `#drawerBody`): stage = clone of the current slide with the candidate on the selected compatible elements (others `in:'none'`), or the sample when nothing is selected; transitions play previous slide → current; components/models show the new element in place. "Usar este efeito" = **one** `commit()` (anim path, `slide.tr`, `insertFx(kind,null,null,variant)` or variant swap); "Descartar"/Esc/"‹ Vitrine" change nothing. `renderProps()` → `galSync()` keeps "Em uso" badges and the Provador in sync with selection, slide and undo/redo. Keys while it is open: KEYMAP §5 (`gxKeys`: nothing reaches the slide behind it). The label "Slide N · …" and "Repetir" sit in a caption bar under the stage (`.gp-cap`), never over the slide. Box footer: category chip on its own line, name up to 2 lines, "quando usar" up to 2 lines; component/model boxes carry the quick "Inserir" as a pill over the preview corner (only "+" at rest on hover devices). Dragging a box sends `amfx:kind[:variant]`, so a model-effect box inserts that variant. `'tx'` (Palavra a palavra) needs real text: a text element or a shape whose html is not empty.
- **API**: `AMStudio.gallery = {open(fam, q), tryFx(id), use(), discard(), current(), items()}`; ids are `in:iris`, `tr:navy`, `cmp:counter`, `model:bars:grow`.
- **Wide mode** "Ampliar a vitrine" (`#drawer.gxw`, remembered in `localStorage['amStudio.gxWide']`, hidden ≤760 px); the Provador goes side by side via a container query (≥720 px).
- Suite: `test-s01.js` (52 checks, ~60 s; S01-45…51 cover the QA round 1 fixes).

### F2 — Presentation history (IndexedDB) with reopen/edit
**Facts (measured)**:
- IndexedDB works on `file://` with ~1 GB quota in headless, and is **shared with every local HTML file** in Chromium, including exported decks.
- `localStorage['amStudio.draft']` must keep its current semantics; cover tests pin them.

**Extension points**:
- New `history.js` (F0 injects it as `#am-history`, editor-only) exposing `window.AMHist`:
  - `list()`, `get(id)`, `put(deck, json, reason)`, `remove(id)`, `snaps(id)`, `restoreSnap(id, ts)`;
  - all Promise-based and wrapped in try/catch; it disables itself if `indexedDB.open` throws or errors.
- DB `canteiro`, v1, stores:
  - `meta` (keyPath `id`: `{id, title, slides, updated, created, firstSlide}`; small, used for the list);
  - `decks` (keyPath `id`: `{id, json}`);
  - `snaps` (autoIncrement, index `deck`, keep the last 20 per deck).
- `newDeck()` E:92: add `id`, `created`.
- `loadDeck()` E:171: if `!deck.id` assign one (templates, old files). **Do not write to history on load.**
- `commit()` E:111–121: after the draft timer, `AMHist.touch(deck, now)` with its **own** ~1500 ms debounce, reusing the already computed `now` string. Skip when `isBlank()`. Flush on `visibilitychange:hidden`/`pagehide`.
- `save()` E:1481: snapshot reason "Arquivo salvo".
- UI, editor: `MENUS.file` E:1301–1306, add "Histórico de apresentações…" **after** "Abrir…" (keeps "Início (capa)" first; does not contain "abrir…").
- UI, cover: a new view `hist` (`#cvHist`, like `#cvTpl`).
  - Changes: `showView` V:482, `hints()` V:435, `back()` V:557, `window.AMCover.open('hist')` V:629.
  - Entry point: a ghost button "Obras recentes" in `.cv-topr` (cover.css 24), icon-only below 640 px. **Not** a 7th `.cv-opt`. **Not** a rail on home (home must fit without scroll at 1024×768).
  - Cards: render `firstSlide` with `RT.renderSlide(…,{play:false})` (same as `stageOf` V:353). Each shows title, slide count, "há 5 min", and the actions Abrir · Duplicar · Baixar .html · Excluir · Versões.
  - "Abrir" goes through `guard()` V:461 then `load(d, msg)` then `close()`.
- Search input inside the cover: guard the cover key handler V:558 so that when the target is an input/textarea only Esc and Tab are handled (today Backspace = back and `?` = manual).

**Risks**:
- (a) Cover pins (6 options, keys, fit, 390 px). Use a panel view with internal scroll (`overflow:auto` on the grid only).
- (b) **Do not put the list in `#modal`** (Enter closes it, Tab skips inputs).
- (c) `pageerror` catches unhandled rejections. Every IDB promise needs `.catch`.
- (d) Large image decks: store the string; never re-stringify in the list path.
- (e) A file reopened twice shares the same `id` (same entry, last write wins). "Duplicar" assigns a new id.
- (f) Privacy note for the UI copy: any local HTML in the same browser can read the DB.
- (g) Firefox gives each file:// file its own origin. Show "Histórico indisponível neste navegador" when the DB is empty and unavailable.

### F2 status: shipped in step S2 (what actually exists now; differs from the proposal above where noted)
- **Storage** (`history.js` → `<script id="am-history">`, editor only, never exported): `window.AMHist`. IndexedDB `canteiro` v1, **one** store `obras` (keyPath `id` = `deck.id`), record `{id, title, createdAt, updatedAt, slideCount, deck}` (`deck` = plain object). No `meta`/`decks`/`snaps` split and no versions in v1. Fallback `localStorage['canteiro.obras']` = `{v:1, obras:{id: record}}` when `indexedDB` is missing or `open` throws/errs (5 s timeout); records left there are migrated into IndexedDB on the next session that has it (newest wins). Neither available → `kind() === 'none'`: everything resolves `null`/`false`, the UI says "Histórico indisponível neste navegador".
- **Contract**: every method returns a Promise that never rejects; writes go through one queue (`seq`), so rename/duplicate/delete/import/autosave never interleave. API: `ready` (Promise of the kind), `kind() available() count() metas() recent() has(id) pending()`, `list() get(id) refresh()`, `put(deck) touch(json) flush() saveNow()`, `rename(id,t) duplicate(id) remove(id)`, `exportJSON() importJSON(text)`, `on(fn)` (called with the metas after every change). Quota/write failures toast once per session (S.toast), never throw.
- **Who writes**: `commit()` → `AMHist.touch(now)` (its own 1200 ms debounce; flushed on `pagehide`/`visibilitychange:hidden`, before the hist view renders and before switching obras); `loadDeck(d, msg, quiet, noHist)` → `put` (open file, drop, template, draft restore, "Retomar obra") unless `noHist` (opening **from** the acervo does not bump `updatedAt`); `save()` → `saveNow()`. A pristine deck (1 white empty slide, title "Nova apresentação") is not stored unless it is already in the acervo. **Deviation from the proposal above**: the task asked to store on open/template load, so loads do write.
- **Editor API added** (`AMStudio`): `safeDeck` (validation used by import and by the cover before rendering/exporting stored decks), `exportDeck(d)` (= `exportHTML(d)`, which now accepts an optional deck), `slug`, `download(name, text, type)`, `openObras()`, `setTitle(t)` (renaming the open obra from the cover). Arquivo menu: "Minhas obras…" right after "Abrir…" (icon `obras`).
- **Cover** (`cover.js/.css/.html`): top-right ghost button `#cvHistBtn` "Minhas obras (N)" (icon only ≤640 px, label kept for screen readers; key **M** on home), view `hist` (`#cvHist`): header + count, toolbar (search `#cvHistQ`, sort seg Recentes/Nome remembered in `localStorage['canteiro.obrasOrdem']`, "Importar acervo", "Exportar acervo (.json)"), grid `#cvHistGrid` of `.cv-hcard` (preview = `RT.renderSlide(safeDeck(slide 1))`, lazily via IntersectionObserver; hover/focus plays the entrance with `am-play`/`am-in` + `runFx`; "Aberta no editor" tag; meta "07 slides · editado há 5 min"; actions Abrir e editar · Duplicar · Renomear (inline input, F2 or double-click the name) · Baixar .html · Excluir (white A&M confirm `#cvConfirm`, orange "Excluir")), empty states (none yet / no search match / unavailable) and the honest note "Suas obras ficam salvas neste navegador; use Exportar acervo para levar a outro computador." The grid scrolls inside the panel (`.cv-main` gets `flex:1 1 0` in this view; `grid-auto-rows:max-content`, bottom fade `.cv-hmore`); on phones the page scrolls instead.
- **Switching obras** from the hist view never asks for confirmation when the current work was just saved to the acervo (`saveNow()` resolved true); it falls back to the old `guard()` when the acervo is unavailable, and warns about a draft only when the draft is not in the acervo. `guard()` now calls `ask(title, desc, ok, fn)`, the same confirm used by "Excluir".
- **Option 3** keeps its pinned behaviour (resume → draft) and, with no draft, becomes "Retomar obra" for the most recent obra ("7 slides · há 5 min"); when the acervo finishes loading after the cover opened, focus moves to option 3 only if nobody moved it.
- **Opened from the editor** (`AMCover.openHist()`, Arquivo › Minhas obras…): Esc / "Voltar à obra" closes the cover (like the manual from Ajuda). `AMCover.open('hist')` opens the view without that return.
- Import accepts the exported acervo, a list of records, one record or a bare deck; every deck passes `safeDeck`; merge by id, newest `updatedAt` wins; dates are preserved. Export file: `canteiro-acervo-AAAA-MM-DD.json` `{app, kind:'canteiro-acervo', v:1, exportedAt, count, obras}`.
- Suite: `test-s02.js` (59 checks, ~70 s).

### F3 — Icon Motion library
**Recommended design.**
- New kind `icon` in `rt-20-icons.js` / `rt-20-icons.css`:
  - `model:false`;
  - `cat: 'Ícones animados'` (appears automatically in the Efeitos tab);
  - `variants` = motions so the existing variant UI (chips, `#fxArrow`, `#mVar`) is the motion picker. Motions: draw (traço se desenhando), pop, pulse, beat, float, spin, shake, bounce, wiggle, ring/ping.
- `data: {name:'target', color:'#002A46', accent:'#F78C16', bg:'none'|'circle'|'square'|'ring', stroke:2}`.
- Icons: a map `ICONS[name] = [d1, d2, …]` of 24×24 stroke paths, ~60 consulting icons (≈12 KB):
  - target, trending-up/down, users, briefcase, building, chart-bar/pie/line, clock, calendar, flag, rocket, lightbulb, gear, shield, lock, globe, coins/R$;
  - handshake, document, search, megaphone, leaf, bolt, star, check-circle, alert, refresh, cloud, database, cpu, link, layers, puzzle, map-pin, mail, chat, award, compass, scale, truck, factory, cart, money, team, idea, growth, risk, ai/sparkles.
- Render `<path class="am-ln ic-p" pathLength="1" d="…" stroke="currentColor" fill="none">` so the **existing "Desenhar" entrance and `amDraw` work on icons**. Then generalise the 6 hard-coded "line/amlines only" checks (§5.2) to `canDraw(el)`.
- Picker:
  - ribbon "Ícones ▾" (§13) and Inserir › "Ícone animado ▸" (submenu: favourites + "Ver todos…");
  - a popover grid (`.menu.icmenu`, 6 columns, search box). **Not** in `#modal`.
- Props: a new field type `'icon'` rendered as a mini grid with `data-set="data.name"` (renderProps E:350–357 adds a branch; the click handler already supports `data-set`).

**Risks**:
- `DATA_TOKENS` (E:134) lacks `bg`, `accent`, `name`. Add them so pasted or opened values are validated. Escape `name` (a lookup key).
- Licence: hand-drawn icons, or keep the upstream licence header (ISC/MIT) in the CSS/JS comment. The comment must not contain `onclick`.
- Infinite loops are cut by reduced motion (fine).
- Keep icon SVG `overflow:visible` for pop/beat so the scale does not clip.

### F3 status: shipped in step S3 (what actually exists now; follows CATALOG §A, differences noted)
- **Runtime** `rt-20-icons.js` / `rt-20-icons.css` (exported with every deck): the CATALOG §A.7 data (54 icons, 8 groups, 7 morph glyphs/pairs) **inside** the IIFE (no globals), `FX.icon` and `FX.iconmorph` (`cat:'Ícones animados'`, `model:false`), 17 motions as `variants` (`auto` is labelled **“Padrão do ícone”**, not “Movimento do ícone”, so the chip, the `#fxArrow` pill and the section title don't repeat each other), 8 triggers (`AMRT.IC_TRIGS`). Exposed for the editor: `AMRT.ICONS`, `ICON_GROUPS`, `ICON_MORPHS`, `IC_MO`, `IC_TRIGS`, `iconFind(k)` (own-property lookup), `iconSVG(k, cls)` (static SVG, accent strokes `.ic-ax`), `bindIcons(root)`. FX definitions carry `gal` (`'icon'` = one component box plus one box per motion in the gallery family “Ícones”; `'one'` = a single component box) and `vtitle` (props section title). Keyframes `ic*` only.
- **Player**: `bindIcons` is registered through `AMRT.hooks.player` (runtime.js unchanged); hover/click play the motion once (`.ic-go` for `data-ms`), the click trigger and the morph `stopPropagation` (18 % zones never advance). The editor stage stays static; `previewEl` and the Provador force `trig:'in-loop'` / morph `loop` **only on the clone** so the motion is visible without hovering.
- **Differences from §A.5**: strokes use `--is` (falls back to `--ic`): white strokes on an ice plate (`soft`/`circle`) render navy and the navy plate forces white strokes, while the label keeps `--ic` (the prototype made the label white on the navy plate, invisible on white slides). White accent on an ice plate falls back to orange. The label font shrinks so its longest word fits the icon width (`overflow-wrap:anywhere` as last resort).
- **Editor** (editor.js / editor.html): `isStroke(el)` (lines, Linhas A&M) vs `canDraw(el)` (+ `icon`, `iconmorph`): “Desenhar” is offered for icons, “Fluxo contínuo” is not; `onlyMsg(it)` adapts the Provador message. `mkFx(…, dark)` sets `data.color='#FFFFFF'` for icons. `insertFx(kind, style, at, variant, data)` (5th arg optional, merged before the single commit). Field type `'icon'` (`iconField`: search + 6-column grid with `data-set`, current icon centred, “Ver todos os ícones, com prévia” → picker). For `gal:'icon'` the Conteúdo section comes before the motion chips; Animação shows “Velocidade do traço” (Rápido 500 / Normal 900 / Lento 1600 → `anim.dur`) when the entrance is Desenhar. `elName` = “Ícone · Alvo”.
- **Picker** `#icMenu.menu.icmenu` (popover; `closeOld()` closes it; the generic `.menu button` click handler skips it): search (accent-free, every word, also matches the theme name), 10 chips with counts (Todos, 8 themes, Transformações), grouped grid when unfiltered, hover/focus preview (`.ic-go`, morph shows state B), footer readout, roving tabindex, drag (`amfx:icon::<k>` / `amfx:iconmorph::<pair>`; the canvas drop reads the 3rd field via `dropData`). Keys: KEYMAP §5. Entry points: ribbon `#bIcons` (`data-menu="icMenu"`), Inserir › “Ícone animado ▸” (8 favourites with their glyph + “Ver todos os ícones…”), props button. API: `AMStudio.icons = {open(opts), close(), isOpen(), favorites}`.
- **Gallery**: family `icon` (“Ícones”, 18 boxes = `auto` + 17, sample icon per motion in `IC_SAMPLE`, e.g. tick → clock); `cmp` keeps exactly one box per non-model kind (S01-05). Provador: selected icons → variant swap (message names the real trigger); nothing selected → inserts the sample icon with that motion.
- **Ribbon consolidation (§13 applied)**: “Linha” + “Seta” → split “Seta” `[data-add=arrow]` + ▾ `[data-menu=mLine]` (`#mLine`: Linha · Seta · Seta dupla, `data-line`; dashed options wait for F4's dash fix); “Ícones ▾” after Imagem; “Marca A&M” → “Marca” ≤1420; edit group icon-only **≤1600** (not 1420: with full labels the ribbon needs ~1540 px). Measured: no overflow at 1180–1920 (baseline overflowed at 1180; 1024 still overflows, by 115 px instead of 249). The button is hidden when the runtime has no icons (S00's temp build).
- Suite: `test-s03.js` (46 checks, ~50 s).

### F4 — More lines, arrows, connectors, rectangles and shapes
**Extension points**:
- Shapes:
  - `shapeBody(el,w,h)` R:13–27 adds cases: snip, callout, hexagon, pentagon (home plate), octagon, plus, star, cylinder, document, frame, bracket, double-chevron, tag, rounded-top tab;
  - `SHAPES` E:465 feeds `#shapeGrid` E:603, `shapeItems()` E:1286 and the props "Tipo" select E:367. **Keep `rect` first** (test-core "Retângulo") and `chevron` (test.js);
  - `mkShape` E:36–40 sizes the shape (`sq` list) and defaults the fill;
  - text inset per shape (callout tail, triangle) via an inset map in `content()` R:362.
- Lines/connectors:
  - `lineSVG(el)` R:33–46: `el.curve` = straight | elbow | curve.
    - elbow: `M x1 y1 H mx V y2 H x2`;
    - curve: `M x1 y1 C mx y1, mx y2, x2 y2`;
    - both stay inside `lineBox`.
  - Heads: `headS`/`headE` = arrow | open | dot | bar | diamond (keep the booleans `headStart`/`headEnd` for old decks).
  - Dash style `dashS` = dash | dot.
  - The arrowhead angle must use the **final segment** (elbow: horizontal; curve: tangent `x2 − mx`).
- **Keep `.am-hit` identical to the drawn path** and `.am-ln pathLength="1"`. Tests IX-04 (click on the stroke selects it, a click far from it selects the shape behind, double-click in the empty box creates text) and the "draw" entrance depend on this.
- `mkLine` E:41.
- Line props E:360–362: chips for the style and the head type.
- `safeEl` E:142: add a token allow-list for `curve|headS|headE|dashS`.
- `drawSel` p1/p2 handles E:204–205 and `startResize` E:734–737 are unchanged (endpoint-based).
- Ribbon: turn the "Seta" button into a **split button**:
  - `button.rb[data-add=arrow]` "↗ Seta" (test.js clicks it);
  - `button.rb.rb-car[data-menu=mLine]` "▾" with the gallery of lines/connectors;
  - remove the separate "Linha" button (no test uses `[data-add=line]`).
- Inserir menu: replace "Linha"/"Seta" with "Linhas e setas ▸" (avoid "forma").
- Optional phase 2, connectors that follow shapes: `el.from/to = {id, side}`. Recompute in `startMove.mv` E:689–703, `startResize.mv` E:732, `nudge` E:1021, `alignTo`/`distribute` (via `act` E:519–520), and remap ids in `dupSel`/paste/`freshSlide`. High risk; only after the rest is green.

**Risks**: test-cover `slideCheck` measures `svg path` bounds. A callout tail or star outside the element box is flagged when used in templates.

### F4 status: shipped in step S4 (what actually exists now; follows CATALOG §B, differences noted)
- **Dashed-line bug fixed in `runtime.js` `lineSVG`** (base, used when no `rt-10` is loaded): a dashed line's visible stroke is `.am-lnd` (no `pathLength`, `stroke-dasharray` in real units, `--dp` = one pattern period); “Desenhar” animates a `<mask>` whose path is the `.am-ln` (`pathLength=1`); mask id from `util.nid('lm')`. Solid lines keep exactly the old markup. `runtime.css`: `mask .am-ln` stays full under “Fluxo contínuo”, and the flow loop moves the dashes themselves (`amxDash` on `.am-lnd`); reduced motion stops `.am-lnd` too.
- **`rt-10-shapes.js`** (no `.css`): replaces `AMRT.lineSVG` (routes `curve` straight/elbow/curve, `bend` 0.05–0.95 clamped at render, 4 `dashS` styles in multiples of the stroke width, 5 head kinds per end via `headS`/`headE`; the old booleans still mean “arrow”; a valid `headS`/`headE` wins), wraps `AMRT.shapeBody` (15 new shapes, then `cardLook` for rect/round/pill) and sets `AMRT.shapeInset` (text inset per shape, applied by `content()` in runtime.js) and `AMRT.shapeText(el, w, h, html)` (hook in `content()`; for `look:'header'` the title gets its own navy background edge to edge, clipped to the card radius, min 26 % of the height, so the band grows with the title). Exposes `SHAPES_X`, `LOOKS`, `LINE_ROUTES`, `LINE_DASHES`, `LINE_HEADS`, `lineBendPt(el)`. Every clip/mask/filter/gradient id comes from `util.nid`. Old decks render pixel-identical (test-s04 compares against the pre-S4 code).
- **Looks: 8, not 6.** CATALOG's six (`flat`, `outline`, `accent`, `topbar`, `header`, `gradient`) plus `lift` (“Elevado”: white card with its own SVG drop shadow) and `ice` (“Gelo”: white→ice translucent gradient with an inner light edge). `EL_TOKENS.look` gained both. `outline`/`lift`/`ice` only replace the stroke when the element has none (`strokeW` 0), so a user stroke survives.
- **Editor**: `SHAPES` = 9 base + `RT.SHAPES_X` (labels in pt-BR; `rect` first; the block arrow is “Seta bloco dupla” so it never clashes with the line “Seta dupla”); `SHAPE_GROUPS` (Retângulos e cards · Básicas · Setas · Fluxo · Chaves); `LOOKS`; `mkShape` sizes per CATALOG (brackets/braces: `fill:'none'`, stroke navy or white, `strokeW:3`, text navy on light slides); `mkCard(look, dark)` + `applyLook(el, k)` (keeps the text legible: navy on light looks, white on dark ones; `header` makes the card white with a hairline and puts the title on top). Ribbon “Formas ▾” = `#mShape.gmenu` grouped gallery (6 columns; small neighbouring groups share a row; 24 shapes + 7 ready cards `data-look`). “Seta ▾” (`#mLine`) = `LINE_PRESETS` (8 lines, thumbnails drawn by the runtime, `data-line`). Inserir: “Forma ▸” is a two-column `xmenu.xcols` (items `cls` on the array; ← → ↑ ↓ follow the grid) with “Cards com estilo ▸”; “Linha” + “Seta” became “Linhas e setas ▸” (`xwide`).
- **Props**: line section `lineSec(el)` (Traçado seg, “Dobra do cotovelo” range, Tracejado seg, Ponta no início / no fim segs, Inverter) through `act('ln-…')` → `lineAct` (one commit; the boolean is always written with the kind; arrow/plain dash don't write `headS`/`dashS`). Shape section: grouped Tipo select, “Estilo do card” tiles (`act('look-…')`), brackets/braces show “Cor do traço” + “Espessura do traço” only; switching to/from them moves the colour between fill and stroke (`shapeSwitch`). Canvas: elbow lines get a third handle `.hdl.bd[data-h=bend]` (drag = one commit).
- **Pinned assertion changed**: S03-08 compared the whole `#mLine` list with `Linha|Seta|Seta dupla`; it now checks those as the first three (the menu has 8 presets by design).
- **QA round 2 fixes**: ring (`Anel`) = band of 15 % of the smaller side, text inset to the hole (`INSET.ring='15%'`; the band was 20 %) and the text takes the slide text colour (`mkShape`: navy on light, white on dark; `shapeSwitch`: to ring = slide colour, away from ring = `inkOn`). Star text inset `28% 17% 30% 17%` (the arms band) and `PADX` (star, ring: 4 px side padding via `shapeText`), so common words never break mid-word at the default size. `mkShape` on a dark slide fills with steel `#43698F` (was `#13315C`, nearly invisible on navy); `mkCard` keeps `#13315C` on dark (tone-on-tone cards). Texto › vertical alignment is disabled (top marked) for `look:'header'` (`vaSeg`). Player bar ≤ 480 px: prev/next show only the arrow (`.amp-bw` words hidden, `aria-label` kept) and the deck title hides, so the A&M wordmark fits.
- Suite: `test-s04.js` (50 checks, ~35 s).

### F5 — More charts + "Ampliar gráfico"
**Charts.** New models in `rt-30-charts.js/.css` with `cat:'Gráficos'` (already in the drawer order):
- colunas agrupadas, barras horizontais (ranking), empilhadas / 100 %, ponte (waterfall), área, combo barra+linha, dispersão/bolhas, funil, pizza, radar, bullet (meta vs real), Pareto, mapa de calor (tabela), sparkline KPI.

Multi-series input: `'rows:t|*v'` (label | values…) plus a `series` `'lines'` field. Follow `bars`/`linechart`:
- SVG `viewBox` = current w,h;
- values with `fmt` in pt-BR;
- highlight in orange only;
- `E()` for category labels.

**Ampliar.** Player-level. See TMG-FEATURES §5.4 (`.amp-zb` button on hover over zoomable elements, `.amp-zm` overlay, key **Z**, ←/→ between zoomables, Esc).
- Zoomable = `type==='fx'` with cat in Gráficos | Indicadores | Matrizes | Riscos | Evolução | SmartArt, unless `el.zoom === false`.
- Re-render the element in the overlay through a fresh `.am-stage` (`container-type:size`) sized to the viewport, so `cqw` text scales. Do not CSS-scale a screenshot.
- Optional editor entry: element context menu "Ampliar" (no "alinhar" in the label).

**Risks**:
- Player bar width at 390 px (today it exactly fits: `scrollWidth 390`, measured).
- The zoom overlay must close on every `go()`.
- The click zones (right/left 18 %) must ignore clicks on `.amp-zb`. It lives inside the deck, so stop propagation, or check `e.target.closest('.amp-zb')` before the zone logic (R:472).

### F5 status: shipped in step S5 (what actually exists now; follows CATALOG §C and TMG-FEATURES §5.4, differences noted)
- **Charts** `rt-30-charts.js` / `rt-30-charts.css` (exported with every deck): `columns` (Agrupadas / Empilhadas / 100 %, `mode`), `hbars` (ranking), `waterfall`, `bullet` (cat Indicadores), `harvey` (cat Matrizes), `funnel`, `radar` — all `model:true, chart:true`, 3–4 variants each (the prototype's), `anim:{in:'fade'}`, fields through the existing codecs (`rows:t|*v`, `rows:t|v:n|k`, `lines`, `sel:`, `number`). Every chart has a `style` field (`light` / `dark`): on a white panel the series are navy → steel → light steel → orange; with `style:'dark'` (no panel on a navy slide) they become white → light steel → ice → orange and text/grid turn white/translucent. Max 4 series (the 5th is ignored), ≤ 3 on the radar; waterfall negatives are a hatched light-steel `<pattern>` with a `util.nid` id; totals use the typed value or the running sum when 0; the axis always starts at min(0, lowest level). Keyframes are prefixed `ch*`, `wf*`, `hv*`, `rd*`; the rest reuse `amUp/amFade/amBar/amLeft/amDraw/amSeg/amPop`. `AMRT.CHARTS` lists the 11 chart kinds in the order of the editor menu.
- **Editor**: ribbon “Gráficos ▾” `#bCharts` (`data-menu="mChart"`, `.menu.chmenu`, 3 groups: Colunas e barras · Linhas e composição · Indicadores e comparativos; `data-fx` buttons go through the generic menu handler, then toast + `previewEl`), Inserir › “Gráfico ▸” (`chartItems`, same groups, `raw` icons from `CH_IC`), hidden when the runtime has no `AMRT.CHARTS`. Label shortens with `.lbs` ≤ 1420 and becomes icon-only (caret hidden) ≤ 1240, so the ribbon fits at 1180–1920 (measured: 1180 scrollWidth = clientWidth; 1280 has ~52 px free). `startMove up` cycles `data-cyc` cells with the model's own `data-cyc-seq` (Harvey balls 0 → 4, numbers) and still R → A → C → I → – without it. `safeEl` keeps `el.zoom` only as a boolean. `HK` explains Z in the note of “Apresentar do início” (no new row: test-cover pins 17 manual rows and the manual must fit at 1280×720). `NOTEXT` += `bands`, `k`.
- **Ampliar (player, runtime.js + runtime.css; editor present mode and exported file)**: `AMRT.zoomables(slide)` = models (`FX[kind].model`) and images ≥ 160×90, minus `zoom:false`, plus components with `zoom:true`, sorted by area; `.amp-zb` (⤢, `visibility:hidden` at rest, so never a Tab stop) follows the zoomable under the pointer (`pointermove` on `.amp-deck`, hides 450 ms after leaving / 300 ms after leaving the button); double-click, **Z** (element under the pointer, else the largest) and the bar button `[data-a=zoom]` (hidden on slides without zoomables) open `.amp-zm` (role dialog): the element is re-rendered alone with `renderSlide({bg, els:[el]}, {play:true})` minus `am-pre` (final state; `runFx` replays counters/cycles) inside a stage of `1280k × 720k` px clipped to `el.w×k × el.h×k` (k ≤ 4, fits 94 vw × 92 vh), so cqw text is crisp at k×; header = `AMRT.slideTitle(slide)` + “n / N”, footer = element name + hint; dark box when the slide bg is dark. Keys while open: Esc closes, ← → cycle, Tab/Shift+Tab trap the 3 buttons, Enter/Space on a focused button act natively, everything else is swallowed; focus goes to ✕ and returns to the previous element (or blurs) on close. `go()` always closes it and hides the button; `destroy()` too. Click zones (18 %) ignore clicks whose target is inside a zoomable `.am-el` or the ⤢ button. KEYMAP rules 4 and 5 are now implemented in `key()`/`mousedown` (Enter/Space on a focused button act on it; bar/zoom buttons `preventDefault` on mousedown, so a mouse click never steals Space). Player handle: `hd.zoom = {open(indexOrId), close(), isOpen(), list(), index()}`; `AMRT` exports `slideTitle`, `zoomables`, `plain`, `isDark`. Props panel: section “Ampliar na apresentação” (toggle `zoom` + “Ver ampliado na apresentação” = `present(cur)` + `player.zoom.open(el.id)`) for models and images.
- **Deviation**: ARCH proposed “zoomable by `cat`”; shipped rule is “any `model:true` kind or image” (covers Gráficos/Indicadores/Matrizes/Riscos/Evolução/Cards and future SmartArt/Estratégia/Processos automatically) with the per-element `zoom` override.
- Suite: `test-s05.js` (36 checks, ~70 s).

### F6 — SmartArt
New models in `rt-40-smartart.js/.css`, `cat:'SmartArt'`:
- lista de blocos (vertical/horizontal), ciclo (3–6 nós), hierarquia/organograma, pirâmide, funil, degraus, Venn (2–3), radial (hub & spoke), alvo concêntrico, prós × contras (balança), lista com ícones (uses F3 `ICONS`), passos numerados.

Extension points:
- **Add `'SmartArt'` to `buildModels` `order[]` E:1111, or the cards never show.**
- Hierarchy input: the `'lines'` codec trims indentation (E:412). Use `'rows:t|p'` (name | parent) or add a codec `'tree'` that keeps leading spaces/`-`, in renderProps E:352 and the input handler E:412–413.
- Inserir › "SmartArt ▸" lists kinds → `insertFx(kind)`.

Risks:
- `kw` collisions in search (process, timeline and matrix already exist). Give each a distinct `name`.
- On dark slides models get the white panel (E:567). Decide per kind.

### F6 status: shipped in step S6 (what actually exists now; follows CATALOG §D, differences noted)
- **Runtime** `rt-40-smartart.js` / `rt-40-smartart.css` (exported with every deck): **one kind `smart`** (`model:true`, `cat:'SmartArt'`, 1000×420, `anim:{in:'fade'}`), 12 layouts in `AMRT.SMART_LAYOUTS` = `[key, label, group, hint, min, max]` (process, chevron, stepup · cycle, hub, venn · org, blocks, matrix · pyramid, funnel, target), 4 variants (`one` · `level` · `all` · `focus` = `data-cycle="g"` over the level-0 groups, `data-g` on every node for the future dock "Passo"). Data `{layout, items:[{t, lv}]}`; `fields` = `['layout','Layout','smartlayout']` + `['items', …, 'outline']`. Exposed: `smartParse(textOrArray)` (Tab or 2 spaces = 1 level, markers `- • *` ignored, blank lines dropped, **a level never jumps more than one step**, lv clamped 0–2, text ≤ 200 chars, ≤ 60 items; arrays keep the original index in `.i` so `data-e="items.N.t"` always points at the stored item), `smartText(items)`, `smartFind(key)`, `smartIcon(key, cls)` (48×32 thumbnail), `smartSample(key)` (pt-BR example items per layout). `FX.smart.norm(data)` is a **new generic FX hook called by `safeEl`** (`F.norm(o.data)`, after the DATA_TOKENS/variant checks): items become `[{t, lv}]` and an unknown layout falls back to `process`, so old string data and hostile JSON never reach markup unnormalised. Geometry: every node is `% of w/h`, font size `CQ(fs)` where `fs` is fitted per layout to the narrowest box (longest word of the titles, number of bullets; floor 55 % of the base so a rare long word wraps instead of the font vanishing; ×0.9 inside the white panel), ellipse cycle with arcs that start/end at the pill edges, tidy-tree hierarchy in pre-order (boss before team, boxes clamped inside the element), hub spokes on an ellipse with rays cut at the box edges, Venn 2–3 with `=` intersection pill, concentric target with leader lines. Per-layout caps (process 8, chevron 7, stepup 8, cycle 10, hub 1+10, venn 3, org 20 boxes, blocks 8, matrix 4, pyramid/funnel 8, target 6); extra items stay in the text pane. No items → `.sa-empty` reminder shown only in `.am-edit` stages. No new keyframes (amRise/amFade/amZoom/amDraw); classes `.fxsa`, `.sal-<layout>`, `.sa-*`.
- **Editor**: field type `'outline'` = `<textarea.outl data-codec="outline">` (JetBrains Mono, `smartText` ↔ `smartParse`, live `input`, commit on `change`); a `#props` keydown listener gives it **Tab / Shift+Tab** (indent/outdent the lines touched by the selection, 2 spaces, max level 2) and **Enter** (keeps the indentation), via `execCommand('insertText')` so the field's native undo works; the keys never reach the editor shortcuts. Field type `'smartlayout'` = `smartLayoutField()`: `.lkg.salg` grid of the 12 thumbnails (`data-set="data.layout"`, so switching keeps the items and is one undo step) + the layout hint with its limits. `elName` = "SmartArt · Ciclo". Entry points: **Inserir › SmartArt ▸** (`smartItems`, `xcols xsa`, 4 group headers, thumbnails as `raw`), **"Gráficos ▾" footer entry** "SmartArt · diagramas por texto" (`[data-open=mSmart]`, no `.mh`/`data-fx`/`.mi-ic`, so S05-04 still counts 11/3/11) that swaps to the visual picker **`#mSmart`** (`.menu.gmenu.smenu`, 4 groups × 3 tiles, `data-smart`, draggable `amfx:smart::<layout>`), drawer category **SmartArt** (already in `buildModels` order), gallery boxes `model:smart:<variant>`. `insertSmart(k)` seeds `smartSeed(k)` = layout + `smartSample(k)`; `dropData` does the same for drops. API: `AMStudio.smart = {insert(layout), layouts(), open()}`. No new ribbon button (1180 px budget, S05-22); `#bCharts` title mentions SmartArt.
- **QA round 1 fixes (S6 fixer)**: every box that reaches markup goes through `box(x, y, w, h)` inside `html()` (width/height clamped to 0…element, position clamped inside it; `.sa-n`, `.sa-sub`, `.sa-bt`) and `w/h` are clamped **before** `fs` is computed, so no layout can write `width:-10%` or `NaN`; the target's column is `lx = min(1.1h, .55w)` with `cx = lx/2.2`, `R = min(.48h, .436·lx)` (identical at 1000×420, shrinks in square/narrow boxes). The Venn intersection pill renders the raw text without the marker but carries `data-ep="= "`, which `startFxEdit` puts back on commit. `FX.smart.label(el)` + `AMRT.fxLabel` make the props header and the zoom footer agree (“SmartArt · Processo”). `[data-e]` spans inside `b`/`li` are `display:block` so a double-click on the blank part of a wrapped line still edits in place; the editor's double-click fallback no longer select-alls a `<textarea>`. `clean()` drops items whose `t` is an object/array/boolean (never “[object Object]”). Suite +5 checks (S06-23…27).
- **Deviation from CATALOG §D**: the field is called `'outline'` (as decided) but the layout field is a thumbnail grid (`'smartlayout'`), not a `<select>`; `data.items` is stored as `[{t, lv}]` from the start (default data is already an array). Zoomable like every model (F5 rule).
- Suite: `test-s06.js` (28 checks, ~3 min): registry, codec, drawer, picker, Inserir, panel, layout switch + undo, text pane keys, commit on blur, in-place edit, limits + hostile data, 12 layouts × white/navy × 100 %/50 % with `stageCheck` and palette check, 4 variants, navy panel, drag/drop, gallery, presentation + Ampliar, safeEl/norm, export (CR-04) and reopen, ribbon budget.

### F7 — More consulting models
New models in `rt-50-models.js/.css`:
- PDCA;
- Gantt/cronograma (`rows: tarefa | início | fim | marco?`; accepts `S1..S52`, `jan/26`, `dd/mm`), with a today/"hoje" marker and milestones as diamonds;
- roadmap por ondas/swimlanes;
- 5 Forças de Porter, Cadeia de valor, 7S, BCG, Ansoff;
- matriz de stakeholders (poder × interesse; reuse the matrix renderer);
- Balanced Scorecard, Business Model Canvas, Ishikawa, árvore de problemas/MECE, árvore de KPIs, OKRs, SIPOC, 5W2H, AS-IS × TO-BE, curva de mudança.

Each gets ≥2 variants, a `tip`, `kw`, and a default size ≤ 1172×470 (fits the content area y=190–650 under `head()` of the templates).

Risks:
- Do **not** add cover templates (5 pinned).
- Drawer performance with ~60 model cards: 21 cards re-render in 12 ms, so ~60 cost ~35 ms every 5.2 s plus RAF counters. Use an `IntersectionObserver` to play only visible cards. CR-12 still applies.
- Run `slideCheck` on each new model at its default size, on white and on navy.

### F7 status: shipped in step S7 — part A (what actually exists now; follows CATALOG §E, differences noted)
- **Runtime** `rt-models2.js` / `rt-models2.css` (exported with every deck; sorted after `rt-40-smartart` by `assemble.py`): seven `model:true` kinds — `pdca` (Processos, 1040×460; variants cycle · spin · ramp · focus; data `names`, `letters`, `p d c a` lines, `center`), `gantt` (Evolução, 1160×440; bars · phase · today · critical; `periods` lines, `tasks` **`rows:t|s|e|k`** kept as text, `today` text), `asistobe` (Evolução, 1100×420; reveal · rows · flip · focus; `rows:t|a|b`, `from`, `to`), `porter` (Estratégia, 1000×470; converge · pressure · focus; `forces` `rows:t|n:n|x`, `center`, `cn`), `roadmap` (Evolução, 1160×440; lanes · waves · path · focus; `cols`, `lanes` lines, `items` `rows:t|l:n|s:n|e:n|k`), `issuetree` (Estratégia, 1100×440; branch · path · grow · focus; `items` `[{t, lv 0–3, v?, hl?}]`, field type **`outline:3`**), `bcg` (Estratégia, **900×470** instead of CATALOG's 900×500 so it fits the F7 ≤ 1172×470 rule; drop · grow · move · quadrants; `items` `rows:t|x:n|y:n|s:n|tx:n|ty:n`, `q` lines, `xlab`, `ylab`). Every text goes through `esc()`/`E()` (double-click edits in place), every number through `num()` + clamp, the row type `k` is reduced to one letter before it becomes a class, lists/rows keep their original index (edit paths such as `tasks.3.t` always hit the stored row; invalid entries render empty instead of shifting). With `data.panel === 'white'` `dims()` scales `w/h` by 0.9 (the `.fx-pin` inset) so fonts shrink with the panel. Keyframes are prefixed `m7*` (`m7Spin m7Roll m7Chock m7Sweep m7Fut m7Crit m7Ms m7Pulse m7Wave m7Light m7MsIn m7Hot m7Ring m7Ghost m7WipeR m7WipeL`); dashed arrows/connectors are revealed with a `clip-path` wipe (`m7WipeR/L`), never with `amDraw` (which would turn them solid).
- **Gantt positions** (`AMRT.ganttPos(v, periods, end)`): a number (comma or dot), a period label (end = index + 1), `S5` / `semana 2`, `jan/26` / `março` (3-letter prefix of a label, optional 2-digit year) or `dd/mm[/aa]` (day inside the month whose label matches); `null` when unknown (start falls back to 0, end to start). `today` accepts the same forms; empty hides the line. Critical bars are `#13406A` at rest and turn orange only in the `critical` variant; the "hoje" pill sits in a 1.6 em padding below the rows.
- **Issue tree codec** (`AMRT.treeParse(text|array)` / `AMRT.treeText(items)`): Tab or 2 spaces = one level, max level 3, a level never jumps more than one step, markers `- • *` ignored, ` = valor` → `v` (mono, right-aligned, editable as `items.N.v`), `[*]` suffix → `hl` (path variant). The tree is a transposed tidy tree (x = depth, y = leaf slots, elbow connectors), ≤ 40 nodes; the root never gets `data-g` (stays lit in `focus`); `.it-hl` on the root class only when some node is marked, so the `path` variant never dims everything. Hooks `FX.issuetree.norm` (safeEl), `outlineParse`, `outlineText`.
- **Editor (3 small edits, backward compatible)**: field type `'outline:N'` renders the same `.outl` textarea with `data-maxlv="N"` (Tab/Shift+Tab indent up to N; the hint says "até N"); `renderProps` uses `FD.outlineText(v)` when the model defines it (else `RT.smartText`); the props `input` handler uses the selected model's `FX.outlineParse(text)` when defined (else `RT.smartParse`). SmartArt is untouched (max level 2 as before).
- **Drawer**: categories `Estratégia` and `Processos` were already in `buildModels` `order[]`; no new ribbon button, no new menu entry (models live in the Biblioteca de modelos and in the effects gallery as `model:<kind>:<variant>`). 27 model cards now re-render every 5.2 s in `playPreviews` (still well under the CR-12 budget; the IntersectionObserver suggested above is not implemented yet).
- Suite: `test-s07.js` (32 checks, ≈4 min; S07-27…31 cover the QA round 1 fixes): registry, `ganttPos`, tree codec, drawer categories + 8 searches, insert + props codecs for the 7 kinds, Gantt render/labels/variants/in-place edit, PDCA, AS-IS→TO-BE, Porter, roadmap, tree and BCG pieces + every variant's animation names and delays, `stageCheck` (test-cover's `slideCheck`) for 7 kinds × white/navy × 100 %/50 % + palette check, hostile `html()` data, gallery, navy panel + resize, presentation + Ampliar, safeEl/norm on open, export (CR-04) and reopen, outline:3 Tab + in-place title/value edit, ribbon budget. Screenshots `shots/s07-*.png`.
- **QA round 1 fixes (S7 fixer)**: text-fit helpers in `rt-models2.js` — `nlines(chars, em, fs, width, max)` estimates wrapped lines (Inter ≈ .53 em/char, Roboto Condensed ≈ .45, uppercase ≈ .5; a line ≤ 92 % full never wraps, beyond that 12 % slack for word breaks; calibrated with `qa/S7/f-calib.js`) and `shrink(fs, floor, over)` lowers one font factor in .04 steps until `over()` stops reporting overflow. **Porter** budgets each card (padding 1 em + name × 1.265 + dots .85 + comment × 1.08) against `bh·h`, shrinks the four cards together (floor .62, inline `font-size:<k>em`) and what still does not fit ends in an ellipsis through `-webkit-line-clamp` driven by `--nl` (name) / `--cl` (comment lines that still fit); `.am-el.editing .pt-f` lifts the clamp while editing; the centre text takes up to 80 chars (3-line clamp) and `.pt-f/.pt-c` wrap unbroken strings (`overflow-wrap:anywhere`) so nothing is ever cut at the card edge. **PDCA** keeps every list inside a 46 % band (`.pd-l{max-height:46%;overflow:hidden}`, top lists at `top:2%`, bottom at `bottom:2%`) and shrinks the four lists together (floor .6) until the fullest fits; the tip now promises 5 short actions (≈30 chars). **BCG** labels pick a slot: preferred side (opposite the target arrow) centred/top/bottom, then the other side, then above (`.u`) / below (`.d`); the first slot with no collision against bubbles, ghost bubbles (`move`), quadrant-name corners, labels already placed or the plot edge wins (least conflict area otherwise); a fully empty row (`{}` from a null item) keeps its index but draws no bubble. **Hand-edited files**: `normer(lists, rows)` gives `pdca gantt asistobe porter roadmap bcg` a `norm` hook (runs in `safeEl`) that turns list fields stored as text (`a;b`, one per line) into arrays and row fields stored as text (`nome | início | fim | tipo`, `prow`) into objects, so in-place edit paths always hit an array; `startFxEdit` additionally wraps `setPath` in try/catch and toasts instead of leaving the span stuck in edit mode. Tips state the practical limits (tree ≤ 20 nodes, Gantt ≤ 14 tasks → Ampliar (Z); Porter ≈ 60-char comments; PDCA 5 short actions).
- Still per CATALOG §E but **not** in this step (part B): stakeholders, value chain, BMC, journey, OKRs, BSC, change curve, 7S, Ishikawa and the cheap presets (Ansoff, Eisenhower, Kano, SCR, Minto, Iceberg, 5W2H, SIPOC).

### F7 status: shipped in step S7b — part B (what actually exists now; follows CATALOG §E.3/§E.4, differences noted)
- **Runtime** `rt-models3.js` / `rt-models3.css` (exported with every deck; sorted after `rt-models2` by `assemble.py`; keyframes prefixed `m8*`: `m8WipeR m8WipeL m8Ghost m8Flow m8Walk m8Win m8Pain m8Trail m8Ring`): seven `model:true` kinds — `stake` (Estratégia, 900×470; drop · move · quadrants · focus; `items` `rows:t|x:n|y:n|st|tx:n|ty:n` with stance `a` navy / `n` white + navy ring / `r` white + orange ring + “!”, `q` lines, `xlab`, `ylab`; legend; label placement reuses the BCG slot search, `data-g` = quadrant), `valuechain` (Processos, 1100×420; build · flow · focus; `support`/`primary` lines, `hl` positions 1–n, `notes` `rows:n:n|x`, `margin`; the classic Porter arrow: support bands with slanted ends, chevrons, the last primary activity following the lower slope, “Margem” rotated along the upper slope; `flow` = a white gradient sweep clipped by the chevrons in a static `<g clip-path>` (the clip must not sit on the moving rect), `m8Flow` infinite; `data-g` = activity 0…n), `bmc` (Estratégia, 1160×470; blocks · sides · focus; keys `kp ka kr vp cr ch cs cost rev` + `titles` lines; CSS grid 10 columns × `minmax(0,…)` rows, storytelling order CS → VP → CH → CR → REV → KR → KA → KP → COST; one font factor (floor .6) until the fullest block fits), `journey` (Evolução, 1160×470; walk · draw · stages · focus; `stages` lines, `rows` **`rows:k|*v`** (one cell per stage), `emo` lines −2…+2; emotion band after the 2nd row with a Catmull-Rom curve, area filled to the neutral line, dots navy/steel/orange by sign, `walk` = per-segment avatars (`m8Walk` left/top + `m8Win` window) plus a final avatar, 800 ms per stage), `okr` (Indicadores, 1000×420; cascade · fill · focus; `obj`, `eyebrow`, `owner`, `krs` `rows:t|v:n|tg:n|u|c` with confidence `o/r/c` → navy / steel / orange and anything else “Sem status”; `data-count` counters only in `fill`; title clamp 2 lines, 1 when rows are short; the objective shrinks its own font), `bsc` (Estratégia, 1160×470; bottomup · perspectives · focus; `persp` lines, `objs` `rows:p:n|t`, `links` `rows:a:n|b:n` by objective number; cards numbered, tones l0–l3 by band, elbow connectors drawn bottom-up with arrowheads, same-band links horizontal; per-card line clamp `--cl`), `change` (Processos, 1100×420; draw · walk · focus; `mode` `sel:curve|adkar`, `stages` lines, `pos`, `marker`, `adkar` `rows:t|v:n`; Kübler-Ross profile `[.62 .7 .45 .12 .35 .62 .88]` interpolated for 2–9 stages, labels on the free side (peak above, valley below, slope above anchored away from the curve, ends inward), “Estamos aqui” pill below on slopes/peaks and above in valleys, `walk` = 19-dot trail; ADKAR = 5 columns A D K A R with 1–5 bars, lowest = orange “ponto de barreira”, score inside the bar when ≥ 4; `label` hook “Curva da mudança” / “ADKAR (curva da mudança)”). All seven have a `norm` hook (`normer`), `dims()` for the white panel, text through `esc()`/`E()`, numbers through `num()` + clamp, one-letter tokens before they become classes, and the shared helpers `nlines`/`shrink`/`place`/`spline`/`at` (`AMRT.spline` exposed).
- **Presets** (`AMRT.PRESETS`, CATALOG §E.4): `ansoff eisenhower kano` on `matrix` (quadrants in the standard orientation — Ansoff: Desenvolvimento de mercado / Diversificação / Penetração / Desenvolvimento de produto with x = produtos, y = mercados; Eisenhower: Agendar / Fazer agora / Eliminar / Delegar with x = urgência, y = importância; Kano: Encantadores / Desempenho / Indiferentes / Básicos — the CATALOG table lists the names, not the TL/TR/BL/BR order), `scr w5h2` on `cardgrid`, `minto iceberg sipoc` on `smart` (org / pyramid / process). Inserting writes `data.preset = key`; `FX.matrix/cardgrid/smart.label` are wrapped so the panel header and the “Ampliar” footer show the preset name (SmartArt keeps “SmartArt · Layout” when no preset); `AMRT.presetOf(el)` validates key + kind. Presets are not gallery items (S01-05 count unchanged).
- **Editor**: `buildModels` renders one card per preset after the engines of its category (`.fxi.fxi-pre[data-k=<engine>][data-preset=<key>]`, subtitle “Preset · <engine>”, pills = engine effects, `_slide` from `previewSlide(k, null, preset)`); Inserir / drag (`'amfx:<engine>:<variant>:<preset>'`) / drop (`dropData` → `presetData`) clone the preset data. `#mCats` chips (one per category, with counts) under the search scroll the drawer to the category and follow the scroll. **Previews** (ARCH risk “~60 cards”): `playPreviews` now re-renders only cards within 160 px of the `#modelsBody` viewport (`cardVis`), draws the others once statically (so every card has `.pv .am-stage`), and a debounced `scroll` handler (`playVisible`) starts cards that enter and stops (`_clean`) cards that leave; the search also re-syncs. `pvOn()` also requires the drawer to be open (CR-12 unaffected). Measured: 6 of 42 cards redraw per 5.2 s cycle.
- Suite: `test-s07b.js` (24 checks): registry + codecs + presets + hooks, drawer (preset cards, chips, visible-only redraw, chip jump, 15 searches), insert + props codecs, preset insert / drag payloads / drops (valid, unknown, wrong engine, S06 layout), stakeholders, value chain (flow sweep moving), canvas (shrink), journey, OKR (counters), BSC, change curve + ADKAR, `stageCheck` 7 kinds × white/navy × 100 %/50 % + ADKAR + palette + text overlaps, hostile `html()` data, gallery, navy panel + resize, presentation + Ampliar (preset name in the footer), safeEl/norm on open (text lists/rows, invalid preset), export (CR-04) + reopen, in-place edit (stakeholder, journey cell, rows field), ribbon + chips budget at 1280. Screenshots `shots/s07b-*.png`.
- Not in this step (still per CATALOG §E): 7S, 3 Horizontes, Ishikawa (P2) and the Iceberg “linha d'água” option; the DTS “Varredura” layer (S8) can later drive the value-chain `flow` sweep instead of its own `m8Flow`.

### F8 — Effect layers and controls (speed, pause, step, restart, tour, glow, sweep, depth, rest)
Full spec: **DTS-CONTROLS.md**. Code map:
- Data: `anim.*` keys (F0 already allow-lists them).
- DOM: `renderEl` R:371–390 (`.am-hv`, `.am-sh`, `.am-glow`, `.am-sweep`); CSS C:6–7, 32–50, 383–387.
- Engine: `runFx` R:401–423 becomes a pausable clock. **Keep the signature `runFx(st) → cleanup`**, because `previewEl` E:459, `playPreviews` E:1148 and the player use it.
- Speed: WAAPI `getAnimations({subtree:true}).forEach(a => a.playbackRate = k)`.
- Player dock: markup R:441, click R:469–474, key R:460–467.
- Editor panel: the Animação section E:383–387; chips from `AMRT.ANIMS` (§10.4).

Risks:
- The loop/hover transform conflict fix rewrites `amPulse`/`amFloat`. Check the existing loop visuals.
- `--d` pre-scaling changes component timing math.
- Builds (`step`) change what "next" means: Space/→ reveal a group before changing slide. test.js and test2.js press ArrowRight expecting a slide change; decks without `step` must behave exactly as today.
- Keymap: **G is taken by Índice** (§12).

### F9 — Player índice + section timeline (rail) + chapter cards
Full spec: **TMG-FEATURES.md** §1–3, §6.5, §9 (`sectionsOf`, `slideTitle`, `dividerOf`). Code map:
- Player markup R:441 (rail row between `.amp-view` and `.amp-bar`; `.amp-pos` becomes a button but **keeps its text format `<b>01</b> / 07`**).
- `go()` R:449 (rail fill, card, wipe); `key()` R:460; click R:469.
- CSS C:133–158: `.amp-deck` width C:136 and `.amp-prog` `bottom:52px` C:158 must subtract `--amp-rail-h`.
- Editor:
  - slide panel (E:334–340) fields "Capítulo" (`s.sec`), "Subtítulo do capítulo" (`s.secSub`), "Título no índice" (`s.title`);
  - `mkSlide('section')` E:91 sets `kind:'section'`;
  - optional chapter labels in `#thumbs`, as non-`.th` nodes so test indexes stay intact.

Risks:
- **No chapter card on the initial `go(start)`.** test-core does Shift+F5 → Esc → `#bHome`; a card would eat the Esc.
- `.amp-pos` regex `/^01/`.
- The rail is rendered only with ≥2 chapters, so existing decks look unchanged.

### F9 status: shipped in step S15 — rail + índice (chapter cards and the wipe are NOT shipped)
- Runtime (`runtime.js`): `dividerOf`, `sectionsOf`, `dataStrings`, `autoNotes` exported on `AMRT`; `AMRT.hooks.show` (called from `go(i)` with `(i, hd)`) and `AMRT.hooks.key` (called from `key()` after the focused-button rule, before `Z`; a hook returning `true` consumes the key); `.amp-pos` is a `<button data-a="index">` with a caret span and is in the `mousedown → preventDefault` list; `runtime.css` subtracts `--amp-rail-h` from `.amp-deck` width and `.amp-prog` bottom.
- Player UI lives in **`rt-150-nav.js` / `rt-150-nav.css`** (so it ships inside every exported file): `.amp-rail` with `button.amp-rs[data-sec]` (flex ∝ slide count; a segment narrower than 64 px gets `.tight` and hides its label unless active/hovered/focused), `.amp-pop.amp-idx` (groups `Parte n · name`, or the plain name when `num === 0`), `.amp-pop.amp-note`. Hooks and the document `pointerdown` / window `resize` listeners are registered per player instance and removed in `hd.onDestroy`. `hd.nav = {index(bool), notes(bool), sections, isIndexOpen(), isNotesOpen()}`.
- **Chapters (`sectionsOf`)**: a divider slide always opens a chapter (6 unrenamed "1 · Nome do capítulo" dividers = 6 chapters); `Parte n` is unique and increasing (the divider's own number is used when it is larger than the previous one, else previous + 1); named chapters before the first divider and the intro get `num 0` (no "Parte"). `dividerOf` returns early for light slides without `kind:'section'` (60-slide deck: 22 ms → 0.1 ms per call).
- **Counter**: `.amp-pos` textContent is exactly `NN / MM`; the ▾ is CSS (`.amp-pos::after`), so `/^01/` and exact matches both hold.
- **Focus rules (Space must keep advancing)**: closing the índice/resumo returns focus to the counter/notes button **only if the keyboard opened it from there** (Tab + Enter); otherwise focus is released (blur). Mouse buttons in the panels never keep focus. With the índice open, Tab cycles inside it, and Enter/Space with focus outside the items refocuses the current item instead of reaching the slide.
- **Notes edited in the player**: stored as `{t, b}` per `'s:' + slide.id` (duplicates get `#index`) in a prototype-less map; `b` = hash of the source text (editor `notes` or auto text). When the source changes the override is dropped, so the editor stays the source of truth. The edit belongs to the slide where it started (`editIdx`), even if Next/rail/hash navigation ends it. Unknown keys and non-conforming values in localStorage are pruned on load.
- **autoNotes** is reader-facing (no presenter coaching): title · `Parte n · capítulo · slide i de N` · Visual · `Neste slide:` (≤ 3 points) · Números-chave; dividers list the chapter's slides. Optional 4th arg `secs` avoids recomputing chapters.
- **Bar layout**: ≤ 860 px the deck title, and the labels of "Sobre este slide", "Ampliar" and "Sair" hide (icon buttons); ≤ 480 px the bar becomes `auto 1fr auto` with compact buttons; ≤ 420 px buttons are 30 px. Verified at 390–1280 px in the editor player and the exported file: wordmark never clipped, no button wraps, no overflow.
- Editor: `mkSlide('section')` sets `kind:'section'`; the slide panel (no selection) starts with **Sobre este slide**: `s.title` (Título no índice), `s.sec` (Capítulo), `s.notes` (Resumo), buttons `autonotes` and `viewnotes`; `applyProp` special-cases `s.title|sec|secSub|notes` (no `renderStage`, empty string deletes the key); after `change` on those fields the panel re-renders once focus has left it (header shows the chapter). `present()` blurs the focused field and destroys a previous player first. `safeSlide` rejects the ids `__proto__`/`constructor`/`prototype`; `safeDeck` re-issues duplicated slide ids.
- Tests: `test-s15-nav.js` (46 checks: editor fields, undo, reopen, rail fills, índice keys/focus/Tab, resumo auto/deck/override + localStorage + invalidation + edit-slide binding, Space after closing layers, double `present()`, F5 from the textarea, chapter numbering, reserved/duplicate ids, 60-slide performance, bar at 390–1280 px, exported file, print, deck without chapters).
- Review: an adversarial workflow (4 lenses: correctness, security, UX vs the TMG reference, regression) produced 24 findings; every one was reproduced or checked and fixed above, except: **Z with the índice open closes the índice** (zoom takes focus; Esc then closes the zoom and the next Esc exits) — accepted, the zoom layer is the topmost.

### Status of the "lote 3/4" modules (S8, S9, S11, S12, S13, S14) — NOT wired (moved to `_unwired/` in S15)
`rt-80-effects-panel`, `rt-90-index`, `rt-110-export-html`, `rt-120-bpmn`, `rt-130-project-builder` and `rt-140-pptx-export` were written as isolated `window.gx*` modules that no editor menu, drawer, player hook or export path ever called (0 references in editor.js / editor.html / cover.js / runtime.js), and their suites `test-s08 … test-s14` print a fixed "✅ PASS" header and test the modules in isolation (`test-s08`/`test-s09-merged` were already failing). They were removed from the build in S15 (kept under `studio/_unwired/`, and in git history) so the exported file and the gate reflect what users can actually use. Rebuilding those features for real means: effect timing controls in the element panel (F8), editable exported file + comments (F11), BPMN/templates/PPTX as proper `rt-*` kinds and `Arquivo` menu entries, each with a suite made from `test-sNN-template.js`.

### F10 status: shipped in step S15 (with F9, see above)
- `AMRT.autoNotes(s, i, deck)` per TMG-FEATURES §9 (title · "Neste capítulo" on dividers · Visual · Pontos principais · Números-chave · closing hint; ≤ 700 chars). The player panel `.amp-note` (key **I**, bar button "Sobre este slide") shows the override (only while its source hash matches) > `slide.notes` > auto text; "Restaurar original" (not "Restaurar automático") because the original may be the editor's text. Overrides: `localStorage['amPlayer.notes:' + (deck.id || deck.title)]`, parsed defensively. While editing, the tag hides and the footer reads "Ctrl+Enter ou clique fora salva · Esc cancela".
- Editor: textarea `data-p="s.notes"` + "Gerar resumo automático" (`act('autonotes')`) + "Ver na apresentação" (`present(cur)` then `player.nav.notes(true)`). No `#modal` involved (§0.15).

### S18 status: resizable / collapsible slide panel (shipped)
- **Layout**: `editor.html` body grid uses `grid-template-columns: var(--side-w) minmax(0,1fr) 304px`; `--side-w` (default 196px) is set on `<body>` by `applySide()` (editor.js, block “painel de slides: largura ajustável e recolher (S18)” right after the thumbnail drag handlers). `#side` is `position:relative; z-index:6` and now starts with `#sideHd` (“SLIDES n” + « `#sideCollapse`), then `#sideMini` (collapsed strip: » `#sideExpand`, `#sidePos` “3/14”, + `#sideAdd`), `#thumbs`, `#addSlide`, and the divider `#sideSplit` (7 px hit area at `right:-4px`, `col-resize`, 1 px line → 3 px orange on hover/drag/focus; `role=separator`, `aria-orientation=vertical`, `aria-valuemin/max/now/text`, `tabindex=0`).
- **Range**: 132 … `min(440, innerWidth − 304 − 520)` (the canvas column keeps ≥ 520 px); `sideClamp()` re-clamps on window `resize` (the old `resize → fit(); drawSel()` handler now calls `applySide()`, which ends with `fit(); drawSel()`). Drag = pointer capture on the divider + `requestAnimationFrame` (`sideLater`), so the stage (`#wrap`, 16:9) grows/shrinks live; `toLogical()` already reads `#wrap`'s rect, so selection, handles, drag and resize stay exact (test S18-16/17).
- **2 columns** at ≥ 340 px (`#side.cols2` → `#thumbs` grid); slide number, hover Duplicar/Apagar, HTML5 drag reorder (drop indicator becomes a left bar) and the thumbs keyboard zone work; ↑ ↓ move by one row in that mode.
- **Collapse**: `body.side-off` → `--side-w: 40px`, hides header/thumbs/“+ Novo slide”/divider and shows `#sideMini`; expanding restores the stored width. `#sideAdd` opens the same layout menu `#mSlide` to its right (added to the `closeOld` exception list). Menu **Slide** gained a last item (after a separator) “Ocultar painel de slides” / “Mostrar painel de slides” (`IC.side`). No new global shortcut (Ctrl+Alt+B etc. avoided).
- **Persistence (UI preference, not deck data)**: `localStorage['amStudio.sideW']` (integer px, re-clamped on load) and `['amStudio.sideOff']` (`'1'`/`'0'`), read/written in try/catch. No deck/slide/element field was added, so `safeDeck/safeSlide/safeEl`, undo, save/reopen and the exported file are unchanged (the runtime does not know about the panel).
- **Side effects fixed**: `#banner` (draft notice) is now centred over the canvas column (`left: calc(var(--side-w) + (100vw − var(--side-w) − 304px)/2)`, `max-width` = canvas − 24 px, wraps) so it never covers «; `#hint` gets `max-width: calc(100% − 24px)` + ellipsis so it does not slide under a wide panel. `sidePos()` (called from `renderThumbs` and `goSlide`) keeps “SLIDES n” and the strip position current.
- **Tests**: `test-s18-lateral.js` (29 checks, real mouse/keyboard: splitter drag 320/400/limits, ←/→/Shift/Home/End/Enter, double-click, Ctrl+wheel, « » and menu Slide, “+” in the strip + Ctrl+Z, reload persistence, element drag/resize mapping after width changes, 2-column drag-reorder/hover buttons/keys, save→reopen, export, 1100/1280/1440 widths without overflow, banner/hint placement, zero console errors). Screenshots `shots/s18-*.png`.
- **Caveats**: the width is per browser (file:// origin shares localStorage across decks, by design); the divider is hidden while collapsed (expand first); touch drag works via pointer events but was only tested with a mouse.

### F11 — Editable exported HTML (move cards, edit texts, save copy) + comments panel
**Architecture**:
- **(1)** `xedit.js` (F0 ships it inert as `#am-xedit`).
- **(2)** Move the export template from `exportHTML` E:1475 into the runtime as `AMRT.buildHTML(deck, {css, js, xjs, brand})`. The editor and the exported file then generate **the same** file.
  - Give the parts ids in the output: `<style id="am-runtime-css">`, `<script id="am-runtime">`, `<script id="am-xedit">`.
  - The export rebuilds itself from those nodes' `textContent` plus the edited deck.
  - Keep `<script type="application/json" id="am-deck-data">`, the `<`→`<` escaping and the `S='script'` trick.
- **(3)** Boot line: `AMRT.player(deck, root, {brand, editable:true})` then `AMX.boot(player)`.
  - The player must return a richer handle (§5.4) plus a way to swap the current slide's stage for a static `am-edit` render while editing.

**Edit mode** (export only, button "Editar" + key **E**):
- banner "Modo edição — arraste os cards · duplo clique edita o texto · Ctrl+S salva · Esc sai";
- click zones, tilt and cycles are off; the current slide renders as `RT.renderSlide(slide,{play:false})`.
- Drag moves `.am-el` in logical coordinates (`dx/rect.width*1280`; lines move x1..y2); arrows nudge 1 px / Shift 10 px.
- Double-click a text or shape: `.am-tx` contenteditable. Double-click a `[data-e]` span: plaintext-only, then `setPath`.
- Sanitise like `cleanHTML` (move it to `AMRT.util.cleanHTML` and share it).
- Undo: a local JSON stack (Ctrl+Z / Ctrl+Shift+Z).
- No delete or resize in v1 (scope: "mover os cards, mexer nos textos").

**Save**:
- **Ctrl+S / "Salvar cópia"**: `showSaveFilePicker` when available (Chromium on file:// is a secure context, measured), otherwise download `slug-editado.html`.
- Also autosave to `localStorage['amPlayer.edit:'+deck.id]`. On load, if that is newer than `deck.updated`, show the banner "Há alterações locais — Restaurar / Descartar".

**Comments** (button "Comentários" + badge, key **C**):
- right panel 360 px: per-slide list plus "Todos"; author name remembered in `localStorage['amPlayer.author']`; "Novo comentário" textarea (Ctrl+Enter adds); resolve checkbox; delete;
- optional pin ("Marcar no slide", click on the slide → `x,y` logical) shown as numbered orange dots in a layer above the stage;
- stored in `deck.comments` (F0 schema), autosaved locally and written by "Salvar cópia";
- the editor keeps them on open/save (F0) and can list them read-only in the slide panel.

**Risks**:
- **CR-04**: no `onclick|onerror|onmouseover` text anywhere in `runtime.js`/`xedit.js`/`rt-*`, comments included.
- `</script` assertion.
- Key routing: textareas, contenteditable and modifiers must bypass `key()` (F0 done). In edit mode, arrows nudge when an element is selected, else navigate.
- The F0 key guard returns on Ctrl/⌘ combos, so Ctrl+S in the export must be handled by xedit's own listener (`preventDefault`).
- The exported file is opened in the editor via `openFile`. Edited copies must stay valid decks (`safeDeck`).
- Export size grows by xedit (budget ≤ 40 KB).

### Summary table
| # | Main files | Hot spots (line) | Top risk |
|---|---|---|---|
| F0 | E, R, assemble.py | E:135,151,163,166 · R:461,483 | none (verified) |
| F1 | E (drawer), C (hover `.am-hov`) | E:1102–1168, C:43–50 | CR-12 timers; test.js `[data-ins=counter]` |
| F2 | history.js, E, V, cover.css | E:92,111,171,1301,1481 · V:435,482,557,558,629 | cover pins; modal key trap; IDB rejections |
| F3 | rt-20-icons.*, E | E:134 (DATA_TOKENS), 350–357, 396/441/522/531/590/1167 | data validation; licence |
| F4 | R, E, H | R:13–46 · E:36–41,142,360–367,465,575–582,603,1286,1331 · H:334–335 | IX-04 hit-testing; `[data-add=arrow]`; "forma" label |
| F5 | rt-30-charts.*, R (player zoom) | R:441,449,469 · C:133–158 | player bar width; click zones |
| F6 | rt-40-smartart.* , E | E:1111 (order), 350–357, 409–415 | invisible cat; tree codec — **shipped (S6)** |
| F7 | rt-50-models.*, E | E:1111 | drawer perf; slideCheck |
| F8 | R, C, E | R:371–423,437–482 · C:6–50,383–387 · E:317–318,383–387 | runFx contract; Space semantics; G key |
| F9 | R, C, E | R:441–474 · C:133–158 · E:91,334–340 | initial card eats Esc; `.amp-pos` |
| F10 | R, E | R:441,460 · E:334–340,392,512 | modal; per-keystroke render |
| F11 | xedit.js, R, E | E:1475–1480 · R:437–483 | CR-04; `</script`; key routing |

---

## 12. Unified player keymap (resolves TMG × DTS)
| Key | Action | Origin |
|---|---|---|
| → PageDown Space Enter · click right 18 % | Avançar (next build group if F8 builds exist, else next slide; skips a visible chapter card) | existing / DTS / TMG |
| ← PageUp Backspace · click left 18 % | Voltar (previous slide shown already built) | existing / DTS |
| Home / End | First / last | existing |
| F | Tela cheia | existing |
| Esc | Close the topmost layer: zoom > comments > índice > resumo > effects popover > help > chapter card; else exit (editor) / leave edit mode (export) | merged |
| **G** | Índice | TMG (the user praised it) |
| **I** | Resumo do slide | TMG |
| **Z** | Ampliar gráfico | TMG |
| P (K) · R · T · V · D | Pausar · Reiniciar efeitos · Tour automático · Varrer agora · Profundidade | DTS |
| **B** | Brilho (Glow) on/off | **moved from DTS "G"** |
| . / , · − = + 0 | Passo ± · Velocidade | DTS |
| C | Comentários (export) | F11 |
| E | Modo edição (export, only when `opts.editable`) | F11 |
| ? | Atalhos do apresentador | DTS |
| Ctrl/⌘+S, Ctrl/⌘+Z, Ctrl/⌘+Shift+Z | Salvar cópia / desfazer / refazer in the export edit layer (xedit listener) | F11 |
Rules:
- Never act on keys whose target is input, textarea, select or contenteditable (F0).
- Never act on Ctrl/⌘/Alt combos in `key()` (F0).
- `mousedown → preventDefault` on bar buttons so Space keeps meaning "next" (TMG §6.5).

---

## 13. Ribbon and top-bar budget (measured) and the consolidation that makes room
Free space after the last ribbon button: **1280: 7 px · 1366: 93 px · 1440: 17 px · 1536: 41 px · 1920: 425 px**. The top bar's spacer is already 0 px up to 1536 (`#top` does not overflow).
Proposal (fits Ícones and Gráficos at 1280 with about 50 px to spare):
1. "Linha" (71) + "Seta" (64) become the split button "↗ Seta" `[data-add=arrow]` + "▾" `[data-menu=mLine]` (estimated ~86). Saves ~49 px. The new-button widths in this list are estimates; the existing widths are measured.
2. Edit group icon-only at ≤1420 px (`#bFront #bBack #bDup #bDel` 292 → 4×36). Saves ~148 px. Ids and `title` stay; IX-09 focuses `#bDup`/`#bFront` by id.
3. "Marca A&M" → "Marca" at ≤1420 (`.lbs`). Saves ~40 px.
4. Add "Ícones ▾" (~88, F3) and "Gráficos ▾" (~100, F5/F6; sections "Gráficos" and "SmartArt"). Full lists stay in Inserir (submenus "Ícone animado ▸", "Gráfico ▸", "SmartArt ▸", "Linhas e setas ▸").
Verify with test-core §16 (`#rib.scrollWidth <= clientWidth` at 1280×720), plus screenshots at 1280/1366/1440 (`SHOTS/a20-editor-<w>.png` show today's state).

---

## 14. Screenshot index (`SHOTS/`)
| File | Shows |
|---|---|
| `a01-editor-empty.png` | Editor, blank deck |
| `a02-editor-template-slide2.png` | Template "Proposta comercial", slide 2 |
| `a03-props-model-selected.png` | Model selected: variant chips, fields, `#fxArrow` |
| `a04-variant-menu.png` | `#mVar` variant menu |
| `a05-props-animation-section.png` | Animação section (entrance, delay/duration, loop, hover) |
| `a06-drawer-models.png` / `a07-drawer-fx.png` | Biblioteca: Modelos / Efeitos e animações |
| `a08-menu-file.png`, `a08-menu-insert.png`, `a08-menu-present.png` | App menus |
| `a09-ribbon-formas.png`, `a10-ribbon-cards.png` | Ribbon popovers |
| `a11-ctx-canvas.png` | Context menu |
| `a12-props-slide.png` | Slide panel (where F9/F10 fields go) |
| `a13-present-editor.png` | Present mode in the editor |
| `a14-exported-player.png`, `a15-exported-phone.png` | Exported deck at 1440 and 390 px |
| `a20-editor-1280/1366/1440/1536/1920.png` | Ribbon budget per width |
| `f0-probe-model-inserted.png`, `f0-probe-export.png` | F0 extension model in the editor and the export |

---

## 15. Evidence log
- Baseline gate on a private copy: `SP/qa-understand/arch-analyst/gate-baseline.log` → GATE PASS (5 min 07 s).
- F0 prototype gate (F0 patch applied to a private copy): `SP/qa-understand/arch-analyst/gate-f0.log` → **GATE PASS**. test.js and test2.js PASS, test-core "TUDO OK", test-cover 100/100, zero console errors.
- `p1-model.js`: field survival matrix, CR paths, export globals, file:// storage sharing (`localStorage` + IndexedDB visible across folders), quota.
- `p2-ui.js`: registry inventory, z-index, drawer counts, preview cost (21 cards / 12 ms), Space-in-contenteditable bug, 390 px bar fits.
- `p3-slack.js`, `p4-rb.js`: ribbon/top-bar budget.
- `p5-fsa.js`: `isSecureContext=true`, `showSaveFilePicker` present on file://.
- `p6-f0.js`: F0 round-trip, `rt-*.js` registration, inert `xedit.js`, export carries extensions, key guard.
- The original studio files are unchanged (md5 list in `studio-md5-before.txt`, re-verified after all probes).

## 16. Open questions for the orchestrator
1. Approve **B = Glow** (moving it off G) so G = Índice and I = Resumo, as in TMG.
2. Approve F2 placement: cover view "Obras recentes" (top-right button) plus Arquivo › "Histórico de apresentações…". The alternative (an editor modal) needs a modal-handler rework.
3. Approve the ribbon consolidation in §13 (split "Seta", icon-only edit group ≤1420, "Marca" short label).
4. F11 scope v1: move plus text edit plus comments (no resize/delete in the exported file). Confirm.
5. Should comments also be editable in the editor (not only preserved)? This doc assumes a read-only list in v1.
