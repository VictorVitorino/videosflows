// =====================================================================
// CENAS — motor de "mockumentary": letterbox, câmera na mão, zoom no
// olhar para a câmera, depoimentos (confessionais), FX e gravação .webm
// =====================================================================

// ------------------------- partículas / efeitos -------------------------
const FX = {
  parts: [], flash: 0, shake: 0, stamps: [],
  spawn(k, x, y) {
    const P = this.parts;
    const R = (a, b) => a + Math.random() * (b - a);
    switch (k) {
      case 'confetti': for (let i = 0; i < 90; i++) P.push({ k: 'rect', x: x + R(-120, 120), y: y - R(90, 200), vx: R(-30, 30), vy: R(20, 90), rot: R(0, 6), vr: R(-8, 8), c: ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#a855f7', '#f472b6'][i % 6], life: R(2, 3.2), w: 5, h: 3 }); Sfx.play('pop'); break;
      case 'hearts': for (let i = 0; i < 16; i++) P.push({ k: 'txt', s: '❤️', x: x + R(-30, 30), y: y - R(40, 70), vx: R(-15, 15), vy: R(-50, -20), life: R(1.4, 2.2), size: R(9, 15) }); break;
      case 'sparkle': for (let i = 0; i < 22; i++) P.push({ k: 'txt', s: '✨', x: x + R(-50, 50), y: y - R(20, 90), vx: R(-10, 10), vy: R(-25, -5), life: R(1, 1.8), size: R(8, 13) }); break;
      case 'trophy': for (let i = 0; i < 12; i++) P.push({ k: 'txt', s: i % 3 ? '⭐' : '🏆', x: x + R(-40, 40), y: y - R(60, 90), vx: R(-20, 20), vy: R(-40, -10), life: R(1.5, 2.4), size: R(10, 16) }); break;
      case 'papers': for (let i = 0; i < 26; i++) P.push({ k: 'rect', x: x + R(-10, 10), y: y - 40, vx: R(-110, 110), vy: R(-140, -40), g: 160, rot: R(0, 6), vr: R(-6, 6), c: '#ffffff', life: R(1.6, 2.4), w: 9, h: 12 }); Sfx.play('whoosh'); break;
      case 'postits': for (let i = 0; i < 40; i++) P.push({ k: 'rect', x: x + R(-60, 60), y: y - R(0, 70), vx: 0, vy: 0, rot: R(-0.4, 0.4), vr: 0, c: ['#fde047', '#fde047', '#f9a8d4', '#86efac'][i % 4], life: 3, w: 8, h: 8, pop: i * 0.03 }); break;
      case 'jelly': P.push({ k: 'jelly', x, y: y + 6, life: 3.2 }); Sfx.play('splat'); break;
      case 'rain': P.push({ k: 'cloud', x, y: y - 80, life: 3 }); break;
      case 'coffee': for (let i = 0; i < 14; i++) P.push({ k: 'dot', x: x + R(-6, 6), y: y - 40, vx: R(-40, 40), vy: R(-80, -20), g: 220, c: '#6b3e1f', life: R(0.6, 1), r: R(1.5, 3) }); break;
      case 'steam': for (let i = 0; i < 6; i++) P.push({ k: 'dot', x: x + R(-5, 5), y: y - R(50, 60), vx: R(-4, 4), vy: R(-25, -12), c: 'rgba(255,255,255,.7)', life: R(0.8, 1.4), r: R(2, 4) }); break;
      case 'notes': for (let i = 0; i < 8; i++) P.push({ k: 'txt', s: ['🎵', '🎶'][i % 2], x: x + R(-20, 20), y: y - R(40, 70), vx: R(-10, 10), vy: R(-30, -15), life: R(1.2, 2), size: R(9, 13) }); break;
      case 'flash': this.flash = 1; break;
      case 'shake': this.shake = 0.6; break;
      case 'ding': P.push({ k: 'ring', x, y: y - 30, life: 1.2 }); break;
    }
  },
  update(dt) {
    this.flash = Math.max(0, this.flash - dt * 2.5);
    this.shake = Math.max(0, this.shake - dt);
    for (const p of this.parts) {
      p.life -= dt; if (p.pop) { p.pop -= dt; continue; }
      if (p.vx != null) { p.x += p.vx * dt; p.y += p.vy * dt; }
      if (p.g) p.vy += p.g * dt;
      if (p.vr) p.rot += p.vr * dt;
      if (p.k === 'rect' && p.c !== '#ffffff' && !p.g && p.vy) { p.vx *= 0.99; p.x += Math.sin(p.life * 5) * 0.4; }
    }
    this.parts = this.parts.filter(p => p.life > 0);
  },
  draw(ctx, t) {
    for (const p of this.parts) {
      if (p.pop > 0) continue;
      ctx.globalAlpha = Math.min(1, p.life * 2);
      switch (p.k) {
        case 'rect': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot || 0); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore(); break;
        case 'txt': ctx.font = `${p.size}px serif`; ctx.textAlign = 'center'; ctx.fillText(p.s, p.x, p.y); break;
        case 'dot': ctx.fillStyle = p.c; circ(ctx, p.x, p.y, p.r); ctx.fill(); break;
        case 'ring': { const k = 1.2 - p.life; ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 3; circ(ctx, p.x, p.y, 10 + k * 90); ctx.stroke(); break; }
        case 'jelly': {
          ctx.fillStyle = 'rgba(74,222,128,.8)'; rr(ctx, p.x - 18, p.y - 22 + Math.sin(t * 12) * 1.5, 36, 24, 8); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.fillRect(p.x - 12, p.y - 18, 5, 12);
          ctx.fillStyle = '#374151'; ctx.fillRect(p.x - 9, p.y - 12, 18, 5); ctx.fillStyle = '#9ca3af'; ctx.fillRect(p.x - 9, p.y - 14, 18, 2);
          break;
        }
        case 'cloud': {
          ctx.fillStyle = '#64748b'; circ(ctx, p.x - 10, p.y, 11); ctx.fill(); circ(ctx, p.x + 8, p.y - 3, 13); ctx.fill(); circ(ctx, p.x + 22, p.y + 2, 9); ctx.fill();
          ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 1.5;
          for (let i = 0; i < 6; i++) { const yy = ((t * 90 + i * 17) % 40); ctx.beginPath(); ctx.moveTo(p.x - 14 + i * 7, p.y + 10 + yy); ctx.lineTo(p.x - 15 + i * 7, p.y + 15 + yy); ctx.stroke(); }
          break;
        }
      }
    }
    ctx.globalAlpha = 1;
  },
};

// ------------------------------ gravação ------------------------------
const Recorder = {
  rec: null, chunks: [], ext: 'webm', enabled: true,
  supported() { return !!(window.MediaRecorder && HTMLCanvasElement.prototype.captureStream); },
  start(canvas) {
    if (!this.enabled || !this.supported()) return false;
    try {
      const stream = canvas.captureStream(30);
      if (Sfx.recDest) Sfx.recDest.stream.getAudioTracks().forEach(tr => stream.addTrack(tr));
      const types = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
      const mime = types.find(t => MediaRecorder.isTypeSupported(t)) || '';
      this.ext = mime.includes('mp4') ? 'mp4' : 'webm';
      this.rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 4_000_000 } : undefined);
      this.chunks = [];
      this.rec.ondataavailable = e => { if (e.data && e.data.size) this.chunks.push(e.data); };
      this.rec.start(250);
      return true;
    } catch (e) { console.warn('Gravação indisponível:', e); this.rec = null; return false; }
  },
  stop() {
    return new Promise(res => {
      if (!this.rec) return res(null);
      const r = this.rec; this.rec = null;
      r.onstop = () => { const blob = new Blob(this.chunks, { type: r.mimeType || 'video/webm' }); res(blob.size ? { url: URL.createObjectURL(blob), ext: this.ext, size: blob.size } : null); };
      try { r.stop(); } catch (e) { res(null); }
    });
  },
};

// ------------------------------- a cena -------------------------------
const Scene = {
  active: false, script: null, idx: 0, beat: null, bt: 0, bd: 0, t: 0,
  cam: { x: 0, y: 0, z: 2 }, camT: { x: 0, y: 0, z: 2 }, bars: 0,
  title: null, sub: null, conf: null, endcard: false, blackout: 0, look: null, spot: null, focus: null, stageIds: [],
  onEnd: null, recording: false,

  play(script, onEnd) {
    this.active = true; this.script = script; this.idx = -1; this.t = 0; this.onEnd = onEnd;
    this.title = this.sub = this.conf = this.look = this.spot = this.focus = null; this.endcard = false; this.blackout = 0; this.bars = 0;
    this.stageIds = (script.cast || []).map(i => i === 'player' ? Game.S.playerId : i); this.layout = null;
    const g = Game.cam; this.cam = { x: g.x, y: g.y, z: g.z }; this.camT = { ...this.cam };
    Game.freezeAll(true);
    document.body.classList.add('in-scene');
    Sfx.play('sting');
    this.recording = Recorder.start(Game.canvas);
    this.next();
  },
  A(id) { return Game.actor(id === 'player' ? Game.S.playerId : id); },
  next() {
    this.idx++;
    if (this.idx >= this.script.beats.length) return this.finish();
    const b = this.beat = this.script.beats[this.idx];
    this.bt = 0; this.bd = 0.01;
    const who = b.who ? this.A(b.who) : null;
    switch (b.t) {
      case 'title': this.title = { text: b.text, sub: b.sub }; this.bd = b.d || 2.8; break;
      case 'cut': this.blackout = 1; this.place(b.actors, b.at, b.layout, true); Sfx.play('whoosh'); this.bd = 0.5; break;
      case 'stage': this.place(b.actors, b.at, b.layout, false); this.bd = 1.0; break;
      case 'say': {
        this.title = null;
        const len = b.text.length;
        this.bd = b.d || Math.min(6.5, Math.max(2.1, 1.3 + len * 0.052));
        this.sub = { name: who.ch.first, color: who.ch.color, text: b.text };
        who.mood = b.mood || who.mood || 'neutral'; who.talkUntil = Game.time + Math.min(this.bd - 0.4, 0.8 + len * 0.045);
        if (b.mood && MOOD_EMOJI[b.mood] && b.mood !== 'neutral') who.emote = { e: MOOD_EMOJI[b.mood], t: 1.4 };
        this.focus = who.id; this.faceStage(who);
        Sfx.speak(b.text, who.ch);
        break;
      }
      case 'emote': who.emote = { e: b.e, t: 1.4 }; this.bd = 0.45; Sfx.play('pop'); break;
      case 'fx': { const a = who || this.A(this.stageIds[0] || 'player'); FX.spawn(b.k, a.x, a.y); if (b.k === 'confetti') Sfx.play('applause'); this.bd = b.d || 0.5; break; }
      case 'sfx': Sfx.play(b.k); this.bd = b.d || 0.05; break;
      case 'look': who.dir = 'down'; who.mood = 'look'; this.look = who.id; this.sub = null; Sfx.play('whoosh'); this.bd = b.d || 1.8; break;
      case 'conf': this.conf = { id: who.id, text: b.text }; this.sub = { name: '', text: b.text, conf: true }; this.bd = Math.min(8, 2.6 + b.text.length * 0.055); Sfx.speak(b.text, who.ch); break;
      case 'mood': who.mood = b.mood; this.bd = 0.05; break;
      case 'face': who.dir = b.dir; this.bd = 0.05; break;
      case 'award': this.spot = who.id; this.focus = who.id; this.sub = { name: '🏆 ' + who.ch.name, color: '#fbbf24', text: b.title }; FX.spawn('trophy', who.x, who.y); Sfx.play('applause'); Sfx.play('success'); who.mood = 'love'; who.emote = { e: '🏆', t: 3 }; this.bd = 3.4; break;
      case 'wait': this.bd = b.d || 1; break;
      case 'end': this.endcard = true; this.sub = null; this.conf = null; this.spot = null; this.bd = 2.6; Sfx.play('rimshot'); break;
    }
  },
  faceStage(who) {
    // quem fala olha para o parceiro mais próximo; os outros olham para quem fala
    for (const id of this.stageIds) {
      const a = this.A(id); if (!a || a === who) continue;
      a.faceTo(who.x, who.y);
    }
    const others = this.stageIds.map(id => this.A(id)).filter(a => a && a !== who);
    if (this.layout === 'gather') { who.dir = 'down'; return; }
    if (others.length) { let best = others[0]; for (const o of others) if (Math.hypot(o.x - who.x, o.y - who.y) < Math.hypot(best.x - who.x, best.y - who.y)) best = o; who.faceTo(best.x, best.y); }
  },
  place(ids, at, layout, instant) {
    ids = (ids || this.stageIds).map(i => i === 'player' ? Game.S.playerId : i);
    this.stageIds = ids.slice(); this.layout = layout || 'pair';
    const actors = ids.map(id => Game.actor(id));
    let anchor = at;
    if (!anchor) {
      const a0 = actors[0];
      anchor = { x: a0.x, y: a0.y };
      // se o protagonista está na própria mesa, a cena acontece na frente dela (câmera livre de monitores)
      if (a0.ch && Math.hypot(a0.x - a0.ch.home.x, a0.y - a0.ch.home.y) < 30) anchor = freePoint(a0.ch.home.x, a0.ch.home.y + 104);
    }
    const spots = [];
    if (layout === 'gather') {
      // anfitrião na frente, plateia em semicírculo
      // anfitrião ao centro, elenco em linha dos dois lados (plano de "all-hands")
      spots.push({ x: anchor.x, y: anchor.y });
      for (let i = 1; i < actors.length; i++) { const k = Math.ceil(i / 2), sg = i % 2 ? -1 : 1; spots.push({ x: anchor.x + sg * k * 52, y: anchor.y + 12 + k * 5 }); }
    } else {
      spots.push({ x: anchor.x, y: anchor.y });
      const side = anchor.x > WORLD.W / 2 ? -1 : 1;
      const offs = [[side * 46, 6], [-side * 46, 6], [0, 46], [side * 90, 10]];
      for (let i = 1; i < actors.length; i++) { const [dx, dy] = offs[(i - 1) % offs.length]; spots.push({ x: anchor.x + dx, y: anchor.y + dy }); }
    }
    actors.forEach((a, i) => {
      const p = freePoint(spots[i].x, spots[i].y);
      if (instant) { a.x = p.x; a.y = p.y; a.glide = null; }
      else a.glide = { fx: a.x, fy: a.y, tx: p.x, ty: p.y, t: 0, d: 0.9 };
      a.path = null;
    });
    // todos se olham
    setTimeout(() => { const c = actors[0]; actors.forEach((a, i) => { if (i) a.faceTo(c.x, c.y); }); if (actors[1]) c.faceTo(actors[1].x, actors[1].y); if (layout === 'gather') c.dir = 'down'; }, instant ? 0 : 950);
  },
  update(dt) {
    if (!this.active) return;
    this.t += dt; this.bt += dt;
    this.bars = Math.min(1, this.bars + dt * 2.2);
    this.blackout = Math.max(0, this.blackout - dt * 2.4);
    // glides
    for (const id of this.stageIds) {
      const a = Game.actor(id); if (!a || !a.glide) continue;
      const g = a.glide; g.t += dt; const k = Math.min(1, g.t / g.d);
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      a.x = g.fx + (g.tx - g.fx) * e; a.y = g.fy + (g.ty - g.fy) * e;
      a.walking = k < 1; if (Math.abs(g.tx - g.fx) > Math.abs(g.ty - g.fy)) a.dir = g.tx > g.fx ? 'right' : 'left'; else a.dir = g.ty > g.fy ? 'down' : 'up';
      if (k >= 1) { a.glide = null; a.walking = false; }
    }
    // câmera
    this.frameCamera(dt);
    if (this.bt >= this.bd) {
      const b = this.beat;
      if (b && b.t === 'look') { const a = this.A(b.who); if (a) a.mood = 'neutral'; this.look = null; }
      if (b && b.t === 'conf') { this.conf = null; this.sub = null; if (b.rim) Sfx.play('rimshot'); }
      if (b && b.t === 'award') { this.spot = null; }
      if (b && b.t === 'title') this.title = null;
      this.next();
    }
  },
  frameCamera(dt) {
    const W = Game.W, H = Game.H;
    const acts = this.stageIds.map(id => Game.actor(id)).filter(Boolean);
    if (!acts.length) return;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const a of acts) { const px = a.glide ? a.glide.tx : a.x, py = a.glide ? a.glide.ty : a.y; x0 = Math.min(x0, px); x1 = Math.max(x1, px); y0 = Math.min(y0, py - 60); y1 = Math.max(y1, py); }
    const bw = x1 - x0, bh = y1 - y0;
    let z = Math.min(W / (bw + 220), H * 0.7 / (bh + 120));
    z = Math.max(1.1, Math.min(z, 3.2));
    let cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + 6;
    let speed = 3;
    if (this.look) { const a = Game.actor(this.look); cx = a.x; cy = a.y - 40; z = Math.min(5.2, z * 1.9); speed = 9; }
    else if (this.spot) { const a = Game.actor(this.spot); cx = a.x; cy = a.y - 34; z = Math.min(4, z * 1.5); }
    else if (this.focus && acts.length > 1) { const a = Game.actor(this.focus); if (a) { cx = cx * 0.62 + a.x * 0.38; cy = cy * 0.7 + (a.y - 30) * 0.3; z *= 1.12; } }
    this.camT = { x: cx, y: cy, z };
    const k = Math.min(1, dt * speed);
    this.cam.x += (this.camT.x - this.cam.x) * k; this.cam.y += (this.camT.y - this.cam.y) * k; this.cam.z += (this.camT.z - this.cam.z) * k;
  },
  wobble() { const t = this.t; return { x: Math.sin(t * 1.3) * 3 + Math.sin(t * 2.9) * 1.4, y: Math.cos(t * 1.1) * 2.4 + Math.sin(t * 3.3) * 1, r: Math.sin(t * 0.8) * 0.006 }; },

  finish() {
    this.active = false;
    Game.freezeAll(false);
    document.body.classList.remove('in-scene');
    const done = this.onEnd; this.onEnd = null;
    Sfx.stopVoice();
    Recorder.stop().then(video => { if (done) done(video); });
  },

  // ------------------------- desenho em tela -------------------------
  drawScreen(ctx, W, H) {
    const barH = Math.round(H * 0.095 * this.bars);
    // spotlight (premiação)
    if (this.spot) {
      const a = Game.actor(this.spot), p = Game.toScreen(a.x, a.y - 30);
      const g = ctx.createRadialGradient(p.x, p.y, 40, p.x, p.y, Math.max(W, H) * 0.45);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.72)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    // barras
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, barH); ctx.fillRect(0, H - barH, W, barH);
    if (this.bars > 0.9 && !this.title) {
      const fs = Math.max(11, H * 0.022);
      ctx.font = `700 ${fs}px Inter, system-ui, sans-serif`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
      if (Math.floor(this.t * 2) % 2 === 0) { ctx.fillStyle = '#ef4444'; circ(ctx, 22, barH / 2, fs * 0.35); ctx.fill(); }
      ctx.fillStyle = '#fff'; ctx.fillText('REC', 22 + fs * 0.7, barH / 2);
      const s = this.t, tc = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s) % 60).padStart(2, '0')}:${String(Math.floor((s % 1) * 30)).padStart(2, '0')}`;
      ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillText(tc, 22 + fs * 3.2, barH / 2);
      ctx.textAlign = 'right'; ctx.fillStyle = '#fbbf24';
      ctx.fillText(`DTS OFFICE · EP. ${String(this.script.ep || 1).padStart(2, '0')} · ${this.script.title.toUpperCase()}`, W - 22, barH / 2);
    }
    // confessional por cima do mundo
    if (this.conf) this.drawConfessional(ctx, W, H, barH);
    // legendas
    if (this.sub && !this.title) this.drawSub(ctx, W, H, barH);
    // título
    if (this.title) this.drawTitle(ctx, W, H);
    if (this.endcard) this.drawEnd(ctx, W, H);
    if (this.blackout > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, this.blackout)})`; ctx.fillRect(0, 0, W, H); }
  },
  wrap(ctx, text, maxW) {
    const words = text.split(' '), lines = []; let cur = '';
    for (const w of words) { const test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
    if (cur) lines.push(cur); return lines;
  },
  drawSub(ctx, W, H, barH) {
    const s = this.sub;
    const shown = Math.floor(this.bt * 42);
    const txt = s.text.slice(0, shown);
    const fs = Math.max(15, Math.min(30, H * 0.036));
    ctx.font = `600 ${fs}px Inter, system-ui, sans-serif`;
    const full = (s.name ? s.name + ': ' : '') + s.text;
    const lines = this.wrap(ctx, full, W * 0.78);
    const lh = fs * 1.3, bh = lines.length * lh + fs * 0.8;
    const y = H - barH - bh - H * 0.02;
    ctx.fillStyle = 'rgba(0,0,0,.55)'; rr(ctx, W * 0.1 - 10, y, W * 0.8 + 20, bh, 10); ctx.fill();
    // desenha com nome colorido e revelação progressiva
    let remaining = (s.name ? s.name.length + 2 : 0) + txt.length;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    lines.forEach((ln, i) => {
      const lw = ctx.measureText(ln).width; let x = W / 2 - lw / 2; const yy = y + fs * 0.4 + i * lh;
      ctx.textAlign = 'left';
      let part = ln.slice(0, Math.max(0, remaining)); remaining -= ln.length + 1;
      if (i === 0 && s.name) {
        const nm = s.name + ': ';
        ctx.fillStyle = s.color || '#fbbf24'; ctx.fillText(nm.slice(0, part.length), x, yy);
        x += ctx.measureText(nm).width; part = part.slice(nm.length);
      }
      ctx.fillStyle = s.conf ? '#fefce8' : '#fff'; ctx.fillText(part, x, yy);
    });
  },
  drawTitle(ctx, W, H) {
    const k = Math.min(1, this.bt / 0.6), out = Math.max(0, (this.bt - (this.bd - 0.5)) / 0.5);
    ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = k * (1 - out);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fbbf24'; ctx.font = `800 ${Math.max(12, H * 0.022)}px Inter, sans-serif`;
    ctx.fillText(this.title.sub || '', W / 2, H * 0.40);
    ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.max(26, H * 0.075)}px Fraunces, Georgia, serif`;
    const lines = this.wrap(ctx, this.title.text, W * 0.85);
    lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.5 + i * H * 0.085));
    ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(W / 2 - 60, H * 0.5 + lines.length * H * 0.085, 120, 2);
    ctx.globalAlpha = 1;
  },
  drawEnd(ctx, W, H) {
    const k = Math.min(1, this.bt / 0.5);
    ctx.fillStyle = `rgba(5,7,13,${k})`; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = k; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.max(28, H * 0.08)}px Fraunces, Georgia, serif`; ctx.fillText('FIM DA CENA', W / 2, H * 0.44);
    ctx.fillStyle = '#fbbf24'; ctx.font = `700 ${Math.max(13, H * 0.026)}px Inter, sans-serif`; ctx.fillText(this.script.title, W / 2, H * 0.53);
    ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = `500 ${Math.max(11, H * 0.018)}px Inter, sans-serif`;
    ctx.fillText('DTS OFFICE — um mockumentary do Digital & Technology Services', W / 2, H * 0.6);
    ctx.globalAlpha = 1;
  },
  drawConfessional(ctx, W, H, barH) {
    const a = Game.actor(this.conf.id); const ch = a.ch;
    const t = this.bt, zoom = 1 + t * 0.012, wob = this.wobble();
    ctx.save();
    ctx.fillStyle = '#000'; ctx.fillRect(0, barH, W, H - barH * 2);
    ctx.beginPath(); ctx.rect(0, barH, W, H - barH * 2); ctx.clip();
    ctx.translate(W / 2 + wob.x, H / 2 + wob.y); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);
    // parede
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#d8ccb3'); g.addColorStop(1, '#bfae8e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // janela com persiana
    const wx = W * 0.06, wy = H * 0.14, ww = W * 0.26, wh = H * 0.5;
    const sky = ctx.createLinearGradient(0, wy, 0, wy + wh); sky.addColorStop(0, '#93c5fd'); sky.addColorStop(1, '#fde68a');
    ctx.fillStyle = sky; ctx.fillRect(wx, wy, ww, wh);
    ctx.fillStyle = 'rgba(30,41,59,.45)'; for (let i = 0; i < ww; i += ww / 9) { const bh = wh * (0.2 + ((i * 13) % 7) / 20); ctx.fillRect(wx + i, wy + wh - bh, ww / 11, bh); }
    ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let y = wy; y < wy + wh; y += H * 0.022) ctx.fillRect(wx, y, ww, H * 0.008);
    ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 6; ctx.strokeRect(wx, wy, ww, wh);
    // estante
    const bx = W * 0.72, by = H * 0.12, bw = W * 0.22, bh = H * 0.62;
    ctx.fillStyle = '#6b4a2f'; ctx.fillRect(bx, by, bw, bh);
    for (let r = 0; r < 4; r++) { ctx.fillStyle = '#4a3220'; ctx.fillRect(bx + 6, by + 8 + r * bh / 4, bw - 12, bh / 4 - 12); for (let i = 0; i < 8; i++) { ctx.fillStyle = ['#b91c1c', '#1d4ed8', '#047857', '#a16207', '#6d28d9', '#f59e0b'][(i + r * 2) % 6]; ctx.fillRect(bx + 10 + i * (bw - 20) / 8, by + 14 + r * bh / 4 + (i % 3) * 4, (bw - 20) / 8 - 3, bh / 4 - 22 - (i % 3) * 4); } }
    // pôster
    ctx.fillStyle = '#0b2a5b'; ctx.fillRect(W * 0.4, H * 0.12, W * 0.13, H * 0.2);
    ctx.fillStyle = '#fbbf24'; ctx.font = `800 ${H * 0.03}px Fraunces, Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('DTS', W * 0.465, H * 0.2);
    ctx.font = `700 ${H * 0.011}px Inter`; ctx.fillStyle = '#fff'; ctx.fillText('GREAT PEOPLE · GREATER IMPACT', W * 0.465, H * 0.26);
    // personagem em plano médio
    const s = H / 118;
    drawCharacter(ctx, ch, { x: W * 0.54, y: H * 0.36 - HY * s, s, dir: 'down', t: this.t, mood: a.mood === 'look' ? 'neutral' : (a.mood || 'neutral'), talk: t < this.bd - 0.6, blink: Math.sin(this.t * 2.3) > 0.985, photo: Game.photoFor(ch.id, true) });
    ctx.restore();
    // lower third
    const lx = W * 0.06, ly = H - barH - H * 0.3, lw = Math.max(260, W * 0.3);
    const inK = Math.min(1, t / 0.4);
    ctx.globalAlpha = inK;
    ctx.fillStyle = ch.color; ctx.fillRect(lx, ly, 6, H * 0.075);
    ctx.fillStyle = 'rgba(8,12,24,.82)'; ctx.fillRect(lx + 6, ly, lw * inK, H * 0.075);
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff'; ctx.font = `800 ${Math.max(14, H * 0.03)}px Inter, sans-serif`; ctx.fillText(ch.name, lx + 20, ly + H * 0.008);
    ctx.fillStyle = '#cbd5e1'; ctx.font = `500 ${Math.max(11, H * 0.019)}px Inter, sans-serif`; ctx.fillText(`${ch.role} · ${ch.archetype}`, lx + 20, ly + H * 0.045);
    ctx.globalAlpha = 1;
  },
};
