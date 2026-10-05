/* ===== rt-05-pal.js — "Cores do componente" (S20): recolore UM componente (el.pal = {p: cor principal, a: cor de destaque}) =====
   Vai junto em todo arquivo exportado (concatenado ao runtime). Sem el.pal nada aqui roda (runtime.js só chama palHTML/palTag
   quando el.pal existe).
   Família AZUL (navy #002A46 e os azuis/aços/gelos da marca: matiz 195–225°, saturação ≥ 0,26) -> matiz da cor principal,
   saturação proporcional e a MESMA luminância do original (navy -> versão escura da principal, gelo -> versão clara): todo
   contraste entre esses tons, o branco e os cinzas fica igual ao do A&M. Família LARANJA (#F78C16 e tons: matiz 20–45°,
   saturação ≥ 0,5) -> cor de destaque, com os tons claros/escuros na mesma posição relativa. Branco, preto, cinzas (#3E4C5E…)
   e cores de status ficam como estão. Alfa preservado.
   1) markup: só os atributos de cor (style, fill, stroke, stop-color, flood-color, color) do HTML que FX[kind].html devolveu;
      textos (nós de texto) nunca são tocados.
   2) folhas de estilo: na primeira vez, um índice das regras do CSS do runtime (#am-runtime-css; no arquivo exportado, o <style>
      do runtime) que mexem em propriedades que levam cores da marca (inclusive dentro de @media/@supports e os @keyframes com
      cores). Para cada paleta distinta, UM <style id="am-pal-<chave>"> logo depois do CSS do runtime, com as mesmas regras (mesma
      especificidade, graças ao :where) restritas a [data-pal="<chave>"] e às cores trocadas; vence a original pela ordem no
      documento. Keyframes com cores ganham uma cópia renomeada (<nome>--<chave>) usada só pelas regras restritas. */
(function (R) {
  'use strict';
  if (!R) return;
  var HEX = /^#[0-9a-f]{6}$/i;
  function norm(pal) {
    if (!pal || typeof pal !== 'object' || Array.isArray(pal)) return null;
    var o = {};
    if (typeof pal.p === 'string' && HEX.test(pal.p)) o.p = pal.p.toUpperCase();
    if (typeof pal.a === 'string' && HEX.test(pal.a)) o.a = pal.a.toUpperCase();
    return o.p || o.a ? o : null;
  }
  function keyOf(n) { return ((n.p ? n.p.slice(1) : 'x') + (n.a ? n.a.slice(1) : 'x')).toLowerCase(); }

  /* ---------- cor ---------- */
  function hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, h = 0, s = 0;
    if (d) {
      s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60;
    }
    return [h, s, l];
  }
  function rgb(h, s, l) {
    function f(n) { var k = (n + h / 30) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); }
    return [f(0), f(8), f(4)];
  }
  function lin(c) { c /= 255; return c <= .03928 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); }
  function lum(c) { return .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2]); }
  function hexRGB(x) { var n = parseInt(x.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; }
  function cl(v) { return Math.max(0, Math.min(1, v)); }
  var NAVY = hsl(0, 42, 70), ORANGE = hsl(247, 140, 22);
  /* 'p' = família azul/navy, 'a' = família laranja, '' = não mexe */
  function family(c) {
    var x = hsl(c[0], c[1], c[2]);
    if (x[1] >= .26 && x[0] >= 195 && x[0] <= 225) return 'p';
    if (x[1] >= .5 && x[0] >= 20 && x[0] <= 45) return 'a';
    return '';
  }
  /* mapeador de uma paleta: [r,g,b] -> [r,g,b] (ou null = fica como está) */
  /* claridade L (matiz h, saturação sa) cuja luminância relativa é y: o tom recolorido tem o mesmo contraste que o original
     com o branco, os cinzas e os outros azuis do modelo (textos continuam legíveis) */
  function solveL(h, sa, y) { var lo = 0, hi = 1; for (var i = 0; i < 20; i++) { var m = (lo + hi) / 2; if (lum(rgb(h, sa, m)) < y) lo = m; else hi = m; } return (lo + hi) / 2; }
  function mapper(n) {
    var P = n.p ? hsl.apply(null, hexRGB(n.p)) : null, A = n.a ? hsl.apply(null, hexRGB(n.a)) : null;
    return function (col) {
      var f = family(col); if (!f || (f === 'p' && !P) || (f === 'a' && !A)) return null;
      var x = hsl(col[0], col[1], col[2]), L, sa;
      if (f === 'p') { sa = cl(x[1] * P[1] / NAVY[1]); return rgb(P[0], sa, solveL(P[0], sa, lum(col))); }
      L = x[2] > ORANGE[2] ? A[2] + (1 - A[2]) * (x[2] - ORANGE[2]) / (1 - ORANGE[2]) : A[2] * x[2] / ORANGE[2];
      return rgb(A[0], cl(x[1] * A[1] / ORANGE[1]), cl(L));
    };
  }
  function h2(v) { return (v < 16 ? '0' : '') + v.toString(16).toUpperCase(); }
  var RE_HEX = /#([0-9a-f]{6}|[0-9a-f]{3})(?![0-9a-z_-])/gi, RE_RGB = /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(?:,\s*([\d.]+%?)\s*)?\)/gi;
  /* troca as cores de um texto CSS/atributo; cache por paleta */
  function recolor(str, M) {
    if (str.indexOf('#') < 0 && str.indexOf('rgb') < 0) return str;
    return str.replace(RE_HEX, function (m, hx) {
      if (M.memo[m] !== undefined) return M.memo[m];
      if (hx.length === 3) hx = hx[0] + hx[0] + hx[1] + hx[1] + hx[2] + hx[2];
      var o = M.fn(hexRGB('#' + hx)); return (M.memo[m] = o ? '#' + h2(o[0]) + h2(o[1]) + h2(o[2]) : m);
    }).replace(RE_RGB, function (m, r, g, b, a) {
      if (M.memo[m] !== undefined) return M.memo[m];
      var o = M.fn([+r, +g, +b]); return (M.memo[m] = o ? (a != null ? 'rgba(' + o.join(',') + ',' + a + ')' : 'rgb(' + o.join(',') + ')') : m);
    });
  }
  var MAPS = {};
  function mapOf(n, k) { return MAPS[k] || (MAPS[k] = { fn: mapper(n), memo: {} }); }

  /* ---------- 1) markup ---------- */
  var RE_TAG = /<[^>]*>/g, RE_ATTR = /(\s(?:style|fill|stroke|stop-color|flood-color|lighting-color|color)\s*=\s*)(?:"([^"]*)"|'([^']*)')/gi;
  function palHTML(el, html) {
    var n = norm(el && el.pal); if (!n || typeof html !== 'string') return html;
    var M = mapOf(n, keyOf(n));
    return html.replace(RE_TAG, function (t) {
      if (t.indexOf('#') < 0 && t.indexOf('rgb') < 0) return t;
      return t.replace(RE_ATTR, function (m, a, v2, v1) { return v2 != null ? a + '"' + recolor(v2, M) + '"' : a + "'" + recolor(v1, M) + "'"; });
    });
  }

  /* ---------- 2) folhas de estilo ---------- */
  var IDX = null, KF = [], STY = {}, ORDER = [];
  function runtimeSheet() {
    var n = document.getElementById('am-runtime-css');
    if (!n) { var ss = document.querySelectorAll('style'); for (var i = 0; i < ss.length; i++) if (/\.am-stage\b/.test(ss[i].textContent) && /\.am-el\b/.test(ss[i].textContent)) { n = ss[i]; break; } }
    return n && n.sheet ? n : null;
  }
  function hasFam(s) {
    var f = false;
    if (s.indexOf('#') < 0 && s.indexOf('rgb') < 0) return false;
    s.replace(RE_HEX, function (m, hx) { if (hx.length === 3) hx = hx[0] + hx[0] + hx[1] + hx[1] + hx[2] + hx[2]; if (family(hexRGB('#' + hx))) f = true; return m; })
      .replace(RE_RGB, function (m, r, g, b) { if (family([+r, +g, +b])) f = true; return m; });
    return f;
  }
  /* divide no nível 0 (fora de parênteses, colchetes e aspas) */
  function split(s, ch) {
    var out = [], d = 0, q = '', a = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (q) { if (c === '\\') i++; else if (c === q) q = ''; continue; }
      if (c === '"' || c === "'") q = c; else if (c === '(' || c === '[') d++; else if (c === ')' || c === ']') d--; else if (c === ch && !d) { out.push(s.slice(a, i)); a = i + 1; }
    }
    out.push(s.slice(a)); return out;
  }
  function decls(css) {
    return split(css, ';').map(function (x) { var i = x.indexOf(':'); if (i < 0) return null; var p = x.slice(0, i).trim(), v = x.slice(i + 1).trim(); return p && v ? [p, v] : null; }).filter(Boolean);
  }
  /* propriedades que disputam a mesma cor na cascata (abreviação + longas): background*, border*-color, outline*, animation* … */
  function group(p) {
    if (p.indexOf('--') === 0) return p;
    p = p.replace(/^-(webkit|moz|ms)-/, '');
    if (/^background/.test(p)) return 'background';
    if (/^border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-color)?$/.test(p)) return 'border';
    if (/^(outline|text-decoration|text-emphasis|column-rule|animation)/.test(p)) return p.split('-')[0] + (/^text|^column/.test(p) ? '-' + p.split('-')[1] : '');
    return p;
  }
  function build() {
    var node = runtimeSheet(); IDX = { node: node, items: [], groups: {} }; KF = [];
    if (!node) return IDX;
    var raw = [], kf = {};
    function walk(rules, into) {
      for (var i = 0; i < rules.length; i++) {
        var r = rules[i];
        if (r.type === 1 && r.selectorText) { var ds = decls(r.style.cssText); if (ds.length) into.push({ s: r.selectorText, d: ds }); }
        else if (r.type === 4 || r.type === 12) { var sub = []; walk(r.cssRules, sub); if (sub.length) into.push({ m: (r.type === 4 ? '@media ' + r.conditionText : '@supports ' + r.conditionText), l: sub }); }
        else if (r.type === 7 && hasFam(r.cssText)) { kf[r.name] = 1; KF.push(r.cssText); }
      }
    }
    try { walk(node.sheet.cssRules, raw); } catch (er) { return IDX; }
    var names = Object.keys(kf);
    IDX.kre = names.length ? new RegExp('(^|[\\s,])(' + names.map(function (x) { return x.replace(/[^\w-]/g, '\\$&'); }).join('|') + ')(?=$|[\\s,;!])', 'g') : null;
    /* grupos de propriedades que levam cor da marca (background, border, color, fill, stroke, box, filter, --var…) */
    (function mark(list) { list.forEach(function (it) { if (it.l) return mark(it.l); it.d.forEach(function (d) { if (hasFam(d[1])) IDX.groups[group(d[0])] = 1; }); }); })(raw);
    if (IDX.kre) IDX.groups.animation = 1;
    /* fica só o que toca esses grupos (todas as declarações desses grupos, mesmo sem cor da marca: a ordem da cascata se mantém) */
    (function keep(list, into) {
      list.forEach(function (it) {
        if (it.l) { var sub = []; keep(it.l, sub); if (sub.length) into.push({ m: it.m, l: sub }); return; }
        var ds = it.d.filter(function (d) { return IDX.groups[group(d[0])]; }); if (ds.length) into.push({ s: it.s, d: ds });
      });
    })(raw, IDX.items);
    return IDX;
  }
  /* :where(escopo) no composto final de cada seletor, antes de um pseudo-elemento */
  function scope(sel, sc) {
    return split(sel, ',').map(function (s) {
      s = s.trim(); var d = 0, q = '', st = 0;
      for (var i = 0; i < s.length; i++) {
        var c = s[i];
        if (q) { if (c === '\\') i++; else if (c === q) q = ''; continue; }
        if (c === '"' || c === "'") q = c; else if (c === '(' || c === '[') d++; else if (c === ')' || c === ']') d--;
        else if (!d && (c === ' ' || c === '>' || c === '+' || c === '~')) st = i + 1;
      }
      var tail = s.slice(st), pm = /::|:(before|after|first-line|first-letter)\b/i.exec(tail), at = pm ? st + pm.index : s.length;
      return s.slice(0, at) + ':where(' + sc + ')' + s.slice(at);
    }).join(',');
  }
  function css(k, M) {
    var ix = IDX, sc = '[data-pal="' + k + '"],[data-pal="' + k + '"] *', out = '';
    function val(p, v) { v = recolor(v, M); if (ix.kre && group(p) === 'animation') v = v.replace(ix.kre, function (m, a, nm) { return a + nm + '--' + k; }); return v; }
    function emit(list) {
      var s = '';
      list.forEach(function (it) {
        if (it.l) { s += it.m + '{' + emit(it.l) + '}'; return; }
        s += scope(it.s, sc) + '{' + it.d.map(function (d) { return d[0] + ':' + val(d[0], d[1]); }).join(';') + '}\n';
      });
      return s;
    }
    KF.forEach(function (t) { out += recolor(t, M).replace(/^@(-webkit-)?keyframes\s+("?)([\w-]+)\2/, function (m, w, q, nm) { return '@keyframes ' + nm + '--' + k; }) + '\n'; });
    /* a cor herdada do palco (.am-stage{color:#002A46}) entra pelo próprio .am-el */
    out += ':where([data-pal="' + k + '"]){color:' + recolor('#002A46', M) + '}\n';
    return out + emit(ix.items);
  }
  function ensure(k, n) {
    if (STY[k] && STY[k].isConnected) { touch(k); return; }
    if (!IDX || !IDX.node || !IDX.node.isConnected) build();
    if (!IDX.node) return;
    var st = document.createElement('style'); st.id = 'am-pal-' + k; st.setAttribute('data-am-pal', k);
    st.textContent = css(k, mapOf(n, k));
    IDX.node.parentNode.insertBefore(st, IDX.node.nextSibling); STY[k] = st; touch(k); gc();
  }
  function touch(k) { var i = ORDER.indexOf(k); if (i >= 0) ORDER.splice(i, 1); ORDER.push(k); }
  /* o seletor de cor do sistema gera uma paleta por movimento: guarda as 12 mais recentes e as que ainda estão na página */
  function gc() {
    if (ORDER.length <= 12) return;
    ORDER.slice(0, ORDER.length - 12).forEach(function (k) {
      if (document.querySelector('[data-pal="' + k + '"]')) return;
      if (STY[k]) STY[k].remove(); delete STY[k]; delete MAPS[k]; ORDER.splice(ORDER.indexOf(k), 1);
    });
  }
  function palTag(node, el) {
    var n = norm(el && el.pal); if (!n || !node) return;
    var k = keyOf(n); node.setAttribute('data-pal', k);
    try { ensure(k, n); } catch (er) { if (window.console && console.warn) console.warn('AMRT: cores do componente', er); }
  }
  R.palHTML = palHTML; R.palTag = palTag;
  R.pal = { norm: norm, key: keyOf, family: function (hex) { return HEX.test(hex) ? family(hexRGB(hex)) : ''; }, map: function (hex, pal) { var n = norm(pal); if (!n || !HEX.test(hex)) return hex; var o = mapOf(n, keyOf(n)).fn(hexRGB(hex)); return o ? '#' + h2(o[0]) + h2(o[1]) + h2(o[2]) : hex.toUpperCase(); }, recolor: function (s, pal) { var n = norm(pal); return n ? recolor(String(s), mapOf(n, keyOf(n))) : s; }, index: function () { return IDX || build(); },
    contrast: function (x, y) { if (!HEX.test(x) || !HEX.test(y)) return 0; var a = lum(hexRGB(x)), b = lum(hexRGB(y)); return (Math.max(a, b) + .05) / (Math.min(a, b) + .05); } };
})(window.AMRT);
