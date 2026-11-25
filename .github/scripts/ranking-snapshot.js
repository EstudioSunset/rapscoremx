// Copia del ranking para no leer Firestore en cada visita (nov 2026).
// Lee los datos PÚBLICOS (artistStats y propuestas aprobadas) con la llave pública del sitio,
// igual que cualquier navegador, y escribe datos/ranking.json. Lo corre GitHub Actions cada 30 min
// (.github/workflows/ranking-snapshot.yml); también se puede correr a mano: node .github/scripts/ranking-snapshot.js
//
// Solo reescribe el archivo si cambiaron los votos o si la última revisión tiene más de HEARTBEAT_H horas
// (así no hay un commit cada 30 min, y el sitio sabe que la copia sigue al día).
// El sitio (loadCommunity en index.html) usa la copia si tiene menos de 7 h; si no, lee en vivo.
// Solo guarda count + sum por rapero (no `lastVoid` ni fechas, que traen IDs de cuentas).

const fs = require('fs');
const path = require('path');

const KEY = 'AIzaSyBhw4QNmzVnto-0nJ4Hm9C2dNy6l_IdtBI';   // llave pública de Firebase (la misma de index.html)
const BASE = 'https://firestore.googleapis.com/v1/projects/rapscoremx/databases/(default)/documents';
const OUT = path.join(__dirname, '..', '..', 'datos', 'ranking.json');
const HEARTBEAT_H = 6;
const CATS = ['flow', 'lirica', 'contenido', 'versatilidad', 'hooks', 'impacto'];

// Valor tipado de la API REST de Firestore → valor normal
function val(v) {
  if (!v) return null;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('stringValue' in v) return v.stringValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('mapValue' in v) { const o = {}; for (const [k, x] of Object.entries(v.mapValue.fields || {})) o[k] = val(x); return o; }
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(val);
  return null;
}
const idOf = name => name.split('/').pop();

async function get(url, opts) {
  const r = await fetch(url, opts);
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`.slice(0, 300));
  return r.json();
}

async function readStats() {
  const stats = {};
  let token = '';
  do {
    const d = await get(`${BASE}/artistStats?pageSize=300&key=${KEY}${token ? '&pageToken=' + encodeURIComponent(token) : ''}`);
    for (const doc of d.documents || []) {
      const f = val({ mapValue: { fields: doc.fields || {} } });
      const count = Number(f.count) || 0;
      if (!count) continue;
      const sum = {};
      CATS.forEach(c => { sum[c] = Number(f.sum && f.sum[c]) || 0; });
      stats[idOf(doc.name)] = { count, sum };
    }
    token = d.nextPageToken || '';
  } while (token);
  return stats;
}

async function readApprovedProposals() {
  const rows = await get(`${BASE}:runQuery?key=${KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ structuredQuery: {
      from: [{ collectionId: 'proposals' }],
      where: { fieldFilter: { field: { fieldPath: 'status' }, op: 'EQUAL', value: { stringValue: 'approved' } } }
    } })
  });
  return rows.filter(r => r.document).map(r => {
    const p = val({ mapValue: { fields: r.document.fields || {} } });
    return { id: idOf(r.document.name), name: p.name || '', estado: p.estado || '', genre: p.genre || '', link: p.link || '', bio: p.bio || '' };
  }).sort((a, b) => a.id.localeCompare(b.id));
}

function sortKeys(o) { return Object.fromEntries(Object.keys(o).sort().map(k => [k, o[k]])); }

(async () => {
  const [stats, propuestas] = await Promise.all([readStats(), readApprovedProposals()]);
  const data = { stats: sortKeys(stats), propuestas };
  let prev = null;
  try { prev = JSON.parse(fs.readFileSync(OUT, 'utf8')); } catch (e) {}
  const same = prev && JSON.stringify({ stats: prev.stats, propuestas: prev.propuestas }) === JSON.stringify(data);
  const ageH = prev && prev.revisado ? (Date.now() - Date.parse(prev.revisado)) / 3600000 : Infinity;
  const votos = Object.values(stats).reduce((s, x) => s + x.count, 0);
  if (same && ageH < HEARTBEAT_H) {
    console.log(`Sin cambios (${votos} calificaciones, revisado hace ${ageH.toFixed(1)} h).`);
    return;
  }
  const out = { revisado: new Date().toISOString(), ...data };
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(out) + '\n');
  console.log(`${same ? 'Revisión periódica' : 'Votos nuevos'}: ${votos} calificaciones en ${Object.keys(stats).length} raperos, ${propuestas.length} propuestas aprobadas.`);
})().catch(e => { console.error('No se pudo leer Firestore:', e.message); process.exit(1); });
