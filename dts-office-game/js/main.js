// =====================================================================
// DTS OFFICE — motor principal: estado, agentes, interações, missões
// =====================================================================
const rand = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const SAVE_KEY = 'dts_office_save_v1';
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} },
};

class Actor {
  constructor(ch) {
    this.ch = ch; this.id = ch.id;
    this.x = ch.home.x; this.y = ch.home.y; this.dir = 'down';
    this.path = null; this.onArrive = null; this.walking = false;
    this.mood = 'neutral'; this.moodT = 0; this.talkUntil = 0; this.emote = null; this.bubble = null;
    this.seed = Math.random() * 10; this.blinkT = Math.random() * 4; this.blink = false;
    this.frozen = false; this.glide = null; this.speed = 95; this.boost = 0;
    this.ai = { state: 'home', timer: rand(2, 8) };
  }
  faceTo(x, y) { const dx = x - this.x, dy = y - this.y; if (Math.abs(dx) > Math.abs(dy)) this.dir = dx > 0 ? 'right' : 'left'; else this.dir = dy > 0 ? 'down' : 'up'; }
  say(text, t = 3.6) { this.bubble = { text: Game.fmt(text), t }; }
  setMood(m, t = 4) { this.mood = m; this.moodT = t; }
  update(dt) {
    if (this.bubble && (this.bubble.t -= dt) <= 0) this.bubble = null;
    if (this.emote && (this.emote.t -= dt) <= 0) this.emote = null;
    if (this.boost > 0) this.boost -= dt;
    if (this.moodT > 0 && (this.moodT -= dt) <= 0 && !this.frozen) this.mood = 'neutral';
    this.blinkT -= dt; if (this.blinkT <= 0) { this.blink = true; if (this.blinkT < -0.12) { this.blink = false; this.blinkT = rand(2, 5); } }
    if (this.glide) return;
    if (this.path && !this.frozen) {
      const p = this.path[0], dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy);
      const step = this.speed * dt * (this.boost > 0 ? 1.45 : 1);
      if (d <= step) {
        this.x = p.x; this.y = p.y; this.path.shift();
        if (!this.path.length) { this.path = null; this.walking = false; const cb = this.onArrive; this.onArrive = null; cb && cb(); }
      } else {
        this.x += dx / d * step; this.y += dy / d * step; this.walking = true;
        if (Math.abs(dx) > Math.abs(dy) * 1.1) this.dir = dx > 0 ? 'right' : 'left'; else this.dir = dy > 0 ? 'down' : 'up';
      }
    } else if (!this.manual) this.walking = false;
  }
}

const Game = {
  canvas: null, ctx: null, W: 0, H: 0, dpr: 1, time: 0, last: 0,
  mode: 'title', paused: false, S: null, actors: {}, player: null,
  cam: { x: 880, y: 600, z: 1.4 }, keys: {}, pending: null, target: null,
  photos: {}, bobble: false, reel: [], lastScript: null, furnState: { printerShake: 0, tvOn: false, excelDays: 0 },
  touch: false,

  // ------------------------------------------------------------ setup
  init() {
    this.canvas = $('#game'); this.ctx = this.canvas.getContext('2d');
    this.resize(); addEventListener('resize', () => this.resize());
    CAST.forEach(ch => { ch.defaultLook = JSON.parse(JSON.stringify(ch.look)); const saved = store.get('dts_look_' + ch.id); if (saved) { try { ch.look = { ...ch.look, ...JSON.parse(saved) }; } catch (e) {} } });
    CAST.forEach(ch => this.actors[ch.id] = new Actor(ch));
    this.loadPhotos();
    this.bobble = store.get('dts_bobble') === '1';
    this.turbo = /[?&]turbo/.test(location.search) ? 4 : 1; // só para testes
    this.bindInput();
    this.buildTitle();
    requestAnimationFrame(t => this.loop(t));
  },
  resize() {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.W = innerWidth; this.H = innerHeight;
    this.canvas.width = Math.round(this.W * this.dpr); this.canvas.height = Math.round(this.H * this.dpr);
    this.canvas.style.width = this.W + 'px'; this.canvas.style.height = this.H + 'px';
  },
  baseZoom() { return clamp(Math.min(this.W / 1000, this.H / 680) * 1.18, 0.8, 1.9); },
  actor(id) { return this.actors[id]; },
  npcs() { return Object.values(this.actors).filter(a => a !== this.player); },
  fmt(s) {
    if (!s) return '';
    const p = this.player ? this.player.ch.first : 'você';
    const c = this.S && this.S.flags.culprit ? CAST_BY_ID[this.S.flags.culprit].first : 'alguém';
    const n = this._fmtN || '';
    return String(s).replace(/\{p\}/g, p).replace(/\{c\}/g, c).replace(/\{n\}/g, n);
  },
  toScreen(x, y) { const c = Scene.active ? Scene.cam : this.cam; return { x: (x - c.x) * c.z + this.W / 2, y: (y - c.y) * c.z + this.H / 2 }; },
  toWorld(sx, sy) { const c = this.cam; return { x: (sx - this.W / 2) / c.z + c.x, y: (sy - this.H / 2) / c.z + c.y }; },

  // ------------------------------------------------------------ fotos
  loadPhotos() {
    CAST.forEach(ch => {
      const src = store.get('dts_photo_' + ch.id) || (typeof EMBEDDED_PHOTOS !== 'undefined' && EMBEDDED_PHOTOS[ch.id]);
      if (src) { const im = new Image(); im.src = src; this.photos[ch.id] = im; } else delete this.photos[ch.id];
    });
  },
  photoFor(id, world = false, raw = false) { const p = this.photos[id]; if (!p) return null; if (raw) return p; if (world) return this.bobble ? p : null; return p; },
  setPhotoFromFile(id, file, done) {
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
        const m = Math.min(im.width, im.height); x.drawImage(im, (im.width - m) / 2, (im.height - m) / 2 * 0.6, m, m, 0, 0, 256, 256);
        const data = c.toDataURL('image/jpeg', 0.86);
        store.set('dts_photo_' + id, data);
        const p = new Image(); p.src = data; this.photos[id] = p;
        toast(`Foto de ${CAST_BY_ID[id].first} atualizada!`, '📷', 'good'); done && done();
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  },
  clearPhoto(id) { store.del('dts_photo_' + id); this.loadPhotos(); toast('Foto removida — voltando à caricatura.', '🎨'); },
  defaultLook(id) { return CAST_BY_ID[id].defaultLook; },
  setLook(id, look) { CAST_BY_ID[id].look = look; store.set('dts_look_' + id, JSON.stringify(look)); },

  // ------------------------------------------------------------ estado
  newState(pid) {
    const missions = {};
    CAST.forEach(c => { if (c.id !== pid) missions[c.id] = 'available'; });
    return { v: 1, playerId: pid, inv: {}, missions, flags: { maestro: false, skill: false, audited: [], clues: [], interviewed: [], culprit: null, rodrigoDelivered: false, finaleDone: false, gossip: 0 },
      aff: Object.fromEntries(CAST.map(c => [c.id, 3])), vibe: 50, ep: 2, topicIdx: {}, cafes: {}, skills: [], scenes: 0, pranks: 0 };
  },
  save() { if (this.S) store.set(SAVE_KEY, JSON.stringify(this.S)); },
  loadSave() { try { const s = JSON.parse(store.get(SAVE_KEY)); return s && s.v === 1 && CAST_BY_ID[s.playerId] ? s : null; } catch (e) { return null; } },
  has(id) { return (this.S.inv[id] || 0) > 0; },
  addItem(id, silent) { this.S.inv[id] = (this.S.inv[id] || 0) + 1; if (!silent) { Sfx.play('item'); toast(`+1 ${ITEMS[id].name}`, ITEMS[id].icon, 'good'); } this.save(); this.refreshHUD(); },
  removeItem(id) { if (this.has(id)) { this.S.inv[id]--; if (!this.S.inv[id]) delete this.S.inv[id]; this.save(); this.refreshHUD(); } },
  vibe(d) { this.S.vibe = clamp(this.S.vibe + d, 0, 100); this.refreshHUD(); this.save(); },
  aff(id, d) { this.S.aff[id] = clamp((this.S.aff[id] || 3) + d, 0, 10); this.save(); },
  missionActive(id) { return this.S && this.S.missions[id] === 'active'; },
  missionReady(id) {
    const S = this.S, f = S.flags;
    switch (id) {
      case 'fabio': return this.has('cafe') && this.has('discurso');
      case 'ana': return this.has('caneta_azul');
      case 'guilherme': return f.audited.length >= 3;
      case 'thiago': return f.maestro;
      case 'luis': return f.clues.length >= 2;
      case 'rodrigo': return !f.rodrigoDelivered && this.has('proposta');
      case 'victor': return f.skill;
    }
    return false;
  },

  // ------------------------------------------------------------ telas
  buildTitle() {
    const save = this.loadSave();
    $('#btn-continue').classList.toggle('hidden', !save);
    if (save) $('#btn-continue').textContent = `▶ Continuar como ${CAST_BY_ID[save.playerId].first}`;
    $('#btn-new').onclick = () => { Sfx.init(); Sfx.play('select'); this.showSelect(); };
    $('#btn-continue').onclick = () => { Sfx.init(); Sfx.play('select'); this.start(save.playerId, save); };
    $('#btn-how').onclick = () => { Sfx.init(); this.showHelp(); };
  },
  showSelect() {
    $('#screen-title').classList.add('hidden');
    const grid = $('#select-grid'); grid.innerHTML = '';
    this.selectCanvases = [];
    CAST.forEach(ch => {
      const cv = h('canvas', { width: 180, height: 180, class: 'card-cv' });
      this.selectCanvases.push([cv, ch]);
      const card = h('div', { class: 'card', style: `--accent:${ch.color}` },
        h('div', { class: 'card-top' }, cv, h('span', { class: 'card-role' }, ch.role)),
        h('h3', {}, ch.name),
        h('div', { class: 'card-arch' }, ch.archetype),
        h('p', { class: 'card-bio' }, ch.bio),
        h('div', { class: 'card-catch' }, '“' + ch.catch + '”'),
        h('div', { class: 'card-mission' }, h('b', {}, 'Missão que ele(a) dá: '), `${ch.mission.icon} ${ch.mission.title}`),
        h('div', { class: 'card-actions' },
          h('button', { class: 'btn ghost sm', onclick: e => { e.stopPropagation(); Studio.open(ch.id, () => {}); } }, '🎨 Caricatura / 📷 Foto'),
          h('button', { class: 'btn primary', onclick: () => { Sfx.play('select'); this.start(ch.id); } }, `Jogar como ${ch.first.split(' ')[0]}`)));
      grid.append(card);
    });
    $('#screen-select').classList.remove('hidden');
  },
  showHelp() {
    Panel.open('Como jogar', h('div', { class: 'help' },
      h('div', { class: 'help-grid' },
        h('div', {}, h('h4', {}, '🕹️ Controles'), h('p', {}, h('kbd', {}, 'WASD'), ' / ', h('kbd', {}, 'setas'), ' andar · ', h('kbd', {}, 'E'), ' / ', h('kbd', {}, 'Espaço'), ' interagir · ', h('kbd', {}, '1-5'), ' escolher respostas · ', h('kbd', {}, 'Esc'), ' fechar'), h('p', {}, 'No celular/mouse: toque no chão para andar, toque em alguém ou num objeto para ir até lá e interagir.')),
        h('div', {}, h('h4', {}, '🤖 Agentes'), h('p', {}, 'Cada colega é um agente com personalidade, humor e memória de afinidade. Eles andam sozinhos, tomam café, fofocam entre si e às vezes vêm puxar papo com você.')),
        h('div', {}, h('h4', {}, '🎬 Cenas'), h('p', {}, 'Toda conversa terminada vira uma cena de mockumentary: letterbox, câmera na mão, o famoso olhar para a câmera e um depoimento. As cenas são gravadas em vídeo e podem ser baixadas.')),
        h('div', {}, h('h4', {}, '🎯 Missões'), h('p', {}, 'Quem tem ❗ na cabeça precisa de ajuda. ✨ marca objetos úteis para suas missões ativas. Complete todas para desbloquear o DTSies Awards 🏆.')),
        h('div', {}, h('h4', {}, '☕ Objetos'), h('p', {}, 'Máquina de café, geladeira, impressora, bebedouro, almoxarifado, computadores (Flows, Terminal, Outlook, Teams, Power BI), sino, planta, quadro branco, TV e a câmera do documentário.')),
        h('div', {}, h('h4', {}, '🎨 Caricaturas'), h('p', {}, 'Na seleção de personagem, use “Caricatura / Foto” para ajustar a aparência ou enviar a foto de cada pessoa. Ative 🧸 Bobblehead para ver as fotos no boneco.')))));
  },
  start(pid, save) {
    this.S = save || this.newState(pid);
    this.player = this.actors[pid];
    this.player.speed = 165;
    // posições iniciais
    this.npcs().forEach(a => { a.x = a.ch.home.x; a.y = a.ch.home.y; a.path = null; a.ai = { state: 'home', timer: rand(3, 9) }; a.dir = 'down'; });
    this.player.x = 1180; this.player.y = 960; this.player.path = null; this.player.dir = 'up'; this.player.ai = { state: 'player' };
    this.cam = { x: this.player.x, y: this.player.y - 30, z: this.baseZoom() };
    this.furnState.excelDays = 0;
    $('#screen-title').classList.add('hidden'); $('#screen-select').classList.add('hidden');
    this.mode = 'play';
    this.buildHUD();
    this.save();
    if (!save) {
      const ch = this.player.ch;
      this.playScene({ title: 'Piloto', ep: 1, cast: ['player'], beats: [
        { t: 'title', text: 'DTS OFFICE', sub: 'UM MOCKUMENTARY INTERATIVO', d: 2.4 },
        { t: 'title', text: `Episódio 1: ${ch.first} chega ao escritório`, sub: 'PILOTO', d: 2.4 },
        { t: 'conf', who: 'player', text: `Oi. Eu sou ${ch.name}, ${ch.role}. Isto aqui é o DTS. Tem gente que diz que é só um escritório. Essas pessoas nunca abriram a geladeira da copa.`, rim: true },
        { t: 'end' },
      ] }, () => this.tutorial(), 'Começar o expediente');
    } else { this.showHUD(true); toast(`Bem-vindo de volta, ${this.player.ch.first}!`, '👋'); }
  },
  tutorial() {
    const tips = [
      ['Ande com WASD/setas ou tocando no chão.', '🕹️'],
      ['Colegas com ❗ têm uma missão pra você.', '❗'],
      ['Aperte E perto de alguém ou de um objeto para interagir.', '💬'],
      ['Termine uma conversa e ela vira uma cena gravada 🎬', '🎥'],
    ];
    tips.forEach(([m, i], k) => setTimeout(() => toast(m, i), 400 + k * 1800));
  },

  // ------------------------------------------------------------ HUD
  buildHUD() {
    const ch = this.player.ch;
    $('#hud-name').textContent = ch.name; $('#hud-role').textContent = `${ch.role} · ${ch.archetype}`;
    $('#hud').style.setProperty('--accent', ch.color);
    const setBtn = (id, on) => $(id).classList.toggle('off', !on);
    $('#b-missions').onclick = () => this.showMissions();
    $('#b-reel').onclick = () => this.showReel();
    $('#b-sound').onclick = () => { Sfx.init(); Sfx.setMuted(!Sfx.muted); setBtn('#b-sound', !Sfx.muted); $('#b-sound').textContent = Sfx.muted ? '🔇' : '🔊'; };
    $('#b-voice').onclick = () => { Sfx.voices = !Sfx.voices; setBtn('#b-voice', Sfx.voices); toast(Sfx.voices ? 'Vozes ligadas (sintetizador do navegador, pt-BR)' : 'Vozes desligadas', '🗣️'); };
    $('#b-bobble').onclick = () => { this.bobble = !this.bobble; store.set('dts_bobble', this.bobble ? '1' : '0'); setBtn('#b-bobble', this.bobble); toast(this.bobble ? 'Modo Bobblehead: fotos nos bonecos!' : 'Modo caricatura desenhada', '🧸'); };
    $('#b-rec').onclick = () => { Recorder.enabled = !Recorder.enabled; setBtn('#b-rec', Recorder.enabled); toast(Recorder.enabled ? 'Gravação das cenas ligada' : 'Gravação desligada', '🎥'); };
    $('#b-help').onclick = () => this.showHelp();
    $('#b-menu').onclick = () => { if (confirm('Voltar à seleção de personagem? Seu progresso fica salvo.')) location.reload(); };
    setBtn('#b-sound', !Sfx.muted); setBtn('#b-voice', Sfx.voices); setBtn('#b-bobble', this.bobble); setBtn('#b-rec', Recorder.enabled);
    if (!Recorder.supported()) $('#b-rec').classList.add('hidden');
    $('#act-btn').onclick = () => this.interactNearest();
    this.refreshHUD();
  },
  showHUD(on) { $('#hud').classList.toggle('hidden', !on); },
  refreshHUD() {
    if (!this.S || !this.player) return;
    $('#vibe-fill').style.width = this.S.vibe + '%';
    $('#vibe-val').textContent = Math.round(this.S.vibe);
    // missões
    const box = $('#hud-missions'); box.innerHTML = '';
    const active = Object.entries(this.S.missions).filter(([, s]) => s === 'active');
    const avail = Object.values(this.S.missions).filter(s => s === 'available').length;
    const done = Object.values(this.S.missions).filter(s => s === 'done').length, total = Object.keys(this.S.missions).length;
    box.append(h('div', { class: 'hm-head' }, `🎯 Missões ${done}/${total}`, avail ? h('span', { class: 'hm-avail' }, `❗ ${avail} colega${avail > 1 ? 's' : ''} precisa${avail > 1 ? 'm' : ''} de ajuda`) : null));
    active.forEach(([id]) => {
      const m = CAST_BY_ID[id].mission;
      const steps = this.missionSteps(id);
      const next = steps.find(s => !s.done);
      box.append(h('div', { class: 'hm-item' }, h('b', {}, `${m.icon} ${m.title}`), h('span', {}, next ? '→ ' + next.label : '✅')));
    });
    // inventário
    const inv = $('#inventory'); inv.innerHTML = '';
    const items = Object.entries(this.S.inv);
    if (!items.length) inv.append(h('div', { class: 'inv-empty' }, '🎒 vazio'));
    items.forEach(([id, n]) => inv.append(h('button', { class: 'inv-slot', title: ITEMS[id].name + ' — clique para usar', onclick: () => this.useItem(id) }, ITEMS[id].icon, n > 1 ? h('i', {}, n) : null)));
  },
  missionSteps(id) {
    const m = CAST_BY_ID[id].mission, f = this.S.flags, st = this.S.missions[id];
    const done = st === 'done';
    return m.steps.map(s => {
      let ok = done;
      if (!ok) switch (id + ':' + s.id) {
        case 'fabio:cafe': ok = this.has('cafe'); break;
        case 'fabio:discurso': ok = this.has('discurso'); break;
        case 'ana:caneta_azul': ok = this.has('caneta_azul'); break;
        case 'guilherme:audit': ok = f.audited.length >= 3; break;
        case 'thiago:maestro': ok = f.maestro; break;
        case 'luis:pistas': ok = f.clues.length >= 2; break;
        case 'rodrigo:proposta': ok = this.has('proposta') || f.rodrigoDelivered; break;
        case 'rodrigo:entrega': ok = f.rodrigoDelivered; break;
        case 'victor:skill': ok = f.skill; break;
      }
      let label = s.label;
      if (id === 'guilherme' && s.id === 'audit') label += ` (${Math.min(3, f.audited.length)}/3)`;
      if (id === 'luis' && s.id === 'pistas') label += ` (${Math.min(2, f.clues.length)}/2)`;
      return { label, done: ok };
    });
  },
  showMissions() {
    const wrap = h('div', { class: 'missions' });
    Object.entries(this.S.missions).forEach(([id, st]) => {
      const ch = CAST_BY_ID[id], m = ch.mission;
      const badge = { available: '❗ Disponível — fale com ' + ch.first, active: '⏳ Em andamento', done: '✅ Concluída' }[st];
      wrap.append(h('div', { class: 'ms-card ' + st, style: `--accent:${ch.color}` },
        h('div', { class: 'ms-h' }, h('span', { class: 'ms-ico' }, m.icon), h('div', {}, h('b', {}, m.title), h('small', {}, `${ch.name} · ${badge}`))),
        st === 'available' ? null : h('ul', {}, ...this.missionSteps(id).map(s => h('li', { class: s.done ? 'ok' : '' }, (s.done ? '✅ ' : '⬜ ') + s.label)))));
    });
    const done = Object.values(this.S.missions).filter(s => s === 'done').length, total = Object.keys(this.S.missions).length;
    wrap.append(h('div', { class: 'ms-foot' }, done === total ? (this.S.flags.finaleDone ? '🏆 DTSies Awards concluído. Lenda do escritório.' : '🏆 Tudo pronto para o DTSies Awards!') : `Complete as ${total} missões para desbloquear o 🏆 DTSies Awards.`));
    if (done === total && !this.S.flags.finaleDone) wrap.append(h('button', { class: 'btn primary', onclick: () => { Panel.close(); this.finale(); } }, '🏆 Começar o DTSies Awards'));
    Panel.open('Missões do escritório', wrap);
  },
  showReel() {
    const wrap = h('div', { class: 'reel' });
    if (!this.reel.length) wrap.append(h('p', { class: 'muted' }, 'Nenhuma cena ainda. Converse com alguém até o fim da conversa e a câmera começa a rodar 🎬'));
    this.reel.slice().reverse().forEach(r => {
      wrap.append(h('div', { class: 'reel-item' },
        r.video ? h('video', { src: r.video.url, controls: '', playsinline: '' }) : h('div', { class: 'reel-ph' }, '🎬'),
        h('div', { class: 'reel-meta' }, h('b', {}, `Ep. ${r.ep} — ${r.title}`),
          h('div', { class: 'reel-actions' },
            h('button', { class: 'btn sm', onclick: () => { Panel.close(); this.playScene(r.script, null); } }, '🔁 Rever'),
            r.video ? h('a', { class: 'btn sm', href: r.video.url, download: `DTS-Office-Ep${r.ep}.${r.video.ext}` }, '⬇️ Baixar') : null))));
    });
    Panel.open('🎞️ Rolo de Cenas', wrap);
  },

  pause(b) { this.paused = b; if (b) this.keys = {}; },

  // ------------------------------------------------------------ input
  bindInput() {
    addEventListener('keydown', e => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      Sfx.init();
      const k = e.key;
      if (k === 'Escape') {
        if (!$('#studio').classList.contains('hidden')) return Studio.close();
        if (!$('#computer').classList.contains('hidden')) return Computer.close();
        if (!$('#panel').classList.contains('hidden')) return Panel.close();
      }
      if (Dlg.key(k)) { e.preventDefault(); return; }
      if (this.mode !== 'play' || this.paused || Scene.active) return;
      this.keys[k.toLowerCase()] = true;
      if (k === 'e' || k === 'E' || k === ' ' || k === 'Enter') { e.preventDefault(); this.interactNearest(); }
      if (k.startsWith('Arrow') || k === ' ') e.preventDefault();
    });
    addEventListener('keyup', e => { this.keys[e.key.toLowerCase()] = false; });
    addEventListener('blur', () => { this.keys = {}; });
    this.canvas.addEventListener('pointerdown', e => {
      Sfx.init();
      if (e.pointerType === 'touch') { this.touch = true; document.body.classList.add('touch'); }
      if (this.mode !== 'play' || this.paused || Scene.active || Dlg.isOpen) return;
      const w = this.toWorld(e.clientX, e.clientY);
      const hit = this.hitTest(w.x, w.y);
      if (hit) this.walkToTarget(hit);
      else { this.pending = null; this.goPlayer(w.x, w.y); this.clickMark = { x: w.x, y: w.y, t: 0.6 }; }
    });
    this.canvas.addEventListener('pointermove', e => {
      if (this.mode !== 'play') return;
      const w = this.toWorld(e.clientX, e.clientY);
      this.canvas.style.cursor = this.hitTest(w.x, w.y) ? 'pointer' : 'default';
    });
  },
  hitTest(x, y) {
    for (const a of this.npcs()) if (Math.hypot(a.x - x, a.y - 26 - y) < 24) return { kind: 'npc', actor: a };
    let best = null, bd = 34;
    for (const o of OBJECTS) { const d = Math.hypot(o.x - x, o.y - 34 - y); if (d < bd) { bd = d; best = o; } }
    return best ? { kind: 'obj', obj: best } : null;
  },
  goPlayer(x, y, onArrive) {
    const p = findPath(this.player.x, this.player.y, x, y);
    if (p) { this.player.path = p; this.player.onArrive = onArrive || null; } else if (onArrive) onArrive();
  },
  walkToTarget(hit) {
    this.pending = hit;
    if (hit.kind === 'npc') {
      const a = hit.actor, side = this.player.x < a.x ? -1 : 1;
      this.goPlayer(a.x + side * 40, a.y + 4, () => { if (this.pending === hit) { this.pending = null; this.interact(hit); } });
    } else {
      this.goPlayer(hit.obj.x, hit.obj.y, () => { if (this.pending === hit) { this.pending = null; this.interact(hit); } });
    }
  },
  nearest() {
    if (!this.player) return null;
    const p = this.player; let best = null, bd = 1e9;
    for (const a of this.npcs()) { const d = Math.hypot(a.x - p.x, a.y - p.y); if (d < 62 && d < bd) { bd = d; best = { kind: 'npc', actor: a }; } }
    for (const o of OBJECTS) { const d = Math.hypot(o.x - p.x, o.y - p.y); if (d < 44 && d < bd) { bd = d; best = { kind: 'obj', obj: o }; } }
    return best;
  },
  interactNearest() { const n = this.nearest(); if (n) this.interact(n); },
  interact(hit) {
    if (Dlg.isOpen || Scene.active || this.mode !== 'play') return;
    this.player.path = null; this.player.walking = false;
    if (hit.kind === 'npc') this.talkTo(hit.actor);
    else { this.player.faceTo(hit.obj.x, hit.obj.y - 30); this.useObject(hit.obj); }
  },

  // ------------------------------------------------------------ loop
  loop(t) {
    const dt = Math.min(0.05, (t - this.last) / 1000 || 0) * (this.turbo || 1); this.last = t;
    requestAnimationFrame(tt => this.loop(tt));
    this.time += dt;
    // um quadro com erro nunca pode congelar o escritório
    try { this.update(dt); } catch (e) { console.error('update', e); }
    try { this.render(); } catch (e) { console.error('render', e); this.ctx.restore && this.ctx.setTransform(1, 0, 0, 1, 0, 0); }
  },
  update(dt) {
    FX.update(dt);
    if (this.furnState.printerShake > 0) this.furnState.printerShake -= dt;
    if (PLANT_BIG.rustle > 0) PLANT_BIG.rustle -= dt;
    if (this.clickMark && (this.clickMark.t -= dt) <= 0) this.clickMark = null;
    if (Dlg.isOpen) Dlg.tick(dt);
    if (Scene.active) { Scene.update(dt); Object.values(this.actors).forEach(a => a.update(dt)); return; }
    if (this.mode === 'title' || this.mode === 'select' || !this.player) { this.attract(dt); return; }
    if (this.paused) return;
    // jogador
    const p = this.player, k = this.keys;
    let vx = (k['d'] || k['arrowright'] ? 1 : 0) - (k['a'] || k['arrowleft'] ? 1 : 0);
    let vy = (k['s'] || k['arrowdown'] ? 1 : 0) - (k['w'] || k['arrowup'] ? 1 : 0);
    if ((vx || vy) && !Dlg.isOpen) {
      p.path = null; this.pending = null;
      const l = Math.hypot(vx, vy); vx /= l; vy /= l;
      const sp = p.speed * (p.boost > 0 ? 1.45 : 1) * dt;
      if (!collides(p.x + vx * sp, p.y)) p.x += vx * sp;
      if (!collides(p.x, p.y + vy * sp)) p.y += vy * sp;
      p.walking = true; p.manual = true;
      if (Math.abs(vx) > Math.abs(vy)) p.dir = vx > 0 ? 'right' : 'left'; else p.dir = vy > 0 ? 'down' : 'up';
    } else p.manual = false;
    Object.values(this.actors).forEach(a => a.update(dt));
    this.npcs().forEach(a => this.ai(a, dt));
    // câmera segue
    const z = this.baseZoom();
    const tx = p.x, ty = p.y - 30;
    this.cam.x += (tx - this.cam.x) * Math.min(1, dt * 5); this.cam.y += (ty - this.cam.y) * Math.min(1, dt * 5); this.cam.z += (z - this.cam.z) * Math.min(1, dt * 3);
    this.clampCam();
    // prompt de interação
    this.target = Dlg.isOpen ? null : this.nearest();
    const pr = $('#prompt');
    if (this.target) {
      const name = this.target.kind === 'npc' ? `Falar com ${this.target.actor.ch.first}` : this.target.obj.name;
      pr.innerHTML = `<kbd>E</kbd> ${esc(name)}`; pr.classList.add('show');
      $('#act-btn').classList.add('show');
    } else { pr.classList.remove('show'); $('#act-btn').classList.remove('show'); }
  },
  clampCam() {
    const c = this.cam, hw = this.W / 2 / c.z, hh = this.H / 2 / c.z;
    c.x = WORLD.W < hw * 2 ? WORLD.W / 2 : clamp(c.x, hw, WORLD.W - hw);
    c.y = WORLD.H + 40 < hh * 2 ? WORLD.H / 2 : clamp(c.y, hh - 40, WORLD.H - hh);
  },
  attract(dt) {
    Object.values(this.actors).forEach(a => { a.update(dt); this.ai(a, dt); });
    const t = this.time * 0.05;
    this.cam.z = this.baseZoom() * 0.85;
    this.cam.x = 880 + Math.sin(t) * 520; this.cam.y = 560 + Math.sin(t * 1.7) * 260;
    this.clampCam();
  },

  // ------------------------------------------------------------ IA dos agentes
  goTo(a, x, y, cb) {
    const p = findPath(a.x, a.y, x, y);
    if (!p || !p.length) { cb && cb(); return; }
    a.path = p; a.onArrive = cb; a.ai.state = 'walk';
  },
  goHome(a) { this.goTo(a, a.ch.home.x, a.ch.home.y, () => { a.ai.state = 'home'; a.dir = 'down'; a.ai.timer = rand(6, 13); }); },
  ai(a, dt) {
    if (a === this.player || a.frozen) return;
    const st = a.ai;
    switch (st.state) {
      case 'talking': case 'walk': return;
      case 'chatWait': if ((st.timer -= dt) <= 0) a.ai = { state: 'home', timer: rand(3, 8) }; return;
      case 'returnDelay': if ((st.timer -= dt) <= 0) this.goHome(a); return;
      case 'activity': if ((st.timer -= dt) <= 0) this.goHome(a); return;
      case 'chat': {
        if (!st.lead) return;
        st.t -= dt;
        if (st.t <= 0) {
          const line = st.lines[st.i++];
          if (!line) { const b = st.partner; if (b && b.ai.state === 'chat') { b.ai = { state: 'home', timer: rand(4, 9) }; if (Math.hypot(b.x - b.ch.home.x, b.y - b.ch.home.y) > 8) this.goHome(b); } this.goHome(a); return; }
          const who = this.actors[line[0]]; who.say(line[1], 2.6); who.setMood(pick(['happy', 'laugh', 'neutral']), 2.6);
          st.t = 2.5;
        }
        return;
      }
      case 'home': {
        st.timer -= dt;
        if (this.player && Math.random() < dt / 22 && Math.hypot(this.player.x - a.x, this.player.y - a.y) < 360 && !a.bubble) a.say(pick(a.ch.ambient), 3);
        if (st.timer <= 0) this.decide(a);
        return;
      }
    }
  },
  decide(a) {
    const r = Math.random();
    const busy = Dlg.isOpen && Dlg.actor === a;
    if (busy) return;
    if (r < 0.28) { a.ai.timer = rand(6, 14); return; }
    if (r < 0.62) {
      const hg = pick(HANGOUTS), o = OBJECTS.find(x => x.id === hg.obj);
      this.goTo(a, o.x + rand(-14, 14), o.y + rand(2, 14), () => {
        a.ai = { state: 'activity', timer: rand(3, 5.5) }; a.dir = 'up';
        a.emote = { e: hg.emote, t: 2.2 }; if (Math.random() < 0.75) a.say(pick(hg.lines));
        if (hg.obj === 'coffee' && this.S) { this.S.cafes[a.id] = (this.S.cafes[a.id] || 0) + 1; FX.spawn('steam', o.x, o.y - 6); }
        if (hg.obj === 'printer') this.furnState.printerShake = 1.2;
        if (hg.obj === 'plant') PLANT_BIG.rustle = 1;
      });
      return;
    }
    if (r < 0.82) {
      const partners = this.npcs().filter(b => b !== a && b.ai.state === 'home' && !b.frozen && !(Dlg.isOpen && Dlg.actor === b));
      if (partners.length) {
        const b = pick(partners);
        const side = b.x > a.x ? -1 : 1;
        b.ai = { state: 'chatWait', timer: 14 };
        this.goTo(a, b.x + side * 44, b.y + 6, () => {
          if (b.ai.state !== 'chatWait') { this.goHome(a); return; }
          a.faceTo(b.x, b.y); b.faceTo(a.x, a.y);
          const key = [a.id, b.id].sort().join('|');
          const lines = DUO_LINES[key] ? DUO_LINES[key].slice() : [[a.id, pick(a.ch.ambient)], [b.id, pick(b.ch.ambient)]];
          a.ai = { state: 'chat', lead: true, partner: b, lines, i: 0, t: 0.2 };
          b.ai = { state: 'chat', lead: false };
        });
        return;
      }
    }
    if (r < 0.9 && this.player && this.mode === 'play' && !Dlg.isOpen && this.time > (this.nextApproach || 20)) {
      const p = this.player;
      this.nextApproach = this.time + rand(35, 60);
      this.goTo(a, p.x + (p.x > a.x ? -46 : 46), p.y + 4, () => {
        if (Math.hypot(p.x - a.x, p.y - a.y) < 110 && !Dlg.isOpen) {
          a.faceTo(p.x, p.y);
          const avail = this.S && this.S.missions[a.id] === 'available';
          a.say(avail ? 'Ei, {p}! Preciso de uma ajuda... vem falar comigo!' : pick(['{p}! Tem um minuto? Brincadeira, tem cinco.', 'Ei {p}, já tomou café hoje?', '{p}! Só passei pra dar oi. Oi.', 'Viu a geladeira hoje, {p}? Não veja.']), 4);
          a.emote = { e: avail ? '❗' : '👋', t: 2.5 };
        }
        a.ai = { state: 'activity', timer: 4.5 };
      });
      return;
    }
    const pt = freePoint(rand(340, 1200), rand(450, 1070));
    this.goTo(a, pt.x, pt.y, () => { a.ai = { state: 'activity', timer: rand(1.5, 3) }; });
  },
  freezeAll(b) {
    Object.values(this.actors).forEach(a => {
      a.frozen = b;
      if (b) { a.path = null; a.onArrive = null; a.walking = false; if (a.ai.state === 'chat' || a.ai.state === 'chatWait') a.ai = { state: 'home', timer: 3 }; }
      else if (a !== this.player) { a.glide = null; a.mood = 'neutral'; a.ai = { state: 'returnDelay', timer: rand(1.2, 3) }; if (Math.hypot(a.x - a.ch.home.x, a.y - a.ch.home.y) < 8) a.ai = { state: 'home', timer: rand(4, 9) }; }
      else { a.glide = null; a.mood = 'neutral'; }
    });
  },
  nearbyComment(lines, exclude) {
    const p = this.player; let best = null, bd = 320;
    for (const a of this.npcs()) { if (a.frozen || a === exclude || (Dlg.actor === a)) continue; const d = Math.hypot(a.x - p.x, a.y - p.y); if (d < bd) { bd = d; best = a; } }
    if (best) setTimeout(() => { best.say(pick(lines), 3.2); best.faceTo(p.x, p.y); }, 700);
  },

  // ------------------------------------------------------------ conversas
  talkTo(a) {
    const p = this.player;
    a.path = null; a.onArrive = null; a.walking = false;
    if (a.ai.state === 'chat' && a.ai.partner) { const b = a.ai.partner; b.ai = { state: 'home', timer: 4 }; }
    a.ai = { state: 'talking' };
    a.faceTo(p.x, p.y); p.faceTo(a.x, a.y);
    a.bubble = null;
    this._fmtN = a.ch.first;
    const pg = a.ch.pairGreet && a.ch.pairGreet[p.id];
    const greet = pg && Math.random() < 0.6 ? pg : pick(a.ch.greet);
    this.mainMenu(a, greet, 'happy');
  },
  affMeta(a) { const v = this.S.aff[a.id] || 0; return `<span title="Afinidade">${'❤️'.repeat(Math.ceil(v / 2))}${'🤍'.repeat(5 - Math.ceil(v / 2))}</span>`; },
  mainMenu(a, text, mood = 'neutral') {
    const S = this.S, id = a.id, ch = a.ch, m = ch.mission, st = S.missions[id];
    const opts = [];
    opts.push({ label: '💬 Bater papo', fn: () => this.smalltalk(a) });
    if (st === 'available') opts.push({ label: `${m.icon} Precisa de ajuda com algo?`, cls: 'mission', fn: () => this.offerMission(a) });
    if (st === 'active') {
      if (id === 'luis') {
        if (S.flags.clues.length >= 2) opts.push({ label: '🕵️ Apontar o culpado', cls: 'mission ready', fn: () => this.accuseMenu(a) });
        else opts.push({ label: `${m.icon} Sobre a marmita...`, cls: 'mission', fn: () => this.mainMenu(a, this.fmtN(m.progress, S.flags.clues.length), 'sad') });
      } else if (id === 'rodrigo' && S.flags.rodrigoDelivered) {
        opts.push({ label: '🔔 E o sino?', cls: 'mission', fn: () => this.mainMenu(a, 'O SINO! Na recepção! O cliente já assinou, falta o barulho!', 'laugh') });
      } else if (this.missionReady(id)) {
        opts.push({ label: `✅ Entregar: ${m.title}`, cls: 'mission ready', fn: () => this.deliver(a) });
      } else {
        const n = id === 'guilherme' ? S.flags.audited.length : 0;
        opts.push({ label: `${m.icon} Sobre a missão...`, cls: 'mission', fn: () => this.mainMenu(a, this.fmtN(m.progress, n), 'neutral') });
      }
    }
    if (this.missionActive('luis') && id !== 'luis' && !S.flags.interviewed.includes(id)) opts.push({ label: '🔎 Perguntar sobre a marmita do Luis', cls: 'mission', fn: () => this.interview(a) });
    opts.push({ label: '😜 Pregar uma peça', fn: () => this.prankMenu(a) });
    if (this.giftables().length) opts.push({ label: '🎁 Dar um item', fn: () => this.giftMenu(a) });
    opts.push({ label: '👋 Até mais', cls: 'ghost', fn: () => { a.say(pick(['Até!', 'Valeu, {p}!', 'Tchau! Volta sempre.', 'Falou!']), 2); Dlg.close(); } });
    Dlg.show({ actor: a, text, mood, options: opts, meta: this.affMeta(a) });
  },
  fmtN(s, n) { return s.replace('{n}', n); },
  smalltalk(a) {
    const ch = a.ch, i = this.S.topicIdx[a.id] || 0, topic = ch.topics[i % ch.topics.length];
    this.S.topicIdx[a.id] = i + 1;
    Dlg.show({ actor: a, text: topic.q, mood: 'happy', meta: this.affMeta(a), options: topic.a.map(ans => ({ label: ans.t, fn: () => {
      this.aff(a.id, ans.aff); this.vibe(2 + Math.max(0, ans.aff));
      a.setMood(ans.mood, 6);
      Dlg.show({ actor: a, text: ans.r, mood: ans.mood, meta: this.affMeta(a), options: [
        { label: '🎬 Rodar a cena!', cls: 'primary', fn: () => { Dlg.close(); this.playScene(this.sceneTalk(a, topic, ans)); } },
        { label: 'Pular a cena', cls: 'ghost', fn: () => this.mainMenu(a, pick(['E aí, mais alguma coisa?', 'Adorei esse papo. Mais algo?', 'Algo mais, {p}?']), 'happy') },
      ] });
    } })).concat([{ label: '↩ Mudar de assunto', cls: 'ghost', fn: () => this.mainMenu(a, 'Tá bom, tá bom. O que manda?') }]) });
  },
  offerMission(a) {
    const m = a.ch.mission;
    Dlg.show({ actor: a, text: m.offer, mood: 'surprised', meta: this.affMeta(a), options: [
      { label: '🤝 Deixa comigo!', cls: 'primary', fn: () => this.acceptMission(a) },
      { label: 'Agora não dá', cls: 'ghost', fn: () => this.mainMenu(a, 'Sem problemas... eu espero. Aqui. Olhando pra você.', 'sad') },
    ] });
  },
  acceptMission(a) {
    const id = a.id, m = a.ch.mission;
    this.S.missions[id] = 'active';
    if (id === 'luis') { const cands = CAST.map(c => c.id).filter(x => x !== 'luis' && x !== this.S.playerId); this.S.flags.culprit = pick(cands); }
    this.save(); this.refreshHUD(); Sfx.play('success'); toast(`Nova missão: ${m.title}`, m.icon, 'mission');
    this.aff(id, 1);
    Dlg.show({ actor: a, text: pick(['Você é demais! Sabia que podia contar com você.', 'ISSO! Great people, greater impact!', 'Maravilha. Vou anotar: "{p} salvou meu dia". Em negrito.']), mood: 'love', options: [{ label: '👍 Partiu!', cls: 'primary', fn: () => Dlg.close() }] });
  },
  deliver(a) {
    const id = a.id, m = a.ch.mission;
    if (id === 'fabio') { this.removeItem('cafe'); this.removeItem('discurso'); }
    if (id === 'ana') this.removeItem('caneta_azul');
    if (id === 'rodrigo') {
      this.removeItem('proposta'); this.S.flags.rodrigoDelivered = true; this.save(); this.refreshHUD(); Sfx.play('item');
      toast('Agora toque o sino da recepção! 🔔', '🔔', 'mission');
      Dlg.show({ actor: a, text: m.done, mood: 'laugh', options: [{ label: '🏃 Correr até o sino!', cls: 'primary', fn: () => Dlg.close() }] });
      return;
    }
    Dlg.show({ actor: a, text: m.done, mood: 'love', options: [{ label: '🎬 Rodar a cena!', cls: 'primary', fn: () => { Dlg.close(); this.completeMission(id); } }] });
  },
  completeMission(id) {
    this.S.missions[id] = 'done'; this.aff(id, 3); this.vibe(12); this.save(); this.refreshHUD();
    Sfx.play('success'); toast(`Missão concluída: ${CAST_BY_ID[id].mission.title}`, '🏅', 'good');
    this.playScene(this.sceneMission(id));
  },
  allDone() { return Object.values(this.S.missions).every(s => s === 'done'); },
  interview(a) {
    const f = this.S.flags;
    f.interviewed.push(a.id);
    const guilty = a.id === f.culprit;
    const text = guilty ? a.ch.guilty : pick(CLUE_LINES);
    if (!f.clues.includes(a.id)) f.clues.push(a.id);
    this.save(); this.refreshHUD();
    toast(`Pista registrada (${Math.min(2, f.clues.length)}/2)`, '🔎', 'mission');
    Dlg.show({ actor: a, text, mood: guilty ? 'surprised' : 'look', meta: this.affMeta(a), options: [{ label: '📝 Anotado.', fn: () => this.mainMenu(a, guilty ? '...Mais alguma pergunta? Não? Ótimo.' : 'Boa sorte na investigação, detetive.', guilty ? 'sad' : 'happy') }] });
  },
  accuseMenu(a) {
    const cands = CAST.filter(c => c.id !== 'luis' && c.id !== this.S.playerId);
    Dlg.show({ actor: a, text: 'Então, detetive... quem comeu minha lasanha?', mood: 'angry', options: cands.map(c => ({ label: `👉 ${c.name}`, fn: () => {
      if (c.id === this.S.flags.culprit) {
        Dlg.show({ actor: a, text: `${c.first}?! Eu sabia! Vamos confrontar agora mesmo.`, mood: 'angry', options: [{ label: '🎬 Rodar a cena!', cls: 'primary', fn: () => { Dlg.close(); this.completeMission('luis'); } }] });
      } else {
        this.vibe(-1);
        Dlg.show({ actor: a, text: `Hmm... ${c.first} tem álibi: estava numa reunião das 12h às 14h. Tem até ata da Ana Paula. Continua investigando!`, mood: 'look', options: [{ label: '🤔 Vou investigar mais', fn: () => this.mainMenu(a, 'Conversa com o pessoal. Alguém viu alguma coisa.', 'sad') }] });
      }
    } })).concat([{ label: '↩ Ainda não tenho certeza', cls: 'ghost', fn: () => this.mainMenu(a, 'Sem pressa. A lasanha já foi mesmo.', 'sad') }]) });
  },
  prankMenu(a) {
    const opts = PRANKS.slice().sort(() => Math.random() - 0.5).slice(0, 3).map(pr => ({ label: `😜 ${pr.title}`, fn: () => {
      this.S.pranks++; this.aff(a.id, -1); this.vibe(3);
      const react = pick(a.ch.prankReact);
      a.setMood(pr.mood, 6);
      Dlg.show({ actor: a, text: react, mood: pr.mood, meta: this.affMeta(a), options: [
        { label: '🎬 Rodar a cena!', cls: 'primary', fn: () => { Dlg.close(); this.playScene(this.scenePrank(a, pr, react)); } },
        { label: 'Pular a cena', cls: 'ghost', fn: () => this.mainMenu(a, 'Vou lembrar disso, {p}.', 'look') },
      ] });
    } }));
    opts.push({ label: '↩ Melhor não', cls: 'ghost', fn: () => this.mainMenu(a, 'Por que você está com essa cara de quem ia aprontar?', 'look') });
    this._fmtN = a.ch.first;
    Dlg.show({ actor: a, text: '(Você olha para a câmera. Qual pegadinha vai ser?)', asPlayer: true, thinking: false, options: opts });
  },
  giftables() { const lock = ['discurso', 'proposta', 'caneta_azul']; return Object.keys(this.S.inv).filter(i => !lock.includes(i)); },
  giftMenu(a) {
    const opts = this.giftables().map(it => ({ label: `${ITEMS[it].icon} ${ITEMS[it].name}`, fn: () => {
      this.removeItem(it);
      const fav = a.ch.fav && a.ch.fav[it];
      const line = fav || (it === 'iogurte' ? 'Esse iogurte tem mais tempo de casa que eu! ...Obrigado?' : pick(['Ah... obrigado! Vou guardar com carinho. Na gaveta.', 'Que gentileza! Não sei o que fazer com isso, mas amei.', 'Um presente? Pra mim? Tô emocionado(a).']));
      this.aff(a.id, fav ? 3 : 1); this.vibe(fav ? 4 : 2);
      const mood = fav ? 'love' : (it === 'iogurte' ? 'surprised' : 'happy');
      Dlg.show({ actor: a, text: line, mood, meta: this.affMeta(a), options: [
        { label: '🎬 Rodar a cena!', cls: 'primary', fn: () => { Dlg.close(); this.playScene(this.sceneGift(a, it, line, mood, !!fav)); } },
        { label: 'Pular a cena', cls: 'ghost', fn: () => this.mainMenu(a, 'Obrigado mesmo, {p}!', mood) },
      ] });
    } }));
    opts.push({ label: '↩ Voltar', cls: 'ghost', fn: () => this.mainMenu(a, 'Hm? Mudou de ideia?') });
    Dlg.show({ actor: a, text: 'O que você vai dar de presente?', asPlayer: true, thinking: false, options: opts });
  },
  onDialogClosed(a) {
    if (a && a !== this.player && !Scene.active) {
      a.ai = Math.hypot(a.x - a.ch.home.x, a.y - a.ch.home.y) > 8 ? { state: 'returnDelay', timer: 2.5 } : { state: 'home', timer: rand(5, 10) };
    }
  },

  // ------------------------------------------------------------ objetos
  objDlg(o, text, options) { Dlg.show({ obj: o, text, options: options.concat([{ label: '🚪 Sair', cls: 'ghost', fn: () => Dlg.close() }]), thinking: false }); },
  useObject(o) {
    if (o.kind === 'pc') return this.usePC(o);
    const S = this.S, f = S.flags;
    switch (o.id) {
      case 'coffee': {
        const brew = (name) => {
          Dlg.close(); Sfx.play('coffee'); FX.spawn('steam', o.x, o.y - 10); this.player.say('☕ ' + name + '...', 1.6);
          setTimeout(() => { FX.spawn('steam', o.x, o.y - 10); this.addItem('cafe'); S.cafes[S.playerId] = (S.cafes[S.playerId] || 0) + 1; }, 1300);
          this.nearbyComment(['Pega um pra mim também!', 'Esse é o quinto de hoje? O Guilherme está anotando.', 'Cheirinho de produtividade!', 'A máquina gosta mais de você do que de mim.']);
        };
        this.objDlg(o, pick(['A máquina te encara. Ela sabe que você precisa dela.', 'Display: "Avalie seu último café de 1 a 5". Você nem tomou ainda.', 'Um post-it colado: "NÃO DESLIGAR. Assinado: Todos."']) + (this.missionActive('fabio') && !this.has('cafe') ? ' (O Fabio precisa de um café forte!)' : ''), [
          { label: '☕ Espresso duplo', fn: () => brew('Espresso duplo') },
          { label: '🥛 Cappuccino com espuminha', fn: () => brew('Cappuccino') },
          { label: '🫖 Café requentado das 8h', fn: () => this.objDlg(o, 'Tem gosto de reunião que podia ser e-mail. Você decide não levar.', []) },
        ]);
        break;
      }
      case 'fridge': {
        Sfx.play('fridge');
        let text = 'Você abre a geladeira. Um frio de mistério. Uma voz interior sussurra: "não é seu".';
        if (this.missionActive('luis') && !f.clues.includes('geladeira')) { f.clues.push('geladeira'); this.save(); this.refreshHUD(); text += ' Há um pote VAZIO escrito "LUIS" em negrito. 🔎 Pista registrada!'; toast(`Pista registrada (${Math.min(2, f.clues.length)}/2)`, '🔎', 'mission'); }
        const auditing = this.missionActive('guilherme') && f.audited.length < 3;
        if (auditing) text += ` 📋 Auditoria do Guilherme: ${f.audited.length}/3.`;
        const items = FRIDGE_POOL.slice().sort(() => Math.random() - 0.5).slice(0, 4);
        this.objDlg(o, text, items.map(it => ({ label: it.label + (auditing && !f.audited.includes(it.id) ? '  · 📋 auditar' : ''), fn: () => {
          let res = it.text;
          if (it.item) this.addItem(it.item);
          if (this.missionActive('guilherme') && f.audited.length < 3 && !f.audited.includes(it.id)) {
            f.audited.push(it.id); this.save(); this.refreshHUD();
            res += ` 📋 Auditado! (${f.audited.length}/3)`;
            toast(`Item auditado (${f.audited.length}/3)`, '📋', 'mission');
            if (f.audited.length >= 3) toast('Auditoria completa! Leve os dados ao Guilherme.', '📊', 'good');
          }
          this.objDlg(o, res, [{ label: '🧊 Olhar mais', fn: () => this.useObject(o) }]);
        } })));
        break;
      }
      case 'microwave':
        this.objDlg(o, 'Fila do micro-ondas: 7 pessoas. Tempo estimado: 1 trimestre.', [
          { label: '🍲 Esquentar uma marmita', fn: () => { Sfx.play('ding'); this.objDlg(o, 'BIP BIP BIP. Alguém grita "tá no ponto!" do outro lado da sala. Não era a sua.', []); } },
          { label: '⏳ Esperar na fila', fn: () => { this.vibe(1); this.objDlg(o, 'Você espera. E espera. Você faz networking na fila. O Luis ficaria orgulhoso.', []); } },
        ]);
        break;
      case 'vending':
        this.objDlg(o, 'Máquina de Snacks. Aceita moedas, cartões e lágrimas.', [
          { label: '🪙 Comprar um chocolate', fn: () => {
            Sfx.play('click');
            this.objDlg(o, 'O chocolate desce... e TRAVA na espiral. Clássico.', [{ label: '👊 Chacoalhar a máquina', fn: () => {
              Sfx.play('bonk'); FX.spawn('shake', 0, 0);
              this.addItem('snack');
              this.objDlg(o, 'Caíram DOIS chocolates. O universo te devia essa. (Um some misteriosamente no caminho.)', []);
              this.nearbyComment(['Chacoalhar a máquina é contra a política! ...Funcionou?', 'Técnica aprovada.', 'Essa máquina me deve R$ 4,50.']);
            } }]);
          } },
        ]);
        break;
      case 'cooler': {
        const gossip = GOSSIP[f.gossip++ % GOSSIP.length];
        this.objDlg(o, 'Bebedouro das Fofocas. Quem bebe água aqui sai sabendo de tudo.', [{ label: '💧 Beber água e ouvir', fn: () => {
          let t = gossip;
          if (this.missionActive('luis') && !f.clues.includes('bebedouro')) { f.clues.push('bebedouro'); this.save(); this.refreshHUD(); t = `Alguém sussurra: "Aquela lasanha estava divina... e ${CAST_BY_ID[f.culprit].first} sabe disso." 🔎 Pista registrada!`; toast(`Pista registrada (${Math.min(2, f.clues.length)}/2)`, '🔎', 'mission'); }
          this.vibe(1); this.objDlg(o, t, [{ label: '👂 Mais fofoca', fn: () => this.useObject(o) }]);
        } }]);
        break;
      }
      case 'shelf':
        this.objDlg(o, 'Almoxarifado. Tudo que um escritório precisa, exceto o que você procura.' + (this.missionActive('ana') && !this.has('caneta_azul') ? ' A caneta azul da sorte não está aqui... algo verde que escuta tudo? 🌿' : ''), [
          { label: '🖊️ Pegar uma caneta', fn: () => { this.addItem('caneta'); this.objDlg(o, 'Você testa oito canetas. Sete estão sem tinta. A oitava é marca-texto. Leva essa mesmo.', []); } },
          { label: '📎 Pegar o grampeador', fn: () => { this.addItem('grampeador'); this.objDlg(o, 'Um grampeador vermelho. Parece importante pra alguém. Você sente um arrepio de pegadinha.', []); } },
          { label: '🗒️ Pegar post-its', fn: () => { this.addItem('postit'); this.objDlg(o, 'Um bloco de post-its amarelos. A Ana Paula já te olha diferente.', []); } },
        ]);
        break;
      case 'printer': {
        const opts = [];
        if (this.missionActive('fabio') && !this.has('discurso')) opts.push({ label: '📜 Imprimir o discurso do Fabio', cls: 'mission', fn: () => this.printJam(o, 'discurso') });
        if (this.missionActive('rodrigo') && !f.rodrigoDelivered && !this.has('proposta')) opts.push({ label: '📄 Imprimir a proposta do Rodrigo', cls: 'mission', fn: () => this.printJam(o, 'proposta') });
        opts.push({ label: '🖨️ Imprimir qualquer coisa', fn: () => this.printJam(o, null) });
        this.objDlg(o, 'Impressora (humor: instável). As luzes piscam em código Morse: "S.O.S."', opts);
        break;
      }
      case 'bell': this.ringBell(o); break;
      case 'sofa':
        this.objDlg(o, 'Sofá da Recepção. Macio. Perigosamente macio.', [{ label: '🛋️ Sentar 5 minutinhos', fn: () => { this.vibe(2); this.player.say('Zzz...', 2); this.objDlg(o, 'Você descansa cinco minutos. Ninguém viu. (O Guilherme viu. Já virou KPI.)', []); } }]);
        break;
      case 'plant':
        this.objDlg(o, 'Samambaia Sênior. 15 anos de casa. Ela ouve tudo e nunca reclama.', [
          { label: '🤫 Contar um segredo', fn: () => { PLANT_BIG.rustle = 1.2; this.objDlg(o, 'As folhas balançam. A planta vai guardar seu segredo. Ou contar pro Luis.', []); } },
          { label: '💧 Regar', fn: () => { this.vibe(2); PLANT_BIG.rustle = 0.6; this.objDlg(o, 'Ela parece mais feliz. Ou mais verde. Difícil dizer.', []); } },
          { label: '🔍 Vasculhar o vaso', cls: this.missionActive('ana') && !this.has('caneta_azul') ? 'mission' : '', fn: () => {
            if (this.missionActive('ana') && !this.has('caneta_azul')) { PLANT_BIG.rustle = 1.5; FX.spawn('sparkle', PLANT_BIG.x, PLANT_BIG.y); this.addItem('caneta_azul'); this.objDlg(o, 'Entre a terra e um clipe de 2015... A CANETA AZUL DA SORTE! A planta sabia o tempo todo.', []); }
            else this.objDlg(o, 'Terra. Um clipe de 2015. E a sensação de estar sendo observado.', []);
          } },
        ]);
        break;
      case 'whiteboard':
        this.objDlg(o, `Alguém escreveu: "DIAS SEM INCIDENTE DE EXCEL: ${this.furnState.excelDays}".`, [
          { label: '✏️ Atualizar o contador', fn: () => {
            this.furnState.excelDays++;
            if (Math.random() < 0.55) { this.furnState.excelDays = 0; Sfx.play('error'); this.objDlg(o, 'Você escreve o novo número. No mesmo segundo, alguém grita "PROCV!" do outro lado da sala. O contador volta a 0.', []); }
            else { Sfx.play('pop'); this.objDlg(o, `Agora são ${this.furnState.excelDays} dias! Um recorde. Ninguém toque em nenhuma planilha.`, []); }
          } },
          { label: '🎨 Desenhar o chefe', fn: () => { this.vibe(2); this.objDlg(o, 'Você desenha o Fabio com uma coroa. Ficou parecido demais. Ele vai amar. Ou emoldurar.', []); this.nearbyComment(['HAHAHA, ficou igualzinho!', 'Tira foto antes que apaguem!', 'Isso vai pro LinkedIn dele.']); } },
        ]);
        break;
      case 'tv':
        this.objDlg(o, 'TV da sala de reunião. Parada no slide 1 de 87 desde 2021.', [
          { label: this.furnState.tvOn ? '📴 Desligar' : '📺 Ligar', fn: () => { this.furnState.tvOn = !this.furnState.tvOn; this.furnState.tvText = 'SLIDE 2 DE 87: AGENDA'; Sfx.play('click'); this.objDlg(o, this.furnState.tvOn ? 'Liga. Slide 2 de 87: "Agenda". Você sente o tempo desacelerar.' : 'Desligada. O slide 2 nunca saberá seu destino.', []); } },
        ]);
        break;
      case 'camera': {
        const ch = this.player.ch;
        this.objDlg(o, 'Câmera do Documentário. A luz vermelha pisca. Ela sempre está gravando.', ch.conf.map((c, i) => ({ label: `🎙️ Depoimento ${i + 1}: "${c.slice(0, 42)}..."`, fn: () => {
          Dlg.close(); this.vibe(2);
          const ep = this.S.ep++;
          this.playScene({ title: `Depoimento de ${ch.first}`, ep, cast: ['player'], beats: [{ t: 'title', text: `Depoimento de ${ch.first}`, sub: `EPISÓDIO ${ep} · CONFESSIONÁRIO`, d: 2 }, { t: 'conf', who: 'player', text: c, rim: true }, { t: 'end' }] });
        } })));
        break;
      }
      case 'mug':
        this.objDlg(o, 'Caneca "Melhor MD do Mundo". A etiqueta de preço ainda está colada: R$ 29,90.', [{ label: '🏷️ Tirar a etiqueta', fn: () => { this.vibe(1); this.objDlg(o, 'Você tira a etiqueta. Agora parece um prêmio de verdade. O Fabio nunca saberá.', []); } }]);
        break;
    }
  },
  printJam(o, doc) {
    Sfx.play('printer'); this.furnState.printerShake = 1;
    let hits = 0;
    const show = () => this.objDlg(o, 'ERRO: ATOLAMENTO NA BANDEJA 7. (Não existe bandeja 7.)', [{ label: `👊 Dar um tapinha (${hits}/3)`, fn: () => {
      hits++; Sfx.play('bonk'); this.furnState.printerShake = 0.5; FX.spawn('shake', 0, 0);
      if (hits < 3) return show();
      Sfx.play('printer'); FX.spawn('papers', o.x, o.y - 20);
      if (doc) { this.addItem(doc); this.objDlg(o, `A impressora ronrona. Sai uma folha quentinha: ${ITEMS[doc].icon} ${ITEMS[doc].name}.`, []); }
      else this.objDlg(o, `Sai da impressora: ${pick(PRINT_RANDOM)}`, []);
    } }]);
    show();
    this.nearbyComment(['Bate nela! Ela gosta!', 'Essa impressora tem trauma.', 'Bandeja 7 de novo?', 'Já tentou desligar e ligar?']);
  },
  ringBell(o) {
    Sfx.play('ding'); FX.spawn('ding', 1460, 880);
    const S = this.S;
    if (this.missionActive('rodrigo') && S.flags.rodrigoDelivered) { setTimeout(() => this.completeMission('rodrigo'), 900); return; }
    this.npcs().forEach(a => { if (!a.frozen && a.ai.state !== 'talking') { a.emote = { e: '🎉', t: 2 }; } });
    const rod = this.actors.rodrigo;
    if (rod !== this.player) setTimeout(() => { rod.say('Quem tocou o sino sem fechar negócio?! Isso dá azar!', 3.5); rod.setMood('angry', 3); }, 600);
    else this.player.say('Ninguém fechou nada. Mas a sensação é ótima.', 3);
    this.vibe(1);
  },
  usePC(o) {
    const owner = o.id.replace('pc_', '');
    const a = this.actors[owner];
    if (a !== this.player && a.ai.state === 'home' && Math.hypot(a.x - a.ch.home.x, a.y - a.ch.home.y) < 10) { a.say('Ei! Esse é o MEU computador! ...Tá, pode usar.', 3); a.setMood('surprised', 3); }
    Computer.open(owner);
  },
  afterComputer() { this.refreshHUD(); },
  useItem(id) {
    const p = this.player;
    switch (id) {
      case 'cafe': this.removeItem('cafe'); p.boost = 25; p.say('CAFEÍNA! ⚡', 2); Sfx.play('success'); toast('Energia! Você anda 45% mais rápido por 25s', '⚡'); this.S.cafes[this.S.playerId] = (this.S.cafes[this.S.playerId] || 0) + 1;
        if (this.missionActive('fabio')) toast('Ops... o café era do Fabio! Pegue outro na copa.', '😅'); break;
      case 'snack': case 'bolo': case 'gelatina': this.removeItem(id); p.say(pick(['Hmm!', 'Delícia.', 'Isso tem gosto de... verde?', 'Não conta pra ninguém.']), 2); this.vibe(1); break;
      case 'iogurte': p.say('Melhor não. Ele piscou pra mim.', 2.5); break;
      case 'caneta': Sfx.play('click'); setTimeout(() => Sfx.play('click'), 120); p.say('*clic clic clic*', 1.5); this.nearbyComment(['Para de clicar essa caneta!', 'Esse barulho vai virar KPI de irritação.', 'CLIC CLIC. Sério?']); break;
      default: p.say(`${ITEMS[id].icon} Guardado com carinho.`, 2);
    }
  },

  // ------------------------------------------------------------ cenas
  playScene(script, after, continueLabel) {
    if (Dlg.isOpen) { Dlg.isOpen = false; $('#dialog').classList.add('hidden'); $('#dialog').classList.remove('open'); Dlg.actor = null; }
    this.showHUD(false); $('#prompt').classList.remove('show'); $('#act-btn').classList.remove('show');
    this.lastScript = script;
    this.S.scenes++; this.save();
    this.mode = 'scene';
    Scene.play(script, video => {
      this.reel.push({ title: script.title, ep: script.ep, video, script });
      const extra = [];
      const finaleReady = this.allDone() && !this.S.flags.finaleDone && script.title !== 'DTSies Awards';
      if (finaleReady) { toast('Todas as missões concluídas! Hora do DTSies Awards!', '🏆', 'good'); }
      SceneEnd.show({ title: `Ep. ${script.ep} — ${script.title}`, video, extra, onContinue: () => {
        this.mode = 'play'; this.showHUD(true); this.refreshHUD();
        if (finaleReady) setTimeout(() => this.finale(), 400);
        else after && after();
      } });
      if (continueLabel) { const b = document.querySelector('#scene-end .btn.primary'); if (b) b.textContent = '▶️ ' + continueLabel; }
      if (finaleReady) { const b = document.querySelector('#scene-end .btn.primary'); if (b) b.textContent = '🏆 Ir para o DTSies Awards'; }
    });
  },
  replayLast() { if (this.lastScript) { this.S.scenes--; this.playScene(this.lastScript, null); } else { this.mode = 'play'; this.showHUD(true); } },
  lookPick(cast) {
    const ids = cast.map(c => c === 'player' ? this.S.playerId : c);
    const by = CAST.map(c => c.id).filter(id => !ids.includes(id));
    if (by.length && Math.random() < 0.45) return pick(by);
    return Math.random() < 0.6 ? 'player' : ids[0];
  },
  sceneTalk(a, topic, ans) {
    const ep = this.S.ep++; this._fmtN = a.ch.first;
    const cast = [a.id, 'player'];
    const b = [
      { t: 'title', text: topic.title, sub: `EPISÓDIO ${ep}` },
      { t: 'stage', actors: cast },
      { t: 'say', who: a.id, text: this.fmt(topic.q), mood: 'happy' },
      { t: 'say', who: 'player', text: this.fmt(ans.t), mood: 'happy' },
      { t: 'say', who: a.id, text: this.fmt(ans.r), mood: ans.mood },
    ];
    if (ans.fx) b.push({ t: 'fx', k: ans.fx, who: a.id });
    b.push({ t: 'look', who: this.lookPick(cast) });
    b.push({ t: 'conf', who: ans.cw === 'player' ? 'player' : a.id, text: this.fmt(ans.conf), rim: true });
    b.push({ t: 'end' });
    return { title: topic.title, ep, cast, beats: b };
  },
  scenePrank(a, pr, react) {
    const ep = this.S.ep++; this._fmtN = a.ch.first;
    const cast = [a.id, 'player'];
    return { title: 'Pegadinha: ' + pr.title, ep, cast, beats: [
      { t: 'title', text: pr.title, sub: `EPISÓDIO ${ep} · PEGADINHA` },
      { t: 'stage', actors: cast },
      { t: 'look', who: 'player', d: 1.3 },
      { t: 'say', who: 'player', text: this.fmt(pr.setup), mood: 'happy' },
      { t: 'fx', k: pr.fx, who: a.id },
      { t: 'emote', who: a.id, e: '😱' },
      { t: 'say', who: a.id, text: this.fmt(react), mood: pr.mood },
      { t: 'look', who: this.lookPick(cast) },
      { t: 'conf', who: 'player', text: this.fmt(pick(PRANK_CONF)), rim: true },
      { t: 'end' },
    ] };
  },
  sceneGift(a, it, line, mood, fav) {
    const ep = this.S.ep++; this._fmtN = a.ch.first;
    const cast = [a.id, 'player'];
    const b = [
      { t: 'title', text: `Um Presente para ${a.ch.first}`, sub: `EPISÓDIO ${ep}` },
      { t: 'stage', actors: cast },
      { t: 'say', who: 'player', text: `Trouxe ${ITEMS[it].name.toLowerCase()} pra você!`, mood: 'happy' },
      { t: 'emote', who: a.id, e: ITEMS[it].icon },
      { t: 'say', who: a.id, text: this.fmt(line), mood },
    ];
    if (fav) b.push({ t: 'fx', k: 'hearts', who: a.id });
    b.push({ t: 'look', who: this.lookPick(cast) });
    b.push({ t: 'conf', who: 'player', text: this.fmt(pick(GIFT_CONF)), rim: true }, { t: 'end' });
    return { title: `Um Presente para ${a.ch.first}`, ep, cast, beats: b };
  },
  others(excl) { return CAST.map(c => c.id).filter(id => !excl.includes(id) && id !== this.S.playerId); },
  sceneMission(id) {
    const ep = this.S.ep++, P = this.S.playerId, m = CAST_BY_ID[id].mission;
    const T = (text, sub) => ({ t: 'title', text, sub: sub || `EPISÓDIO ${ep} · MISSÃO CUMPRIDA` });
    const REACT = { ana: 'Registrando em ata...', guilherme: 'Duração: quatro minutos acima da meta.', thiago: 'Dá pra reiniciar esse discurso?', luis: 'Lindo. E depois tem almoço?', rodrigo: 'Vendeu! Eu compraria!', victor: 'Posso transformar isso numa skill?', fabio: 'Esse é o meu time!' };
    let beats = [], cast = [];
    switch (id) {
      case 'fabio': {
        cast = ['fabio', 'player', ...this.others(['fabio'])];
        const rx = this.others(['fabio']).filter(x => x !== P).sort(() => Math.random() - 0.5).slice(0, 2);
        beats = [T(m.title), { t: 'cut', actors: cast, at: { x: 860, y: 662 }, layout: 'gather' },
          { t: 'say', who: 'fabio', text: 'Pessoal, reúnam-se! Eu tenho um café, um discurso e zero medo.', mood: 'happy' },
          { t: 'say', who: 'fabio', text: 'Talento é o nosso maior diferencial para gerar impacto real. E hoje eu olho pra vocês e vejo talento. E um pouco de sono.', mood: 'love' },
          ...rx.map(x => ({ t: 'say', who: x, text: REACT[x], mood: 'look' })),
          { t: 'say', who: 'fabio', text: 'Great people...', mood: 'happy' },
          { t: 'say', who: 'fabio', text: '...GREATER IMPACT!', mood: 'laugh' },
          { t: 'fx', k: 'confetti', who: 'fabio' },
          { t: 'look', who: this.lookPick(['fabio']) },
          { t: 'conf', who: 'fabio', text: 'Eu escrevi esse discurso em 2019. Só troquei o ano. Visão é isso.', rim: true }, { t: 'end' }];
        break;
      }
      case 'ana':
        cast = ['ana', 'player'];
        beats = [T(m.title), { t: 'stage', actors: cast },
          { t: 'say', who: 'player', text: 'Achei! Estava na Samambaia Sênior.', mood: 'happy' },
          { t: 'say', who: 'ana', text: 'Na planta? Ela sempre soube demais.', mood: 'surprised' },
          { t: 'say', who: 'ana', text: 'Com esta caneta, eu declaro o Termo de Governança...', mood: 'happy' },
          { t: 'fx', k: 'sparkle', who: 'ana' },
          { t: 'say', who: 'ana', text: '...ASSINADO!', mood: 'laugh' }, { t: 'fx', k: 'flash' }, { t: 'sfx', k: 'applause' },
          { t: 'look', who: this.lookPick(cast) },
          { t: 'conf', who: 'ana', text: 'Uma caneta genérica assina. A caneta azul da sorte GOVERNA.', rim: true }, { t: 'end' }];
        break;
      case 'guilherme':
        cast = ['guilherme', 'player'];
        this.furnState.tvOn = true; this.furnState.tvText = 'IOGURTES VENCIDOS / TRI';
        beats = [T(m.title), { t: 'cut', actors: cast, at: { x: 262, y: 176 } },
          { t: 'say', who: 'guilherme', text: 'Apresento: "Iogurtes Vencidos por Trimestre".', mood: 'happy' },
          { t: 'say', who: 'player', text: 'Isso é... um gráfico de pizza?', mood: 'surprised' },
          { t: 'say', who: 'guilherme', text: 'É um gráfico de BARRAS. De iogurte. Crescimento de 300%!', mood: 'laugh' },
          { t: 'fx', k: 'papers', who: 'guilherme' },
          { t: 'say', who: 'guilherme', text: 'Conclusão: alguém precisa limpar a geladeira. Não eu. Eu só meço.', mood: 'look' },
          { t: 'look', who: this.lookPick(cast) },
          { t: 'conf', who: 'guilherme', text: 'Todo dado conta uma história. Essa é de terror.', rim: true }, { t: 'end' }];
        break;
      case 'thiago':
        cast = ['thiago', 'player'];
        beats = [T(m.title), { t: 'stage', actors: cast },
          { t: 'say', who: 'player', text: 'Thiago, o Maestro voltou.', mood: 'happy' },
          { t: 'say', who: 'thiago', text: 'Deixa eu adivinhar: você reiniciou.', mood: 'look' },
          { t: 'say', who: 'player', text: '...Eu reiniciei.', mood: 'happy' },
          { t: 'say', who: 'thiago', text: 'Senhoras e senhores... o Maestro está no ar!', mood: 'laugh' },
          { t: 'fx', k: 'flash' }, { t: 'fx', k: 'confetti', who: 'thiago' },
          { t: 'look', who: 'thiago' },
          { t: 'conf', who: 'thiago', text: 'Vinte anos de arquitetura de sistemas. E a solução ainda é desligar e ligar.', rim: true }, { t: 'end' }];
        break;
      case 'luis': {
        const c = this.S.flags.culprit;
        cast = ['luis', c, 'player'];
        beats = [T(m.title), { t: 'cut', actors: cast, at: { x: 230, y: 905 } },
          { t: 'say', who: 'luis', text: 'Chegou a hora. Quem comeu minha lasanha?', mood: 'angry' },
          { t: 'say', who: 'player', text: `Foi... ${CAST_BY_ID[c].first}!`, mood: 'surprised' },
          { t: 'emote', who: c, e: '😱' },
          { t: 'say', who: c, text: CAST_BY_ID[c].confess, mood: 'sad' },
          { t: 'say', who: 'luis', text: '...Pelo menos estava boa?', mood: 'look' },
          { t: 'say', who: c, text: 'Divina.', mood: 'love' },
          { t: 'say', who: 'luis', text: 'Eu sei. Eu que fiz.', mood: 'love' }, { t: 'fx', k: 'hearts', who: 'luis' },
          { t: 'look', who: this.lookPick(cast) },
          { t: 'conf', who: 'luis', text: 'Perdoei. Mas agora minha marmita tem QR Code, cadeado e um RACI.', rim: true }, { t: 'end' }];
        break;
      }
      case 'rodrigo': {
        cast = ['rodrigo', 'player', ...this.others(['rodrigo'])];
        const shout = this.others(['rodrigo']).filter(x => x !== P);
        beats = [T(m.title), { t: 'cut', actors: cast, at: { x: 1480, y: 960 }, layout: 'gather' },
          { t: 'say', who: 'rodrigo', text: 'Alô? ...Sim. ...SIM! ...FECHADO!', mood: 'laugh' },
          { t: 'sfx', k: 'ding' }, { t: 'fx', k: 'ding', who: 'rodrigo' }, { t: 'fx', k: 'confetti', who: 'rodrigo' },
          { t: 'say', who: shout.length ? pick(shout) : 'player', text: 'FECHADO?!', mood: 'surprised' },
          { t: 'say', who: 'rodrigo', text: 'O cliente assinou! Toca de novo! TOCA DE NOVO!', mood: 'laugh' },
          { t: 'sfx', k: 'ding' },
          { t: 'look', who: this.lookPick(['rodrigo']) },
          { t: 'conf', who: 'rodrigo', text: 'Eu toco esse sino até quando pago o condomínio. Mas hoje foi especial.', rim: true }, { t: 'end' }];
        break;
      }
      case 'victor': {
        cast = ['victor', 'player'];
        const sk = (this.S.skills || []).slice(-1)[0] || 'uma skill';
        beats = [T(m.title), { t: 'stage', actors: cast },
          { t: 'say', who: 'victor', text: 'Senhoras e senhores... nova skill no Catálogo DTS!', mood: 'laugh' },
          { t: 'say', who: 'player', text: `Ela se chama "${sk.replace(/ \(.*\)$/, '')}".`, mood: 'happy' },
          { t: 'say', who: 'victor', text: 'Já tem três curtidas. Duas são minhas. Uma é da planta.', mood: 'love' },
          { t: 'fx', k: 'confetti', who: 'victor' },
          { t: 'look', who: this.lookPick(cast) },
          { t: 'conf', who: 'victor', text: 'Um pequeno passo para uma skill. Um passo gigante para o Catálogo DTS.', rim: true }, { t: 'end' }];
        break;
      }
    }
    return { title: m.title, ep, cast, beats };
  },
  finale() {
    const P = this.S.playerId, ep = this.S.ep++;
    const THANKS = {
      fabio: 'Eu gostaria de agradecer... a mim mesmo. E a vocês! Mas principalmente a mim.',
      ana: 'Agradeço ao meu RACI. Ele sempre esteve lá por mim.',
      guilherme: 'Esse prêmio aumenta minha média em 14%. Obrigado!',
      thiago: 'Vou reiniciar de emoção. Já volto.',
      luis: 'Esse troféu vai direto pra geladeira. Com etiqueta.',
      rodrigo: 'FECHADO! ...Desculpa, reflexo. Obrigado, gente!',
      victor: 'Vou transformar esse prêmio numa skill.',
    };
    const order = CAST.map(c => c.id).filter(id => id !== P && id !== 'fabio');
    const cast = ['fabio', ...CAST.map(c => c.id).filter(id => id !== 'fabio')];
    const beats = [
      { t: 'title', text: 'DTSies Awards 2026', sub: `EPISÓDIO ${ep} · GRANDE FINAL`, d: 3 },
      { t: 'cut', actors: cast, at: { x: 860, y: 662 }, layout: 'gather' },
      { t: 'say', who: 'fabio', text: 'Bem-vindos ao DTSies Awards! O Oscar do Digital & Technology Services!', mood: 'laugh' },
      { t: 'fx', k: 'confetti', who: 'fabio' },
      { t: 'say', who: 'fabio', text: 'Sem orçamento. Mas com muito coração. E troféus de papel-alumínio.', mood: 'happy' },
    ];
    for (const id of order) beats.push({ t: 'award', who: id, title: AWARDS[id] }, { t: 'say', who: id, text: THANKS[id], mood: 'love' });
    if (P !== 'fabio') beats.push({ t: 'award', who: 'fabio', title: AWARDS.fabio }, { t: 'say', who: 'fabio', text: THANKS.fabio, mood: 'love' });
    beats.push(
      { t: 'say', who: 'fabio', text: 'E o prêmio principal da noite... Talento do Ano...', mood: 'surprised' },
      { t: 'award', who: 'player', title: `Talento do Ano — e ${AWARDS[P]}` },
      { t: 'say', who: 'player', text: 'Eu... nem preparei discurso. Obrigado, DTS!', mood: 'love' },
      { t: 'say', who: 'fabio', text: 'Great people...', mood: 'happy' },
      { t: 'say', who: 'fabio', text: '...GREATER IMPACT!', mood: 'laugh' },
      { t: 'fx', k: 'confetti', who: 'fabio' }, { t: 'fx', k: 'flash' },
      { t: 'look', who: pick(order.length ? order : ['fabio']) },
      { t: 'conf', who: 'player', text: 'Entrei achando que era só mais um dia no escritório. Saí com um troféu, uma caneca e uma pegadinha pendente. Isso é o DTS.', rim: true },
      { t: 'end' });
    this.S.flags.finaleDone = true; this.save();
    this.playScene({ title: 'DTSies Awards', ep, cast, beats }, () => {
      Panel.open('🏆 Fim de temporada!', h('div', { class: 'final' },
        h('div', { class: 'big' }, '🏆'),
        h('h2', {}, `${this.player.ch.first}, você é o Talento do Ano!`),
        h('div', { class: 'final-stats' },
          h('div', {}, h('b', {}, Math.round(this.S.vibe)), h('span', {}, 'Vibe do escritório')),
          h('div', {}, h('b', {}, this.S.scenes), h('span', {}, 'Cenas gravadas')),
          h('div', {}, h('b', {}, this.S.pranks), h('span', {}, 'Pegadinhas')),
          h('div', {}, h('b', {}, (this.S.skills || []).length), h('span', {}, 'Skills no Flows'))),
        h('p', { class: 'muted' }, 'O escritório continua vivo: continue conversando, pregando peças e gravando cenas. Ou jogue de novo com outro personagem.'),
        h('div', { class: 'se-actions' },
          h('button', { class: 'btn', onclick: () => { Panel.close(); this.showReel(); } }, '🎞️ Ver rolo de cenas'),
          h('button', { class: 'btn', onclick: () => { store.del(SAVE_KEY); location.reload(); } }, '🔄 Jogar com outro personagem'),
          h('button', { class: 'btn primary', onclick: () => Panel.close() }, '▶️ Continuar no escritório'))));
    });
  },

  // ------------------------------------------------------------ render
  render() {
    const ctx = this.ctx, W = this.W, H = this.H, dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#1f2433'; ctx.fillRect(0, 0, W, H);
    const inConf = Scene.active && Scene.conf;
    if (!inConf) {
      const c = Scene.active ? Scene.cam : this.cam;
      const wob = Scene.active ? Scene.wobble() : { x: 0, y: 0, r: 0 };
      const sh = FX.shake > 0 ? { x: (Math.random() - 0.5) * 14 * FX.shake, y: (Math.random() - 0.5) * 14 * FX.shake } : { x: 0, y: 0 };
      ctx.save();
      ctx.translate(W / 2 + wob.x + sh.x, H / 2 + wob.y + sh.y); ctx.rotate(wob.r); ctx.scale(c.z, c.z); ctx.translate(-c.x, -c.y);
      const hw = W / 2 / c.z + 40, hh = H / 2 / c.z + 40;
      drawFloor(ctx, { x0: c.x - hw, y0: c.y - hh, x1: c.x + hw, y1: c.y + hh }, this.time);
      // marcador de clique
      if (this.clickMark) { ctx.strokeStyle = `rgba(245,158,11,${this.clickMark.t})`; ctx.lineWidth = 2; ell(ctx, this.clickMark.x, this.clickMark.y, 14 * (1.2 - this.clickMark.t), 5 * (1.2 - this.clickMark.t)); ctx.stroke(); }
      // anel do jogador
      if (this.player && this.mode !== 'title') { ctx.strokeStyle = rgba(this.player.ch.color, 0.9); ctx.lineWidth = 2; ell(ctx, this.player.x, this.player.y, 15, 5.5); ctx.stroke(); }
      // alvo de interação
      if (this.target && !Scene.active && !Dlg.isOpen) {
        const tp = this.target.kind === 'npc' ? this.target.actor : this.target.obj;
        const pul = 1 + Math.sin(this.time * 6) * 0.1;
        ctx.strokeStyle = 'rgba(251,191,36,.9)'; ctx.lineWidth = 2; ell(ctx, tp.x, tp.y, 18 * pul, 6.5 * pul); ctx.stroke();
      }
      const list = FURNITURE.map(f => ({ k: f.key, f }));
      Object.values(this.actors).forEach(a => list.push({ k: a.y, a }));
      list.sort((p, q) => p.k - q.k);
      for (const it of list) {
        if (it.f) { const fn = FURN[it.f.type]; if (fn) fn(ctx, it.f, this.time, this.furnState); }
        else {
          const a = it.a;
          drawCharacter(ctx, a.ch, { x: a.x, y: a.y, s: 1, dir: a.dir, t: this.time + a.seed, walk: a.walking, talk: this.time < a.talkUntil || (Dlg.isOpen && Dlg.actor === a && Dlg.typing && Dlg.thinking <= 0 && !Dlg.speakerIsPlayer), mood: a.mood, blink: a.blink, photo: this.photoFor(a.id, true) });
        }
      }
      FX.draw(ctx, this.time);
      ctx.restore();
      this.drawOverlays(ctx);
    }
    if (Scene.active) Scene.drawScreen(ctx, W, H);
    if (FX.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${FX.flash})`; ctx.fillRect(0, 0, W, H); }
    // HUD retrato
    if (this.player && this.mode === 'play' && !$('#hud').classList.contains('hidden')) drawPortrait($('#hud-portrait'), this.player.ch, { t: this.time, mood: 'happy', blink: this.player.blink, photo: this.photoFor(this.player.id) });
    // cards da seleção
    if (this.selectCanvases && !$('#screen-select').classList.contains('hidden')) this.selectCanvases.forEach(([cv, ch], i) => drawPortrait(cv, ch, { t: this.time + i, mood: 'happy', blink: Math.sin(this.time * 2 + i * 3) > 0.985, photo: this.photoFor(ch.id) }));
  },
  drawOverlays(ctx) {
    const z = Scene.active ? Scene.cam.z : this.cam.z;
    const S = this.S;
    for (const a of Object.values(this.actors)) {
      const head = this.toScreen(a.x, a.y - 64), foot = this.toScreen(a.x, a.y);
      // nomes
      if (!Scene.active && this.mode === 'play') {
        const isP = a === this.player;
        const txt = isP ? 'Você' : a.ch.first;
        ctx.font = `700 ${11}px Inter, system-ui, sans-serif`;
        const tw = ctx.measureText(txt).width + 12;
        ctx.fillStyle = isP ? a.ch.color : 'rgba(15,23,42,.72)'; rr(ctx, foot.x - tw / 2, foot.y + 7, tw, 16, 8); ctx.fill();
        ctx.fillStyle = isP ? '#111' : '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, foot.x, foot.y + 15.5);
      }
      // marcadores de missão
      if (S && !Scene.active && this.mode === 'play' && a !== this.player) {
        const mk = this.markerFor(a);
        if (mk) {
          const y = head.y - 16 * Math.min(z, 1.6) + Math.sin(this.time * 4) * 3;
          ctx.fillStyle = mk.bg; circ(ctx, head.x, y, 11); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.font = '900 13px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(mk.s, head.x, y + 0.5);
        }
      }
      // emote
      if (a.emote) {
        if (!a.emote.T) a.emote.T = a.emote.t;
        const s = Math.min(1, 0.35 + (a.emote.T - a.emote.t) * 4) * Math.min(1.5, Math.max(0.9, z * 0.7));
        const y = head.y - 10 * z - (Scene.active ? 0 : 6);
        ctx.fillStyle = '#fff'; circ(ctx, head.x + 18 * s, y, 14 * s); ctx.fill();
        ctx.font = `${16 * s}px serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(a.emote.e, head.x + 18 * s, y + 1);
      }
      // balão de fala
      if (a.bubble && !(Scene.active && Scene.sub)) this.drawBubble(ctx, head.x, head.y - 8, a.bubble.text, a.ch.color);
    }
    // marcadores em objetos
    if (S && this.mode === 'play' && !Scene.active) {
      for (const o of OBJECTS) {
        if (!this.objectRelevant(o)) continue;
        const p = this.toScreen(o.x, o.y - 70);
        const y = p.y + Math.sin(this.time * 4 + o.x) * 3;
        ctx.font = '18px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.id === 'bell' ? '🔔' : '✨', p.x, y);
      }
    }
  },
  drawBubble(ctx, x, y, text, color) {
    ctx.font = '600 12.5px Inter, system-ui, sans-serif';
    const lines = Scene.wrap(ctx, text, 190), lh = 16, w = Math.max(...lines.map(l => ctx.measureText(l).width)) + 20, hh = lines.length * lh + 12;
    const bx = clamp(x - w / 2, 6, this.W - w - 6), by = y - hh - 10;
    ctx.fillStyle = 'rgba(255,255,255,.96)'; rr(ctx, bx, by, w, hh, 10); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - 6, by + hh - 1); ctx.lineTo(x, by + hh + 8); ctx.lineTo(x + 6, by + hh - 1); ctx.fill();
    ctx.fillStyle = color; ctx.fillRect(bx + 6, by + 6, 3, hh - 12);
    ctx.fillStyle = '#111827'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    lines.forEach((l, i) => ctx.fillText(l, bx + 14, by + 7 + i * lh));
  },
  markerFor(a) {
    const S = this.S, st = S.missions[a.id], f = S.flags;
    if (st === 'available') return { s: '!', bg: '#f59e0b' };
    if (st === 'active') {
      if (a.id === 'luis' ? f.clues.length >= 2 : this.missionReady(a.id)) return { s: '✓', bg: '#10b981' };
    }
    if (this.missionActive('luis') && a.id !== 'luis' && !f.interviewed.includes(a.id)) return { s: '?', bg: '#8b5cf6' };
    return null;
  },
  objectRelevant(o) {
    const f = this.S.flags;
    switch (o.id) {
      case 'coffee': return this.missionActive('fabio') && !this.has('cafe');
      case 'printer': return (this.missionActive('fabio') && !this.has('discurso')) || (this.missionActive('rodrigo') && !f.rodrigoDelivered && !this.has('proposta'));
      case 'plant': return this.missionActive('ana') && !this.has('caneta_azul');
      case 'fridge': return (this.missionActive('guilherme') && f.audited.length < 3) || (this.missionActive('luis') && !f.clues.includes('geladeira'));
      case 'cooler': return this.missionActive('luis') && !f.clues.includes('bebedouro');
      case 'bell': return this.missionActive('rodrigo') && f.rodrigoDelivered;
    }
    if (o.kind === 'pc') {
      if (!((this.missionActive('thiago') && !f.maestro) || (this.missionActive('victor') && !f.skill))) return false;
      const p = this.player; let best = null, bd = 1e9;
      for (const q of OBJECTS) if (q.kind === 'pc') { const d = Math.hypot(q.x - p.x, q.y - p.y); if (d < bd) { bd = d; best = q; } }
      return best === o;
    }
    return false;
  },
};

window.addEventListener('load', () => Game.init());
