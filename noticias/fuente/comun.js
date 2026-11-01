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

function contarPalabras(t) { return String(t).trim().split(/\s+/).filter(Boolean).length; }

module.exports = { RAIZ, DIR_EDICIONES, slugify, esc, leerRoster, leerEdiciones, fechaLarga, rangoSemana, contarPalabras };
