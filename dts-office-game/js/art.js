// =====================================================================
// ARTE PROCEDURAL — caricaturas "cabeção" e mobília em visão 3/4
// =====================================================================

function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  return [parseInt(c.substr(0, 2), 16), parseInt(c.substr(2, 2), 16), parseInt(c.substr(4, 2), 16)];
}
function shade(hex, amt) {
  let [r, g, b] = hexToRgb(hex);
  if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
function rgba(hex, a) { const [r, g, b] = hexToRgb(hex); return `rgba(${r},${g},${b},${a})`; }

function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function ell(ctx, x, y, rx, ry) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
function circ(ctx, x, y, r) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); }

// ---------------------------------------------------------------------
// Personagem. Pés em (x,y). Tamanho base ~62px de altura, cabeça gigante.
// o = { x, y, s, dir: 'down'|'up'|'left'|'right', t, walk, talk, mood, blink, photo }
// ---------------------------------------------------------------------
const HY = -44, HR = 15;

function drawCharacter(ctx, ch, o) {
  const L = ch.look;
  const s = o.s || 1, t = o.t || 0, dir = o.dir || 'down';
  const side = dir === 'left' || dir === 'right';
  const back = dir === 'up';
  const ph = o.walk ? Math.sin(t * 11) : 0;
  const bob = o.walk ? Math.abs(Math.cos(t * 11)) * 1.6 : Math.sin(t * 2.2) * 0.45;

  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.scale(s, s);

  // sombra
  ctx.fillStyle = 'rgba(20,20,40,.20)';
  ell(ctx, 0, 0, 12, 4); ctx.fill();

  if (dir === 'left') ctx.scale(-1, 1);

  const pants = L.pants || '#2b2f3a';
  const shoe = '#1b1b22';
  // pernas
  if (!side) {
    const l1 = Math.max(0, ph) * 2.6, l2 = Math.max(0, -ph) * 2.6;
    ctx.fillStyle = pants; ctx.fillRect(-6, -12, 5, 11 - l1); ctx.fillRect(1, -12, 5, 11 - l2);
    ctx.fillStyle = shoe; rr(ctx, -6.5, -3 - l1, 6, 3, 1.2); ctx.fill(); rr(ctx, 0.5, -3 - l2, 6, 3, 1.2); ctx.fill();
  } else {
    const a = ph * 3.6;
    ctx.fillStyle = shade(pants, -0.2); ctx.fillRect(-2.5 - a, -12, 5, 11);
    ctx.fillStyle = shoe; rr(ctx, -2.5 - a, -3, 7, 3, 1.2); ctx.fill();
    ctx.fillStyle = pants; ctx.fillRect(-2.5 + a, -12, 5, 11);
    ctx.fillStyle = shoe; rr(ctx, -2.5 + a, -3, 7, 3, 1.2); ctx.fill();
  }

  ctx.translate(0, -bob);

  const shirt = L.shirt || '#f6f6f4';
  const oc = L.outfitColor;
  const sleeve = L.outfit === 'vest' ? shirt : oc;
  const swing = ph * 0.38;

  // braço de trás (lateral)
  if (side) drawArm(ctx, 1, -25, -swing, shade(sleeve, -0.18), L.skin);

  // tronco
  if (side) {
    ctx.fillStyle = L.outfit === 'vest' ? shirt : oc;
    rr(ctx, -7.5, -28, 15, 19, 6); ctx.fill();
    if (L.outfit === 'vest') { ctx.fillStyle = oc; rr(ctx, -7.5, -24, 15, 15, 5); ctx.fill(); }
    if (L.outfit === 'blazer' || L.outfit === 'suit') { ctx.fillStyle = shirt; ctx.beginPath(); ctx.moveTo(3, -28); ctx.lineTo(7.5, -28); ctx.lineTo(7, -19); ctx.closePath(); ctx.fill(); }
  } else {
    ctx.fillStyle = (L.outfit === 'vest') ? shirt : oc;
    rr(ctx, -10, -28, 20, 19, 6); ctx.fill();
    if (!back) drawTorsoFront(ctx, L, shirt, oc);
    else { ctx.strokeStyle = shade(oc, -0.2); ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(0, -10); ctx.stroke(); if (L.outfit === 'vest') { ctx.fillStyle = oc; rr(ctx, -10, -25, 20, 16, 5); ctx.fill(); } }
  }

  // braços
  if (!side) {
    drawArm(ctx, -12, -25, swing, sleeve, L.skin);
    drawArm(ctx, 12, -25, -swing, sleeve, L.skin);
  } else {
    drawArm(ctx, -1, -25, swing, sleeve, L.skin);
  }

  // pescoço
  ctx.fillStyle = shade(L.skin, -0.12);
  ctx.fillRect(-3, -32, 6, 5);

  // cabeça
  const photo = o.photo && o.photo.complete && o.photo.naturalWidth ? o.photo : null;
  if (photo && !back) drawPhotoHead(ctx, photo, side);
  else if (back) drawHeadBack(ctx, L);
  else if (side) drawHeadSide(ctx, L, o, t);
  else drawHeadFront(ctx, L, o, t);

  ctx.restore();
}

function drawArm(ctx, x, y, ang, sleeve, skin) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.fillStyle = sleeve; rr(ctx, -2.6, -1, 5.2, 12, 2.6); ctx.fill();
  ctx.fillStyle = skin; circ(ctx, 0, 12, 2.6); ctx.fill();
  ctx.restore();
}

function drawTorsoFront(ctx, L, shirt, oc) {
  const dark = shade(oc, -0.25);
  switch (L.outfit) {
    case 'vest': {
      ctx.fillStyle = oc; rr(ctx, -10, -24.5, 20, 15.5, 5); ctx.fill();
      ctx.fillStyle = shirt; ctx.beginPath(); ctx.moveTo(-4, -25); ctx.lineTo(4, -25); ctx.lineTo(0, -15); ctx.closePath(); ctx.fill();
      drawTie(ctx, L.tie || '#222');
      ctx.fillStyle = dark; circ(ctx, 0, -13.5, 0.8); ctx.fill(); circ(ctx, 0, -11, 0.8); ctx.fill();
      // "logo" de lapela
      ctx.fillStyle = '#dfe6f3'; ctx.beginPath(); ctx.moveTo(5, -18); ctx.lineTo(7, -18); ctx.lineTo(6, -20); ctx.closePath(); ctx.fill();
      break;
    }
    case 'blazer':
    case 'suit': {
      ctx.fillStyle = shirt; ctx.beginPath(); ctx.moveTo(-4.5, -28); ctx.lineTo(4.5, -28); ctx.lineTo(0, -15); ctx.closePath(); ctx.fill();
      if (L.outfit === 'suit' && L.tie) drawTie(ctx, L.tie);
      ctx.strokeStyle = dark; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-4.5, -28); ctx.lineTo(-1.5, -18); ctx.lineTo(-1, -10); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(4.5, -28); ctx.lineTo(1.5, -18); ctx.lineTo(1, -10); ctx.stroke();
      ctx.fillStyle = dark; circ(ctx, 2.5, -13, 0.8); ctx.fill();
      break;
    }
    case 'polo': {
      ctx.fillStyle = shade(oc, 0.25);
      ctx.beginPath(); ctx.moveTo(-5, -28); ctx.lineTo(0, -24); ctx.lineTo(-2, -22.5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(5, -28); ctx.lineTo(0, -24); ctx.lineTo(2, -22.5); ctx.closePath(); ctx.fill();
      ctx.fillStyle = dark; circ(ctx, 0, -21, 0.7); ctx.fill(); circ(ctx, 0, -18.5, 0.7); ctx.fill();
      break;
    }
    case 'hoodie': {
      ctx.strokeStyle = '#f2f2f2'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(-2, -26); ctx.lineTo(-2.5, -19); ctx.moveTo(2, -26); ctx.lineTo(2.5, -19); ctx.stroke();
      ctx.fillStyle = dark; rr(ctx, -6, -15, 12, 4, 2); ctx.fill();
      break;
    }
    default: { // shirt
      ctx.fillStyle = shade(oc, -0.12);
      ctx.beginPath(); ctx.moveTo(-5, -28); ctx.lineTo(0, -25); ctx.lineTo(-2.5, -22.5); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(5, -28); ctx.lineTo(0, -25); ctx.lineTo(2.5, -22.5); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = shade(oc, -0.22); ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(0, -25); ctx.lineTo(0, -10); ctx.stroke();
      ctx.fillStyle = shade(oc, -0.3); circ(ctx, 0, -20, 0.6); ctx.fill(); circ(ctx, 0, -15, 0.6); ctx.fill();
    }
  }
}
function drawTie(ctx, c) {
  ctx.fillStyle = c;
  ctx.beginPath(); ctx.moveTo(-1.4, -25); ctx.lineTo(1.4, -25); ctx.lineTo(0.9, -23.5); ctx.lineTo(2, -14); ctx.lineTo(0, -12); ctx.lineTo(-2, -14); ctx.lineTo(-0.9, -23.5); ctx.closePath(); ctx.fill();
}

function drawPhotoHead(ctx, img, side) {
  ctx.save();
  circ(ctx, 0, HY, HR + 2.5); ctx.clip();
  const iw = img.naturalWidth, ih = img.naturalHeight, m = Math.min(iw, ih);
  ctx.drawImage(img, (iw - m) / 2, (ih - m) / 2, m, m, -HR - 2.5, HY - HR - 2.5, (HR + 2.5) * 2, (HR + 2.5) * 2);
  ctx.restore();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.6; circ(ctx, 0, HY, HR + 2.5); ctx.stroke();
}

// ---------------- cabelo ----------------
function hairCapPath(ctx, hairline) {
  // meia-calota superior + linha do cabelo na testa
  ctx.beginPath();
  ctx.arc(0, HY, HR + 1.2, Math.PI * 1.0, Math.PI * 2.0);
  hairline(ctx);
  ctx.closePath();
}
function drawHairFront(ctx, L) {
  const hc = L.hairColor, dk = shade(hc, -0.3), lt = shade(hc, 0.18);
  ctx.fillStyle = hc;
  switch (L.hair) {
    case 'short':
      hairCapPath(ctx, c => { c.lineTo(15.5, HY - 1); c.quadraticCurveTo(13, HY - 8, 5, HY - 7.5); c.quadraticCurveTo(0, HY - 5.5, -5, HY - 7.5); c.quadraticCurveTo(-13, HY - 8, -15.5, HY - 1); });
      ctx.fill(); break;
    case 'messy': {
      hairCapPath(ctx, c => { c.lineTo(15.5, HY - 1); c.quadraticCurveTo(13, HY - 9, 6, HY - 6); c.lineTo(3, HY - 9); c.lineTo(0, HY - 5); c.lineTo(-3, HY - 9); c.lineTo(-6, HY - 5.5); c.quadraticCurveTo(-13, HY - 9, -15.5, HY - 1); });
      ctx.fill();
      for (let i = 0; i < 9; i++) {
        const a = Math.PI * (1.08 + i * 0.105), r = HR + 1;
        const x = Math.cos(a) * r, y = HY + Math.sin(a) * r;
        const x2 = Math.cos(a - 0.12) * (r + 5 + (i % 2) * 2), y2 = HY + Math.sin(a - 0.12) * (r + 5 + (i % 2) * 2);
        ctx.beginPath(); ctx.moveTo(x - 3, y + 1); ctx.lineTo(x2, y2); ctx.lineTo(x + 3, y + 1); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = dk; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-6, HY - 12); ctx.quadraticCurveTo(-2, HY - 15, 2, HY - 11); ctx.moveTo(4, HY - 13); ctx.quadraticCurveTo(8, HY - 15, 10, HY - 10); ctx.stroke();
      break;
    }
    case 'sidepart':
      hairCapPath(ctx, c => { c.lineTo(15.5, HY - 1); c.quadraticCurveTo(14, HY - 6, 9, HY - 7); c.quadraticCurveTo(0, HY - 8, -5, HY - 11.5); c.quadraticCurveTo(-11, HY - 9, -15.5, HY - 2); });
      ctx.fill();
      ctx.strokeStyle = dk; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-5, HY - 11.5); ctx.lineTo(-6, HY - 16); ctx.stroke();
      ctx.strokeStyle = lt; ctx.beginPath(); ctx.moveTo(-2, HY - 12); ctx.quadraticCurveTo(6, HY - 14, 12, HY - 8); ctx.stroke();
      break;
    case 'slick':
      hairCapPath(ctx, c => { c.lineTo(15, HY - 3); c.quadraticCurveTo(9, HY - 11.5, 0, HY - 11.5); c.quadraticCurveTo(-9, HY - 11.5, -15, HY - 3); });
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, HY - 2, 12, Math.PI * 1.25, Math.PI * 1.55); ctx.stroke();
      break;
    case 'long':
      hairCapPath(ctx, c => { c.lineTo(15.5, HY - 1); c.quadraticCurveTo(10, HY - 9, 0, HY - 11); c.quadraticCurveTo(-10, HY - 9, -15.5, HY - 1); });
      ctx.fill();
      rr(ctx, -17.5, HY - 6, 6.5, 27, 3.2); ctx.fill();
      rr(ctx, 11, HY - 6, 6.5, 27, 3.2); ctx.fill();
      ctx.strokeStyle = dk; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, HY - 11); ctx.lineTo(0, HY - 15.5); ctx.stroke();
      break;
    case 'curly':
      hairCapPath(ctx, c => { c.lineTo(15.5, HY - 2); c.quadraticCurveTo(0, HY - 9, -15.5, HY - 2); });
      ctx.fill();
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI * (0.97 + i * 0.106);
        circ(ctx, Math.cos(a) * 14.5, HY + Math.sin(a) * 14.5, 4.6); ctx.fill();
      }
      ctx.fillStyle = lt; circ(ctx, -4, HY - 12, 3.4); ctx.fill(); circ(ctx, 4, HY - 12.5, 3.4); ctx.fill();
      break;
    case 'bun':
      circ(ctx, 0, HY - 18, 6.5); ctx.fill();
      hairCapPath(ctx, c => { c.lineTo(15.5, HY - 1); c.quadraticCurveTo(10, HY - 10, 0, HY - 10.5); c.quadraticCurveTo(-10, HY - 10, -15.5, HY - 1); });
      ctx.fill(); break;
    case 'buzz':
      ctx.globalAlpha = 0.72;
      hairCapPath(ctx, c => { c.lineTo(15, HY - 3); c.quadraticCurveTo(8, HY - 10, 0, HY - 10); c.quadraticCurveTo(-8, HY - 10, -15, HY - 3); });
      ctx.fill(); ctx.globalAlpha = 1; break;
    case 'bald':
      ell(ctx, -14.5, HY - 3, 2.5, 4.5); ctx.fill(); ell(ctx, 14.5, HY - 3, 2.5, 4.5); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.35)'; ell(ctx, -5, HY - 10, 4, 2.2); ctx.fill();
      break;
  }
}
function drawHairBackLayer(ctx, L, side) {
  if (L.hair !== 'long') return;
  ctx.fillStyle = shade(L.hairColor, -0.12);
  if (side) { rr(ctx, -17, HY - 12, 22, 34, 9); ctx.fill(); }
  else { rr(ctx, -17.5, HY - 12, 35, 34, 11); ctx.fill(); }
}

// ---------------- cabeça de frente ----------------
function drawHeadFront(ctx, L, o, t) {
  const skin = L.skin, mood = o.mood || 'neutral';
  drawHairBackLayer(ctx, L, false);
  // orelhas
  ctx.fillStyle = skin; circ(ctx, -14.6, HY + 1, 3.6); ctx.fill(); circ(ctx, 14.6, HY + 1, 3.6); ctx.fill();
  ctx.fillStyle = shade(skin, -0.15); circ(ctx, -14.6, HY + 1, 1.8); ctx.fill(); circ(ctx, 14.6, HY + 1, 1.8); ctx.fill();
  // rosto
  const g = ctx.createRadialGradient(-4, HY - 5, 3, 0, HY, HR + 2);
  g.addColorStop(0, shade(skin, 0.1)); g.addColorStop(1, skin);
  ctx.fillStyle = g; circ(ctx, 0, HY, HR); ctx.fill();
  // bochechas
  ctx.fillStyle = 'rgba(240,110,110,.22)'; ell(ctx, -8.5, HY + 3.5, 3, 2); ctx.fill(); ell(ctx, 8.5, HY + 3.5, 3, 2); ctx.fill();
  // barba
  drawBeardFront(ctx, L);
  // olhos + sobrancelhas
  const blink = o.blink && mood !== 'laugh';
  drawEye(ctx, -5.5, HY + 1.5, mood, blink, L, -1);
  drawEye(ctx, 5.5, HY + 1.5, mood, blink, L, 1);
  drawBrows(ctx, L, mood);
  // nariz
  ctx.strokeStyle = shade(skin, -0.28); ctx.lineWidth = 1; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-0.8, HY + 4); ctx.quadraticCurveTo(0.6, HY + 6.4, 1.8, HY + 5); ctx.stroke();
  // boca
  drawMouth(ctx, 0, HY + 9, mood, o.talk && Math.floor(t * 9) % 2 === 0, L);
  // cabelo frente
  drawHairFront(ctx, L);
  // óculos
  if (L.glasses) {
    ctx.strokeStyle = '#1d1d22'; ctx.lineWidth = 1.25; ctx.fillStyle = 'rgba(255,255,255,.16)';
    rr(ctx, -10, HY - 1.8, 8.8, 6.6, 2); ctx.fill(); ctx.stroke();
    rr(ctx, 1.2, HY - 1.8, 8.8, 6.6, 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-1.2, HY + 0.6); ctx.lineTo(1.2, HY + 0.6); ctx.moveTo(-10, HY); ctx.lineTo(-14.2, HY - 0.5); ctx.moveTo(10, HY); ctx.lineTo(14.2, HY - 0.5); ctx.stroke();
  }
  if (L.earrings) { ctx.fillStyle = '#f5c542'; circ(ctx, -14.8, HY + 5.4, 1.4); ctx.fill(); circ(ctx, 14.8, HY + 5.4, 1.4); ctx.fill(); }
}

function drawEye(ctx, x, y, mood, blink, L, sideSign) {
  ctx.lineCap = 'round';
  if (blink) { ctx.strokeStyle = '#2a1d17'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 2.4, y); ctx.lineTo(x + 2.4, y); ctx.stroke(); return; }
  if (mood === 'laugh' || mood === 'love') {
    ctx.strokeStyle = '#2a1d17'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(x, y + 1.2, 2.6, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    if (mood === 'love') { ctx.fillStyle = '#e11d48'; ctx.font = '5px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('♥', x, y - 3.5); }
    return;
  }
  const big = mood === 'surprised';
  ctx.fillStyle = '#fff'; ell(ctx, x, y, big ? 3.2 : 2.7, big ? 3.8 : 3.1); ctx.fill();
  ctx.fillStyle = '#3a2618'; circ(ctx, x + (mood === 'look' ? 0 : 0.2), y + 0.3, big ? 1.5 : 1.85); ctx.fill();
  ctx.fillStyle = '#fff'; circ(ctx, x + 0.8, y - 0.7, 0.65); ctx.fill();
  if (mood === 'look' || mood === 'sad') { // pálpebra entediada
    ctx.fillStyle = shade(L.skin, -0.06); ctx.fillRect(x - 3.2, y - 3.6, 6.4, mood === 'look' ? 3.4 : 2.2);
    ctx.strokeStyle = shade(L.skin, -0.35); ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(x - 2.8, y - 0.2); ctx.lineTo(x + 2.8, y - 0.2); ctx.stroke();
  }
}
function drawBrows(ctx, L, mood) {
  ctx.strokeStyle = shade(L.hairColor, -0.15); ctx.lineWidth = 1.7; ctx.lineCap = 'round';
  const y = HY - 3.8;
  let li = 0, lo = 0, ri = 0, ro = 0; // deslocamentos verticais (inner/outer)
  if (mood === 'angry') { li = 1.6; lo = -0.8; ri = 1.6; ro = -0.8; }
  else if (mood === 'sad') { li = -1.4; lo = 0.6; ri = -1.4; ro = 0.6; }
  else if (mood === 'surprised') { li = lo = ri = ro = -2; }
  else if (mood === 'look') { ri = -2.2; ro = -1.8; }
  ctx.beginPath(); ctx.moveTo(-8.4, y + lo); ctx.lineTo(-3, y + li); ctx.moveTo(3, y + ri); ctx.lineTo(8.4, y + ro); ctx.stroke();
}
function drawMouth(ctx, x, y, mood, open, L) {
  ctx.lineCap = 'round';
  if (open && mood !== 'surprised') {
    ctx.fillStyle = '#6b1f24'; ell(ctx, x, y, 3, 2.3); ctx.fill();
    ctx.fillStyle = '#e57373'; ell(ctx, x, y + 1.1, 1.8, 0.9); ctx.fill();
    return;
  }
  switch (mood) {
    case 'laugh': case 'love':
      ctx.fillStyle = '#6b1f24'; ctx.beginPath(); ctx.moveTo(x - 4.6, y - 1.2); ctx.quadraticCurveTo(x, y + 6.2, x + 4.6, y - 1.2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(x - 3.4, y - 1.2, 6.8, 1.3);
      break;
    case 'surprised':
      ctx.fillStyle = '#6b1f24'; ell(ctx, x, y + 0.5, 2.1, 2.8); ctx.fill(); break;
    case 'angry': case 'sad':
      ctx.strokeStyle = '#6b2a2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 3, y + 1.2); ctx.quadraticCurveTo(x, y - 1.6, x + 3, y + 1.2); ctx.stroke(); break;
    case 'look':
      ctx.strokeStyle = '#6b2a2a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(x - 3, y + 0.3); ctx.lineTo(x + 2, y + 0.3); ctx.quadraticCurveTo(x + 3.2, y + 0.2, x + 3.6, y - 0.8); ctx.stroke(); break;
    default:
      ctx.strokeStyle = '#6b2a2a'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x - 3.6, y - 0.6); ctx.quadraticCurveTo(x, y + 2.8, x + 3.6, y - 0.6); ctx.stroke();
  }
}
function drawBeardFront(ctx, L) {
  if (!L.beard || L.beard === 'none') return;
  const hc = L.hairColor;
  const jaw = () => {
    ctx.beginPath();
    ctx.arc(0, HY, HR + 0.4, Math.PI * 0.03, Math.PI * 0.97);
    ctx.quadraticCurveTo(-9, HY + 8.5, 0, HY + 7.4);
    ctx.quadraticCurveTo(9, HY + 8.5, 14.8, HY + 1.8);
    ctx.closePath();
  };
  const stache = () => { ctx.beginPath(); ctx.moveTo(-5.2, HY + 7.3); ctx.quadraticCurveTo(0, HY + 4.6, 5.2, HY + 7.3); ctx.quadraticCurveTo(0, HY + 6.6, -5.2, HY + 7.3); ctx.fill(); };
  if (L.beard === 'full') { ctx.fillStyle = shade(hc, 0.1); jaw(); ctx.fill(); ctx.fillStyle = shade(hc, -0.1); stache(); }
  else if (L.beard === 'stubble') { ctx.fillStyle = rgba(hc, 0.28); jaw(); ctx.fill(); }
  else if (L.beard === 'goatee') { ctx.fillStyle = hc; ell(ctx, 0, HY + 12.5, 4.2, 3.4); ctx.fill(); stache(); }
  else if (L.beard === 'mustache') { ctx.fillStyle = hc; ctx.beginPath(); ctx.moveTo(-6, HY + 7.8); ctx.quadraticCurveTo(0, HY + 3.8, 6, HY + 7.8); ctx.quadraticCurveTo(0, HY + 6.4, -6, HY + 7.8); ctx.fill(); }
}

// ---------------- cabeça de lado (olhando para a direita) ----------------
function drawHeadSide(ctx, L, o, t) {
  const skin = L.skin, mood = o.mood || 'neutral', hc = L.hairColor;
  drawHairBackLayer(ctx, L, true);
  ctx.fillStyle = skin; circ(ctx, 0, HY, HR); ctx.fill();
  // nariz
  ctx.beginPath(); ctx.moveTo(13.2, HY + 1); ctx.quadraticCurveTo(17.4, HY + 4.5, 13.6, HY + 6); ctx.fill();
  // orelha
  ctx.fillStyle = shade(skin, -0.05); circ(ctx, -2.5, HY + 1, 3.6); ctx.fill();
  ctx.fillStyle = shade(skin, -0.18); circ(ctx, -2.5, HY + 1, 1.7); ctx.fill();
  // bochecha
  ctx.fillStyle = 'rgba(240,110,110,.22)'; ell(ctx, 6.5, HY + 4, 3, 2); ctx.fill();
  // barba
  if (L.beard === 'full' || L.beard === 'stubble') {
    ctx.fillStyle = L.beard === 'full' ? hc : rgba(hc, 0.28);
    ctx.beginPath(); ctx.moveTo(-0.5, HY + 3); ctx.quadraticCurveTo(2, HY + 15, 10, HY + 13.5); ctx.quadraticCurveTo(14.5, HY + 11, 13.6, HY + 7);
    ctx.quadraticCurveTo(8, HY + 6.5, 4, HY + 4); ctx.closePath(); ctx.fill();
  } else if (L.beard === 'goatee') { ctx.fillStyle = hc; ell(ctx, 10, HY + 12, 3, 2.8); ctx.fill(); }
  if (L.beard === 'mustache' || L.beard === 'full' || L.beard === 'goatee') { ctx.fillStyle = shade(hc, -0.1); ell(ctx, 12, HY + 7, 3.2, 1.3); ctx.fill(); }
  // olho
  const blink = o.blink && mood !== 'laugh';
  drawEye(ctx, 7, HY + 1.5, mood, blink, L, 1);
  ctx.strokeStyle = shade(hc, -0.15); ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  const by = mood === 'surprised' ? -6 : mood === 'angry' ? -2.8 : -3.8;
  ctx.beginPath(); ctx.moveTo(4, HY + by); ctx.lineTo(10, HY + by + (mood === 'angry' ? 1.2 : 0)); ctx.stroke();
  // boca
  drawMouth(ctx, 10, HY + 9, mood, o.talk && Math.floor(t * 9) % 2 === 0, L);
  // cabelo
  ctx.fillStyle = hc;
  ctx.beginPath();
  const low = L.hair === 'long' ? 0.52 : 0.72;
  ctx.arc(0, HY, HR + 1.2, Math.PI * low, Math.PI * 1.86);
  if (L.hair === 'messy') { ctx.lineTo(13, HY - 4); ctx.lineTo(9, HY - 6); ctx.lineTo(7, HY - 3); ctx.lineTo(3, HY - 7); }
  else if (L.hair === 'slick' || L.hair === 'buzz' || L.hair === 'bald') { ctx.quadraticCurveTo(6, HY - 10, 2, HY - 9); }
  else { ctx.quadraticCurveTo(10, HY - 5, 4, HY - 6); }
  ctx.quadraticCurveTo(-1, HY - 3, -5, HY - 1);
  ctx.quadraticCurveTo(-7, HY + 4, -8, HY + 6);
  ctx.closePath();
  if (L.hair === 'bald') { ctx.globalAlpha = 0; }
  if (L.hair === 'buzz') ctx.globalAlpha = 0.72;
  ctx.fill(); ctx.globalAlpha = 1;
  if (L.hair === 'messy') { for (let i = 0; i < 5; i++) { const a = Math.PI * (1.1 + i * 0.15); const x = Math.cos(a) * 16, y = HY + Math.sin(a) * 16; ctx.beginPath(); ctx.moveTo(x - 2.5, y + 1); ctx.lineTo(x + Math.cos(a - 0.3) * 5, y + Math.sin(a - 0.3) * 5); ctx.lineTo(x + 2.5, y + 1); ctx.fill(); } }
  if (L.hair === 'curly') { for (let i = 0; i <= 6; i++) { const a = Math.PI * (0.78 + i * 0.17); circ(ctx, Math.cos(a) * 14.5, HY + Math.sin(a) * 14.5, 4.5); ctx.fill(); } }
  if (L.hair === 'bun') { circ(ctx, -4, HY - 17, 6); ctx.fill(); }
  if (L.glasses) {
    ctx.strokeStyle = '#1d1d22'; ctx.lineWidth = 1.25; ctx.fillStyle = 'rgba(255,255,255,.16)';
    rr(ctx, 3.2, HY - 1.8, 8.4, 6.6, 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(3.2, HY); ctx.lineTo(-2, HY - 0.5); ctx.stroke();
  }
  if (L.earrings) { ctx.fillStyle = '#f5c542'; circ(ctx, -2.5, HY + 5.6, 1.4); ctx.fill(); }
}

// ---------------- cabeça de costas ----------------
function drawHeadBack(ctx, L) {
  const skin = L.skin, hc = L.hairColor;
  ctx.fillStyle = skin; circ(ctx, -14.6, HY + 1, 3.6); ctx.fill(); circ(ctx, 14.6, HY + 1, 3.6); ctx.fill();
  circ(ctx, 0, HY, HR); ctx.fill();
  if (L.hair === 'bald') { ctx.fillStyle = hc; ell(ctx, 0, HY + 7, 13, 5); ctx.fill(); return; }
  ctx.fillStyle = hc;
  if (L.hair === 'buzz') ctx.globalAlpha = 0.72;
  ctx.beginPath(); ctx.arc(0, HY, HR + 1.2, Math.PI * 0.82, Math.PI * 2.18); ctx.quadraticCurveTo(0, HY + 13, -12.5, HY + 9); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  if (L.hair === 'long') { rr(ctx, -16, HY - 4, 32, 28, 10); ctx.fill(); }
  if (L.hair === 'curly') { for (let i = 0; i < 12; i++) { const a = Math.PI * (0.8 + i * 0.13); circ(ctx, Math.cos(a) * 14, HY + Math.sin(a) * 14, 4.6); ctx.fill(); } }
  if (L.hair === 'bun') { circ(ctx, 0, HY - 16, 6.5); ctx.fill(); }
  if (L.hair === 'messy') { for (let i = 0; i < 8; i++) { const a = Math.PI * (1.05 + i * 0.12); const x = Math.cos(a) * 16, y = HY + Math.sin(a) * 16; ctx.beginPath(); ctx.moveTo(x - 3, y + 1); ctx.lineTo(Math.cos(a) * 21, HY + Math.sin(a) * 21); ctx.lineTo(x + 3, y + 1); ctx.fill(); } }
  ctx.strokeStyle = shade(hc, -0.25); ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-4, HY - 10); ctx.quadraticCurveTo(0, HY - 4, -2, HY + 4); ctx.moveTo(5, HY - 9); ctx.quadraticCurveTo(7, HY - 2, 4, HY + 5); ctx.stroke();
}

// ---------------------------------------------------------------------
// Retrato (diálogos / cards). Usa foto se houver, senão a caricatura.
// ---------------------------------------------------------------------
function drawPortrait(canvas, ch, opts = {}) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, shade(ch.color, 0.55)); bg.addColorStop(1, shade(ch.color, 0.1));
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  // "blinds" do escritório
  ctx.fillStyle = 'rgba(255,255,255,.12)';
  for (let y = 6; y < h; y += 12) ctx.fillRect(0, y, w, 4);
  const photo = opts.photo;
  if (photo && photo.complete && photo.naturalWidth && !opts.noPhoto) {
    const iw = photo.naturalWidth, ih = photo.naturalHeight, m = Math.min(iw, ih);
    ctx.drawImage(photo, (iw - m) / 2, (ih - m) / 2, m, m, 0, 0, w, h);
    return;
  }
  const s = w / 46;
  drawCharacter(ctx, ch, { x: w / 2, y: h * 0.46 - HY * s, s, dir: opts.dir || 'down', t: opts.t || 0, mood: opts.mood, talk: opts.talk, blink: opts.blink });
}

// ---------------------------------------------------------------------
// Mobília (visão 3/4): footprint (x,y,w,d) + altura h
// ---------------------------------------------------------------------
function box3(ctx, x, y, w, d, h, top, front, r = 3) {
  ctx.fillStyle = front; rr(ctx, x, y + d - h, w, h, r); ctx.fill();
  ctx.fillStyle = top; rr(ctx, x, y - h, w, d, r); ctx.fill();
}
function label(ctx, text, x, y, size = 9, color = 'rgba(40,50,70,.55)') {
  ctx.fillStyle = color; ctx.font = `700 ${size}px Inter, system-ui, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}

const FURN = {
  desk(ctx, f, t) {
    const { x, y, w, d } = f, h = 22;
    box3(ctx, x, y, w, d, h, '#d5b286', '#a17e57', 4);
    ctx.fillStyle = 'rgba(0,0,0,.08)'; ctx.fillRect(x + 4, y + d - h + 4, w - 8, 2);
    // monitor (de costas para nós)
    ctx.fillStyle = '#2d3340'; rr(ctx, x + w / 2 - 25, y - h - 30, 50, 28, 3); ctx.fill();
    ctx.fillStyle = '#3c4454'; ctx.fillRect(x + w / 2 - 4, y - h - 4, 8, 6);
    ctx.fillStyle = '#f59e0b'; ctx.font = '700 6px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('DTS', x + w / 2, y - h - 14);
    // decoração por dono
    const o = f.owner;
    if (o === 'ana') { ['#fde047', '#f472b6', '#60a5fa', '#a78bfa', '#4ade80'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x + 8 + i * 7, y - h + 6 + (i % 2) * 3, 6, 6); }); }
    if (o === 'guilherme') { [8, 14, 10, 18].forEach((v, i) => { ctx.fillStyle = '#2563eb'; ctx.fillRect(x + w - 30 + i * 5, y - h + 24 - v, 4, v); }); }
    if (o === 'thiago') { ctx.fillStyle = '#2d3340'; rr(ctx, x + 6, y - h - 24, 26, 20, 2); ctx.fill(); ctx.fillStyle = '#10b981'; ctx.fillRect(x + 9, y - h - 21, 20, 2); }
    if (o === 'luis') { ctx.fillStyle = '#8b5cf6'; rr(ctx, x + 10, y - h + 8, 18, 11, 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillRect(x + 13, y - h + 10, 12, 3); }
    if (o === 'rodrigo') { ctx.fillStyle = '#111827'; rr(ctx, x + w - 26, y - h + 8, 16, 10, 2); ctx.fill(); ctx.fillStyle = '#0ea5e9'; circ(ctx, x + w - 18, y - h + 13, 2); ctx.fill(); }
    if (o === 'victor') { ctx.fillStyle = '#cbd5e1'; rr(ctx, x + 8, y - h + 6, 26, 16, 2); ctx.fill(); ctx.strokeStyle = '#f97316'; ctx.lineWidth = 1.4; circ(ctx, x + 21, y - h + 14, 4); ctx.stroke(); }
    // caneca
    ctx.fillStyle = '#fff'; rr(ctx, x + w - 12, y - h + 22, 7, 8, 2); ctx.fill();
    // plaquinha
    ctx.fillStyle = '#1f2937'; rr(ctx, x + w / 2 - 24, y + d - h + 6, 48, 10, 2); ctx.fill();
    const ch = CAST_BY_ID[o];
    ctx.fillStyle = '#fbbf24'; ctx.font = '700 6.5px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(ch ? ch.first.toUpperCase() : '', x + w / 2, y + d - h + 11.5);
  },
  chair(ctx, f) {
    const { x, y } = f;
    ctx.fillStyle = '#374151'; rr(ctx, x - 11, y - 30, 22, 20, 5); ctx.fill();
    ctx.fillStyle = '#4b5563'; rr(ctx, x - 12, y - 14, 24, 10, 4); ctx.fill();
    ctx.fillStyle = '#111827'; ctx.fillRect(x - 1.5, y - 5, 3, 5);
  },
  mdDesk(ctx, f) {
    const { x, y, w, d } = f, h = 24;
    box3(ctx, x, y, w, d, h, '#7c4a2d', '#5b341e', 4);
    ctx.fillStyle = '#2d3340'; rr(ctx, x + 20, y - h - 28, 48, 26, 3); ctx.fill();
    // caneca "Melhor MD do Mundo"
    ctx.fillStyle = '#fff'; rr(ctx, x + w - 44, y - h + 10, 14, 15, 3); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x + w - 29, y - h + 17, 4, -1.2, 1.2); ctx.stroke();
    ctx.fillStyle = '#f59e0b'; ctx.font = '700 4px Inter'; ctx.textAlign = 'center'; ctx.fillText('#1 MD', x + w - 37, y - h + 18);
    ctx.fillStyle = '#fbbf24'; rr(ctx, x + w / 2 - 34, y + d - h + 6, 68, 11, 2); ctx.fill();
    ctx.fillStyle = '#3b2412'; ctx.font = '800 6.5px Inter'; ctx.fillText('MANAGING DIRECTOR', x + w / 2, y + d - h + 12);
  },
  table(ctx, f) { const { x, y, w, d } = f; box3(ctx, x, y, w, d, 20, '#e8dccb', '#b8a58a', 8); },
  confTable(ctx, f) {
    const { x, y, w, d } = f;
    for (let i = 0; i < 5; i++) { FURN.chair(ctx, { x: x + 35 + i * 62, y: y + 2 }); }
    box3(ctx, x, y, w, d, 20, '#8a5a3b', '#63402a', 14);
    ctx.fillStyle = 'rgba(255,255,255,.08)'; rr(ctx, x + 10, y - 16, w - 20, 10, 6); ctx.fill();
    for (let i = 0; i < 4; i++) { ctx.fillStyle = '#f5f5f4'; ctx.fillRect(x + 40 + i * 70, y - 4, 16, 12); }
  },
  confChairsFront(ctx, f) { for (let i = 0; i < 5; i++) { const cx = f.x + 35 + i * 62, cy = f.y; ctx.fillStyle = '#374151'; rr(ctx, cx - 11, cy - 20, 22, 10, 4); ctx.fill(); ctx.fillStyle = '#1f2937'; rr(ctx, cx - 10, cy - 12, 20, 12, 4); ctx.fill(); } },
  fridge(ctx, f) {
    const { x, y, w, d } = f, h = 74;
    box3(ctx, x, y, w, d, h, '#e5e7eb', '#cfd4dc', 5);
    ctx.fillStyle = '#b8bec8'; ctx.fillRect(x + 3, y + d - h + 26, w - 6, 1.5);
    ctx.fillStyle = '#9aa1ad'; ctx.fillRect(x + w - 10, y + d - h + 8, 3, 14); ctx.fillRect(x + w - 10, y + d - h + 34, 3, 20);
    ['#fde047', '#f472b6', '#60a5fa'].forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(x + 8 + i * 9, y + d - h + 36 + (i % 2) * 5, 7, 7); });
  },
  counter(ctx, f) {
    const { x, y, w, d } = f, h = 34;
    box3(ctx, x, y, w, d, h, '#f4efe6', '#8d6e52', 3);
    // máquina de café
    const cx = x + 22;
    ctx.fillStyle = '#1f2937'; rr(ctx, cx, y - h - 30, 34, 36, 4); ctx.fill();
    ctx.fillStyle = '#f59e0b'; rr(ctx, cx + 5, y - h - 25, 24, 8, 2); ctx.fill();
    ctx.fillStyle = '#111'; ctx.font = '700 5px Inter'; ctx.textAlign = 'center'; ctx.fillText('3000', cx + 17, y - h - 20);
    ctx.fillStyle = '#fff'; rr(ctx, cx + 12, y - h - 2, 9, 8, 2); ctx.fill();
    // micro-ondas
    const mx = x + 82;
    ctx.fillStyle = '#d1d5db'; rr(ctx, mx, y - h - 20, 44, 26, 3); ctx.fill();
    ctx.fillStyle = '#1f2937'; rr(ctx, mx + 4, y - h - 16, 28, 18, 2); ctx.fill();
    ctx.fillStyle = '#22c55e'; ctx.fillRect(mx + 35, y - h - 14, 6, 3);
  },
  vending(ctx, f, t) {
    const { x, y, w, d } = f, h = 84;
    box3(ctx, x, y, w, d, h, '#b91c1c', '#dc2626', 4);
    ctx.fillStyle = '#e0f2fe'; rr(ctx, x + 5, y + d - h + 6, w - 20, h - 26, 2); ctx.fill();
    const cols = ['#f59e0b', '#8b5cf6', '#10b981', '#ef4444'];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) { ctx.fillStyle = cols[(r + c) % 4]; ctx.fillRect(x + 8 + c * 10, y + d - h + 10 + r * 13, 7, 8); }
    ctx.fillStyle = '#1f2937'; ctx.fillRect(x + w - 13, y + d - h + 10, 8, 20);
  },
  cooler(ctx, f, t) {
    const { x, y } = f;
    ctx.fillStyle = '#e5e7eb'; rr(ctx, x, y - 26, 26, 30, 4); ctx.fill();
    ctx.fillStyle = 'rgba(96,165,250,.75)'; rr(ctx, x + 3, y - 50, 20, 26, 8); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x + 7, y - 46, 3, 16);
    const b = (t * 0.6) % 1; ctx.fillStyle = 'rgba(255,255,255,.8)'; circ(ctx, x + 14, y - 28 - b * 18, 1.4); ctx.fill();
    ctx.fillStyle = '#3b82f6'; ctx.fillRect(x + 6, y - 18, 4, 3); ctx.fillStyle = '#ef4444'; ctx.fillRect(x + 16, y - 18, 4, 3);
  },
  shelf(ctx, f) {
    const { x, y, w, d } = f, h = 64;
    box3(ctx, x, y, w, d, h, '#9ca3af', '#6b7280', 2);
    for (let r = 0; r < 3; r++) {
      ctx.fillStyle = '#4b5563'; ctx.fillRect(x + 3, y + d - h + 6 + r * 19, w - 6, 15);
      for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#fde047', '#60a5fa', '#f472b6', '#e5e7eb', '#34d399', '#f97316'][(i + r) % 6]; ctx.fillRect(x + 6 + i * 16, y + d - h + 9 + r * 19, 12, 11); }
    }
  },
  bookshelf(ctx, f) {
    const { x, y, w, d } = f, h = 72;
    box3(ctx, x, y, w, d, h, '#6b4a2f', '#4a3220', 2);
    for (let r = 0; r < 3; r++) for (let i = 0; i < 9; i++) { ctx.fillStyle = ['#b91c1c', '#1d4ed8', '#047857', '#a16207', '#6d28d9'][(i * 3 + r) % 5]; ctx.fillRect(x + 5 + i * 9, y + d - h + 6 + r * 22, 7, 16 - (i % 3) * 2); }
  },
  printer(ctx, f, t, st) {
    const { x, y, w, d } = f, h = 40;
    const shake = st && st.printerShake > 0 ? Math.sin(t * 60) * 2 : 0;
    ctx.save(); ctx.translate(shake, 0);
    box3(ctx, x, y, w, d, h, '#e5e7eb', '#9ca3af', 4);
    ctx.fillStyle = '#374151'; ctx.fillRect(x + 8, y - h + 6, w - 16, 6);
    ctx.fillStyle = '#fff'; ctx.fillRect(x + 14, y - h - 6, w - 28, 10);
    ctx.fillStyle = (Math.floor(t * 2) % 2) ? '#ef4444' : '#7f1d1d'; circ(ctx, x + w - 8, y + d - h + 8, 2.2); ctx.fill();
    ctx.restore();
  },
  receptionCounter(ctx, f, t) {
    const { x, y, w, d } = f, h = 36;
    box3(ctx, x, y, w, d, h, '#f3f4f6', '#1f2d4d', 6);
    ctx.fillStyle = '#f59e0b'; ctx.font = '800 9px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('DTS', x + w / 2, y + d - h / 2);
    // sino
    const bx = x + 40, by = y - h + 18;
    ctx.fillStyle = '#374151'; ell(ctx, bx, by + 3, 9, 3); ctx.fill();
    ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(bx, by + 1, 8, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#fde68a'; circ(ctx, bx, by - 8, 2); ctx.fill();
  },
  sofa(ctx, f) {
    const { x, y, w, d } = f;
    box3(ctx, x, y, w, d, 16, '#475569', '#334155', 8);
    ctx.fillStyle = '#334155'; rr(ctx, x, y - 34, w, 20, 8); ctx.fill();
    ctx.fillStyle = '#f59e0b'; rr(ctx, x + 12, y - 26, 20, 14, 4); ctx.fill();
  },
  plant(ctx, f, t) {
    const { x, y } = f, sz = f.big ? 1.35 : 1;
    ctx.fillStyle = '#b45309'; rr(ctx, x - 10 * sz, y - 16 * sz, 20 * sz, 16 * sz, 3); ctx.fill();
    const sway = Math.sin(t * 1.3 + x) * 1.5 + (f.rustle > 0 ? Math.sin(t * 40) * 3 : 0);
    ctx.fillStyle = '#15803d';
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i - 3) * 0.38; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * 12 * sz + sway * (i / 7), y - 22 * sz + Math.sin(a) * 12 * sz, 5 * sz, 11 * sz, a + Math.PI / 2, 0, Math.PI * 2); ctx.fill(); }
    ctx.fillStyle = '#22c55e'; circ(ctx, x + sway * 0.5, y - 30 * sz, 6 * sz); ctx.fill();
  },
  camera(ctx, f, t) {
    const { x, y } = f;
    ctx.strokeStyle = '#111827'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y - 30); ctx.lineTo(x - 10, y); ctx.moveTo(x, y - 30); ctx.lineTo(x + 10, y); ctx.moveTo(x, y - 30); ctx.lineTo(x, y); ctx.stroke();
    ctx.fillStyle = '#1f2937'; rr(ctx, x - 14, y - 44, 24, 16, 3); ctx.fill();
    ctx.fillStyle = '#4b5563'; circ(ctx, x - 16, y - 36, 5); ctx.fill();
    ctx.fillStyle = (Math.floor(t * 2) % 2) ? '#ef4444' : '#450a0a'; circ(ctx, x + 6, y - 40, 1.8); ctx.fill();
    // luz de estúdio
    ctx.strokeStyle = '#6b7280'; ctx.beginPath(); ctx.moveTo(x + 40, y); ctx.lineTo(x + 40, y - 50); ctx.stroke();
    ctx.fillStyle = '#fef3c7'; rr(ctx, x + 30, y - 64, 20, 16, 3); ctx.fill();
  },
  stool(ctx, f) {
    const { x, y } = f;
    ctx.fillStyle = '#7c2d12'; rr(ctx, x - 12, y - 22, 24, 8, 3); ctx.fill();
    ctx.strokeStyle = '#1f2937'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 8, y - 14); ctx.lineTo(x - 10, y); ctx.moveTo(x + 8, y - 14); ctx.lineTo(x + 10, y); ctx.stroke();
  },
  glassH(ctx, f) {
    const { x, y, w } = f, h = 46;
    ctx.fillStyle = 'rgba(165,205,235,.30)'; ctx.fillRect(x, y - h, w, h + 4);
    ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 20; i < w; i += 70) { ctx.beginPath(); ctx.moveTo(x + i, y - h); ctx.lineTo(x + i + 18, y - h); ctx.lineTo(x + i - 4, y); ctx.lineTo(x + i - 22, y); ctx.closePath(); ctx.fill(); }
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(x, y - h - 2, w, 3); ctx.fillStyle = '#64748b'; ctx.fillRect(x, y + 2, w, 3);
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(x, y - 22, w, 2);
  },
  glassV(ctx, f) {
    const { x, y, d } = f, h = 46;
    ctx.fillStyle = 'rgba(165,205,235,.30)'; ctx.fillRect(x - 3, y - h, 6, d + 4);
    ctx.fillStyle = '#94a3b8'; ctx.fillRect(x - 3, y - h - 2, 6, 3); ctx.fillRect(x - 3, y + d - h, 6, h + 4);
    ctx.fillStyle = '#64748b'; ctx.fillRect(x - 1, y - h, 2, d);
  },
  tv(ctx, f, t, st) {
    const { x, y, w } = f;
    ctx.fillStyle = '#111827'; rr(ctx, x, y - 64, w, 44, 3); ctx.fill();
    const on = st && st.tvOn;
    ctx.fillStyle = on ? '#1d4ed8' : '#1f2937'; ctx.fillRect(x + 4, y - 60, w - 8, 36);
    if (on) { ctx.fillStyle = '#fff'; ctx.font = '700 7px Inter'; ctx.textAlign = 'center'; ctx.fillText(st.tvText || 'SLIDE 1 DE 87', x + w / 2, y - 40); }
  },
  whiteboard(ctx, f, t, st) {
    const { x, y, w } = f;
    ctx.fillStyle = '#9ca3af'; ctx.fillRect(x - 2, y - 66, w + 4, 48);
    ctx.fillStyle = '#fafafa'; ctx.fillRect(x, y - 64, w, 44);
    ctx.fillStyle = '#dc2626'; ctx.font = '700 6.5px Inter'; ctx.textAlign = 'left';
    ctx.fillText('DIAS SEM INCIDENTE', x + 6, y - 54); ctx.fillText('DE EXCEL:', x + 6, y - 45);
    ctx.fillStyle = '#111'; ctx.font = '800 16px Inter'; ctx.fillText(String(st ? st.excelDays : 0), x + 60, y - 38);
    ctx.strokeStyle = '#2563eb'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 8, y - 30); ctx.lineTo(x + 30, y - 36); ctx.lineTo(x + 50, y - 28); ctx.stroke();
  },
  rug(ctx, f) {
    const { x, y, w, d } = f;
    ctx.fillStyle = '#1e3a8a'; rr(ctx, x, y, w, d, 14); ctx.fill();
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3; rr(ctx, x + 8, y + 8, w - 16, d - 16, 10); ctx.stroke();
    ctx.fillStyle = 'rgba(245,158,11,.9)'; ctx.font = '900 30px Fraunces, Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('DTS', x + w / 2, y + d / 2 - 6);
    ctx.font = '700 9px Inter'; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillText('PESSOAS · TECNOLOGIA · RESULTADOS', x + w / 2, y + d / 2 + 18);
  },
};
