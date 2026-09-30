// =====================================================================
// UI — diálogos com "agente pensando", toasts, painéis, computador
// (Flows/Terminal/Outlook/Teams/Power BI), estúdio de caricatura
// =====================================================================
const $ = s => document.querySelector(s);
const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'html') e.innerHTML = v; else e.setAttribute(k, v);
  }
  for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ------------------------------- toasts -------------------------------
function toast(msg, icon = '✨', kind = '') {
  const t = h('div', { class: 'toast ' + kind }, h('span', { class: 'ti' }, icon), h('span', {}, msg));
  $('#toasts').append(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400); }, 3400);
}

// ------------------------------- diálogo -------------------------------
const Dlg = {
  isOpen: false, actor: null, obj: null, full: '', shown: 0, typing: false, thinking: 0, opts: [], mood: 'neutral', speakerIsPlayer: false,
  show({ actor = null, obj = null, text, options = [], mood, thinking = true, meta = '', asPlayer = false }) {
    this.isOpen = true; this.actor = actor; this.obj = obj; this.opts = options; this.mood = mood || (actor && actor.mood) || 'neutral';
    this.speakerIsPlayer = asPlayer;
    const el = $('#dialog'); el.classList.remove('hidden'); el.classList.add('open');
    const who = asPlayer ? Game.player.ch : (actor ? actor.ch : null);
    $('#dlg-name').textContent = who ? who.name : obj.name;
    $('#dlg-role').textContent = who ? `${who.role} · ${who.archetype}` : 'Objeto do escritório';
    $('#dlg-name').style.color = who ? who.color : '#fbbf24';
    $('#dlg-meta').innerHTML = meta;
    $('#dlg-portrait').classList.toggle('icon', !who);
    $('#dlg-icon').textContent = who ? '' : obj.icon;
    this.full = Game.fmt(text); this.shown = 0; this.typing = true;
    this.thinking = (thinking && actor && !asPlayer) ? 0.45 + Math.random() * 0.45 : 0;
    $('#dlg-text').innerHTML = this.thinking ? '<span class="thinking">🤖 agente pensando<i>.</i><i>.</i><i>.</i></span>' : '';
    $('#dlg-options').innerHTML = '';
    if (actor && !asPlayer) { actor.mood = this.mood; }
    if (!this.thinking) this.startSpeech();
  },
  startSpeech() {
    const who = this.speakerIsPlayer ? Game.player.ch : (this.actor ? this.actor.ch : null);
    Sfx.speak(this.full, who);
  },
  tick(dt) {
    if (!this.isOpen) return;
    if (this.thinking > 0) { this.thinking -= dt; if (this.thinking <= 0) { $('#dlg-text').innerHTML = ''; this.startSpeech(); } }
    else if (this.typing) {
      const before = Math.floor(this.shown);
      this.shown += dt * 55;
      if (Math.floor(this.shown) > before && Math.floor(this.shown) % 3 === 0) Sfx.play('blip');
      if (this.shown >= this.full.length) this.finishTyping();
      else $('#dlg-text').textContent = this.full.slice(0, Math.floor(this.shown));
    }
    // retrato animado
    const cv = $('#dlg-canvas');
    const who = this.speakerIsPlayer ? Game.player : this.actor;
    if (who) drawPortrait(cv, who.ch, { t: Game.time, mood: this.speakerIsPlayer ? 'happy' : this.mood, talk: this.typing && this.thinking <= 0, blink: Math.sin(Game.time * 2.1) > 0.985, photo: Game.photoFor(who.ch.id), noPhoto: false });
  },
  finishTyping() {
    this.typing = false; this.thinking = 0; this.shown = this.full.length;
    $('#dlg-text').textContent = this.full;
    const box = $('#dlg-options'); box.innerHTML = '';
    this.opts.forEach((o, i) => {
      const b = h('button', { class: 'opt ' + (o.cls || ''), onclick: () => this.choose(i) }, h('kbd', {}, String(i + 1)), h('span', {}, Game.fmt(o.label)));
      if (o.disabled) b.disabled = true;
      box.append(b);
    });
  },
  choose(i) {
    const o = this.opts[i]; if (!o || o.disabled) return;
    Sfx.play('select');
    o.fn && o.fn();
  },
  key(k) {
    if (!this.isOpen) return false;
    if (k === 'Escape') { this.close(); return true; }
    if ((k === ' ' || k === 'Enter' || k === 'e' || k === 'E') && (this.typing || this.thinking > 0)) { this.thinking = 0; this.finishTyping(); return true; }
    const n = parseInt(k, 10); if (n >= 1 && n <= this.opts.length && !this.typing) { this.choose(n - 1); return true; }
    if ((k === 'Enter' || k === ' ') && this.opts.length === 1) { this.choose(0); return true; }
    return false;
  },
  close() {
    if (!this.isOpen) return;
    this.isOpen = false; Sfx.stopVoice();
    const el = $('#dialog'); el.classList.remove('open'); el.classList.add('hidden');
    const a = this.actor; this.actor = null; this.obj = null;
    Game.onDialogClosed(a);
  },
};

// ------------------------------- painéis -------------------------------
const Panel = {
  open(title, body) {
    Game.pause(true);
    $('#panel-title').textContent = title;
    const b = $('#panel-body'); b.innerHTML = ''; b.append(body);
    $('#panel').classList.remove('hidden');
  },
  close() { $('#panel').classList.add('hidden'); Game.pause(false); },
};

// ----------------------------- computador ------------------------------
const Computer = {
  owner: null,
  open(owner) {
    this.owner = owner; Game.pause(true);
    $('#computer').classList.remove('hidden');
    $('#pc-user').textContent = Game.player.ch.first;
    this.desktop();
    Sfx.play('boot');
  },
  close() { $('#computer').classList.add('hidden'); Game.pause(false); Game.afterComputer(); },
  win(title, content) {
    const body = $('#pc-body'); body.innerHTML = '';
    body.append(h('div', { class: 'pc-win' },
      h('div', { class: 'pc-bar' }, h('button', { class: 'pc-back', onclick: () => { Sfx.play('click'); this.desktop(); } }, '← Área de trabalho'), h('b', {}, title), h('span', {})),
      h('div', { class: 'pc-content' }, content)));
  },
  desktop() {
    const body = $('#pc-body'); body.innerHTML = '';
    const S = Game.S;
    const apps = [
      { id: 'flows', icon: '🌀', name: 'Flows', hint: Game.missionActive('victor') && !S.flags.skill ? 'missão!' : '' },
      { id: 'terminal', icon: '⌨️', name: 'Terminal', hint: Game.missionActive('thiago') && !S.flags.maestro ? 'missão!' : '' },
      { id: 'outlook', icon: '📧', name: 'Outlook', hint: '2.847' },
      { id: 'teams', icon: '💬', name: 'Teams' },
      { id: 'powerbi', icon: '📊', name: 'Power BI' },
      { id: 'solitaire', icon: '🃏', name: 'Paciência' },
    ];
    const grid = h('div', { class: 'pc-desktop' });
    apps.forEach(a => grid.append(h('button', { class: 'pc-app', onclick: () => { Sfx.play('click'); this[a.id](); } }, h('span', { class: 'pc-ico' }, a.icon), h('span', {}, a.name), a.hint ? h('em', {}, a.hint) : null)));
    body.append(grid);
    const who = CAST_BY_ID[this.owner];
    body.append(h('div', { class: 'pc-wall' }, `Papel de parede de ${who ? who.first : '—'}: "Pessoas. Tecnologia. Resultados."`));
  },
  // ---------- Flows ----------
  flows() {
    const S = Game.S;
    const skills = S.skills || [];
    const c = h('div', { class: 'flows' },
      h('aside', {}, h('div', { class: 'fl-logo' }, 'FL', h('span', {}, 'O'), 'WS'),
        h('div', { class: 'fl-sec' }, 'Principal'), h('div', { class: 'fl-item on' }, '🏠 Início'), h('div', { class: 'fl-item' }, '📁 Projetos'),
        h('div', { class: 'fl-sec' }, 'Skills'), h('div', { class: 'fl-item' }, '📚 Biblioteca'), h('div', { class: 'fl-item' }, '👤 Minhas Skills')),
      h('main', {},
        h('h2', {}, `Olá, ${Game.player.ch.first}`),
        h('div', { class: 'fl-search' }, '🔍 Buscar projetos, skills ou métodos', h('kbd', {}, 'Ctrl+K')),
        h('div', { class: 'fl-cards' },
          h('button', { class: 'fl-card cta', onclick: () => this.flowsUpload() }, h('b', {}, '➕ Subir uma skill'), h('span', {}, 'Compartilhe com o DTS')),
          h('div', { class: 'fl-card' }, h('b', {}, '📚 Catálogo de Métodos DTS'), h('span', {}, '128 métodos')),
          h('div', { class: 'fl-card' }, h('b', {}, '⚡ Catálogo de Skills DTS'), h('span', {}, `${42 + skills.length} skills`))),
        h('h3', {}, 'Publicadas recentemente'),
        h('ul', { class: 'fl-list' }, ...(skills.length ? skills : ['Gerador de RACI (Ana Paula)', 'KPI de Qualquer Coisa (Guilherme)', 'Reiniciador Universal (Thiago)']).map(s => h('li', {}, '⚡ ' + s)))));
    this.win('Flows — DTS', c);
  },
  flowsUpload() {
    Sfx.play('click');
    let name = SKILL_NAMES[0], cat = 'Skills DTS';
    const nameBox = h('div', { class: 'chips' });
    SKILL_NAMES.forEach((n, i) => { const b = h('button', { class: 'chip' + (i === 0 ? ' on' : ''), onclick: () => { name = n; [...nameBox.children].forEach(x => x.classList.remove('on')); b.classList.add('on'); Sfx.play('click'); } }, n); nameBox.append(b); });
    const catBox = h('div', { class: 'chips' });
    ['Skills DTS', 'Métodos DTS', 'Agentes (experimental)'].forEach((n, i) => { const b = h('button', { class: 'chip' + (i === 0 ? ' on' : ''), onclick: () => { cat = n; [...catBox.children].forEach(x => x.classList.remove('on')); b.classList.add('on'); Sfx.play('click'); } }, n); catBox.append(b); });
    const c = h('div', { class: 'fl-form' },
      h('p', { class: 'muted' }, 'Passo 1 de 2 — Preencha sua skill'),
      h('label', {}, 'Nome da skill'), nameBox,
      h('label', {}, 'Categoria'), catBox,
      h('label', {}, 'Descrição'), h('div', { class: 'fake-input' }, 'Economiza 2h por semana e 100% da paciência do time.'),
      h('button', { class: 'btn primary', onclick: () => {
        Sfx.play('success');
        Game.S.skills = (Game.S.skills || []).concat(`${name} (${Game.player.ch.first})`);
        const wasMission = Game.missionActive('victor') && !Game.S.flags.skill;
        Game.S.flags.skill = true; Game.save();
        this.win('Flows — Publicado!', h('div', { class: 'pc-done' }, h('div', { class: 'big' }, '🚀'), h('h2', {}, 'Skill publicada no Catálogo!'), h('p', {}, `"${name}" em ${cat}.`), h('p', { class: 'muted' }, wasMission ? 'Missão: agora conte pro Victor! ✅' : 'Já tem 3 curtidas. Duas são do Victor.')));
        if (wasMission) toast('Skill publicada! Conte ao Victor.', '🚀', 'good');
      } }, '🚀 Publicar no Catálogo'));
    this.win('Flows — Subir uma skill', c);
  },
  // ---------- Terminal ----------
  terminal() {
    const out = h('pre', { class: 'term-out' }, 'maestro@dts:~$ status\n❌ Maestro: FORA DO AR (desde 09:41)\n\n');
    if (Game.S.flags.maestro) out.textContent = 'maestro@dts:~$ status\n✅ Maestro: ONLINE (uptime: desde que você salvou o dia)\n';
    const cmds = [
      { c: 'sudo faz-funcionar', r: '[sudo] senha para ' + Game.player.ch.first.toLowerCase() + ': ********\nfaz-funcionar: comando não encontrado. Mas gostei da atitude.' },
      { c: 'rm -rf problemas/', r: 'rm: não é possível remover "problemas/": o diretório é infinito.' },
      { c: 'ping deus', r: 'PING deus: 56 bytes\nRequest timeout... Request timeout...\nDica: tente algo mais antigo que a própria fé.' },
      { c: 'git blame', r: 'Linha 42 alterada por: Victor Vitorino (sexta-feira, 18:47).' },
      { c: 'reboot', r: null },
    ];
    const box = h('div', { class: 'term-cmds' });
    const type = (txt, done) => { let i = 0; const iv = setInterval(() => { out.textContent += txt[i++] || ''; if (i % 2) Sfx.play('type'); out.scrollTop = 1e9; if (i >= txt.length) { clearInterval(iv); done && done(); } }, 14); };
    cmds.forEach(cm => box.append(h('button', { class: 'term-btn', onclick: () => {
      out.textContent += `maestro@dts:~$ ${cm.c}\n`;
      if (cm.r) { Sfx.play('error'); type(cm.r + '\n\n'); return; }
      type('Reiniciando o Maestro...\n[ OK ] Café carregado\n[ OK ] Paciência restaurada\n[ OK ] Servidor ligado de novo\n\n✅ Maestro: ONLINE\n', () => {
        Sfx.play('success');
        const wasMission = Game.missionActive('thiago') && !Game.S.flags.maestro;
        Game.S.flags.maestro = true; Game.save();
        if (wasMission) toast('Maestro no ar! Avise o Thiago.', '🖥️', 'good');
      });
    } }, cm.c)));
    this.win('Terminal — maestro@dts', h('div', { class: 'term' }, out, box));
  },
  // ---------- Outlook ----------
  outlook() {
    const list = h('div', { class: 'mail' });
    const view = h('div', { class: 'mail-view' }, h('p', { class: 'muted' }, 'Selecione um e-mail. Ou não. 2.847 não lidos te observam.'));
    EMAILS.forEach(m => list.append(h('button', { class: 'mail-item', onclick: () => { Sfx.play('click'); view.innerHTML = ''; view.append(h('h3', {}, m.subj), h('p', { class: 'muted' }, 'De: ' + m.from), h('p', {}, m.body)); } }, h('b', {}, m.from), h('span', {}, m.subj))));
    this.win('Outlook — Caixa de entrada (2.847)', h('div', { class: 'mail-wrap' }, list, view));
  },
  // ---------- Teams ----------
  teams() {
    const opts = [['🟢', 'Disponível', 'Disponível (mentira)'], ['🔴', 'Em reunião', 'Em reunião (fugindo)'], ['🟡', 'Ausente', 'Ausente (na copa)'], ['⛔', 'Não perturbe', 'Não perturbe (focado no Paciência)']];
    const c = h('div', { class: 'teams' }, h('p', {}, 'Defina seu status:'));
    opts.forEach(([i, s, full]) => c.append(h('button', { class: 'btn', onclick: () => { Sfx.play('pop'); toast(`Status: ${full}`, i); Game.S.status = s; } }, `${i} ${full}`)));
    const chat = h('div', { class: 'teams-chat' },
      h('div', {}, h('b', {}, 'Fabio: '), 'Pessoal, alguém tem um minuto? São 40, mas começa com 1.'),
      h('div', {}, h('b', {}, 'Ana Paula: '), 'Fabio, sua reunião não tem pauta.'),
      h('div', {}, h('b', {}, 'Guilherme: '), '87% das reuniões sem pauta viram outra reunião.'),
      h('div', {}, h('b', {}, 'Rodrigo: '), 'FECHADO! (era o almoço)'),
      h('div', {}, h('b', {}, 'Victor: '), 'Fiz uma skill que gera pauta. Link no Flows 🙃'));
    c.append(h('h3', {}, '#dts-geral'), chat);
    this.win('Teams', c);
  },
  // ---------- Power BI ----------
  powerbi() {
    const cv = h('canvas', { width: 640, height: 300, class: 'pbi' });
    const ctx = cv.getContext('2d');
    const data = CAST.map(c => ({ c, v: (Game.S.cafes[c.id] || 0) + 2 + (c.id.length % 4) }));
    const max = Math.max(...data.map(d => d.v));
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 640, 300);
    ctx.fillStyle = '#111827'; ctx.font = '700 16px Inter'; ctx.fillText('Cafés por pessoa (hoje) — fonte: Guilherme', 20, 28);
    data.forEach((d, i) => {
      const bw = 60, x = 30 + i * 85, hgt = (d.v / max) * 200;
      ctx.fillStyle = d.c.color; ctx.fillRect(x, 260 - hgt, bw, hgt);
      ctx.fillStyle = '#111827'; ctx.font = '700 13px Inter'; ctx.textAlign = 'center'; ctx.fillText(d.v, x + bw / 2, 252 - hgt);
      ctx.font = '12px Inter'; ctx.fillText(d.c.first.split(' ')[0], x + bw / 2, 280);
      ctx.textAlign = 'left';
    });
    this.win('Power BI — KPI do Café', h('div', { class: 'pbi-wrap' }, cv, h('p', { class: 'muted' }, 'Nenhum gráfico 3D foi ferido na produção deste dashboard.')));
  },
  solitaire() {
    Sfx.play('error');
    Game.vibe(-1);
    this.win('Paciência', h('div', { class: 'pc-done' }, h('div', { class: 'big' }, '🃏'), h('h2', {}, 'Você abriu o Paciência.'), h('p', {}, 'O Fabio passou bem atrás de você.'), h('p', { class: 'muted' }, 'Ele não disse nada. Só anotou algo num post-it.')));
  },
};

// -------------------------- fim da cena (overlay) --------------------------
const SceneEnd = {
  show({ title, video, extra = [], onContinue }) {
    const box = $('#scene-end-body'); box.innerHTML = '';
    box.append(h('div', { class: 'se-clap' }, '🎬'), h('h2', {}, title), h('div', { class: 'stars' }, '⭐'.repeat(4 + (Math.random() > 0.5 ? 1 : 0))));
    if (video) {
      const v = h('video', { src: video.url, controls: '', playsinline: '', class: 'se-video' });
      box.append(v);
    } else {
      box.append(h('p', { class: 'muted' }, Recorder.supported() ? 'A gravação está desligada (🎥 no topo).' : 'Seu navegador não permite gravar a cena em vídeo, mas você pode revê-la.'));
    }
    const row = h('div', { class: 'se-actions' });
    if (video) row.append(h('a', { class: 'btn', href: video.url, download: `DTS-Office-${title.replace(/[^\wÀ-ú]+/g, '-')}.${video.ext}` }, '⬇️ Baixar vídeo'));
    row.append(h('button', { class: 'btn', onclick: () => { this.hide(); Game.replayLast(); } }, '🔁 Rever'));
    extra.forEach(e => row.append(h('button', { class: 'btn ' + (e.cls || ''), onclick: () => { this.hide(); e.fn(); } }, e.label)));
    row.append(h('button', { class: 'btn primary', onclick: () => { this.hide(); onContinue && onContinue(); } }, '▶️ Voltar ao escritório'));
    box.append(row);
    $('#scene-end').classList.remove('hidden');
  },
  hide() { $('#scene-end').classList.add('hidden'); },
};

// ------------------------ estúdio de caricatura ------------------------
const LOOK_OPTIONS = {
  skin: ['#f6d2b8', '#efbf98', '#e4ae88', '#d9a078', '#c68b60', '#a86f48', '#8a5636', '#6b3f26'],
  hair: [['short', 'Curto'], ['messy', 'Bagunçado'], ['sidepart', 'Repartido'], ['slick', 'Gel'], ['long', 'Longo'], ['curly', 'Cacheado'], ['bun', 'Coque'], ['buzz', 'Raspado'], ['bald', 'Careca']],
  hairColor: ['#111111', '#2a1c14', '#4a2f1f', '#6b4a2b', '#a0703f', '#d6b370', '#8f8f8f', '#e5e5e5', '#b4432f'],
  beard: [['none', 'Sem'], ['stubble', 'Por fazer'], ['full', 'Cheia'], ['goatee', 'Cavanhaque'], ['mustache', 'Bigode']],
  outfit: [['vest', 'Colete'], ['blazer', 'Blazer'], ['suit', 'Terno'], ['shirt', 'Camisa'], ['polo', 'Polo'], ['hoodie', 'Moletom']],
  outfitColor: ['#3b4763', '#1f2d4d', '#b8324a', '#3d7ab8', '#4f8a4b', '#39434e', '#eef2f7', '#7c3aed', '#f59e0b', '#111827'],
};
const Studio = {
  id: null, draft: null, raf: 0,
  open(id, onDone) {
    const ch = CAST_BY_ID[id]; this.id = id; this.draft = JSON.parse(JSON.stringify(ch.look)); this.onDone = onDone;
    const body = $('#studio-body'); body.innerHTML = '';
    const cv = h('canvas', { width: 260, height: 300, class: 'studio-cv' });
    const controls = h('div', { class: 'studio-ctrls' });
    const row = (title, key, opts, isColor) => {
      const wrap = h('div', { class: 'chips' });
      opts.forEach(o => {
        const val = Array.isArray(o) ? o[0] : o, lab = Array.isArray(o) ? o[1] : '';
        const b = h('button', { class: 'chip' + (isColor ? ' sw' : '') + (this.draft[key] === val ? ' on' : ''), title: lab || val, onclick: () => { this.draft[key] = val; [...wrap.children].forEach(x => x.classList.remove('on')); b.classList.add('on'); Sfx.play('click'); } }, isColor ? '' : lab);
        if (isColor) b.style.background = val;
        wrap.append(b);
      });
      controls.append(h('label', {}, title), wrap);
    };
    row('Tom de pele', 'skin', LOOK_OPTIONS.skin, true);
    row('Cabelo', 'hair', LOOK_OPTIONS.hair);
    row('Cor do cabelo', 'hairColor', LOOK_OPTIONS.hairColor, true);
    row('Barba', 'beard', LOOK_OPTIONS.beard);
    row('Roupa', 'outfit', LOOK_OPTIONS.outfit);
    row('Cor da roupa', 'outfitColor', LOOK_OPTIONS.outfitColor, true);
    const gl = h('label', { class: 'toggle' }, h('input', { type: 'checkbox', ...(this.draft.glasses ? { checked: '' } : {}), onchange: e => { this.draft.glasses = e.target.checked; } }), ' Óculos');
    const er = h('label', { class: 'toggle' }, h('input', { type: 'checkbox', ...(this.draft.earrings ? { checked: '' } : {}), onchange: e => { this.draft.earrings = e.target.checked; } }), ' Brincos');
    controls.append(h('div', { class: 'toggles' }, gl, er));
    const photoIn = h('input', { type: 'file', accept: 'image/*', class: 'hidden-file', onchange: e => { const f = e.target.files[0]; if (f) Game.setPhotoFromFile(id, f, () => this.refreshPhotoState()); } });
    this.photoState = h('div', { class: 'photo-state' });
    const actions = h('div', { class: 'studio-actions' },
      h('button', { class: 'btn', onclick: () => photoIn.click() }, '📷 Enviar foto'),
      h('button', { class: 'btn ghost', onclick: () => { Game.clearPhoto(id); this.refreshPhotoState(); } }, 'Remover foto'),
      h('button', { class: 'btn ghost', onclick: () => { this.draft = JSON.parse(JSON.stringify(Game.defaultLook(id))); this.open(id, onDone); } }, 'Restaurar padrão'),
      h('button', { class: 'btn primary', onclick: () => this.save() }, '✅ Salvar caricatura'), photoIn);
    body.append(h('div', { class: 'studio-grid' }, h('div', { class: 'studio-prev' }, cv, h('div', { class: 'studio-name' }, ch.name), this.photoState), h('div', {}, controls, actions)));
    this.refreshPhotoState();
    $('#studio').classList.remove('hidden');
    const dirs = ['down', 'right', 'up', 'left'];
    const loop = () => {
      if ($('#studio').classList.contains('hidden')) return;
      const ctx = cv.getContext('2d'); ctx.clearRect(0, 0, 260, 300);
      const g = ctx.createLinearGradient(0, 0, 0, 300); g.addColorStop(0, '#1e293b'); g.addColorStop(1, '#0f172a'); ctx.fillStyle = g; ctx.fillRect(0, 0, 260, 300);
      const t = performance.now() / 1000, dir = dirs[Math.floor(t / 1.6) % 4];
      drawCharacter(ctx, { ...ch, look: this.draft }, { x: 130, y: 272, s: 3.4, dir, t, walk: Math.floor(t / 1.6) % 2 === 1, blink: Math.sin(t * 2) > 0.98, mood: 'happy' });
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  },
  refreshPhotoState() {
    const has = !!Game.photoFor(this.id, true, true);
    this.photoState.textContent = has ? '📷 Foto ativa — aparece nos diálogos e no Modo Bobblehead' : 'Sem foto — usando caricatura desenhada';
  },
  save() {
    Game.setLook(this.id, this.draft);
    $('#studio').classList.add('hidden'); cancelAnimationFrame(this.raf);
    Sfx.play('success'); toast('Caricatura salva!', '🎨', 'good');
    this.onDone && this.onDone();
  },
  close() { $('#studio').classList.add('hidden'); cancelAnimationFrame(this.raf); this.onDone && this.onDone(); },
};
