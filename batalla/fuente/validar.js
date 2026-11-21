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
// Rival: cada ronda es una lista de JUEGOS de 4 versos (la réplica, de 2). En cada batalla sale un juego completo.
for (const [pre, rondas] of [['R', C.rival], ['RM', C.rivalMedio], ['RJ', C.rivalJefe]])
  rondas.forEach((r, i) => r.forEach((juego, g) => juego.forEach((v, j) => rival(v, `${pre}${i + 1}${'abcdefgh'[g]}.${j + 1}`))));
for (const [pre, juegos] of [['RX', C.rivalReplica], ['RXM', C.rivalReplicaMedio], ['RXJ', C.rivalReplicaJefe]])
  juegos.forEach((juego, g) => juego.forEach((v, j) => rival(v, `${pre}${'abcdefgh'[g]}.${j + 1}`)));
// Ids únicos (el juego recuerda qué fichas ya viste por id)
{ const ids = new Set(); [C.practica, C.novato.flat(), C.medio.flat(), C.jefe.flat(), C.replica].flat().forEach(f => { if (ids.has(f.id)) err(f.id, 'id repetido'); ids.add(f.id); }); }
if (C.practica.length < 4) err('practica', 'el banco necesita al menos 4 fichas');
if (C.replica.length < 2) err('replica', 'el banco necesita al menos 2 fichas');
// Que ninguna palabra correcta se repita dentro del mismo nivel (si no, el jugador "se la sabe").
for (const [nom, lvl] of [['novato', C.novato], ['medio', C.medio], ['jefe', C.jefe]]) {
  const vistas = new Map();
  lvl.flat().forEach(f => f.ops.forEach(o => { const k = o.w.toLowerCase(); if (vistas.has(k)) warn(f.id, `"${o.w}" ya sale en ${vistas.get(k)} (${nom})`); vistas.set(k, f.id); }));
  if (lvl.length !== 3 || lvl.some(r => r.length < 4)) err(nom, 'debe tener 3 rondas con al menos 4 fichas cada una (en cada batalla salen 4 al azar)');
}

// Casos de prueba del analizador
const casos = [['canción', 'corazón', 'c'], ['calle', 'madre', 'a'], ['camino', 'destino', 'c'], ['vaso', 'bajo', 'a'],
  ['casa', 'caza', 'c'], ['fuego', 'juego', 'c'], ['clásico', 'sábado', 'x'], ['corazón', 'razones', 'x'], ['que', 'fe', 'c'], ['día', 'vida', 'a'], ['bronca', 'concha', 'a'], ['noche', 'coche', 'c']];
for (const [a, b, t] of casos) { const r = R.classify(a, b); if (r !== t) err('TEST', `${a}/${b} esperaba ${t} y dio ${r}`); }

const puntos = l => l.reduce((s, v) => s + (v.ok ? (v.t === 'c' ? 1 : .5) : 0), 0);
// Medio y Jefe: el 4.º verso de cada ronda es REMATE y vale doble (máximo del jugador: 15).
const conRemate = l => l.reduce((s, v, i) => s + (v.ok ? (v.t === 'c' ? 1 : .5) : 0) * (i === l.length - 1 ? 2 : 1), 0);
// Todos los juegos de una ronda deben dar los mismos puntos, si no el balance cambia según el juego que salga.
const igual = (nom, juegos, fn) => { const p = juegos.map(fn); if (p.some(x => x !== p[0])) err(nom, `los juegos del rival dan puntos distintos: ${p.join(', ')}`); return p[0]; };
const rondasNov = C.rival.map((r, i) => igual(`rival R${i + 1}`, r, puntos));
console.log('Rival novato por ronda:', rondasNov, 'total', rondasNov.reduce((a, b) => a + b, 0), 'de 12 · réplica:', igual('rivalReplica', C.rivalReplica, puntos),
  `· juegos por ronda: ${C.rival.map(r => r.length).join('/')}`);
for (const [nom, r, rx] of [['medio', C.rivalMedio, C.rivalReplicaMedio], ['jefe', C.rivalJefe, C.rivalReplicaJefe]]) {
  const rondas = r.map((j, i) => igual(`rival ${nom} R${i + 1}`, j, conRemate));
  console.log(`Rival ${nom} por ronda (con remate ×2):`, rondas, 'total', rondas.reduce((a, b) => a + b, 0), 'de 15 · réplica:', igual(`réplica ${nom}`, rx, puntos),
    `· juegos por ronda: ${r.map(x => x.length).join('/')}`);
}
const total = C.practica.length + C.replica.length + [C.novato, C.medio, C.jefe].reduce((s, l) => s + l.flat().length, 0);
console.log(`Banco: ${total} fichas del jugador (práctica ${C.practica.length}, novato ${C.novato.map(r => r.length).join('/')}, medio ${C.medio.map(r => r.length).join('/')}, jefe ${C.jefe.map(r => r.length).join('/')}, réplica ${C.replica.length})`);
console.log(`\n${errores} errores, ${avisos} avisos`);
process.exit(errores ? 1 : 0);
