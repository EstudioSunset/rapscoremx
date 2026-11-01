// Genera las páginas de Rap News a partir de noticias/fuente/ediciones/*.json
// Uso (desde la raíz del repo):  node noticias/fuente/validar.js && node noticias/fuente/build.js
// Escribe (no editarlos a mano):
//   noticias/index.html               lista de ediciones
//   noticias/<slug>/index.html        una página por edición
//   noticias/feed.xml                 RSS
//   sitemap.xml                       mapa del sitio completo (páginas fijas + noticias)
'use strict';
const fs = require('fs');
const path = require('path');
const { RAIZ, slugify, esc, leerRoster, leerEdiciones, fechaLarga, rangoSemana } = require('./comun');

const SITIO = 'https://www.rapscoremx.com';
const OG_IMG = `${SITIO}/images/rapscore-logo.png`;
// Sin UTMs en links internos: en GA4 reinician la sesión y borran la fuente real (Google, Facebook…).
// Los clics se miden con data-track (evento cta_click).
const ETIQUETAS = { lanzamiento: 'Lanzamiento', gira: 'Gira', concierto: 'Concierto', batalla: 'Batallas', premio: 'Premios', colaboracion: 'Colaboración', video: 'Video', entrevista: 'Entrevista', industria: 'Industria', polemica: 'Polémica', otro: 'Escena' };

// Páginas fijas del sitio para sitemap.xml (si creas otra página, agrégala aquí).
const PAGINAS_FIJAS = [
  { loc: '/', lastmod: hoy() },
  { loc: '/noticias/', lastmod: null },          // se llena con la fecha de la edición más nueva
  { loc: '/batalla/', lastmod: '2026-11-01' },
  { loc: '/privacidad.html', lastmod: '2026-10-22' },
];

function hoy() { return new Date().toISOString().slice(0, 10); }

const ediciones = leerEdiciones();
const roster = leerRoster();

// ── Piezas comunes ─────────────────────────────────────────────
function medicion(seccion) {
  // Igual que index.html y batalla: GA4 vía Firebase + Clarity solo para visitas reales.
  return `<!-- ═══ MEDICIÓN: igual que index.html (GA4 G-D6QMGC5N67 vía Firebase + Microsoft Clarity) ═══ -->
<script>
window.RS_SITIO = true;
window.RS_CLARITY_ID = 'yvosalsr5z';
(function () {
  try {
    var m = location.search.match(/[?&]rs_internal=([01])/);
    if (m) localStorage.setItem('rs_internal', m[1]);
    window.RS_INTERNAL = localStorage.getItem('rs_internal') === '1';
  } catch (e) { window.RS_INTERNAL = false; }
  var host = location.hostname;
  window.RS_LOCAL = location.protocol === 'file:' || host === 'localhost' || host === '[::1]' || /^127\\.|^0\\.0\\.0\\.0$|^192\\.168\\.|\\.local$/.test(host);
  window.RS_AUTOMATED = !!navigator.webdriver || /HeadlessChrome|Lighthouse|PageSpeed|bot\\b|crawler|spider|Prerender/i.test(navigator.userAgent || '');
  if (window.RS_LOCAL || window.RS_AUTOMATED) window.RS_INTERNAL = true;
  if (window.RS_CLARITY_ID && !window.RS_INTERNAL) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', window.RS_CLARITY_ID);
    clarity('set', 'section', '${seccion}');
  }
  var queue = [];
  window.rsTrack = function (name, params) {
    params = params || {};
    try { if (window.clarity) window.clarity('event', name); } catch (e) {}
    if (window._rsLog) { try { window._rsLog(name, params); } catch (e) {} }
    else queue.push([name, params]);
  };
  window._rsReady = function (fn) {
    window._rsLog = fn;
    queue.splice(0).forEach(function (e) { try { fn(e[0], e[1]); } catch (x) {} });
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-track]');
    if (el) window.rsTrack('cta_click', { cta: el.getAttribute('data-track'), section: '${seccion}' });
  }, true);
})();
</script>
<script type="module">
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAnalytics, logEvent, setDefaultEventParameters } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";
try {
  const app = initializeApp({
    apiKey: "AIzaSyBhw4QNmzVnto-0nJ4Hm9C2dNy6l_IdtBI",
    authDomain: "rapscoremx.firebaseapp.com",
    projectId: "rapscoremx",
    storageBucket: "rapscoremx.firebasestorage.app",
    messagingSenderId: "971301585434",
    appId: "1:971301585434:web:db4e6b2c2f651087ac87a3",
    measurementId: "G-D6QMGC5N67"
  });
  const analytics = getAnalytics(app);
  if (window.RS_INTERNAL) setDefaultEventParameters({ traffic_type: 'internal' });
  window._rsReady((name, params) => logEvent(analytics, name, params));
} catch (e) {}
</script>`;
}

const CSS = `
:root { --bg:#0a0a0a; --surface:#111; --border:#2a2a2a; --accent:#ff3c00; --accent2:#ffcc00; --text:#f0ede6; --muted:#9a948a; --body:#d6d0c6; }
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { overflow-x: clip; }
body { background: var(--bg); color: var(--text); font-family: 'Barlow', system-ui, -apple-system, 'Segoe UI', sans-serif; font-size: 17px; min-height: 100vh; }
a { color: var(--accent); }
a:hover { color: #ff6a3d; }
a:focus-visible, .btn:focus-visible { outline: 2px solid var(--accent2); outline-offset: 2px; }
header { position: sticky; top: 0; z-index: 10; background: rgba(10,10,10,.95); border-bottom: 1px solid var(--border); padding: 0 24px; min-height: 60px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.logo-img { display: inline-flex; align-items: center; min-height: 44px; }
.logo-img img { height: 38px; width: auto; display: block; }
nav { display: flex; flex-wrap: wrap; }
nav a { color: #8a847b; text-decoration: none; font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 1px; padding: 14px; text-transform: uppercase; min-height: 44px; display: inline-flex; align-items: center; }
nav a:hover, nav a.on { color: var(--text); }
nav a.nav-votar { color: var(--accent2); }
main { max-width: 760px; margin: 0 auto; padding: 48px 20px 72px; }
.kicker { font-family: 'Saira Stencil One', 'Bebas Neue', sans-serif; text-transform: uppercase; letter-spacing: 2px; color: var(--accent); font-size: 17px; display: inline-block; transform: rotate(-2deg); }
h1 { font-family: 'Bebas Neue', sans-serif; font-weight: 400; font-size: clamp(42px, 8.5vw, 72px); line-height: .95; margin: 10px 0 14px; letter-spacing: .5px; }
.meta { font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--muted); line-height: 1.8; }
.lead { margin-top: 22px; font-size: 19px; line-height: 1.65; color: var(--body); }
.toc { margin: 30px 0 8px; border: 1px solid var(--border); background: var(--surface); padding: 18px 20px; }
.toc b { font-family: 'Space Mono', monospace; font-weight: 400; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--muted); }
.toc ol { margin: 10px 0 0 20px; display: grid; gap: 6px; }
.toc a { color: var(--text); text-decoration: none; font-size: 16px; line-height: 1.4; }
.toc a:hover { color: var(--accent); }
.nota { border-top: 1px solid var(--border); padding-top: 30px; margin-top: 34px; scroll-margin-top: 80px; }
.tag { display: inline-block; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #000; background: var(--accent2); padding: 3px 8px; }
.tag.alerta { background: var(--muted); }
.nota h2 { font-family: 'Bebas Neue', sans-serif; font-weight: 400; font-size: clamp(30px, 6vw, 40px); line-height: 1; margin: 12px 0 12px; letter-spacing: .3px; }
.nota p { font-size: 17px; line-height: 1.75; color: var(--body); }
.nota time { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1.5px; color: var(--muted); margin-left: 8px; text-transform: uppercase; }
.acciones { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }
.btn { display: inline-flex; align-items: center; gap: 8px; min-height: 44px; padding: 0 16px; border: 1px solid var(--accent); color: var(--accent); text-decoration: none; font-family: 'Space Mono', monospace; font-size: 12px; letter-spacing: 1px; text-transform: uppercase; }
.btn:hover { background: var(--accent); color: #000; }
.btn.lleno { background: var(--accent2); border-color: var(--accent2); color: #000; font-family: 'Bebas Neue', sans-serif; font-size: 22px; letter-spacing: 1px; padding: 0 24px; min-height: 52px; }
.btn.lleno:hover { background: #ffd93d; }
.fuentes { margin-top: 14px; font-size: 13px; color: var(--muted); line-height: 1.7; }
.fuentes a { color: #c9c2b6; }
.cierre { margin-top: 40px; font-size: 18px; line-height: 1.7; color: var(--body); }
.cta { margin-top: 40px; border: 2px solid var(--accent2); padding: 26px 22px; background: linear-gradient(135deg, rgba(255,204,0,.07), transparent 60%); }
.cta h2 { font-family: 'Bebas Neue', sans-serif; font-weight: 400; font-size: 36px; line-height: 1; margin-bottom: 8px; }
.cta p { color: var(--body); line-height: 1.6; margin-bottom: 18px; font-size: 16px; }
.mas { margin-top: 48px; }
.mas h2, .lista h2 { font-family: 'Bebas Neue', sans-serif; font-weight: 400; font-size: 30px; margin-bottom: 12px; }
.card { display: block; border: 1px solid var(--border); background: var(--surface); padding: 18px 20px; text-decoration: none; color: var(--text); margin-top: 12px; }
.card:hover { border-color: var(--accent); color: var(--text); }
.card .meta { font-size: 10px; }
.card h3 { font-family: 'Bebas Neue', sans-serif; font-weight: 400; font-size: 28px; line-height: 1.05; margin: 6px 0 6px; }
.card p { font-size: 15px; line-height: 1.6; color: var(--body); }
.nota-ia { margin-top: 44px; font-size: 13px; line-height: 1.7; color: var(--muted); border-left: 3px solid var(--border); padding-left: 14px; }
.vacio { margin-top: 30px; color: var(--body); line-height: 1.7; }
footer { border-top: 1px solid var(--border); padding: 24px; text-align: center; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1px; color: var(--muted); line-height: 1.8; }
footer a { color: var(--muted); }
@media (max-width: 600px) { header { position: static; padding: 0 12px; } .logo-img img { height: 30px; } header nav { flex-wrap: nowrap; overflow-x: auto; width: 100%; scrollbar-width: none; } header nav::-webkit-scrollbar { display: none; } nav a { padding: 10px 8px; white-space: nowrap; } main { padding-top: 32px; } }
`;

function head({ titulo, descripcion, canonical, raiz, ogType, extraLd, seccion }) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(descripcion)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" type="application/rss+xml" title="Rap News · RapScore MX" href="${SITIO}/noticias/feed.xml">
<meta property="og:type" content="${ogType}">
<meta property="og:site_name" content="RapScore MX">
<meta property="og:locale" content="es_MX">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(descripcion)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${OG_IMG}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="${raiz}images/rs-favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Saira+Stencil+One&family=Space+Mono:wght@400;700&family=Barlow:wght@400;500;600;700&display=swap" rel="stylesheet">
${extraLd ? `<script type="application/ld+json">\n${JSON.stringify(extraLd)}\n</script>` : ''}
<style>${CSS}</style>
${medicion(seccion)}
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
    <a href="${raiz}noticias/" class="on" aria-current="page">Noticias</a>
  </nav>
</header>
`;
}

function pie(raiz) {
  return `<footer>© ${new Date().getFullYear()} RapScore MX · El ranking del rap mexicano lo decide la comunidad · <a href="${raiz}noticias/feed.xml">RSS</a> · <a href="${raiz}privacidad.html">Aviso de privacidad</a></footer>
</body>
</html>
`;
}

function linkCalificar(raiz, slug) { return `${raiz}index.html?calificar=${slug}#votar`; }

// ── Página de una edición ───────────────────────────────────────
function paginaEdicion(ed, otras) {
  const raiz = '../../';
  const url = `${SITIO}/noticias/${ed.slug}/`;
  const publicada = `${ed.fecha}T09:00:00-06:00`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'NewsArticle',
    headline: ed.titulo, description: ed.descripcion, inLanguage: 'es-MX',
    datePublished: publicada, dateModified: ed.actualizado ? `${ed.actualizado}T09:00:00-06:00` : publicada,
    mainEntityOfPage: url, image: [OG_IMG],
    author: { '@type': 'Organization', name: 'Redacción RapScore MX', url: SITIO + '/' },
    publisher: { '@type': 'Organization', name: 'RapScore MX', logo: { '@type': 'ImageObject', url: `${SITIO}/images/rapscore-logo-transparente.png` } },
    about: [...new Set(ed.notas.flatMap(n => n.artistas || []))].slice(0, 20).map(a => ({ '@type': 'MusicGroup', name: a })),
  };

  const toc = ed.notas.map((n, i) => `<li><a href="#n${i + 1}">${esc(n.titulo)}</a></li>`).join('');
  const notas = ed.notas.map((n, i) => {
    const enRanking = (n.artistas || []).map(a => ({ a, slug: slugify(a) })).filter(x => roster[x.slug]);
    const botones = enRanking.map(x => `<a class="btn" href="${linkCalificar(raiz, x.slug)}" data-track="noticia_calificar_${x.slug}">★ Califica a ${esc(roster[x.slug])}</a>`).join('');
    const fuentes = (n.fuentes || []).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.nombre)}</a>`).join(' · ');
    return `
  <article class="nota" id="n${i + 1}">
    <span class="tag${n.delicado ? ' alerta' : ''}">${esc(ETIQUETAS[n.tipo] || 'Escena')}</span><time datetime="${n.fecha}">${esc(fechaLarga(n.fecha))}</time>
    <h2>${esc(n.titulo)}</h2>
    <p>${esc(n.texto)}</p>
    ${botones ? `<div class="acciones">${botones}</div>` : ''}
    <p class="fuentes">Fuente${(n.fuentes || []).length > 1 ? 's' : ''}: ${fuentes}</p>
  </article>`;
  }).join('');

  const mas = otras.slice(0, 4).map(o => tarjeta(o, raiz)).join('');

  return head({
    titulo: `${ed.titulo} | RapScore MX`, descripcion: ed.descripcion, canonical: url, raiz, ogType: 'article', extraLd: ld, seccion: 'noticias',
  }) + `
<main>
  <span class="kicker">Rap News</span>
  <h1>${esc(ed.titulo)}</h1>
  <p class="meta">Semana del ${esc(rangoSemana(ed.semana.desde, ed.semana.hasta))} · Publicado el ${esc(fechaLarga(ed.fecha))} · Redacción RapScore MX</p>
  <p class="lead">${esc(ed.intro)}</p>
  <nav class="toc" aria-label="En esta edición"><b>En esta edición</b><ol>${toc}</ol></nav>
  ${notas}
  ${ed.cierre ? `<p class="cierre">${esc(ed.cierre)}</p>` : ''}
  <section class="cta">
    <h2>¿Y tú a quién le das el 10?</h2>
    <p>En RapScore el ranking del rap mexicano lo deciden los fans. Califica a tus raperos en flow, lírica, contenido, versatilidad, hooks e impacto.</p>
    <a class="btn lleno" href="${raiz}index.html#votar" data-track="noticia_cta_votar">Calificar raperos →</a>
  </section>
  ${mas ? `<section class="mas"><h2>Ediciones anteriores</h2>${mas}<p class="fuentes"><a href="${raiz}noticias/">Ver todas las ediciones →</a></p></section>` : ''}
  <p class="nota-ia">Este resumen se escribe con ayuda de inteligencia artificial a partir de las fuentes enlazadas en cada nota, y una persona de RapScore MX lo revisa antes de publicarlo. ¿Ves un error o falta una noticia? Escríbenos en <a href="https://www.facebook.com/rapscoremx" target="_blank" rel="noopener">Facebook</a>.</p>
</main>
` + pie(raiz);
}

function tarjeta(ed, raiz) {
  const arts = [...new Set(ed.notas.flatMap(n => n.artistas || []))].slice(0, 5);
  return `<a class="card" href="${raiz}noticias/${ed.slug}/">
    <span class="meta">${esc(rangoSemana(ed.semana.desde, ed.semana.hasta))} · ${ed.notas.length} notas</span>
    <h3>${esc(ed.titulo)}</h3>
    <p>${esc(ed.descripcion)}</p>
    ${arts.length ? `<span class="meta">${esc(arts.join(' · '))}</span>` : ''}
  </a>`;
}

// ── Lista de ediciones ──────────────────────────────────────────
function paginaLista() {
  const raiz = '../';
  const url = `${SITIO}/noticias/`;
  const ld = {
    '@context': 'https://schema.org', '@type': 'CollectionPage', name: 'Rap News · RapScore MX', url, inLanguage: 'es-MX',
    hasPart: ediciones.slice(0, 20).map(ed => ({ '@type': 'NewsArticle', headline: ed.titulo, url: `${SITIO}/noticias/${ed.slug}/`, datePublished: `${ed.fecha}T09:00:00-06:00` })),
  };
  const cards = ediciones.map(ed => tarjeta(ed, raiz)).join('');
  return head({
    titulo: 'Rap News: noticias del rap mexicano cada semana | RapScore MX',
    descripcion: 'Lanzamientos, giras, batallas y lo más importante del rap mexicano, resumido cada semana con sus fuentes. Lee y califica a tus raperos en RapScore MX.',
    canonical: url, raiz, ogType: 'website', extraLd: ld, seccion: 'noticias',
  }) + `
<main>
  <span class="kicker">Cada semana</span>
  <h1>Rap News</h1>
  <p class="lead">Lo que pasó en el rap mexicano esta semana: lanzamientos, giras, batallas y movimientos de la escena, en notas cortas y siempre con la fuente.</p>
  <section class="lista">${cards || '<p class="vacio">La primera edición sale muy pronto.</p>'}</section>
  <section class="cta">
    <h2>El ranking lo decides tú</h2>
    <p>Califica a los raperos mexicanos del 1 al 10 y mueve el ranking.</p>
    <a class="btn lleno" href="${raiz}index.html#votar" data-track="noticias_lista_votar">Calificar raperos →</a>
  </section>
</main>
` + pie(raiz);
}

// ── RSS ─────────────────────────────────────────────────────────
function feed() {
  const items = ediciones.slice(0, 20).map(ed => `
  <item>
    <title>${esc(ed.titulo)}</title>
    <link>${SITIO}/noticias/${ed.slug}/</link>
    <guid isPermaLink="true">${SITIO}/noticias/${ed.slug}/</guid>
    <pubDate>${new Date(`${ed.fecha}T15:00:00Z`).toUTCString()}</pubDate>
    <description>${esc(ed.descripcion)}</description>
  </item>`).join('');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Rap News · RapScore MX</title>
  <link>${SITIO}/noticias/</link>
  <atom:link href="${SITIO}/noticias/feed.xml" rel="self" type="application/rss+xml"/>
  <description>Resumen semanal de noticias del rap mexicano.</description>
  <language>es-mx</language>${items}
</channel>
</rss>
`;
}

// ── Sitemap ─────────────────────────────────────────────────────
function sitemap() {
  const masNueva = ediciones[0] ? (ediciones[0].actualizado || ediciones[0].fecha) : null;
  const urls = PAGINAS_FIJAS.map(p => ({ loc: p.loc, lastmod: p.loc === '/noticias/' ? masNueva : p.lastmod }))
    .filter(p => p.loc !== '/noticias/' || ediciones.length)
    .concat(ediciones.map(ed => ({ loc: `/noticias/${ed.slug}/`, lastmod: ed.actualizado || ed.fecha })));
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u => `  <url><loc>${SITIO}${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
}

// ── Escribir ────────────────────────────────────────────────────
const DIR = path.join(RAIZ, 'noticias');
const escritos = [];
function escribir(rel, contenido) {
  const ruta = path.join(RAIZ, rel);
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, contenido);
  escritos.push(`${rel} (${contenido.length} bytes)`);
}

// Borra carpetas de ediciones que ya no existen en la fuente (p. ej. una que se descartó).
const slugs = new Set(ediciones.map(e => e.slug));
fs.readdirSync(DIR, { withFileTypes: true })
  .filter(d => d.isDirectory() && d.name !== 'fuente' && !slugs.has(d.name) && fs.existsSync(path.join(DIR, d.name, 'index.html')))
  .forEach(d => { fs.rmSync(path.join(DIR, d.name), { recursive: true }); escritos.push(`noticias/${d.name}/ (borrada: ya no está en la fuente)`); });

ediciones.forEach(ed => escribir(`noticias/${ed.slug}/index.html`, paginaEdicion(ed, ediciones.filter(o => o.slug !== ed.slug))));
escribir('noticias/index.html', paginaLista());
escribir('noticias/feed.xml', feed());
escribir('sitemap.xml', sitemap());
console.log(escritos.join('\n'));
