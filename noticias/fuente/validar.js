// Revisa las ediciones de Rap News antes de generar las páginas.
// Uso (desde la raíz del repo):  node noticias/fuente/validar.js
// Sale con código 1 si hay ERRORES (no se debe publicar). Los AVISOS son para que la persona que aprueba los revise.
'use strict';
const { slugify, leerRoster, leerEdiciones, contarPalabras } = require('./comun');

const TIPOS = ['lanzamiento', 'gira', 'concierto', 'batalla', 'premio', 'colaboracion', 'video', 'entrevista', 'industria', 'polemica', 'otro'];
// Temas donde un error puede ser difamación o dañar a alguien: exigen 2 fuentes de medios distintos y "delicado": true.
const DELICADO = /\b(muri[óo]|muerte|falleci|fallecimiento|asesin|homicid|detenid|detenci[óo]n|arrest|captur|encarcel|prisi[óo]n|c[áa]rcel|demand[aó]|acusad|acusaci[óo]n|denuncia|vinculad|proceso penal|fiscal[íi]a|sancion|c[áa]rtel(es)? (de (sinaloa|jalisco|golfo)|del |jalisco)|cártel|cjng|narco(?!-?rap)|violencia|agresi[óo]n|abuso|desaparec|hospitaliz|accidente)/i;

const ediciones = leerEdiciones();
const roster = leerRoster();
let errores = 0, avisos = 0;
const err = (ed, msg) => { errores++; console.log(`  ✗ ERROR  [${ed}] ${msg}`); };
const avi = (ed, msg) => { avisos++; console.log(`  ! AVISO  [${ed}] ${msg}`); };

if (!ediciones.length) console.log('No hay ediciones en noticias/fuente/ediciones/.');
const slugsVistos = new Set();
const urlsPorEdicion = new Map();     // url → archivo donde apareció primero (para no repetir noticias)

// Recorre de la más vieja a la más nueva para detectar fuentes repetidas de semanas anteriores.
[...ediciones].reverse().forEach(ed => {
  const f = ed._archivo;
  const fechaArchivo = f.replace('.json', '');
  if (ed.fecha !== fechaArchivo) err(f, `"fecha" (${ed.fecha}) debe ser igual al nombre del archivo (${fechaArchivo}).`);
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(ed.slug || '')) err(f, '"slug" falta o tiene caracteres no válidos (solo a-z, 0-9 y guiones).');
  if (slugsVistos.has(ed.slug)) err(f, `"slug" repetido: ${ed.slug}`);
  slugsVistos.add(ed.slug);
  if (!ed.semana || !/^\d{4}-\d{2}-\d{2}$/.test(ed.semana.desde || '') || !/^\d{4}-\d{2}-\d{2}$/.test(ed.semana.hasta || '')) err(f, '"semana" necesita "desde" y "hasta" con formato AAAA-MM-DD.');
  else if (ed.semana.desde > ed.semana.hasta) err(f, '"semana.desde" es después de "semana.hasta".');

  const tl = (ed.titulo || '').length;
  if (!tl) err(f, 'Falta "titulo".'); else if (tl > 75) avi(f, `"titulo" tiene ${tl} caracteres; Google corta arriba de ~60–70.`);
  const dl = (ed.descripcion || '').length;
  if (!dl) err(f, 'Falta "descripcion".'); else if (dl > 165) err(f, `"descripcion" tiene ${dl} caracteres (máx. 165).`); else if (dl < 90) avi(f, `"descripcion" es corta (${dl}); lo ideal son 120–160.`);
  if (!ed.intro || contarPalabras(ed.intro) > 80) err(f, '"intro" falta o pasa de 80 palabras.');

  const notas = Array.isArray(ed.notas) ? ed.notas : [];
  if (notas.length < 3) err(f, `Solo hay ${notas.length} notas; mínimo 3. Si fue una semana floja, mejor no publicar.`);
  if (notas.length > 8) avi(f, `${notas.length} notas: es mucho para un resumen corto (ideal 4–7).`);

  notas.forEach((n, i) => {
    const id = `${f} · nota ${i + 1}${n.titulo ? ` "${n.titulo.slice(0, 40)}"` : ''}`;
    if (!n.titulo) err(id, 'Falta "titulo".');
    const w = contarPalabras(n.texto || '');
    if (w < 30 || w > 140) err(id, `"texto" tiene ${w} palabras (debe tener 30–140).`);
    if (n.tipo && !TIPOS.includes(n.tipo)) err(id, `"tipo" no válido: ${n.tipo}. Usa: ${TIPOS.join(', ')}.`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(n.fecha || '')) err(id, '"fecha" de la nota falta (AAAA-MM-DD, el día que pasó o se anunció).');
    else if (ed.semana && (n.fecha < ed.semana.desde || n.fecha > ed.semana.hasta)) avi(id, `La fecha ${n.fecha} queda fuera de la semana; confirma que sea noticia nueva.`);

    // Fuentes
    const fuentes = Array.isArray(n.fuentes) ? n.fuentes : [];
    if (!fuentes.length) err(id, 'Sin fuentes. Toda nota necesita al menos un link.');
    const dominios = new Set();
    fuentes.forEach(s => {
      if (!s || !s.nombre || !/^https:\/\/[^\s]+$/.test(s.url || '')) { err(id, `Fuente incompleta o sin https: ${JSON.stringify(s)}`); return; }
      try { dominios.add(new URL(s.url).hostname.replace(/^www\./, '')); } catch (e) { err(id, `URL inválida: ${s.url}`); }
      if (/google\.[a-z.]+\/(search|url)|news\.google|bit\.ly|t\.co\//.test(s.url)) err(id, `Usa el link original del medio, no de un buscador o acortador: ${s.url}`);
      const prev = urlsPorEdicion.get(s.url);
      if (prev && prev !== f) avi(id, `Esta fuente ya salió en ${prev}: ¿noticia repetida?`);
      else urlsPorEdicion.set(s.url, f);
    });

    // Temas delicados
    const textoTodo = `${n.titulo || ''} ${n.texto || ''}`;
    if (DELICADO.test(textoTodo) || n.delicado) {
      if (!n.delicado) err(id, 'Habla de un tema delicado (muerte, arresto, demanda, violencia…): marca "delicado": true.');
      if (dominios.size < 2) err(id, 'Tema delicado: necesita al menos 2 fuentes de medios distintos.');
      avi(id, 'TEMA DELICADO: léela con calma antes de aprobar (que diga solo lo que dicen las fuentes, sin adjetivos).');
    }

    // Citas textuales: máximo una por nota y de menos de 15 palabras (no copiar a los medios ni letras).
    const citas = (n.texto || '').match(/[“"«]([^”"»]+)[”"»]/g) || [];
    if (citas.length > 1) err(id, `Tiene ${citas.length} citas textuales; máximo 1 por nota.`);
    citas.forEach(c => { if (contarPalabras(c) >= 15) err(id, `Cita de ${contarPalabras(c)} palabras (máx. 14): ${c.slice(0, 60)}…`); });

    // Artistas
    const arts = Array.isArray(n.artistas) ? n.artistas : [];
    if (!arts.length) avi(id, 'Sin "artistas": no habrá botón para calificar.');
    arts.forEach(a => {
      if (!roster[slugify(a)]) avi(id, `"${a}" no está en el ranking (no tendrá botón de calificar). ¿Se agrega al roster?`);
    });
  });
});

console.log(`\n${ediciones.length} edición(es) · ${errores} errores · ${avisos} avisos`);
if (errores) { console.log('Corrige los errores antes de generar/publicar.'); process.exit(1); }
