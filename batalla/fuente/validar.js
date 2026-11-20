// Uso: node src/validar.js  — revisa cada ficha y cada verso del rival.
const R = require('./rima.js');
const C = require('./content.json');
let errores = 0, avisos = 0;
const err = (id, m) => { errores++; console.log('ERROR ', id, m); };
const warn = (id, m) => { avisos++; console.log('aviso ', id, m); };
const ATONAS = new Set('con en de mi tu su que por sin el la los las un una me te se nos y o a al del mis tus sus pa ni'.split(' '));
const palabras = s => s.toLowerCase().replace(/[^a-záéíóúüñ ]/g, ' ').split(/\s+/).filter(Boolean);
const NOMBRE = { c: 'consonante', a: 'asonante', x: 'no rima' };

function ficha(f) {
  const ref = R.analyze(f.ref);
  const tipos = { c: [], a: [] };
  for (const o of f.ops) {
    const real = R.classify(f.ref, o.w);
    if (real !== o.t) err(f.id, `"${o.w}" marcada ${NOMBRE[o.t]} pero es ${NOMBRE[real]} (${R.analyze(o.w).sound} vs ${ref.sound})`);
    if (o.w.toLowerCase() === f.ref.toLowerCase()) err(f.id, `"${o.w}" es la misma palabra que la referencia`);
    (tipos[o.t] || []).push(o);
  }
  for (const t of ['c', 'a']) {
    if (tipos[t].length !== 2) err(f.id, `debe haber 2 opciones ${NOMBRE[t]}, hay ${tipos[t].length}`);
    const ok = tipos[t].filter(o => o.ok).length;
    if (ok !== 1) err(f.id, `en la pareja ${NOMBRE[t]} debe haber exactamente 1 válida, hay ${ok}`);
  }
  for (const p of palabras(f.pie)) {
    if (ATONAS.has(p)) continue;
    const c = R.classify(f.ref, p);
    if (c !== 'x') err(f.id, `en el pie, "${p}" rima (${NOMBRE[c]}) con la referencia "${f.ref}"`);
  }
  const lens = f.ops.map(o => o.w.length);
  if (Math.max(...lens) - Math.min(...lens) > 4) warn(f.id, `largo de opciones muy distinto: ${f.ops.map(o => o.w).join(', ')}`);
}

function rival(v, id) {
  const real = R.classify(v.ref, v.w);
  if (real !== v.t) err(id, `rival "${v.w}" marcada ${NOMBRE[v.t]} pero es ${NOMBRE[real]}`);
  for (const p of palabras(v.pie)) {
    if (ATONAS.has(p)) continue;
    if (R.classify(v.ref, p) !== 'x') warn(id, `en el pie del rival, "${p}" rima con "${v.ref}"`);
  }
}

C.practica.forEach(ficha);
C.novato.flat().forEach(ficha);
C.medio.flat().forEach(ficha);
C.jefe.flat().forEach(ficha);
C.replica.forEach(ficha);
C.rival.forEach((r, i) => r.forEach((v, j) => rival(v, `R${i + 1}.${j + 1}`)));
C.rivalMedio.forEach((r, i) => r.forEach((v, j) => rival(v, `RM${i + 1}.${j + 1}`)));
C.rivalJefe.forEach((r, i) => r.forEach((v, j) => rival(v, `RJ${i + 1}.${j + 1}`)));
C.rivalReplica.forEach((v, j) => rival(v, `RX.${j + 1}`));
C.rivalReplicaMedio.forEach((v, j) => rival(v, `RXM.${j + 1}`));
C.rivalReplicaJefe.forEach((v, j) => rival(v, `RXJ.${j + 1}`));
// Que ninguna palabra correcta se repita dentro del mismo nivel (si no, el jugador "se la sabe").
for (const [nom, lvl] of [['novato', C.novato], ['medio', C.medio], ['jefe', C.jefe]]) {
  const vistas = new Map();
  lvl.flat().forEach(f => f.ops.forEach(o => { const k = o.w.toLowerCase(); if (vistas.has(k)) warn(f.id, `"${o.w}" ya sale en ${vistas.get(k)} (${nom})`); vistas.set(k, f.id); }));
  if (lvl.length !== 3 || lvl.some(r => r.length !== 4)) err(nom, 'debe tener 3 rondas de 4 fichas');
}

// Casos de prueba del analizador
const casos = [['canción', 'corazón', 'c'], ['calle', 'madre', 'a'], ['camino', 'destino', 'c'], ['vaso', 'bajo', 'a'],
  ['casa', 'caza', 'c'], ['fuego', 'juego', 'c'], ['clásico', 'sábado', 'x'], ['corazón', 'razones', 'x'], ['que', 'fe', 'c'], ['día', 'vida', 'a'], ['bronca', 'concha', 'a'], ['noche', 'coche', 'c']];
for (const [a, b, t] of casos) { const r = R.classify(a, b); if (r !== t) err('TEST', `${a}/${b} esperaba ${t} y dio ${r}`); }

const puntos = l => l.reduce((s, v) => s + (v.ok ? (v.t === 'c' ? 1 : .5) : 0), 0);
console.log('Puntos del rival por ronda:', C.rival.map(puntos), 'réplica:', puntos(C.rivalReplica));
// Medio y Jefe: el 4.º verso de cada ronda es REMATE y vale doble (máximo del jugador: 15).
const conRemate = l => l.reduce((s, v, i) => s + (v.ok ? (v.t === 'c' ? 1 : .5) : 0) * (i === l.length - 1 ? 2 : 1), 0);
for (const [nom, r, rx] of [['medio', C.rivalMedio, C.rivalReplicaMedio], ['jefe', C.rivalJefe, C.rivalReplicaJefe]]) {
  const rondas = r.map(conRemate);
  console.log(`Rival ${nom} por ronda (con remate ×2):`, rondas, 'total', rondas.reduce((a, b) => a + b, 0), 'de 15 · réplica:', puntos(rx));
}
console.log(`\n${errores} errores, ${avisos} avisos`);
process.exit(errores ? 1 : 0);
