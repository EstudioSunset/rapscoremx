// Desde la raíz del repo:  node batalla/fuente/validar.js && node batalla/fuente/build-sitio.js .
// Escribe batalla/index.html (no editarlo a mano). Las imágenes viven en batalla/img.
const fs = require('fs'), path = require('path');
const d = __dirname, repo = process.argv[2];
if (!repo) { console.error('Falta la ruta del repo'); process.exit(1); }
const out = path.join(repo, 'batalla');
fs.mkdirSync(path.join(out, 'img'), { recursive: true });

const rima = fs.readFileSync(path.join(d, 'rima.js'), 'utf8');
const content = JSON.stringify(JSON.parse(fs.readFileSync(path.join(d, 'content.json'), 'utf8')));
let pag = fs.readFileSync(path.join(d, 'plantilla.html'), 'utf8')
  .replace('/*RIMA*/', () => rima).replace('/*CONTENT*/', () => content)
  .replace(/^\s*window\.__bpm.*$/m, '');
const corte = pag.indexOf('<div class="app"');
let cabeza = pag.slice(0, corte), cuerpo = pag.slice(corte);
cabeza = cabeza.replace(/<title>[^<]*<\/title>\n?/, '').replace(/<meta name="claude:[^>]*>\n?/, '');

const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Batalla de Freestyle · RapScore MX</title>
<meta name="description" content="Completa el verso con la rima que tiene sentido antes de que se acabe el beat. Practica o rétale al rival novato. Versión de prueba de RapScore MX.">
<meta name="theme-color" content="#0a0a0a">
<link rel="canonical" href="https://www.rapscoremx.com/batalla/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="RapScore MX">
<meta property="og:locale" content="es_MX">
<meta property="og:title" content="Batalla de Freestyle: ¿le ganas al rival novato?">
<meta property="og:description" content="Completa el verso con la rima correcta antes de que se acabe el beat. Juego de prueba de RapScore MX.">
<meta property="og:url" content="https://www.rapscoremx.com/batalla/">
<meta property="og:image" content="https://www.rapscoremx.com/batalla/og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Dos raperos de caricatura frente a frente con el título Batalla de Freestyle">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" href="../images/rs-favicon.png">
<style>
:root { padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); box-sizing: border-box; height: 100%; }
body { margin: 0; }
img { max-width: 100%; }
[hidden] { display: none !important; }
</style>
<!-- ═══ MEDICIÓN: igual que index.html (GA4 G-D6QMGC5N67 vía Firebase + Microsoft Clarity) ═══ -->
<script>
window.RS_SITIO = true;
window.RS_CLARITY_ID = 'yvosalsr5z';
(function () {
  try {
    var m = location.search.match(/[?&]rs_internal=([01])/);
    if (m) localStorage.setItem('rs_internal', m[1]);
    window.RS_INTERNAL = localStorage.getItem('rs_internal') === '1';
  } catch (e) { window.RS_INTERNAL = false; }
  if (window.RS_CLARITY_ID) {
    (function (c, l, a, r, i, t, y) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', window.RS_CLARITY_ID);
    clarity('set', 'section', 'batalla');
    if (window.RS_INTERNAL) clarity('set', 'traffic_type', 'internal');
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
</script>
${cabeza.trim()}
</head>
<body>
${cuerpo.trim()}
</body>
</html>
`;
fs.writeFileSync(path.join(out, 'index.html'), html);
const imgSrc = path.resolve(d, '..', 'img'), imgOut = path.resolve(out, 'img');
if (imgSrc !== imgOut) for (const f of fs.readdirSync(imgSrc)) fs.copyFileSync(path.join(imgSrc, f), path.join(imgOut, f));
console.log('batalla/index.html', html.length, 'bytes');
