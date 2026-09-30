// =====================================================================
// MUNDO — planta do escritório, colisões, pathfinding (A*) e piso
// =====================================================================
const WORLD = { W: 1760, H: 1120, CELL: 16 };

const ZONES = [
  { x: 16, y: 100, w: 504, h: 320, kind: 'wood', label: 'SALA DE REUNIÃO' },
  { x: 1240, y: 100, w: 504, h: 320, kind: 'woodDark', label: 'SALA DO MD' },
  { x: 16, y: 470, w: 284, h: 270, kind: 'studio', label: 'SALA DO DOCUMENTÁRIO' },
  { x: 16, y: 790, w: 504, h: 314, kind: 'tiles', label: 'COPA' },
  { x: 1340, y: 760, w: 404, h: 344, kind: 'stone', label: 'RECEPÇÃO' },
];

// paredes sólidas (retângulos)
const WALLS = [
  { x: 0, y: 0, w: WORLD.W, h: 100 },
  { x: 0, y: 0, w: 16, h: WORLD.H },
  { x: WORLD.W - 16, y: 0, w: 16, h: WORLD.H },
  { x: 0, y: WORLD.H - 16, w: WORLD.W, h: 16 },
];

// mobília (tipo, footprint) — "key" = ordem de profundidade
const FURNITURE = [];
function addF(f, solid = true) { f.solid = solid; if (f.key == null) f.key = f.y + (f.d || 0); FURNITURE.push(f); return f; }

// vidros
function glassH(x, y, w) { addF({ type: 'glassH', x, y, w, d: 6, key: y + 6 }); }
function glassV(x, y, d) { addF({ type: 'glassV', x, y, w: 6, d, key: y + d }); }
// sala de reunião
glassH(16, 414, 364); glassH(460, 414, 60); glassV(517, 100, 320);
// sala do documentário
glassH(16, 464, 284); glassV(297, 470, 90); glassV(297, 640, 100); glassH(16, 734, 284);
// copa
glassH(16, 784, 374); glassH(470, 784, 50);
// sala do MD
glassV(1237, 100, 320); glassH(1240, 414, 60); glassH(1380, 414, 364);

addF({ type: 'whiteboard', x: 50, y: 100, w: 120, d: 8 });
addF({ type: 'tv', x: 220, y: 100, w: 140, d: 8 });
addF({ type: 'confTable', x: 100, y: 205, w: 320, d: 90 });
addF({ type: 'confChairsFront', x: 100, y: 322, w: 320, d: 0, key: 322 }, false);
addF({ type: 'camera', x: 200, y: 620, w: 30, d: 10, key: 620 });
addF({ type: 'stool', x: 90, y: 626, w: 26, d: 8, key: 626 }, false);
addF({ type: 'plant', x: 270, y: 500, w: 20, d: 10, key: 505 });
addF({ type: 'fridge', x: 36, y: 806, w: 54, d: 34 });
addF({ type: 'counter', x: 100, y: 806, w: 140, d: 34 });
addF({ type: 'vending', x: 256, y: 800, w: 56, d: 40 });
addF({ type: 'table', x: 150, y: 950, w: 150, d: 60 });
addF({ type: 'cooler', x: 530, y: 812, w: 26, d: 16, key: 812 });
addF({ type: 'shelf', x: 600, y: 100, w: 104, d: 30 });
addF({ type: 'mdDesk', x: 1450, y: 230, w: 170, d: 56 });
addF({ type: 'chair', x: 1535, y: 196, w: 0, d: 0, key: 196 }, false);
addF({ type: 'bookshelf', x: 1650, y: 100, w: 88, d: 26 });
addF({ type: 'plant', x: 1275, y: 150, w: 24, d: 10, key: 150, big: true });
addF({ type: 'receptionCounter', x: 1420, y: 850, w: 180, d: 44 });
addF({ type: 'printer', x: 1640, y: 806, w: 64, d: 36 });
addF({ type: 'sofa', x: 1440, y: 1040, w: 160, d: 40 });
const PLANT_BIG = addF({ type: 'plant', x: 1700, y: 1070, w: 24, d: 12, key: 1070, big: true });
addF({ type: 'plant', x: 560, y: 450, w: 20, d: 10, key: 450 });
addF({ type: 'plant', x: 1190, y: 450, w: 20, d: 10, key: 450 });
addF({ type: 'plant', x: 560, y: 1080, w: 20, d: 10, key: 1080 });
addF({ type: 'rug', x: 690, y: 620, w: 340, d: 78, key: -1 }, false);
DESKS.forEach(dk => {
  addF({ type: 'desk', x: dk.x, y: dk.y, w: 120, d: 50, owner: dk.owner });
  addF({ type: 'chair', x: dk.x + 60, y: dk.y - 18, w: 0, d: 0, key: dk.y - 18 }, false);
});

// retângulo de colisão de cada móvel
function furnRect(f) {
  switch (f.type) {
    case 'glassH': return { x: f.x, y: f.y - 2, w: f.w, h: 8 };
    case 'glassV': return { x: f.x - 4, y: f.y, w: 8, h: f.d };
    case 'plant': return { x: f.x - 10, y: f.y - 8, w: 20, h: 10 };
    case 'cooler': return { x: f.x, y: f.y - 16, w: 26, h: 16 };
    case 'camera': return { x: f.x - 14, y: f.y - 10, w: 30, h: 12 };
    default: return { x: f.x, y: f.y, w: f.w, h: f.d };
  }
}
const COLLIDERS = WALLS.concat(FURNITURE.filter(f => f.solid).map(furnRect));

// objetos interativos (âncora = onde o personagem fica para usar)
const OBJECTS = [
  { id: 'coffee', name: 'Máquina de Café 3000', icon: '☕', x: 139, y: 862 },
  { id: 'microwave', name: 'Micro-ondas', icon: '🍲', x: 205, y: 862 },
  { id: 'fridge', name: 'Geladeira da Copa', icon: '🧊', x: 63, y: 862 },
  { id: 'vending', name: 'Máquina de Snacks', icon: '🍫', x: 284, y: 864 },
  { id: 'cooler', name: 'Bebedouro das Fofocas', icon: '💧', x: 543, y: 836 },
  { id: 'shelf', name: 'Almoxarifado', icon: '🖊️', x: 652, y: 150 },
  { id: 'printer', name: 'Impressora (humor: instável)', icon: '🖨️', x: 1672, y: 864 },
  { id: 'bell', name: 'Sino do Fechamento', icon: '🔔', x: 1460, y: 914 },
  { id: 'sofa', name: 'Sofá da Recepção', icon: '🛋️', x: 1520, y: 1024 },
  { id: 'plant', name: 'Samambaia Sênior', icon: '🌿', x: 1672, y: 1050 },
  { id: 'whiteboard', name: 'Quadro Branco', icon: '📋', x: 110, y: 132 },
  { id: 'tv', name: 'TV da Sala de Reunião', icon: '📺', x: 290, y: 132 },
  { id: 'camera', name: 'Câmera do Documentário', icon: '🎥', x: 205, y: 660 },
  { id: 'mug', name: 'Caneca "Melhor MD do Mundo"', icon: '🏆', x: 1535, y: 306 },
].concat(DESKS.map(d => ({ id: 'pc_' + d.owner, kind: 'pc', name: 'Computador de ' + CAST_BY_ID[d.owner].first, icon: '💻', x: d.x + 60, y: d.y + 68 })));

// pontos que os agentes visitam sozinhos
const HANGOUTS = [
  { obj: 'coffee', emote: '☕', lines: ['Café número 4. Quem está contando? O Guilherme.', 'Essa máquina me entende.', 'Cafeína: ativada.'] },
  { obj: 'fridge', emote: '🧊', lines: ['Quem deixou esse iogurte aqui em 2019?', 'Tem alguma coisa se mexendo aqui dentro.', 'Cadê minha gelatina?'] },
  { obj: 'cooler', emote: '💧', lines: ['Hidratação é governança do corpo.', 'Alguém tem fofoca nova?', 'Água: o café dos fortes.'] },
  { obj: 'printer', emote: '🖨️', lines: ['ATOLOU. DE NOVO.', 'Bandeja 7? Não existe bandeja 7!', 'Imprime, por favor. Por favor.'] },
  { obj: 'vending', emote: '🍫', lines: ['Travou meu chocolate!', 'Só mais um snack.', 'Essa máquina me deve R$ 4,50.'] },
  { obj: 'plant', emote: '🌿', lines: ['Bom dia, Samambaia.', 'Ela ouve tudo, sabia?', 'Você é a mais sênior daqui.'] },
  { obj: 'whiteboard', emote: '✏️', lines: ['Zero dias sem incidente de Excel. De novo.', 'Quem desenhou isso?', 'Precisamos de um diagrama.'] },
];

// ---------------------------------------------------------------------
// grade de navegação
// ---------------------------------------------------------------------
const NAV = (() => {
  const C = WORLD.CELL, cols = Math.ceil(WORLD.W / C), rows = Math.ceil(WORLD.H / C);
  const blocked = new Uint8Array(cols * rows);
  const pad = 9;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const cx = c * C + C / 2, cy = r * C + C / 2;
    for (const w of COLLIDERS) {
      if (cx > w.x - pad && cx < w.x + w.w + pad && cy > w.y - pad + 2 && cy < w.y + w.h + pad - 3) { blocked[r * cols + c] = 1; break; }
    }
  }
  return { cols, rows, blocked, C };
})();

function cellOf(x, y) { return [Math.floor(x / NAV.C), Math.floor(y / NAV.C)]; }
function isBlocked(c, r) { return c < 0 || r < 0 || c >= NAV.cols || r >= NAV.rows || NAV.blocked[r * NAV.cols + c] === 1; }
function nearestFree(x, y) {
  let [c, r] = cellOf(x, y);
  if (!isBlocked(c, r)) return [c, r];
  for (let rad = 1; rad < 20; rad++) {
    let best = null, bd = 1e9;
    for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== rad) continue;
      if (!isBlocked(c + dx, r + dy)) { const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = [c + dx, r + dy]; } }
    }
    if (best) return best;
  }
  return [c, r];
}
function freePoint(x, y) { const [c, r] = nearestFree(x, y); const [c0, r0] = cellOf(x, y); if (c === c0 && r === r0) return { x, y }; return { x: c * NAV.C + NAV.C / 2, y: r * NAV.C + NAV.C / 2 }; }

function lineClear(x0, y0, x1, y1) {
  const d = Math.hypot(x1 - x0, y1 - y0), n = Math.ceil(d / 6);
  for (let i = 1; i < n; i++) { const t = i / n; const [c, r] = cellOf(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t); if (isBlocked(c, r)) return false; }
  return true;
}

function findPath(sx, sy, tx, ty) {
  const [sc, sr] = nearestFree(sx, sy);
  const [tc, tr] = nearestFree(tx, ty);
  const cols = NAV.cols, N = cols * NAV.rows;
  const g = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const start = sr * cols + sc, goal = tr * cols + tc;
  const heap = [];
  const push = (i, f) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  const h = i => { const c = i % cols, r = (i / cols) | 0; const dx = Math.abs(c - tc), dy = Math.abs(r - tr); return (dx + dy) + (1.414 - 2) * Math.min(dx, dy); };
  g[start] = 0; push(start, h(start));
  let found = false, iter = 0;
  while (heap.length && iter++ < 12000) {
    const [, cur] = pop();
    if (closed[cur]) continue; closed[cur] = 1;
    if (cur === goal) { found = true; break; }
    const c = cur % cols, r = (cur / cols) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nc = c + dx, nr = r + dy;
      if (isBlocked(nc, nr)) continue;
      if (dx && dy && (isBlocked(c + dx, r) || isBlocked(c, r + dy))) continue;
      const ni = nr * cols + nc;
      const ng = g[cur] + (dx && dy ? 1.414 : 1);
      if (ng < g[ni]) { g[ni] = ng; came[ni] = cur; push(ni, ng + h(ni)); }
    }
  }
  if (!found) return null;
  const cells = [];
  for (let i = goal; i !== -1; i = came[i]) cells.push(i);
  cells.reverse();
  const pts = cells.map(i => ({ x: (i % cols) * NAV.C + NAV.C / 2, y: ((i / cols) | 0) * NAV.C + NAV.C / 2 }));
  const [gc, gr] = cellOf(tx, ty);
  if (gc === tc && gr === tr) pts[pts.length - 1] = { x: tx, y: ty };
  // suavização (string pulling)
  const out = [];
  let a = { x: sx, y: sy }, k = 0;
  while (k < pts.length) {
    let far = k;
    for (let j = pts.length - 1; j > k; j--) { if (lineClear(a.x, a.y, pts[j].x, pts[j].y)) { far = j; break; } }
    out.push(pts[far]); a = pts[far]; k = far + 1;
  }
  return out;
}

// colisão de movimento livre (teclado)
function collides(x, y) {
  const fx = x - 8, fy = y - 5, fw = 16, fh = 8;
  for (const w of COLLIDERS) if (fx < w.x + w.w && fx + fw > w.x && fy < w.y + w.h && fy + fh > w.y) return true;
  return false;
}

// ---------------------------------------------------------------------
// piso, paredes e cenário fixo
// ---------------------------------------------------------------------
function drawFloor(ctx, view, t) {
  const { x0, y0, x1, y1 } = view;
  // carpete do open space
  ctx.fillStyle = '#c9ced9'; ctx.fillRect(0, 0, WORLD.W, WORLD.H);
  ctx.fillStyle = 'rgba(255,255,255,.18)';
  const T = 48;
  for (let y = Math.floor(y0 / T) * T; y < y1; y += T) for (let x = Math.floor(x0 / T) * T; x < x1; x += T) if (((x + y) / T) % 2 === 0) ctx.fillRect(x, y, T, T);
  for (const z of ZONES) {
    if (z.x > x1 || z.x + z.w < x0 || z.y > y1 || z.y + z.h < y0) continue;
    ctx.save(); ctx.beginPath(); ctx.rect(z.x, z.y, z.w, z.h); ctx.clip();
    if (z.kind === 'wood' || z.kind === 'woodDark') {
      ctx.fillStyle = z.kind === 'wood' ? '#c89b6d' : '#a57449'; ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1;
      for (let y = z.y; y < z.y + z.h; y += 18) { ctx.beginPath(); ctx.moveTo(z.x, y); ctx.lineTo(z.x + z.w, y); ctx.stroke(); for (let x = z.x + ((y / 18) % 3) * 40; x < z.x + z.w; x += 120) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 18); ctx.stroke(); } }
    } else if (z.kind === 'tiles') {
      for (let y = z.y; y < z.y + z.h; y += 28) for (let x = z.x; x < z.x + z.w; x += 28) { ctx.fillStyle = ((x + y) / 28) % 2 === 0 ? '#f1f5f9' : '#cbd5e1'; ctx.fillRect(x, y, 28, 28); }
    } else if (z.kind === 'stone') {
      ctx.fillStyle = '#e7e0d2'; ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.strokeStyle = 'rgba(0,0,0,.07)'; for (let y = z.y; y < z.y + z.h; y += 40) for (let x = z.x + ((y / 40) % 2) * 30; x < z.x + z.w; x += 60) ctx.strokeRect(x, y, 60, 40);
    } else if (z.kind === 'studio') {
      ctx.fillStyle = '#5b5670'; ctx.fillRect(z.x, z.y, z.w, z.h);
      ctx.fillStyle = 'rgba(255,255,255,.04)'; for (let y = z.y; y < z.y + z.h; y += 16) ctx.fillRect(z.x, y, z.w, 8);
      // spot de luz
      const g = ctx.createRadialGradient(95, 610, 5, 95, 610, 110); g.addColorStop(0, 'rgba(255,240,200,.35)'); g.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = g; ctx.fillRect(z.x, z.y, z.w, z.h);
    }
    ctx.restore();
    label(ctx, z.label, z.x + z.w / 2, z.y + z.h - 14, 10, z.kind === 'studio' ? 'rgba(255,255,255,.4)' : 'rgba(40,50,70,.35)');
  }
  label(ctx, 'OPEN SPACE DTS', 860, 1080, 11, 'rgba(40,50,70,.3)');

  // parede superior
  ctx.fillStyle = '#434a5c'; ctx.fillRect(0, 0, WORLD.W, 30);
  const wg = ctx.createLinearGradient(0, 30, 0, 100); wg.addColorStop(0, '#f4efe6'); wg.addColorStop(1, '#e6dfd2');
  ctx.fillStyle = wg; ctx.fillRect(0, 30, WORLD.W, 70);
  ctx.fillStyle = '#b9ad98'; ctx.fillRect(0, 94, WORLD.W, 6);
  // janelas com persianas e skyline
  const wins = [[380, 110], [760, 120], [920, 120], [1080, 120], [1370, 110]];
  for (const [wx, ww] of wins) {
    const sky = ctx.createLinearGradient(0, 38, 0, 86); sky.addColorStop(0, '#7dd3fc'); sky.addColorStop(1, '#fde68a');
    ctx.fillStyle = sky; ctx.fillRect(wx, 38, ww, 48);
    ctx.fillStyle = 'rgba(30,41,59,.55)';
    for (let i = 0; i < ww; i += 14) { const bh = 12 + ((i * 7 + wx) % 23); ctx.fillRect(wx + i, 86 - bh, 11, bh); }
    ctx.fillStyle = 'rgba(255,255,255,.55)'; for (let y = 40; y < 84; y += 5) ctx.fillRect(wx, y, ww, 1.5);
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 3; ctx.strokeRect(wx, 38, ww, 48);
  }
  // letreiro
  ctx.font = '900 22px Fraunces, Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0b2a5b'; ctx.fillText('DTS', 620, 62);
  ctx.font = '700 7px Inter, sans-serif'; ctx.fillStyle = '#6b7280'; ctx.fillText('DIGITAL & TECHNOLOGY SERVICES', 620, 80);
  // relógio
  ctx.fillStyle = '#fff'; circ(ctx, 1190, 60, 13); ctx.fill(); ctx.strokeStyle = '#334155'; ctx.lineWidth = 2; ctx.stroke();
  const a = t * 0.2; ctx.beginPath(); ctx.moveTo(1190, 60); ctx.lineTo(1190 + Math.cos(a) * 9, 60 + Math.sin(a) * 9); ctx.moveTo(1190, 60); ctx.lineTo(1190 + Math.cos(a / 12) * 6, 60 + Math.sin(a / 12) * 6); ctx.stroke();
  // quadro "Great people"
  ctx.fillStyle = '#1e293b'; ctx.fillRect(1560, 44, 70, 40); ctx.fillStyle = '#f59e0b'; ctx.font = '700 6.5px Inter'; ctx.fillText('GREAT PEOPLE', 1595, 58); ctx.fillText('GREATER IMPACT', 1595, 70);
  // paredes laterais / inferior
  ctx.fillStyle = '#434a5c'; ctx.fillRect(0, 0, 16, WORLD.H); ctx.fillRect(WORLD.W - 16, 0, 16, WORLD.H); ctx.fillRect(0, WORLD.H - 16, WORLD.W, 16);
}
