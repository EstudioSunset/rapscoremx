// Análisis de rima en español (pronunciación de México: s=z=c(e,i), ll=y, b=v, h muda).
(function (root) {
  const STRONG = 'aeoáéó', WEAK = 'iuíúü', ACC = 'áéíóú';
  const plain = c => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ü: 'u' }[c] || c);

  // Devuelve las posiciones de vocales que suenan, agrupadas en núcleos silábicos.
  function nuclei(w) {
    const isV = [];
    for (let i = 0; i < w.length; i++) {
      const c = w[i];
      let v = STRONG.includes(c) || WEAK.includes(c);
      if (c === 'u' && (w[i - 1] === 'q' || (w[i - 1] === 'g' && 'eiéí'.includes(w[i + 1] || '')))) v = false;
      if (c === 'y' && i === w.length - 1 && i > 0 && (STRONG + WEAK).includes(w[i - 1])) v = true;
      isV.push(v);
    }
    const groups = [];
    let cur = null;
    for (let i = 0; i < w.length; i++) {
      if (!isV[i]) { cur = null; continue; }
      const c = w[i] === 'y' ? 'i' : w[i];
      if (cur) {
        const prev = w[cur[cur.length - 1]] === 'y' ? 'i' : w[cur[cur.length - 1]];
        const hiatus = (STRONG.includes(prev) && STRONG.includes(c)) ||
          ('íú'.includes(c) && STRONG.includes(prev)) || ('íú'.includes(prev) && STRONG.includes(c));
        if (!hiatus) { cur.push(i); continue; }
      }
      cur = [i]; groups.push(cur);
    }
    return groups;
  }

  function analyze(word) {
    const w = word.toLowerCase().normalize('NFC');
    const g = nuclei(w);
    if (!g.length) return null;
    let t = g.findIndex(n => n.some(i => ACC.includes(w[i])));
    if (t < 0) {
      const last = w[w.length - 1];
      t = ('aeiouns'.includes(last) && g.length > 1) ? g.length - 2 : g.length - 1;
    }
    const n = g[t];
    let pos = n.find(i => ACC.includes(w[i]));
    if (pos === undefined) pos = n.find(i => STRONG.includes(w[i]));
    if (pos === undefined) pos = n[n.length - 1];
    const vowelOf = grp => {
      const s = grp.find(i => ACC.includes(w[i])) ?? grp.find(i => STRONG.includes(w[i])) ?? grp[grp.length - 1];
      return plain(w[s] === 'y' ? 'i' : w[s]);
    };
    const vowels = [plain(w[pos])].concat(g.slice(t + 1).map(vowelOf));
    const vowelPos = [pos].concat(g.slice(t + 1).map(grp =>
      grp.find(i => ACC.includes(w[i])) ?? grp.find(i => STRONG.includes(w[i])) ?? grp[grp.length - 1]));
    return { word: w, tonic: pos, stress: g.length - 1 - t, tail: w.slice(pos), sound: sound(w.slice(pos)), vowels, vowelPos };
  }

  function sound(s) {
    s = s.split('').map(plain).join('');
    s = s.replace(/ch/g, 'ʧ').replace(/qu/g, 'k').replace(/gu(?=[ei])/g, 'g').replace(/c(?=[ei])/g, 's').replace(/z/g, 's')
      .replace(/c/g, 'k').replace(/ll/g, 'y').replace(/v/g, 'b').replace(/h/g, '').replace(/x/g, 'ks').replace(/y$/, 'i');
    return s;
  }

  // 'c' consonante, 'a' asonante (estricta), 'x' no rima
  function classify(ref, word) {
    const a = analyze(ref), b = analyze(word);
    if (!a || !b || a.stress !== b.stress) return 'x';
    if (a.sound === b.sound) return 'c';
    if (a.vowels.join() === b.vowels.join()) return 'a';
    return 'x';
  }

  const api = { analyze, classify, sound };
  if (typeof module !== 'undefined') module.exports = api; else root.Rima = api;
})(this);
