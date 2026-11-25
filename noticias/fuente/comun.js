// Funciones compartidas por validar.js y build.js (Node, sin dependencias).
'use strict';
const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..', '..');           // raíz del repo
const DIR_EDICIONES = path.join(__dirname, 'ediciones');     // un JSON por edición

function slugify(t) {                                       // igual que en index.html
  return String(t).toLowerCase().normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function esc(t) {
  return String(t == null ? '' : t).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

// Lee los nombres del ranking directo de RAW_ARTISTS en index.html → { slug: nombre }
function leerRoster() {
  const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
  const ini = html.indexOf('const RAW_ARTISTS = [');
  if (ini < 0) throw new Error('No encontré RAW_ARTISTS en index.html');
  const fin = html.indexOf('\n];', ini);
  const bloque = html.slice(ini, fin);
  const roster = {};
  const re = /\{\s*name:\s*(['"])((?:\\.|(?!\1).)*)\1/g;
  let m;
  while ((m = re.exec(bloque))) {
    const nombre = m[2].replace(/\\(['"])/g, '$1');
    roster[slugify(nombre)] = nombre;
  }
  return roster;
}

function leerEdiciones() {
  if (!fs.existsSync(DIR_EDICIONES)) return [];
  return fs.readdirSync(DIR_EDICIONES)
    .filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .map(f => {
      const ruta = path.join(DIR_EDICIONES, f);
      let datos;
      try { datos = JSON.parse(fs.readFileSync(ruta, 'utf8')); }
      catch (e) { throw new Error(`${f}: JSON inválido (${e.message})`); }
      datos._archivo = f;
      return datos;
    })
    .sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));   // la más nueva primero
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
function fechaLarga(iso) {                                   // "2026-11-01" → "1 de noviembre de 2026"
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}
function rangoSemana(desde, hasta) {                         // "26 de octubre al 1 de noviembre"
  const [, m1, d1] = desde.split('-').map(Number);
  const [, m2, d2] = hasta.split('-').map(Number);
  return m1 === m2 ? `${d1} al ${d2} de ${MESES[m2 - 1]}` : `${d1} de ${MESES[m1 - 1]} al ${d2} de ${MESES[m2 - 1]}`;
}

// Bloque de medición (GA4 vía Firebase + Clarity solo para visitas reales), igual que index.html y batalla.
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

function contarPalabras(t) { return String(t).trim().split(/\s+/).filter(Boolean).length; }

module.exports = { RAIZ, DIR_EDICIONES, slugify, esc, leerRoster, leerEdiciones, fechaLarga, rangoSemana, contarPalabras, medicion };
