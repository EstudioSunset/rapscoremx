// letras.js — Analizador de rimas y estructura para RapScore MX (fase 1).
// Funciones puras: no tocan el DOM, no guardan nada y no mandan nada a ningún servidor.
// Fonética de español latinoamericano: b=v, ll=y, s=z=c(e,i), k=c(a,o,u)=qu, h muda, x≈ks.
// Pruebas: en la consola del navegador corre  runLetrasTests()   (o en Node:  node letras.js).
//
// FASE 2 (pendiente): figuras retóricas, dobles sentidos, metáforas, etc. Se conectarían en
// analyzeLyrics(), después de calcular `verses` y `families` (ver el comentario "FASE 2" abajo),
// agregando un campo nuevo al resultado (p. ej. result.figuras) sin cambiar lo que ya existe.
(function (root) {
  'use strict';

  const VOWELS = 'aeiouáéíóúü';
  const STRONG = 'aeoáéíóú';          // las débiles con tilde (í, ú) cuentan como fuertes: forman hiato
  const ACCENTED = 'áéíóú';
  const PLAIN = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' };
  const CLUSTERS = new Set(['pl', 'pr', 'bl', 'br', 'fl', 'fr', 'gl', 'gr', 'cl', 'cr', 'dr', 'tr', 'kl', 'kr', 'tl']);
  // Palabras de función: no cuentan como rima interna (sí como rima final si cierran el verso)
  const STOP = new Set(('a al ante con de del desde en entre hacia hasta para pa pal por sin so sobre tras ' +
    'el la lo los las le les un una unos unas y e o u ni que qué si no ya se me te nos os mi mis tu tus su sus ' +
    'es son fue era ha he hay muy más mas pero como cuando donde yo tú tu él ella eso esa ese esto esta este').split(' '));

  const isVowel = c => VOWELS.includes(c);
  const isStrong = c => STRONG.includes(c);
  const plain = s => s.replace(/[áéíóúü]/g, c => PLAIN[c]);

  // Deja solo letras. Devuelve null si trae dígitos (los números no riman) o si no queda nada.
  function cleanWord(raw) {
    const s = String(raw || '').toLowerCase().normalize('NFC');
    if (/\d/.test(s)) return null;
    const w = s.replace(/[^a-záéíóúüñ]/g, '');
    return w || null;
  }

  // Parte la palabra en unidades: vocales sueltas y consonantes (ch, ll, rr, qu y gu mudas van juntas).
  function units(word) {
    const out = [];
    for (let i = 0; i < word.length; i++) {
      const c = word[i], n = word[i + 1], n2 = word[i + 2];
      if ((c === 'c' && n === 'h') || (c === 'l' && n === 'l') || (c === 'r' && n === 'r')) { out.push({ t: c + n, v: false }); i++; continue; }
      if ((c === 'q' || c === 'g') && n === 'u' && n2 && 'eiéí'.includes(n2)) { out.push({ t: c + n, v: false }); i++; continue; }
      if (c === 'y') {
        // "y" suena como vocal al final (hoy, rey) o entre consonantes; si no, es consonante
        const prevV = i > 0 && isVowel(word[i - 1]), nextV = n && isVowel(n);
        if (i === word.length - 1 || (!prevV && !nextV)) { out.push({ t: 'y', v: true, y: true }); continue; }
        out.push({ t: 'y', v: false }); continue;
      }
      out.push({ t: c, v: isVowel(c) });
    }
    return out;
  }

  function splitCluster(cs) {
    // cs: arreglo de consonantes entre dos núcleos → [lo que se queda atrás, lo que pasa a la siguiente sílaba]
    const n = cs.length;
    if (n === 0) return [[], []];
    if (n === 1) return [[], cs];
    const pair = (a, b) => CLUSTERS.has(a + b);
    if (n === 2) return pair(cs[0], cs[1]) ? [[], cs] : [[cs[0]], [cs[1]]];
    const k = pair(cs[n - 2], cs[n - 1]) ? n - 2 : n - 1;
    return [cs.slice(0, k), cs.slice(k)];
  }

  // Separación en sílabas con diptongos, triptongos e hiatos.
  function syllabify(word) {
    const us = units(word);
    // grupos: consonantes y núcleos vocálicos (separando hiatos)
    const nuclei = [];        // [{start, end}] índices en us
    let i = 0;
    while (i < us.length) {
      if (!us[i].v) { i++; continue; }
      let start = i;
      let j = i + 1;
      while (j < us.length && us[j].v) {
        const prev = us[j - 1].t, cur = us[j].t;
        const yPrev = us[j - 1].y;
        if ((isStrong(prev) && isStrong(cur)) && !yPrev) { nuclei.push({ start, end: j - 1 }); start = j; }
        j++;
      }
      nuclei.push({ start, end: j - 1 });
      i = j;
    }
    if (!nuclei.length) return [];
    const sylls = nuclei.map(() => ({ pre: [], nuc: [], post: [] }));
    nuclei.forEach((nu, k) => { for (let x = nu.start; x <= nu.end; x++) sylls[k].nuc.push(us[x]); });
    // consonantes antes del primer núcleo
    for (let x = 0; x < nuclei[0].start; x++) sylls[0].pre.push(us[x].t);
    // entre núcleos
    for (let k = 0; k < nuclei.length - 1; k++) {
      const cs = [];
      for (let x = nuclei[k].end + 1; x < nuclei[k + 1].start; x++) cs.push(us[x].t);
      const [back, fwd] = splitCluster(cs);
      sylls[k].post.push(...back);
      sylls[k + 1].pre.push(...fwd);
    }
    // consonantes al final
    for (let x = nuclei[nuclei.length - 1].end + 1; x < us.length; x++) sylls[sylls.length - 1].post.push(us[x].t);
    return sylls.map(s => {
      const nucText = s.nuc.map(u => u.t).join('');
      return { text: s.pre.join('') + nucText + s.post.join(''), pre: s.pre.join(''), nucleus: nucText, post: s.post.join(''), vowel: mainVowel(nucText) };
    });
  }

  // Vocal que "suena" en el núcleo (la que cuenta para la asonancia): la tildada, si no la fuerte, si no la última.
  function mainVowel(nuc) {
    const n = nuc.replace(/y/g, 'i');
    const acc = [...n].find(c => ACCENTED.includes(c));
    if (acc) return plain(acc);
    const strong = [...n].find(c => 'aeo'.includes(c));
    if (strong) return strong;
    return plain(n[n.length - 1] || '');
  }

  // Sílaba tónica: la tilde manda; sin tilde, llana si termina en vocal, n o s; aguda en los demás casos (incluye "y" final).
  function stressIndex(word, sylls) {
    if (sylls.length <= 1) return 0;
    const acc = sylls.findIndex(s => /[áéíóú]/.test(s.nucleus));
    if (acc >= 0) return acc;
    const last = word[word.length - 1];
    if (last !== 'y' && 'aeiouns'.includes(last)) return sylls.length - 2;
    return sylls.length - 1;
  }

  // Convierte texto escrito a cómo suena (español latinoamericano). Mayúsculas = sonidos de dos letras.
  function phonetize(s) {
    let t = String(s).toLowerCase();
    t = t.replace(/ch/g, 'C').replace(/ll/g, 'Y').replace(/rr/g, 'R');
    t = t.replace(/qu(?=[eiéí])/g, 'k').replace(/gu(?=[eiéí])/g, 'G').replace(/gü/g, 'Gu');
    t = t.replace(/c(?=[eiéí])/g, 's').replace(/c/g, 'k').replace(/z/g, 's').replace(/q/g, 'k');
    t = t.replace(/g(?=[eiéí])/g, 'j').replace(/G/g, 'g');
    t = t.replace(/x/g, 'ks').replace(/v/g, 'b').replace(/w/g, 'u').replace(/h/g, '');
    t = t.replace(/y$/g, 'i').replace(/y(?![aeiouáéíóú])/g, 'i').replace(/y/g, 'Y');
    return plain(t);
  }

  const wordCache = new Map();
  // Analiza una palabra suelta. Devuelve null si no se puede (números, sin vocales, etc.).
  function analyzeWord(raw) {
    const w = cleanWord(raw);
    if (!w) return null;
    if (wordCache.has(w)) return wordCache.get(w);
    const sylls = syllabify(w);
    let res = null;
    if (sylls.length) {
      const st = stressIndex(w, sylls);
      const ss = sylls[st];
      const v = ss.vowel;
      const posInNuc = Math.max(0, [...ss.nucleus.replace(/y/g, 'i')].findIndex(c => plain(c) === v));
      const tailOrth = ss.nucleus.slice(posInNuc) + ss.post + sylls.slice(st + 1).map(s => s.text).join('');
      res = {
        word: w,
        syllables: sylls.map(s => s.text),
        count: sylls.length,
        stress: st,
        type: st === sylls.length - 1 ? 'aguda' : st === sylls.length - 2 ? 'llana' : 'esdrújula',
        vowels: sylls.map(s => s.vowel),
        consKey: phonetize(tailOrth),                       // rima consonante: todo igual desde la vocal tónica
        asKey: sylls.slice(st).map(s => s.vowel).join(''),  // rima asonante: solo vocales desde la tónica
        stop: STOP.has(w),
      };
    }
    wordCache.set(w, res);
    return res;
  }

  // ¿Riman dos palabras? → 'consonante' | 'asonante' | null
  function rhymeType(a, b) {
    const A = typeof a === 'string' ? analyzeWord(a) : a, B = typeof b === 'string' ? analyzeWord(b) : b;
    if (!A || !B) return null;
    if (A.consKey && A.consKey === B.consKey) return 'consonante';
    if (A.asKey && A.asKey === B.asKey) return 'asonante';
    return null;
  }

  const normLine = s => plain(String(s).toLowerCase()).replace(/[^a-zñ\s]/g, ' ').replace(/\s+/g, ' ').trim();
  const letterOf = n => { let s = ''; n++; while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); } return s; };

  // Analiza una letra completa.
  function analyzeLyrics(text, opts) {
    const o = Object.assign({ window: 2, minMulti: 3 }, opts);
    const rawLines = String(text || '').replace(/\r/g, '').split('\n');
    const verses = [];       // incluye líneas en blanco (blank: true) para conservar el formato
    const sections = [];
    let sec = null;
    rawLines.forEach(line => {
      if (!line.trim()) { verses.push({ blank: true, text: '' }); sec = null; return; }
      if (!sec) { sec = { index: sections.length, verses: [] }; sections.push(sec); }
      const tokens = line.split(/(\s+)/).map(raw => {
        if (!raw || /^\s+$/.test(raw)) return { raw, space: true };
        return { raw, a: analyzeWord(raw), fam: -1, multi: false };
      });
      const v = { blank: false, text: line, section: sec.index, tokens, letter: '', endType: 'libre', repeated: false };
      v.syllables = tokens.reduce((s, t) => s + (t.a ? t.a.count : 0), 0);
      v.lastTok = (() => { for (let k = tokens.length - 1; k >= 0; k--) if (tokens[k].a) return k; return -1; })();
      sec.verses.push(verses.length);
      verses.push(v);
    });
    const real = verses.map((v, i) => i).filter(i => !verses[i].blank);

    // 1) Rima final y esquema (las letras se reinician en cada sección)
    sections.forEach(s => {
      const fams = [];   // {asKey, letter, members:[vi]}
      s.verses.forEach(vi => {
        const v = verses[vi];
        const last = v.lastTok >= 0 ? v.tokens[v.lastTok].a : null;
        if (!last) { v.letter = '–'; return; }
        let f = fams.find(f => f.asKey === last.asKey);
        if (!f) { f = { asKey: last.asKey, letter: letterOf(fams.length), members: [] }; fams.push(f); }
        f.members.push(vi);
        v.letter = f.letter;
      });
      fams.forEach(f => {
        if (f.members.length < 2) return;
        f.members.forEach(vi => {
          const me = verses[vi].tokens[verses[vi].lastTok].a;
          const cons = f.members.some(o2 => o2 !== vi && verses[o2].tokens[verses[o2].lastTok].a.consKey === me.consKey);
          verses[vi].endType = cons ? 'consonante' : 'asonante';
        });
      });
      s.scheme = s.verses.map(vi => verses[vi].letter).join('');
    });

    // 2) Familias de rima (finales + internas) con ventana de N versos
    const occ = [];   // {vi, ti, a, end}
    real.forEach(vi => {
      const v = verses[vi];
      v.tokens.forEach((t, ti) => {
        if (!t.a || !t.a.asKey) return;
        const end = ti === v.lastTok;
        if (t.a.stop && !end) return;
        if (t.a.count === 1 && !end && t.a.word.length < 3) return;
        occ.push({ vi, ti, a: t.a, end, pos: real.indexOf(vi) });
      });
    });
    const parent = occ.map((_, i) => i);
    const find = x => { while (parent[x] !== x) { parent[x] = parent[parent[x]]; x = parent[x]; } return x; };
    const unite = (x, y) => { const a = find(x), b = find(y); if (a !== b) parent[Math.max(a, b)] = Math.min(a, b); };
    const pairs = [];
    for (let i = 0; i < occ.length; i++) {
      const A = occ[i];
      for (let j = i + 1; j < occ.length; j++) {
        const B = occ[j];
        if (B.pos - A.pos > o.window) break;
        if (A.a.word === B.a.word) continue;            // repetir la misma palabra no es rima
        let type = null;
        if (A.a.consKey === B.a.consKey) type = 'consonante';
        else if (A.a.asKey === B.a.asKey && A.a.asKey.length >= 2) type = 'asonante';
        if (!type) continue;
        unite(i, j);
        pairs.push({ i, j, type });
      }
    }
    const groups = new Map();
    occ.forEach((x, i) => { const r = find(i); if (!groups.has(r)) groups.set(r, []); groups.get(r).push(i); });
    const families = [];
    [...groups.values()].filter(g => g.length >= 2).sort((a, b) => a[0] - b[0]).forEach(g => {
      const id = families.length;
      g.forEach(i => { verses[occ[i].vi].tokens[occ[i].ti].fam = id; });
      families.push({ id, size: g.length, words: [...new Set(g.map(i => occ[i].a.word))], asKey: occ[g[0]].a.asKey });
    });

    // 3) Rimas multisilábicas: desde cada par que rima, contar hacia atrás sílabas con las mismas vocales
    const streams = new Map();   // vi → [{v, ti}]
    real.forEach(vi => {
      const st = [];
      verses[vi].tokens.forEach((t, ti) => { if (t.a) t.a.vowels.forEach(v => st.push({ v, ti })); });
      streams.set(vi, st);
    });
    const endPos = (vi, ti) => { const st = streams.get(vi); for (let k = st.length - 1; k >= 0; k--) if (st[k].ti === ti) return k; return -1; };
    const multis = [];
    pairs.forEach(p => {
      const A = occ[p.i], B = occ[p.j];
      const sa = streams.get(A.vi), sb = streams.get(B.vi);
      let pa = endPos(A.vi, A.ti), pb = endPos(B.vi, B.ti);
      if (pa < 0 || pb < 0) return;
      let L = 0;
      const wordAt = (vi, ti) => verses[vi].tokens[ti].a.word;
      while (pa - L >= 0 && pb - L >= 0 && L < 12 && sa[pa - L].v === sb[pb - L].v) {
        if (A.vi === B.vi && pa - L <= pb) break;     // en el mismo verso, que no se encimen
        // repetir las mismas palabras ("que nadie me…" / "que nadie me…") es repetición, no rima
        if (wordAt(A.vi, sa[pa - L].ti) === wordAt(B.vi, sb[pb - L].ti)) break;
        L++;
      }
      if (L >= o.minMulti && L > A.a.asKey.length) {
        const span = (st, p0) => [st[p0 - L + 1].ti, st[p0].ti];
        // si los dos tramos comparten la mayoría de sus palabras es una frase repetida (desfasada), no una rima
        const wordsIn = (vi, [f, t2]) => new Set(verses[vi].tokens.slice(f, t2 + 1).filter(x => x.a).map(x => x.a.word));
        const wa = wordsIn(A.vi, span(sa, pa)), wb = wordsIn(B.vi, span(sb, pb));
        const common = [...wa].filter(x => wb.has(x)).length;
        if (common / Math.min(wa.size, wb.size) >= 0.5) return;
        multis.push({ len: L, vowels: sa.slice(pa - L + 1, pa + 1).map(x => x.v).join('-'),
          a: { vi: A.vi, from: span(sa, pa)[0], to: span(sa, pa)[1] }, b: { vi: B.vi, from: span(sb, pb)[0], to: span(sb, pb)[1] },
          fam: verses[A.vi].tokens[A.ti].fam });
      }
    });
    multis.forEach(m => [m.a, m.b].forEach(side => {
      const toks = verses[side.vi].tokens;
      for (let t = side.from; t <= side.to; t++) if (toks[t].a) { toks[t].multi = true; if (toks[t].fam < 0) toks[t].fam = m.fam; }
    }));
    multis.sort((x, y) => y.len - x.len);

    // 4) Estructura: versos repetidos y posibles coros
    const counts = new Map();
    real.forEach(vi => { const k = normLine(verses[vi].text); if (k) counts.set(k, (counts.get(k) || 0) + 1); });
    real.forEach(vi => { verses[vi].repeated = (counts.get(normLine(verses[vi].text)) || 0) >= 2; });
    const secText = sections.map(s => s.verses.map(vi => normLine(verses[vi].text)).join('|'));
    sections.forEach((s, k) => {
      const same = secText.some((t, j) => j !== k && t === secText[k]);
      const rep = s.verses.filter(vi => verses[vi].repeated).length;
      s.chorus = same || (s.verses.length >= 2 && rep / s.verses.length >= 0.5);
    });

    // FASE 2: aquí se conectaría el análisis de figuras retóricas / dobles sentidos (p. ej. result.figuras = ...).

    // 5) Métricas
    let words = 0, rhyming = 0; const distinct = new Set();
    real.forEach(vi => verses[vi].tokens.forEach(t => {
      if (!t.a) return;
      words++; distinct.add(t.a.word);
      if (t.fam >= 0 || t.multi) rhyming++;
    }));
    const top = multis[0];
    const multiText = m => {
      if (!m) return '';
      const part = side => verses[side.vi].tokens.slice(side.from, side.to + 1).filter(t => !t.space).map(t => t.raw).join(' ').replace(/[^\p{L}\s'’-]/gu, '');
      return part(m.a) + ' / ' + part(m.b);
    };
    const metrics = {
      lines: real.length,
      words,
      rhymingWords: rhyming,
      density: words ? rhyming / words : 0,
      families: families.length,
      longestMulti: top ? top.len : 0,
      longestMultiText: multiText(top),
      lexical: words ? distinct.size / words : 0,
      sections: sections.length,
      // pares de versos distintos con rima multisilábica (cada par cuenta una vez)
      multiCount: new Set(multis.map(m => [Math.min(m.a.vi, m.b.vi), Math.max(m.a.vi, m.b.vi)].join('-'))).size,
    };
    Object.assign(metrics, rhymeIndex(metrics));
    return { verses, sections, families, multis, metrics };
  }

  // Índice de rima (0–100): SOLO con lo que se mide de forma objetiva. No mide flow, contenido ni punchlines.
  //   40% densidad de rima (60% de palabras rimando = máximo)
  //   35% rimas multisilábicas (largo de la más larga hasta 8 sílabas + cuántos pares hay, 1 por cada 2 versos = máximo)
  //   25% variedad de vocabulario (75% de palabras distintas = máximo)
  function rhymeIndex(m) {
    const clamp = x => Math.max(0, Math.min(1, x));
    const dens = clamp(m.density / 0.6);
    const multi = clamp(m.longestMulti / 8) * 0.6 + clamp(m.multiCount / Math.max(1, m.lines / 2)) * 0.4;
    const vari = clamp(m.lexical / 0.75);
    return { index: Math.round(100 * (0.4 * dens + 0.35 * multi + 0.25 * vari)), indexParts: { densidad: dens, multisilabicas: multi, variedad: vari } };
  }

  // ─── Pruebas (llámalas desde la consola: runLetrasTests()) ───
  function runLetrasTests() {
    const T = [];
    const t = (name, ok, detail) => T.push({ caso: name, ok: !!ok, detalle: detail === undefined ? '' : String(detail) });
    t('canción / corazón → consonante', rhymeType('canción', 'corazón') === 'consonante', rhymeType('canción', 'corazón'));
    t('calle / madre → asonante a-e', rhymeType('calle', 'madre') === 'asonante' && analyzeWord('calle').asKey === 'ae', analyzeWord('calle').asKey);
    t('camino / destino → consonante', rhymeType('camino', 'destino') === 'consonante', rhymeType('camino', 'destino'));
    t('vaso / bajo → asonante a-o', rhymeType('vaso', 'bajo') === 'asonante' && analyzeWord('vaso').asKey === 'ao', analyzeWord('bajo').asKey);
    t('ciudad → 2 sílabas', analyzeWord('ciudad').count === 2, analyzeWord('ciudad').syllables.join('-'));
    t('país → 2 sílabas', analyzeWord('país').count === 2, analyzeWord('país').syllables.join('-'));
    t('río → 2 sílabas', analyzeWord('río').count === 2, analyzeWord('río').syllables.join('-'));
    t('árbol → llana', analyzeWord('árbol').type === 'llana', analyzeWord('árbol').type);
    t('que → u muda (suena "ke")', phonetize('que') === 'ke' && analyzeWord('que').count === 1, phonetize('que'));
    t('guerra → u muda, pingüino → ü suena', phonetize('guerra') === 'geRa' && phonetize('pingüino').includes('gu'), phonetize('guerra') + ' / ' + phonetize('pingüino'));
    t('b=v, s=z=c: vez / bes', phonetize('vez') === phonetize('bes'), phonetize('vez'));
    t('ll=y: calle / caye', phonetize('calle') === phonetize('caye'), phonetize('calle'));
    t('hoy → aguda con "y" final como vocal', analyzeWord('hoy').count === 1 && analyzeWord('hoy').asKey === 'o', analyzeWord('hoy').consKey);
    t('números no riman ni rompen', analyzeWord('2024') === null && analyzeLyrics('tengo 100 rimas\nflow sin 200 límites').metrics.words === 5, '');
    t('inglés no rompe', !!analyzeLyrics('yeah yeah check it\nrhythm and flow').metrics, '');
    const r = analyzeLyrics('Yo sigo mi camino solo\nbuscando mi destino propio');
    t('multisilábica de 3+ sílabas entre dos versos', r.metrics.longestMulti >= 3, r.metrics.longestMulti + ' sílabas: ' + r.metrics.longestMultiText);
    const r2 = analyzeLyrics('la calle me llama\nla gente reclama\nsigo mi camino\nbusco mi destino');
    t('esquema AABB', r2.sections[0].scheme === 'AABB', r2.sections[0].scheme);
    const ri = rhymeIndex({ density: 0.6, longestMulti: 8, multiCount: 5, lines: 10, lexical: 0.75 }), r0 = rhymeIndex({ density: 0, longestMulti: 0, multiCount: 0, lines: 4, lexical: 0 });
    t('índice de rima: máximo 100, mínimo 0', ri.index === 100 && r0.index === 0, ri.index + ' / ' + r0.index);
    const r3 = analyzeLyrics('que suene la calle\nque nadie me falle\n\nverso distinto aquí\notro verso así\n\nque suene la calle\nque nadie me falle');
    t('bloque repetido → posible coro', r3.sections[0].chorus && r3.sections[2].chorus && !r3.sections[1].chorus, r3.sections.map(s => s.chorus).join(','));
    const ok = T.filter(x => x.ok).length;
    if (typeof console !== 'undefined') { (console.table || console.log)(T); console.log(`Letras: ${ok}/${T.length} pruebas pasaron`); }
    return { passed: ok, total: T.length, results: T };
  }

  const api = { cleanWord, syllabify, phonetize, analyzeWord, rhymeType, analyzeLyrics, rhymeIndex, runLetrasTests };
  root.Letras = api;
  root.runLetrasTests = runLetrasTests;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
    if (typeof require !== 'undefined' && require.main === module) runLetrasTests();
  }
})(typeof window !== 'undefined' ? window : globalThis);
