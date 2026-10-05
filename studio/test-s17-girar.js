/* S17 — Girar e inverter direto no quadro: alça de girar (ângulo ao vivo, Shift 15°, ímã 0/90/180/270), alças de redimensionar no
   quadro girado (canto oposto parado), barra do quadro (girar 90° e inverter), painel, menu de contexto, Alt+setas, linhas,
   desfazer, reabrir, exportar. Tudo pela interface real (cliques, arrastes, teclas). Uso: python3 assemble.py && node test-s17-girar.js */
process.env.NODE_PATH='/opt/node22/lib/node_modules'; require('module').Module._initPaths();
const {chromium}=require('playwright'); const path=require('path'); const fs=require('fs');
const FILE='file://'+path.join(__dirname,'AM-Studio-Editor.html');
const FONTS=process.env.AM_FONTS_DIR||path.join(__dirname,'..','fonts2');
const SHOTS=path.join(__dirname,'shots'); fs.mkdirSync(SHOTS,{recursive:true});
const SH=f=>path.join(SHOTS,'s17-'+f+'.png');
const IMG='data:image/png;base64,'+fs.readFileSync(path.join(__dirname,'test-foto.png')).toString('base64');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const results=[]; let failed=0; const errs=[];
function check(name, ok, info){ results.push((ok?'PASS ':'FAIL ')+name+(info!==undefined?'  '+JSON.stringify(info):'')); if(!ok) failed++; }
async function fonts(p){ if(!fs.existsSync(path.join(FONTS,'gf.css'))) return;
  await p.route('https://fonts.googleapis.com/**',r=>r.fulfill({status:200,contentType:'text/css',body:fs.readFileSync(path.join(FONTS,'gf.css'),'utf8')}));
  await p.route('https://fonts.gstatic.com/**',r=>{const f=path.join(FONTS,path.basename(new URL(r.request().url()).pathname)); return fs.existsSync(f)?r.fulfill({status:200,contentType:'font/woff2',body:fs.readFileSync(f)}):r.abort();}); }
async function open(ctx, url, tag){ const p=await ctx.newPage(); await fonts(p);
  p.on('pageerror',e=>errs.push(tag+' pageerror: '+e.message));
  p.on('console',m=>{ if(m.type()==='error'&&!/net::|Failed to load/.test(m.text())) errs.push(tag+': '+m.text()); });
  await p.goto(url); await sleep(800); return p; }
const rnd=v=>Math.round(v*100)/100;
/* deck de trabalho: forma com texto, imagem, texto, ícone, gráfico e duas linhas (reta e cotovelo) */
function deckSpec(img){ return {v:1,title:'S17',slides:[{id:'s1',bg:'#FFFFFF',tr:'fade',els:[
  {id:'shp',type:'shape',shape:'callout',x:120,y:150,w:300,h:160,fill:'#002A46',stroke:'#7EA1C3',strokeW:0,radius:14,html:'Texto da forma',font:'Inter',size:22,weight:600,color:'#FFFFFF',align:'center',valign:'middle',anim:{in:'none'}},
  {id:'img',type:'image',src:img,x:560,y:140,w:320,h:200,fit:'cover',radius:0,anim:{in:'none'}},
  {id:'txt',type:'text',x:960,y:160,w:260,h:60,html:'Texto comum',font:'Inter',size:22,weight:400,color:'#002A46',align:'left',anim:{in:'none'}},
  {id:'ico',type:'fx',kind:'icon',x:150,y:440,w:140,h:140,data:{name:'target',trig:'in-hover',color:'#002A46',accent:'#F78C16',bg:'none',stroke:1.85,label:'Meta'},anim:{in:'none'}},
  {id:'bar',type:'fx',kind:'bars',x:380,y:420,w:420,h:240,data:{},anim:{in:'none'}},
  {id:'ln',type:'line',x1:880,y1:560,x2:1180,y2:500,stroke:'#002A46',strokeW:3,headEnd:true,headStart:false,dash:false,anim:{in:'none'}},
  {id:'elb',type:'line',x1:880,y1:640,x2:1180,y2:690,curve:'elbow',bend:.3,stroke:'#002A46',strokeW:3,headEnd:true,headStart:false,dash:false,anim:{in:'none'}}
]}]}; }
(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:1440,height:900},acceptDownloads:true});
  const p=await open(ctx, FILE+'?nocover', 'ed');
  await p.evaluate(d=>AMStudio.loadDeck(d,''), deckSpec(IMG)); await sleep(300);
  let wb=await (await p.$('#wrap')).boundingBox();
  const L=(x,y)=>({x:wb.x+x/1280*wb.width, y:wb.y+y/720*wb.height});     /* lógico 1280×720 -> tela */
  const EL=id=>p.evaluate(id=>{ const e=AMStudio.deck.slides[AMStudio.cur].els.find(x=>x.id===id); return e?JSON.parse(JSON.stringify(e)):null; }, id);
  /* ponto do mundo de um ponto local (fx, fy em 0..1) da caixa girada */
  const world=(e,fx,fy)=>{ const t=(e.rot||0)*Math.PI/180, cx=e.x+e.w/2, cy=e.y+e.h/2, dx=e.x+e.w*fx-cx, dy=e.y+e.h*fy-cy; return {x:cx+dx*Math.cos(t)-dy*Math.sin(t), y:cy+dx*Math.sin(t)+dy*Math.cos(t)}; };
  const ctr=async id=>{ const e=await EL(id); return L(e.x+e.w/2, e.y+e.h/2); };
  const clickEl=async id=>{ const c=await ctr(id); await p.mouse.click(c.x,c.y); await sleep(150); };
  const rect=async sel=>{ const h=await p.$(sel); return h?h.boundingBox():null; };
  const mid=r=>({x:r.x+r.width/2,y:r.y+r.height/2});
  const undo=async()=>{ await p.keyboard.press('Control+z'); await sleep(180); };
  /* arrasta a alça de girar até o ângulo T (graus, horário a partir do “para cima”) */
  async function rotateTo(id, T, shift){
    const c=await ctr(id), h=mid(await rect('#sel .rhdl')), r=Math.hypot(h.x-c.x,h.y-c.y), a0=Math.atan2(h.y-c.y,h.x-c.x)*180/Math.PI+90;
    if(shift) await p.keyboard.down('Shift');
    await p.mouse.move(h.x,h.y); await p.mouse.down();
    for(let i=1;i<=8;i++){ const a=(a0+(T-a0)*i/8)*Math.PI/180; await p.mouse.move(c.x+r*Math.sin(a), c.y-r*Math.cos(a)); await sleep(15); }
    const live={tip:await p.evaluate(()=>{const t=document.querySelector('#sel .rottip'); return t&&t.textContent;}), bar:!!await p.$('#frBar'), cursor:await p.evaluate(()=>getComputedStyle(document.body).cursor)};
    await p.mouse.up(); if(shift) await p.keyboard.up('Shift'); await sleep(200);
    return live;
  }

  /* ---------- 1. alça de girar e barra do quadro ---------- */
  await clickEl('shp');
  const rh0=await rect('#sel .rhdl'), e0=await EL('shp'), top0=L(e0.x+e0.w/2, e0.y);
  const fr=await p.$$eval('#frBar button',bs=>bs.map(b=>({k:b.dataset.fr,t:b.title,a:b.getAttribute('aria-label')})));
  check('S17-01: forma selecionada mostra a alça redonda de girar ~26 px acima do meio da borda de cima (com haste) e a barra do quadro com os 4 botões nomeados',
    rh0&&Math.abs(mid(rh0).x-top0.x)<2&&Math.abs(top0.y-mid(rh0).y-26)<3&&!!await p.$('#sel .rstem')&&await p.$$eval('#sel .hdl',h=>h.length)===8&&
    JSON.stringify(fr.map(f=>f.k))==='["rot-l","rot-r","flip-h","flip-v"]'&&fr.every(f=>f.t&&f.t===f.a)&&/Girar 90° à esquerda/.test(fr[0].t)&&/Inverter na vertical/.test(fr[3].t), {rh0,top0,fr});
  await p.screenshot({path:SH('01-quadro')});
  /* 2. arrastar a alça até ~45° */
  const lv=await rotateTo('shp',45);
  let e=await EL('shp');
  check('S17-02: arrastar a alça gira ~45° com o ângulo ao vivo (“45°”), cursor “grabbing” e a barra do quadro escondida durante o giro', e.rot>=44&&e.rot<=46&&/^4[4-6]°$/.test(lv.tip||'')&&!lv.bar&&lv.cursor==='grabbing'&&e.x===e0.x&&e.w===e0.w, {rot:e.rot,lv});
  await p.screenshot({path:SH('02-girado-45')});
  /* alças do quadro girado */
  const hse=mid(await rect('#sel .hdl[data-h=se]')), wse=world(e,1,1), Lse=L(wse.x,wse.y), curN=await p.$eval('#sel .hdl[data-h=n]',h=>h.style.cursor);
  check('S17-03: no quadro girado as alças ficam nos cantos girados e o cursor gira junto (alça “n” a 45° = ne-resize)', Math.hypot(hse.x-Lse.x,hse.y-Lse.y)<3&&curN==='ne-resize', {hse,Lse,curN});
  await undo(); e=await EL('shp');
  check('S17-04: Ctrl+Z desfaz o giro inteiro num passo só', !e.rot, e.rot);
  /* 3. Shift = passos de 15°; ímã em 90° */
  await rotateTo('shp',52,true); e=await EL('shp'); const rS=e.rot; await undo();
  await rotateTo('shp',92); e=await EL('shp'); const rM=e.rot; await undo();
  await rotateTo('shp',96); e=await EL('shp'); const rF=e.rot; await undo();
  check('S17-05: Shift encaixa de 15 em 15° (52° → 45°); sem Shift, ímã em 90° dentro de ±3° (92° → 90°) e giro livre fora dele (96°)', rS===45&&rM===90&&rF>=95&&rF<=97, {rS,rM,rF});

  /* ---------- 4. redimensionar uma forma girada 30° (campo do painel) ---------- */
  await p.fill('#props [data-p=rot]','30'); await p.keyboard.press('Tab'); await sleep(200);
  const r0=await EL('shp'), nw0=world(r0,0,0); let hs=mid(await rect('#sel .hdl[data-h=se]'));
  const t30=Math.PI/6, dX=60*Math.cos(t30)-40*Math.sin(t30), dY=60*Math.sin(t30)+40*Math.cos(t30); /* (60, 40) px na direção do próprio quadro girado */
  await p.mouse.move(hs.x,hs.y); await p.mouse.down(); await p.mouse.move(hs.x+dX,hs.y+dY,{steps:8}); await p.mouse.up(); await sleep(200);
  const r1=await EL('shp'), nw1=world(r1,0,0);
  hs=mid(await rect('#sel .hdl[data-h=w]')); await p.mouse.move(hs.x,hs.y); await p.mouse.down(); await p.mouse.move(hs.x-40,hs.y+10,{steps:6}); await p.mouse.up(); await sleep(200);
  const r2=await EL('shp'), ne1=world(r1,1,0), ne2=world(r2,1,0), se1=world(r1,1,1), se2=world(r2,1,1);
  check('S17-06: forma girada 30°: a alça de canto aumenta e o canto oposto fica parado no slide (±2 px); a alça lateral só estica a largura e o lado oposto não sai do lugar',
    r0.rot===30&&r1.rot===30&&r1.w>r0.w+40&&r1.h>r0.h+25&&Math.hypot(nw1.x-nw0.x,nw1.y-nw0.y)<=2&&r2.w>r1.w+20&&r2.h===r1.h&&Math.hypot(ne2.x-ne1.x,ne2.y-ne1.y)<=2&&Math.hypot(se2.x-se1.x,se2.y-se1.y)<=2,
    {r0:[r0.x,r0.y,r0.w,r0.h],r1:[r1.x,r1.y,r1.w,r1.h],r2:[r2.x,r2.y,r2.w,r2.h],dNW:rnd(Math.hypot(nw1.x-nw0.x,nw1.y-nw0.y)),dNE:rnd(Math.hypot(ne2.x-ne1.x,ne2.y-ne1.y))});
  await p.screenshot({path:SH('03-girada-redimensionada')});
  /* clique na parte girada fora da caixa sem giro seleciona o elemento */
  await p.mouse.click(L(1240,700).x, L(1240,700).y); await sleep(120);
  const tip=world(r2,.03,.03), tipL=L(tip.x,tip.y), inBox=tip.x>=r2.x&&tip.x<=r2.x+r2.w&&tip.y>=r2.y&&tip.y<=r2.y+r2.h;
  await p.mouse.click(tipL.x,tipL.y); await sleep(150);
  check('S17-07: o clique segue o desenho girado (ponto girado fora da caixa sem giro seleciona a forma)', !inBox&&(await p.evaluate(()=>AMStudio.selected()))[0]==='shp', {tip,inBox});
  /* Zerar rotação no painel */
  await p.click('#props [data-act=rot-0]'); await sleep(200); e=await EL('shp');
  check('S17-08: painel “Girar e inverter” (4 botões + Zerar rotação): Zerar volta a 0° e Ctrl+Z traz os 30° de volta', !e.rot&&await p.$$eval('#props .frseg button',b=>b.length)===5&&await (async()=>{ await undo(); return (await EL('shp')).rot===30; })(), e.rot);
  await p.click('#props [data-act=rot-0]'); await sleep(150);

  /* ---------- 5. barra do quadro: girar 90° e inverter (forma e imagem) ---------- */
  await clickEl('img');
  await p.click('#frBar [data-fr=flip-h]'); await sleep(150);
  let im=await EL('img'), dom=await p.evaluate(()=>{ const n=document.querySelector('#wrap .am-stage .am-el[data-id=img]'), i=n.querySelector('.am-img'); return {sc:getComputedStyle(i).scale, rot:n.querySelector('.am-rot').style.transform, fxw:getComputedStyle(n.querySelector('.am-fxw')).transform}; });
  check('S17-09: Inverter na horizontal (barra do quadro) espelha só a <img> (scale −1 1); .am-rot e .am-fxw ficam sem espelho; a seleção continua', im.flipH===true&&!im.flipV&&dom.sc==='-1 1'&&dom.rot===''&&dom.fxw==='none'&&(await p.evaluate(()=>AMStudio.selected()))[0]==='img', dom);
  await p.click('#frBar [data-fr=flip-v]'); await sleep(150);
  await p.click('#frBar [data-fr=rot-r]'); await sleep(150);
  im=await EL('img'); const imsc=await p.$eval('#wrap .am-stage .am-el[data-id=img] .am-img',i=>getComputedStyle(i).scale);
  check('S17-10: Inverter na vertical soma (scale −1 −1) e Girar 90° à direita leva a 90°', im.flipH&&im.flipV&&im.rot===90&&/^-1( -1)?$/.test(imsc), {im:[im.flipH,im.flipV,im.rot],imsc});
  await p.screenshot({path:SH('04-imagem-invertida-girada')});
  await undo(); im=await EL('img'); const u1=[!!im.flipV,im.rot]; await undo(); im=await EL('img'); const u2=[!!im.flipV,!!im.flipH]; await undo(); im=await EL('img'); const u3=!!im.flipH;
  check('S17-11: cada botão é um passo de desfazer (giro, depois vertical, depois horizontal)', u1[0]===true&&!u1[1]&&u2[0]===false&&u2[1]===true&&u3===false, {u1,u2,u3});
  await clickEl('shp');
  await p.click('#frBar [data-fr=flip-h]'); await sleep(150);
  const sd=await p.evaluate(()=>{ const n=document.querySelector('#wrap .am-stage .am-el[data-id=shp]'), sv=n.querySelector('.am-fxw>svg'), g=sv.querySelector('g[data-flip]'), t=n.querySelector('.am-text'); return {g:g&&g.getAttribute('data-flip'), tr:g&&g.getAttribute('transform'), svgT:getComputedStyle(sv).transform, svgS:getComputedStyle(sv).scale, tT:getComputedStyle(t).transform, tS:getComputedStyle(t).scale, tIn:sv.contains(t), txt:t.textContent, inset:t.style.inset}; });
  check('S17-12: forma invertida: só o desenho do <svg> espelha (g[data-flip=h], matrix(−1…)); o texto (.am-text) não espelha e continua legível; a área do texto do balão acompanha', (await EL('shp')).flipH===true&&sd.g==='h'&&/^matrix\(-1 0 0 1 \d+(\.\d+)? 0\)$/.test(sd.tr)&&sd.svgT==='none'&&sd.svgS==='none'&&sd.tT==='none'&&sd.tS==='none'&&!sd.tIn&&sd.txt==='Texto da forma'&&/^0(px)? 0(px)? 22%( 0(px)?)?$/.test(sd.inset), sd);
  await p.screenshot({path:SH('05-forma-invertida')});

  /* ---------- 6. texto e gráfico: inverter desativado; ícone espelha ---------- */
  await clickEl('txt');
  const tb=await p.$eval('#frBar [data-fr=flip-h]',x=>({d:x.getAttribute('aria-disabled'),t:x.title})), tr0=await p.$eval('#frBar [data-fr=rot-r]',x=>x.getAttribute('aria-disabled'));
  await p.click('#frBar [data-fr=flip-h]',{force:true}); await sleep(200); /* aria-disabled: o clique real chega e explica o motivo */
  const toastT=await p.$eval('#toast',t=>t.classList.contains('show')?t.textContent:'');
  check('S17-13: texto: Inverter aparece desativado com o motivo no title; o clique não espelha e avisa; Girar continua ativo', tb.d==='true'&&/Textos não se espelham/.test(tb.t)&&!(await EL('txt')).flipH&&/Textos não se espelham/.test(toastT)&&tr0===null, {tb,toastT,tr0});
  await p.screenshot({path:SH('06-texto-inverter-desativado')});
  await clickEl('bar');
  const bb=await p.$eval('#frBar [data-fr=flip-v]',x=>({d:x.getAttribute('aria-disabled'),t:x.title})), pb=await p.$eval('#props [data-act=flip-h]',x=>x.getAttribute('aria-disabled'));
  await clickEl('ico'); await p.click('#frBar [data-fr=flip-h]'); await sleep(150);
  const ic=await p.evaluate(()=>{ const n=document.querySelector('#wrap .am-stage .am-el[data-id=ico]'), sv=n.querySelector('svg.ic'), l=n.querySelector('.ic-l'); return {sc:getComputedStyle(sv).scale, l:l&&getComputedStyle(l).scale, lt:l&&l.textContent}; });
  check('S17-14: gráfico com texto: Inverter desativado (barra e painel); ícone: só o desenho espelha, a legenda não', bb.d==='true'&&/não se espelham/.test(bb.t)&&pb==='true'&&(await EL('ico')).flipH===true&&ic.sc==='-1 1'&&ic.l==='none'&&ic.lt==='Meta', {bb,pb,ic});

  /* ---------- 7. linhas: girar e espelhar as pontas (painel da linha) ---------- */
  const lc=await p.evaluate(()=>{ const e=AMStudio.deck.slides[0].els.find(x=>x.id==='ln'); return {x:(e.x1+e.x2)/2,y:(e.y1+e.y2)/2}; });
  await p.mouse.click(L(lc.x,lc.y).x, L(lc.x,lc.y).y); await sleep(150);
  const lnBtns=await p.$$eval('#props .frseg button',b=>b.map(x=>x.dataset.act));
  await p.click('#props [data-act=rot-r]'); await sleep(150); const l1=await EL('ln');
  await p.click('#props [data-act=flip-h]'); await sleep(150); const l2=await EL('ln');
  await p.click('#props [data-act=flip-v]'); await sleep(150); const l3=await EL('ln');
  check('S17-15: linha: Girar 90° à direita gira as pontas em torno do meio; Inverter H/V espelha as pontas (sem campos novos); o painel “Posição” traz os 4 botões',
    JSON.stringify(lnBtns)==='["rot-l","rot-r","flip-h","flip-v"]'&&[l1.x1,l1.y1,l1.x2,l1.y2].join()==='1000,380,1060,680'&&[l2.x1,l2.y1,l2.x2,l2.y2].join()==='1060,380,1000,680'&&[l3.x1,l3.y1,l3.x2,l3.y2].join()==='1060,680,1000,380'&&l3.rot===undefined&&l3.flipH===undefined&&l3.headEnd===true, {lnBtns,l1:[l1.x1,l1.y1,l1.x2,l1.y2],l2:[l2.x1,l2.y1,l2.x2,l2.y2],l3:[l3.x1,l3.y1,l3.x2,l3.y2]});
  const ec=await p.evaluate(()=>{ const e=AMStudio.deck.slides[0].els.find(x=>x.id==='elb'); return AMRT.lineBendPt?AMRT.lineBendPt(e):{x:(e.x1+e.x2)/2,y:(e.y1+e.y2)/2}; });
  await p.mouse.click(L(ec.x,ec.y).x+(ec.hz?0:0), L(ec.x,ec.y).y); await sleep(150);
  const selE=(await p.evaluate(()=>AMStudio.selected()))[0];
  if(selE==='elb'){ await p.click('#frBar [data-fr=rot-l]'); await sleep(150); }
  const eb=await EL('elb');
  check('S17-16: conector em cotovelo também gira pela barra do quadro (−90°): continua cotovelo, com a mesma dobra', selE==='elb'&&eb.curve==='elbow'&&eb.bend===.3&&[eb.x1,eb.y1,eb.x2,eb.y2].join()==='1005,815,1055,515', {selE,eb:[eb.x1,eb.y1,eb.x2,eb.y2,eb.curve,eb.bend]});
  await p.screenshot({path:SH('07-linhas')});
  await undo(); await undo(); await undo(); await undo();

  /* ---------- 8. Alt+setas ---------- */
  await clickEl('shp'); const k0=(await EL('shp')).rot||0, x0=(await EL('shp')).x;
  await p.keyboard.press('Alt+ArrowRight'); await sleep(120); const k1=(await EL('shp')).rot||0;
  await p.keyboard.press('Alt+Shift+ArrowLeft'); await sleep(120); const k2=(await EL('shp')).rot||0;
  await p.keyboard.press('Alt+ArrowLeft'); await sleep(120); const k3=(await EL('shp')).rot||0;
  await undo(); const k4=(await EL('shp')).rot||0; const ex=(await EL('shp')).x;
  check('S17-17: Alt+→ gira 15° no sentido horário, Alt+Shift+← volta 1°, Alt+← volta 15°; cada toque é um passo de desfazer; não move o elemento', k1===k0+15&&k2===k0+14&&k3===k0-1&&k4===k0+14&&ex===x0, {k0,k1,k2,k3,k4,ex,x0});
  await undo(); await undo();
  const hk=await p.evaluate(()=>{ const g=AMStudio.HK.find(x=>x[0]==='Mover e selecionar'), r=g&&g[1].find(x=>/giram 15°/.test(x[2]||'')); return r?JSON.stringify(r):''; });
  await p.keyboard.press('F1'); await sleep(250); const f1=await p.evaluate(()=>{ const m=document.querySelector('#modal'); return m.classList.contains('open')&&/giram 15°/.test(m.textContent)&&/Alt/.test(m.textContent); }); await p.keyboard.press('Escape'); await sleep(150);
  check('S17-18: atalho Alt+← / Alt+→ listado em HK no grupo “Mover e selecionar” (nota da linha das setas: o manual da capa continua com 17 linhas e cabe em 1280×720) e no modal F1', hk==='["Mover 1 px / 10 px",[["Setas"],["Shift","Setas"]],"Alt+← / Alt+→ giram 15° · com Shift, 1°","/"]'&&f1, {hk,f1});

  /* ---------- 9. menu de contexto ---------- */
  await clickEl('img'); const c=await ctr('img'); await p.mouse.click(c.x,c.y,{button:'right'}); await sleep(250);
  const ctxN={girar:await p.locator('.xmenu .xi',{hasText:'Girar e inverter'}).count(), alinhar:await p.locator('.xmenu .xi',{hasText:/alinhar/i}).count(), frente:await p.locator('.xmenu .xi',{hasText:/trazer para frente/i}).count()};
  await p.locator('.xmenu .xi',{hasText:'Girar e inverter'}).hover(); await sleep(300);
  const subT=await p.evaluate(()=>{ const ms=[...document.querySelectorAll('.xmenu')]; return [...ms[ms.length-1].querySelectorAll('.xi .xl')].map(x=>x.textContent); });
  await p.screenshot({path:SH('08-menu-contexto')});
  const it=p.locator('.xmenu').last().locator('.xi',{hasText:'Inverter na vertical'}).first(); await it.hover(); await sleep(100); await it.click(); await sleep(200);
  check('S17-19: clique direito: um item “Girar e inverter ▸” (e ainda um “Alinhar”, um “Trazer para frente”) com os 4 comandos + Zerar rotação; “Inverter na vertical” espelha a imagem', ctxN.girar===1&&ctxN.alinhar===1&&ctxN.frente===1&&JSON.stringify(subT)==='["Girar 90° à esquerda","Girar 90° à direita","Inverter na horizontal","Inverter na vertical","Zerar rotação"]'&&(await EL('img')).flipV===true, {ctxN,subT});

  /* ---------- 10. seleção múltipla ---------- */
  await clickEl('img'); let cs=await ctr('shp'); await p.keyboard.down('Shift'); await p.mouse.click(cs.x,cs.y); await p.keyboard.up('Shift'); await sleep(200);
  const before=await p.evaluate(()=>AMStudio.deck.slides[0].els.filter(x=>x.id==='img'||x.id==='shp').map(x=>[x.x,x.y,!!x.flipH])), mb=await rect('#frBar'), gb=await rect('#sel .gbox');
  await p.click('#frBar [data-fr=flip-h]'); await sleep(200);
  const after=await p.evaluate(()=>AMStudio.deck.slides[0].els.filter(x=>x.id==='img'||x.id==='shp').map(x=>[x.x,x.y,!!x.flipH]));
  const mp=await p.$$eval('#props .frseg button',b=>b.map(x=>x.dataset.act));
  check('S17-20: seleção múltipla: a barra fica presa ao quadro do grupo e espelha cada elemento no próprio lugar; o painel do grupo tem os botões', (await p.evaluate(()=>AMStudio.selected().length))===2&&mb&&gb&&mb.y+mb.height<=gb.y+2&&after.every((a,i)=>a[0]===before[i][0]&&a[1]===before[i][1]&&a[2]!==before[i][2])&&mp.slice(0,4).join()==='rot-l,rot-r,flip-h,flip-v', {before,after,mb,gb,mp});
  await p.screenshot({path:SH('09-multipla')});

  /* ---------- 11. editar texto esconde a barra e a alça ---------- */
  await clickEl('shp'); await p.keyboard.press('Enter'); await sleep(200);
  const ed={bar:!!await p.$('#frBar'), rh:!!await p.$('#sel .rhdl')};
  await p.keyboard.press('Escape'); await sleep(150);
  check('S17-21: editando o texto da forma, a barra do quadro e a alça de girar somem', !ed.bar&&!ed.rh, ed);

  /* ---------- 12. miniatura, salvar → reabrir e normalização ---------- */
  await clickEl('shp'); await p.click('#frBar [data-fr=rot-r]'); await sleep(200);
  const thumb=await p.evaluate(()=>{ const n=document.querySelector('#thumbs .th.on .am-el[data-id=img] .am-img'), s=document.querySelector('#thumbs .th.on .am-el[data-id=shp]'); return {img:n&&n.style.scale, shpG:!!(s&&s.querySelector('g[data-flip]')), shpR:s&&s.querySelector('.am-rot').style.transform}; });
  const snap=await p.evaluate(()=>AMStudio.deck.slides[0].els.filter(x=>['img','shp','ico'].includes(x.id)).map(x=>[x.id,x.rot||0,!!x.flipH,!!x.flipV]));
  await p.evaluate(()=>AMStudio.loadDeck(JSON.parse(JSON.stringify(AMStudio.deck)),'')); await sleep(300);
  const back=await p.evaluate(()=>AMStudio.deck.slides[0].els.filter(x=>['img','shp','ico'].includes(x.id)).map(x=>[x.id,x.rot||0,!!x.flipH,!!x.flipV]));
  const nz=await p.evaluate(()=>{ AMStudio.loadDeck({v:1,title:'n',slides:[{id:'a',bg:'#fff',els:[{id:'q1',type:'shape',shape:'rect',x:10,y:10,w:100,h:80,rot:270.4,flipH:'sim',flipV:true},{id:'q2',type:'text',x:10,y:200,w:200,h:40,html:'x',rot:-180,flipH:true},{id:'q3',type:'image',src:'data:image/png;base64,AAAA',x:300,y:10,w:100,h:80,rot:720,flipH:1}]}]},''); return AMStudio.deck.slides[0].els.map(e=>({id:e.id,rot:e.rot,fh:e.flipH,fv:e.flipV})); });
  check('S17-22: miniatura mostra giro e espelho; salvar → reabrir mantém rot/flipH/flipV; ao abrir, rot vira inteiro em (−180, 180] (270,4 → −90; −180 → 180; 720 → 0) e flip só fica se for true e onde existe (texto não)',
    /^-1( -1)?$/.test(thumb.img)&&/rotate\(90deg\)/.test(thumb.shpR)&&JSON.stringify(back)===JSON.stringify(snap)&&JSON.stringify(snap)==='[["shp",90,false,false],["img",0,true,true],["ico",0,true,false]]'&&
    JSON.stringify(nz)==='[{"id":"q1","rot":-90,"fv":true},{"id":"q2","rot":180},{"id":"q3"}]', {thumb,snap,back,nz});

  /* ---------- 13. exportar: o player mostra o espelho e o giro ---------- */
  await p.evaluate(d=>AMStudio.loadDeck(d,''), deckSpec(IMG)); await sleep(200);
  await clickEl('img'); await p.click('#frBar [data-fr=flip-h]'); await sleep(120);
  await clickEl('shp'); await p.click('#frBar [data-fr=flip-v]'); await sleep(120); await p.click('#frBar [data-fr=rot-r]'); await sleep(120);
  await clickEl('ico'); await p.click('#frBar [data-fr=flip-h]'); await sleep(120);
  const html=await p.evaluate(()=>AMStudio.exportHTML()); const f=path.join(__dirname,'saved-s17.html'); fs.writeFileSync(f,html);
  const q=await open(ctx,'file://'+f,'exp'); await sleep(600);
  const ex2=await q.evaluate(()=>{ const s=document.querySelector('.amp-slide'), i=s.querySelector('.am-el[data-id=img] .am-img'), sh=s.querySelector('.am-el[data-id=shp]'), ic=s.querySelector('.am-el[data-id=ico] svg.ic'); return {img:i&&getComputedStyle(i).scale, g:sh&&(sh.querySelector('g[data-flip]')||{}).getAttribute&&sh.querySelector('g[data-flip]').getAttribute('data-flip'), rot:sh&&sh.querySelector('.am-rot').style.transform, tx:sh&&getComputedStyle(sh.querySelector('.am-text')).scale, ic:ic&&getComputedStyle(ic).scale}; });
  await q.screenshot({path:SH('10-exportado')});
  check('S17-23: arquivo exportado: o player desenha a foto espelhada, a forma espelhada na vertical e girada 90° (texto sem espelho) e o ícone espelhado', ex2.img==='-1 1'&&ex2.g==='v'&&/rotate\(90deg\)/.test(ex2.rot)&&ex2.tx==='none'&&ex2.ic==='-1 1', ex2);
  check('S17-24: export sem on* (CR-04)', !/onerror|onmouseover|onclick/i.test(html));
  await q.close();

  /* ---------- 14. barra do quadro nunca sobre o “Animação” (#fxArrow) nem sobre a alça, sempre dentro do palco: 1280×720 e 1440×900 ---------- */
  const cases=[['padrão',{id:'z',type:'shape',shape:'rect',x:490,y:290,w:300,h:140}],['estreita',{id:'z',type:'shape',shape:'ellipse',x:600,y:300,w:90,h:90}],['no topo',{id:'z',type:'shape',shape:'rect',x:40,y:4,w:1200,h:80}],
    ['na base',{id:'z',type:'shape',shape:'rect',x:900,y:640,w:360,h:76}],['girada 30°',{id:'z',type:'shape',shape:'round',x:500,y:250,w:300,h:160,rot:30}],['canto',{id:'z',type:'image',src:IMG,x:2,y:2,w:120,h:80}],
    ['linha',{id:'z',type:'line',x1:100,y1:300,x2:300,y2:240,stroke:'#002A46',strokeW:3}],['texto no topo',{id:'z',type:'text',x:60,y:20,w:400,h:40,html:'Título',size:28}],['girada 135° no topo',{id:'z',type:'shape',shape:'rect',x:600,y:10,w:200,h:60,rot:135}]];
  const bad=[]; let shot=0;
  for(const vp of [[1280,720],[1440,900]]){
    await p.setViewportSize({width:vp[0],height:vp[1]}); await sleep(250);
    for(const cs2 of cases){
      await p.evaluate(e=>{ AMStudio.loadDeck({v:1,title:'v',slides:[{id:'a',bg:'#FFFFFF',els:[Object.assign({anim:{in:'none'},fill:'#002A46',strokeW:0,color:'#002A46'},e)]}]},''); AMStudio.select('z'); }, cs2[1]); await sleep(120);
      const m=await p.evaluate(()=>{ const R=s=>{const n=document.querySelector(s); if(!n) return null; const r=n.getBoundingClientRect(); return {l:r.left,t:r.top,r:r.right,b:r.bottom};}; return {bar:R('#frBar'),fa:R('#fxArrow'),rh:R('#sel .rhdl'),wr:R('#wrap')}; });
      const ov=(a,b)=>a&&b&&Math.min(a.r,b.r)-Math.max(a.l,b.l)>0&&Math.min(a.b,b.b)-Math.max(a.t,b.t)>0;
      const inside=m.bar&&m.bar.l>=m.wr.l-.5&&m.bar.r<=m.wr.r+.5&&m.bar.t>=m.wr.t-.5&&m.bar.b<=m.wr.b+.5;
      if(!m.bar||ov(m.bar,m.fa)||ov(m.bar,m.rh)||ov(m.fa,m.rh)||!inside) bad.push({vp,c:cs2[0],m});
      if((cs2[0]==='no topo'||cs2[0]==='estreita'||cs2[0]==='girada 135° no topo')&&shot<6){ shot++; await p.screenshot({path:SH('11-'+vp[0]+'-'+cs2[0].replace(/\W+/g,'-'))}); }
    }
  }
  check('S17-25: a barra do quadro não cobre o “Animação” nem a alça de girar, e fica dentro do palco (9 casos × 1280×720 e 1440×900)', bad.length===0, bad.slice(0,3));
  /* barra superior não transborda em 1280 (nada foi acrescentado à faixa) */
  await p.setViewportSize({width:1280,height:720}); await sleep(200);
  const of=await p.evaluate(()=>{ const r=document.querySelector('#rib'), t=document.querySelector('#top'); return {rib:r.scrollWidth-r.clientWidth, top:t.scrollWidth-t.clientWidth}; });
  check('S17-26: faixa de ferramentas e barra do topo sem transbordar em 1280×720', of.rib<=0&&of.top<=0, of);

  check('Zero erros de console', errs.length===0, errs);
  console.log(results.join('\n'));
  console.log(failed?('FALHAS: '+failed):'TUDO OK', JSON.stringify({errs}));
  await b.close(); try{ fs.unlinkSync(f); }catch(e){}
  process.exit(failed?1:0);
})().catch(e=>{ console.log(results.join('\n')); console.error('ERRO', e); process.exit(2); });
