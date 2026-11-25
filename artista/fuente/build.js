// Genera una ficha pública por rapero: artista/<slug>/index.html (+ artista/index.html con todos).
// Uso (desde la raíz del repo):  node artista/fuente/build.js
// Después, si cambió el roster: imágenes para redes con  python artista/fuente/og-servidor.py  (ver LEEME.md).
//
// Toma TODO de index.html (no hay datos duplicados): RAW_ARTISTS, SPOTIFY_IDS, ARTIST_PHOTOS, categorías y
// las constantes del cálculo. Los números se calculan en el navegador con datos/ranking.json (la copia del
// ranking que actualiza GitHub Actions); los del HTML son de cuando se generó, solo para la primera pintura.
// El botón "Calificar a X" abre el formulario de voto de siempre: /?calificar=<slug> (con los UTM de la visita).
// No editar a mano las páginas generadas.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { RAIZ, slugify, esc, medicion } = require('../../noticias/fuente/comun');

const SITIO = 'https://www.rapscoremx.com';
const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');

// ── Leer datos de index.html ────────────────────────────────────
function bloque(inicio, cierre) {
  const i = html.indexOf(inicio);
  if (i < 0) throw new Error('No encontré "' + inicio + '" en index.html');
  const j = html.indexOf(cierre, i);
  return html.slice(i + inicio.length - 1, j + cierre.length - 1);   // desde [ o { hasta ] o }
}
const leer = (inicio, cierre) => vm.runInNewContext('(' + bloque(inicio, cierre) + ')');
const RAW = leer('const RAW_ARTISTS = [', '\n];');
const SPOTIFY = leer('const SPOTIFY_IDS = {', '\n};');
const FOTOS = leer('const ARTIST_PHOTOS = {', '\n};');
const CATS = vm.runInNewContext(bloque('const CATEGORIES = [', '];'));
const LABELS = vm.runInNewContext('(' + bloque('const CAT_LABELS = {', '};') + ')');
const num = (re, def) => { const m = html.match(re); return m ? Number(m[1]) : def; };
const K = num(/const COMMUNITY_WEIGHT_K = (\d+)/, 2);
const BASE = num(/const BASE_SCORE = (\d+)/, 65);
const FIRME = num(/const MIN_VOTES_FIRM = (\d+)/, 5);

const ARTISTAS = RAW.map((a, i) => ({ ...a, order: i, slug: slugify(a.name) }));
let ranking = { stats: {} };
try { ranking = JSON.parse(fs.readFileSync(path.join(RAIZ, 'datos', 'ranking.json'), 'utf8')); } catch (e) { console.warn('Sin datos/ranking.json: las fichas arrancan sin números.'); }

// ── Mismo cálculo que index.html (blendScores + rankCmp) ────────
const CALC = `
var CATS=${JSON.stringify(CATS)},K=${K},BASE=${BASE},FIRME=${FIRME};
function rsPrior(stats){var s=0,n=0;for(var k in stats){var st=stats[k];if(!st||!st.count)continue;CATS.forEach(function(c){s+=(st.sum&&st.sum[c])||0;});n+=st.count*CATS.length;}return n?s/n:BASE;}
function rsBlend(st,prior){var n=st&&st.count>0?st.count:0,ex={},sc={},cm={};CATS.forEach(function(c){cm[c]=n?((st.sum&&st.sum[c])||0)/n:0;ex[c]=(K*prior+n*cm[c])/(K+n);sc[c]=Math.round(ex[c]);});var mean=CATS.reduce(function(s,c){return s+ex[c];},0)/CATS.length;return{n:n,scores:sc,total:Math.round(mean*10)/10,comm:n?Math.round(CATS.reduce(function(s,c){return s+cm[c];},0)/CATS.length*10)/10:null};}
function rsTier(v){return v>=FIRME?2:v>0?1:0;}
function rsRank(orden,stats){var prior=rsPrior(stats);var l=orden.map(function(slug,i){var b=rsBlend(stats[slug],prior);return{slug:slug,order:i,votes:b.n,total:b.total,b:b};});l.sort(function(a,b){return(rsTier(b.votes)-rsTier(a.votes))||(b.total-a.total)||(b.votes-a.votes)||(a.order-b.order);});return l;}
`;
const calc = vm.runInNewContext(CALC + ';({rsRank:rsRank})');
const ORDEN = ARTISTAS.map(a => a.slug);
const RANK = calc.rsRank(ORDEN, ranking.stats || {});
const POS = Object.fromEntries(RANK.map((x, i) => [x.slug, { pos: i + 1, ...x }]));

// ── Piezas ─────────────────────────────────────────────────────
const fmt = t => (Number(t) / 10).toFixed(1);
const initials = n => n.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
const TIER = { legend: 'Leyenda', emerging: 'Emergente', active: '' };
const LINEA = { legend: '#ffcc00', emerging: '#00e676', active: '#ff3c00' };
function metaTexto(votes) {
  if (!votes) return 'Nadie lo ha calificado todavía: deja la primera calificación.';
  if (votes < FIRME) return `Lleva ${votes} de ${FIRME} calificaciones para salir de provisional.`;
  return `Posición firme · ${votes} calificaciones de la comunidad.`;
}
function lugarDe(a) { return [a.tags && a.tags[0], a.estado].filter(Boolean).filter((v, i, l) => l.indexOf(v) === i).join(' · '); }

const CSS = `
:root{--bg:#0a0a0a;--surface:#111;--border:#2a2a2a;--accent:#ff3c00;--accent2:#ffcc00;--text:#f0ede6;--muted:#9a948a;--body:#d6d0c6}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{overflow-x:clip}
body{background:var(--bg);color:var(--text);font-family:'Barlow',system-ui,-apple-system,'Segoe UI',sans-serif;font-size:17px;min-height:100vh}
a{color:var(--accent)}
header{display:flex;align-items:center;gap:18px;flex-wrap:wrap;padding:12px 20px;border-bottom:1px solid var(--border);background:rgba(10,10,10,.96);position:sticky;top:0;z-index:10}
.logo-img img{height:34px;width:auto;display:block}
nav{display:flex;gap:16px;flex-wrap:wrap;font-family:'Space Mono',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase}
nav a{color:var(--muted);text-decoration:none}
nav a.nav-votar{color:var(--accent2)}
main{max-width:880px;margin:0 auto;padding:18px 18px 40px}
.migas{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);margin-bottom:14px}
.migas a{color:var(--muted)}
.top{display:grid;grid-template-columns:120px 1fr;gap:18px;align-items:center}
.av{width:120px;height:120px;background:#161616;position:relative;overflow:hidden;border:1px solid var(--border)}
.av img{width:100%;height:100%;object-fit:cover;display:block}
.av .ini{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:54px;letter-spacing:1px;color:var(--text)}
.av .linea{position:absolute;left:34%;right:34%;bottom:14px;height:4px}
h1{font-family:'Bebas Neue',sans-serif;font-weight:400;font-size:46px;line-height:.95;letter-spacing:1px}
.badge{display:inline-block;margin-top:8px;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:1px;text-transform:uppercase;padding:2px 8px;border:1px solid currentColor}
.badge.legend{color:#ffcc00}.badge.emerging{color:#00e676}
.lugar{color:var(--muted);font-size:16px;margin-top:6px}
.marcador{display:flex;align-items:flex-end;gap:22px;flex-wrap:wrap;margin:20px 0 6px}
.score{font-family:'Bebas Neue',sans-serif;font-size:72px;line-height:.85;color:var(--accent2)}
.score small{font-size:24px;color:var(--muted)}
.dato{font-family:'Space Mono',monospace;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--muted);line-height:1.7}
.dato b{color:var(--text);font-weight:700}
.meta{font-size:16px;color:#cfc9bf;margin:8px 0 16px;padding-left:10px;border-left:3px solid var(--accent2)}
.meta-bar{height:6px;background:#222;margin:-6px 0 18px;max-width:320px}
.meta-bar i{display:block;height:100%;background:var(--accent2)}
.cta{display:flex;align-items:center;justify-content:center;width:100%;max-width:420px;min-height:56px;background:var(--accent2);color:#0a0a0a;text-decoration:none;font-family:'Space Mono',monospace;font-weight:700;font-size:14px;letter-spacing:1px;text-transform:uppercase}
.cta:hover{filter:brightness(1.08);color:#0a0a0a}
.cta-sub{font-size:14px;color:var(--muted);margin-top:8px}
.compartir{margin-top:12px;background:none;border:1px solid #3a3a3a;color:var(--text);min-height:44px;padding:0 16px;font-family:'Space Mono',monospace;font-size:12px;letter-spacing:1px;text-transform:uppercase;cursor:pointer}
section{margin-top:34px}
h2{font-family:'Bebas Neue',sans-serif;font-weight:400;font-size:28px;letter-spacing:1px;margin-bottom:12px}
.cats{display:grid;grid-template-columns:1fr 1fr;gap:12px 28px}
.cat{display:grid;grid-template-columns:1fr auto;gap:4px 10px;align-items:center;font-family:'Space Mono',monospace;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:var(--muted)}
.cat b{color:var(--text);font-size:14px}
.cat .bar{grid-column:1/-1;height:4px;background:#222}
.cat .bar i{display:block;height:100%;background:var(--accent)}
.nota{font-size:14px;color:var(--muted);margin-top:12px;line-height:1.5}
.bio{font-size:17px;line-height:1.6;color:var(--body)}
.credito{font-size:13px;color:var(--muted);margin-top:8px}
.credito a{color:var(--muted)}
.escucha{display:flex;gap:10px;flex-wrap:wrap}
.escucha a,.escucha button{display:inline-flex;align-items:center;min-height:44px;padding:0 16px;border:1px solid #3a3a3a;background:#111;color:var(--text);text-decoration:none;font-family:'Space Mono',monospace;font-size:12px;letter-spacing:1px;cursor:pointer}
.escucha .play{background:#1db954;border-color:#1db954;color:#0a0a0a;font-weight:700}
.sp-player{margin-top:12px}
.mas{display:flex;flex-wrap:wrap;gap:8px}
.mas a{padding:8px 12px;border:1px solid var(--border);color:var(--text);text-decoration:none;font-size:15px}
.mas a:hover{border-color:var(--accent)}
.lista{columns:2;column-gap:28px}
.lista h3{font-family:'Space Mono',monospace;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:var(--accent2);margin:14px 0 6px;break-after:avoid}
.lista a{display:block;color:var(--text);text-decoration:none;padding:3px 0;font-size:16px}
.lista a:hover{color:var(--accent)}
footer{border-top:1px solid var(--border);padding:22px 20px;text-align:center;font-size:13px;color:var(--muted)}
footer a{color:var(--muted)}
@media(max-width:600px){header{padding:10px 14px;gap:10px}nav{gap:10px;font-size:10px}main{padding:14px 16px 32px}.top{grid-template-columns:88px 1fr;gap:14px}.av{width:88px;height:88px}.av .ini{font-size:40px}.av .linea{bottom:10px}h1{font-size:38px}.score{font-size:60px}.cats{grid-template-columns:1fr}.lista{columns:1}}
`;

function head({ titulo, descripcion, canonical, imagen, raiz, ld }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#0a0a0a">
<meta property="og:type" content="profile">
<meta property="og:site_name" content="RapScore MX">
<meta property="og:locale" content="es_MX">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${imagen}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(descripcion)}">
<meta name="twitter:image" content="${imagen}">
<link rel="icon" type="image/png" href="${raiz}images/rs-favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&family=Barlow:wght@400;700&display=swap" rel="stylesheet">
<script type="application/ld+json">
${JSON.stringify(ld).replace(/</g, '\\u003c')}
</script>
<style>${CSS}</style>
${medicion('artista')}
</head>
<body>
<header>
  <a href="${raiz}index.html" class="logo-img"><img src="${raiz}images/rapscore-logo-transparente.png" alt="RapScore MX, inicio" width="1200" height="337"></a>
  <nav aria-label="Principal">
    <a href="${raiz}index.html">Rankings</a>
    <a href="${raiz}index.html#votar" class="nav-votar">Votar</a>
    <a href="${raiz}index.html#estados">Por Estado</a>
    <a href="${raiz}index.html#letras">Letras</a>
    <a href="${raiz}index.html#freestyle">Freestyle</a>
    <a href="${raiz}batalla/">Batalla</a>
    <a href="${raiz}noticias/">Noticias</a>
  </nav>
</header>
`;
}
const pie = raiz => `<footer>© ${new Date().getFullYear()} RapScore MX · El ranking del rap mexicano lo decide la comunidad · <a href="${raiz}artista/">Todos los raperos</a> · <a href="${raiz}privacidad.html">Aviso de privacidad</a></footer>
</body>
</html>
`;

function avatar(a, raiz) {
  const f = FOTOS[a.slug];
  if (f) return `<div class="av"><img src="${raiz}images/artistas/${a.slug}.jpg" alt="Foto de ${esc(a.name)}" width="240" height="240" style="object-position:${esc(f.pos)}"></div>`;
  return `<div class="av" aria-hidden="true"><span class="ini">${esc(initials(a.name))}</span><span class="linea" style="background:${LINEA[a.tier] || LINEA.active}"></span></div>`;
}

function escucha(a) {
  const yt = a.youtube || 'https://www.youtube.com/results?search_query=' + encodeURIComponent(a.name + ' rap');
  const sp = SPOTIFY[a.slug] ? 'https://open.spotify.com/artist/' + SPOTIFY[a.slug] : 'https://open.spotify.com/search/' + encodeURIComponent(a.name);
  return `<div class="escucha">
      <a href="${esc(yt)}" target="_blank" rel="noopener" data-listen="youtube">▶ YouTube</a>
      <a href="${esc(sp)}" target="_blank" rel="noopener" data-listen="spotify">Spotify ↗</a>
      ${SPOTIFY[a.slug] ? `<button type="button" class="play" data-sp="${SPOTIFY[a.slug]}">▶ Escuchar aquí</button>` : ''}
    </div>`;
}

function paginaArtista(a) {
  const raiz = '../../';
  const p = POS[a.slug], votes = p.votes, b = p.b;
  const canonical = `${SITIO}/artista/${a.slug}/`;
  const lugar = lugarDe(a);
  const estilo = (a.tags || []).slice(1).join(', ');
  const titulo = `${a.name}: calificación de la comunidad | RapScore MX`;
  const descripcion = `${a.name}${lugar ? ', rap de ' + lugar : ''}. ¿Cuánto le das del 1 al 10? Califícalo en flow, lírica, contenido, versatilidad, hooks e impacto en el ranking del rap mexicano que deciden los fans.`;
  const sameAs = [a.youtube, SPOTIFY[a.slug] && 'https://open.spotify.com/artist/' + SPOTIFY[a.slug]].filter(Boolean);
  const ld = {
    '@context': 'https://schema.org', '@type': 'ProfilePage', url: canonical, name: titulo,
    mainEntity: { '@type': 'MusicGroup', name: a.name, description: a.bio, genre: (a.tags || []).slice(1), ...(sameAs.length ? { sameAs } : {}), ...(a.estado ? { foundingLocation: { '@type': 'Place', name: lugar } } : {}) },
    breadcrumb: { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ranking', item: SITIO + '/' },
      { '@type': 'ListItem', position: 2, name: 'Raperos', item: SITIO + '/artista/' },
      { '@type': 'ListItem', position: 3, name: a.name, item: canonical } ] }
  };
  const vecinos = ARTISTAS.filter(x => x.slug !== a.slug && a.estado && x.estado === a.estado).slice(0, 12);
  const f = FOTOS[a.slug];
  const scoreHtml = votes ? `${fmt(b.total)}<small> / 10</small>` : '—';
  const pct = Math.min(100, Math.round(votes / FIRME * 100));
  return head({ titulo, descripcion, canonical, imagen: `${SITIO}/artista/${a.slug}/og.jpg`, raiz, ld }) + `<main>
  <p class="migas"><a href="${raiz}index.html">Ranking</a> › <a href="${raiz}artista/">Raperos</a>${a.estado ? ` › ${esc(a.estado)}` : ''}</p>
  <div class="top">
    ${avatar(a, raiz)}
    <div>
      <h1>${esc(a.name)}</h1>
      ${TIER[a.tier] ? `<span class="badge ${a.tier}">${TIER[a.tier]}</span>` : ''}
      ${lugar ? `<p class="lugar">${esc(lugar)}${estilo ? ' · ' + esc(estilo) : ''}</p>` : ''}
    </div>
  </div>
  <div class="marcador">
    <div class="score" id="aScore">${scoreHtml}</div>
    <div class="dato"><span id="aVotos">${votes ? `<b>${votes}</b> calificación${votes === 1 ? '' : 'es'}` : '<b>Sin calificar</b>'}</span><br><span id="aPos">${votes ? `Lugar <b>#${p.pos}</b> de ${ARTISTAS.length}${votes < FIRME ? ' · provisional' : ''}` : `${ARTISTAS.length} raperos en el ranking`}</span></div>
  </div>
  <p class="meta" id="aMeta">${metaTexto(votes)}</p>
  <div class="meta-bar" id="aMetaBar"${votes >= FIRME ? ' hidden' : ''}><i style="width:${pct}%"></i></div>
  <a class="cta" id="aCta" href="${raiz}index.html?calificar=${a.slug}" data-track="ficha_pagina_calificar">Calificar a ${esc(a.name)}</a>
  <p class="cta-sub">Seis categorías del 1 al 10. Toma menos de un minuto.</p>
  <button type="button" class="compartir" id="aShare">Compartir a ${esc(a.name)}</button>
  <section>
    <h2>Calificación por categoría</h2>
    <div class="cats" id="aCats">${CATS.map(c => `<div class="cat"><span>${esc(LABELS[c])}</span><b>${votes ? fmt(b.scores[c]) : '—'}</b><div class="bar"><i style="width:${votes ? b.scores[c] : 0}%"></i></div></div>`).join('')}</div>
    <p class="nota">Con pocos votos el número se acerca al promedio de todo el sitio, para que una sola persona no lo mande al #1. Con menos de ${FIRME} calificaciones su lugar es provisional. <span id="aFuente"></span></p>
  </section>
  <section>
    <h2>Escúchalo</h2>
    ${escucha(a)}
  </section>
  <section>
    <h2>Quién es</h2>
    <p class="bio">${esc(a.bio)}</p>
    ${f ? `<p class="credito">Foto: <a href="${esc(f.page)}" target="_blank" rel="noopener">${esc(f.autor)}</a> · <a href="${esc(f.licUrl)}" target="_blank" rel="noopener">${esc(f.lic)}</a> · Wikimedia Commons</p>` : ''}
  </section>
  ${vecinos.length ? `<section>
    <h2>Más rap de ${esc(a.estado)}</h2>
    <div class="mas">${vecinos.map(x => `<a href="${raiz}artista/${x.slug}/">${esc(x.name)}</a>`).join('')}</div>
  </section>` : ''}
</main>
<script>
(function(){
${CALC}
var SLUG=${JSON.stringify(a.slug)},NAME=${JSON.stringify(a.name)},ORDEN=${JSON.stringify(ORDEN)},LABELS=${JSON.stringify(LABELS)};
var $=function(id){return document.getElementById(id);};
function fmt(t){return (Number(t)/10).toFixed(1);}
function meta(v){return !v?'Nadie lo ha calificado todavía: deja la primera calificación.':v<FIRME?'Lleva '+v+' de '+FIRME+' calificaciones para salir de provisional.':'Posición firme · '+v+' calificaciones de la comunidad.';}
// Sin UTM en el link interno (GA4 ya guardó la fuente de la visita al llegar a la ficha); el clic se mide con data-track.
window.rsTrack&&rsTrack('view_artist',{artist_slug:SLUG,artist_name:NAME,page:'ficha'});
fetch('../../datos/ranking.json',{cache:'no-cache'}).then(function(r){return r.ok?r.json():null;}).then(function(d){
  if(!d||!d.stats)return;
  var l=rsRank(ORDEN,d.stats),i=-1;l.forEach(function(x,k){if(x.slug===SLUG)i=k;});if(i<0)return;
  var x=l[i],v=x.votes,b=x.b;
  $('aScore').innerHTML=v?fmt(b.total)+'<small> / 10</small>':'—';
  $('aVotos').innerHTML=v?'<b>'+v+'</b> calificaci'+(v===1?'ón':'ones'):'<b>Sin calificar</b>';
  $('aPos').innerHTML=v?'Lugar <b>#'+(i+1)+'</b> de '+ORDEN.length+(v<FIRME?' · provisional':''):ORDEN.length+' raperos en el ranking';
  $('aMeta').textContent=meta(v);
  var bar=$('aMetaBar');bar.hidden=v>=FIRME;bar.firstChild.style.width=Math.min(100,Math.round(v/FIRME*100))+'%';
  $('aCats').innerHTML=CATS.map(function(c){return '<div class="cat"><span>'+LABELS[c]+'</span><b>'+(v?fmt(b.scores[c]):'—')+'</b><div class="bar"><i style="width:'+(v?b.scores[c]:0)+'%"></i></div></div>';}).join('');
  var m=Math.round((Date.now()-Date.parse(d.revisado))/60000);
  $('aFuente').textContent='Los números se actualizan cada 30 min.';
}).catch(function(){});
document.addEventListener('click',function(e){
  var l=e.target.closest('[data-listen]');if(l&&window.rsTrack)rsTrack('listen_click',{artist_name:NAME,platform:l.getAttribute('data-listen'),page:'ficha'});
  var p=e.target.closest('[data-sp]');
  if(p){var box=document.createElement('div');box.className='sp-player';box.innerHTML='<iframe title="Spotify: '+NAME.replace(/[<>"&]/g,'')+'" src="https://open.spotify.com/embed/artist/'+p.getAttribute('data-sp')+'?theme=0" width="100%" height="152" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>';p.closest('.escucha').after(box);p.remove();window.rsTrack&&rsTrack('listen_click',{artist_name:NAME,platform:'spotify_player',page:'ficha'});}
});
$('aShare').addEventListener('click',function(){
  var url='https://www.rapscoremx.com/artista/'+SLUG+'/?utm_source='+(navigator.share?'share_menu':'whatsapp')+'&utm_medium=share&utm_campaign=ficha_artista';
  var txt='¿Cuánto le das a '+NAME+' del 1 al 10? El ranking del rap mexicano lo deciden los fans 👉';
  window.rsTrack&&rsTrack('share',{method:navigator.share?'native':'whatsapp',content_type:'artista',item_id:SLUG});
  if(navigator.share){navigator.share({title:NAME+' · RapScore MX',text:txt,url:url}).catch(function(){});}
  else{window.open('https://wa.me/?text='+encodeURIComponent(txt+' '+url),'_blank','noopener');}
});
})();
</script>
` + pie(raiz);
}

function paginaLista() {
  const raiz = '../';
  const canonical = `${SITIO}/artista/`;
  const titulo = 'Raperos mexicanos por estado: todos los del ranking | RapScore MX';
  const descripcion = `Los ${ARTISTAS.length} raperos mexicanos del ranking de RapScore MX, por estado. Entra a su ficha, escúchalos y califícalos del 1 al 10.`;
  const grupos = {};
  ARTISTAS.forEach(a => { const k = a.estado || 'Origen por confirmar'; (grupos[k] = grupos[k] || []).push(a); });
  const claves = Object.keys(grupos).sort((x, y) => (x === 'Origen por confirmar') - (y === 'Origen por confirmar') || x.localeCompare(y, 'es'));
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: titulo, url: canonical };
  return head({ titulo, descripcion, canonical, imagen: `${SITIO}/images/og-rapscore.jpg`, raiz, ld }) + `<main>
  <p class="migas"><a href="${raiz}index.html">Ranking</a> › Raperos</p>
  <h1>Raperos del ranking</h1>
  <p class="lugar" style="margin-bottom:10px">${ARTISTAS.length} raperos de ${claves.filter(k => k !== 'Origen por confirmar').length} estados. Entra a su ficha para escucharlo y calificarlo.</p>
  <div class="lista">${claves.map(k => `<h3>${esc(k)}</h3>${grupos[k].sort((x, y) => x.name.localeCompare(y.name, 'es')).map(a => `<a href="${raiz}artista/${a.slug}/">${esc(a.name)}</a>`).join('')}`).join('')}</div>
</main>
` + pie(raiz);
}

// ── Escribir ────────────────────────────────────────────────────
const DIR = path.join(RAIZ, 'artista');
const vivos = new Set(ARTISTAS.map(a => a.slug));
// Borra fichas de raperos que ya no están en el roster
fs.readdirSync(DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'fuente' && !vivos.has(d.name))
  .forEach(d => { fs.rmSync(path.join(DIR, d.name), { recursive: true }); console.log('Borrada: artista/' + d.name + '/'); });
ARTISTAS.forEach(a => {
  fs.mkdirSync(path.join(DIR, a.slug), { recursive: true });
  fs.writeFileSync(path.join(DIR, a.slug, 'index.html'), paginaArtista(a));
});
fs.writeFileSync(path.join(DIR, 'index.html'), paginaLista());
// Lista para generar las imágenes para redes (og-servidor.py + og.html)
fs.writeFileSync(path.join(__dirname, 'og-datos.json'), JSON.stringify(ARTISTAS.map(a => ({ slug: a.slug, name: a.name, lugar: lugarDe(a), tier: a.tier }))));
const sinOg = ARTISTAS.filter(a => !fs.existsSync(path.join(DIR, a.slug, 'og.jpg'))).length;
console.log(`Fichas: ${ARTISTAS.length} raperos + artista/index.html.${sinOg ? ` Faltan ${sinOg} imágenes para redes: corre python artista/fuente/og-servidor.py` : ''}`);
