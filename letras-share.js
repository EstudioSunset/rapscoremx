// letras-share.js — Tarjeta para compartir el análisis de Letras (imagen 1080×1350, formato vertical de redes).
// La imagen se dibuja en el celular del usuario y solo sale de ahí si él decide compartirla o descargarla.
(function () {
  'use strict';
  const W = 1080, H = 1350, PAD = 72;
  const SITE = 'https://www.rapscoremx.com/#letras';
  let logo = null, lastBlob = null;

  function loadLogo() {
    if (logo) return Promise.resolve(logo);
    return new Promise(ok => {
      const img = new Image();
      img.onload = () => { logo = img; ok(img); };
      img.onerror = () => ok(null);
      img.src = 'images/rapscore-logo-transparente.png';
    });
  }
  async function loadFonts() {
    try {
      await Promise.all(['400 100px "Bebas Neue"', '500 34px "Barlow"', '600 34px "Barlow"', '700 34px "Barlow"', '400 40px "Saira Stencil One"'].map(f => document.fonts.load(f)));
    } catch (e) {}
  }

  // Fragmento a mostrar: los versos seguidos con más palabras que riman, evitando el coro repetido
  // (para presumir barras se ve mejor una estrofa que un estribillo).
  function bestExcerpt(r, max) {
    const real = r.verses.filter(v => !v.blank);
    const n = Math.min(max, real.length);
    const score = v => v.repeated ? -3 : v.tokens.filter(t => t.fam >= 0 || t.multi).length + (v.tokens.some(t => t.multi) ? 2 : 0);
    let best = 0, bestSum = -1;
    for (let i = 0; i + n <= real.length; i++) {
      const sum = real.slice(i, i + n).reduce((s, v) => s + score(v), 0);
      if (sum > bestSum) { bestSum = sum; best = i; }
    }
    return real.slice(best, best + n);
  }

  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  async function drawCard(r, mcName) {
    await Promise.all([loadFonts(), loadLogo()]);
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d'), m = r.metrics;
    const colors = window.LT_COLORS_PUBLIC || ['#ff6a3d', '#ffcc00', '#39c0ff', '#00e676', '#ff4fa3', '#b98cff', '#ff9f1c', '#4dd0e1', '#c6ff00', '#ff6e6e', '#82b1ff', '#ffd180'];
    // fondo
    g.fillStyle = '#0a0a0a'; g.fillRect(0, 0, W, H);
    const rad = g.createRadialGradient(W * 0.85, 120, 40, W * 0.85, 120, 700);
    rad.addColorStop(0, 'rgba(255,60,0,0.22)'); rad.addColorStop(1, 'rgba(255,60,0,0)');
    g.fillStyle = rad; g.fillRect(0, 0, W, H);
    // logo + encabezado
    let y = PAD;
    if (logo) { const lw = 330, lh = lw * logo.height / logo.width; g.drawImage(logo, PAD, y, lw, lh); }
    g.textAlign = 'right'; g.fillStyle = '#cfc9bf'; g.font = '600 26px "Barlow", sans-serif'; g.letterSpacing = '3px';
    g.fillText('ANÁLISIS DE BARRAS', W - PAD, y + 34);
    g.textAlign = 'left'; g.letterSpacing = '0px';
    y += 150;
    if (mcName) {
      g.fillStyle = '#f0ede6'; g.font = '400 64px "Saira Stencil One", "Bebas Neue", sans-serif';
      g.fillText(mcName.toUpperCase().slice(0, 24), PAD, y); y += 30;
    }
    // índice grande
    y += 175;
    g.fillStyle = '#ff3c00'; g.font = '400 230px "Bebas Neue", sans-serif';
    g.fillText(String(m.index), PAD - 6, y);
    const iw = g.measureText(String(m.index)).width;
    g.fillStyle = '#6d6d6d'; g.font = '400 70px "Bebas Neue", sans-serif';
    g.fillText('/100', PAD + iw + 8, y);
    g.fillStyle = '#f0ede6'; g.font = '400 44px "Bebas Neue", sans-serif';
    g.fillText('ÍNDICE DE RIMA', PAD + iw + 8, y - 80);
    y += 40;
    // 4 datos
    const stats = [
      [Math.round(m.density * 100) + '%', 'Densidad de rima'],
      [m.longestMulti ? m.longestMulti + ' sílabas' : '—', 'Multisilábica más larga'],
      [String(m.families), 'Familias de rima'],
      [Math.round(m.lexical * 100) + '%', 'Palabras distintas'],
    ];
    const tw = (W - PAD * 2 - 24) / 2, th = 128;
    stats.forEach(([v, l], i) => {
      const x = PAD + (i % 2) * (tw + 24), yy = y + Math.floor(i / 2) * (th + 18);
      g.fillStyle = '#141414'; roundRect(g, x, yy, tw, th, 10); g.fill();
      g.strokeStyle = '#2a2a2a'; g.lineWidth = 2; g.stroke();
      g.fillStyle = '#f0ede6'; g.font = '400 66px "Bebas Neue", sans-serif'; g.fillText(v, x + 24, yy + 72);
      g.fillStyle = '#a8a8a8'; g.font = '600 21px "Barlow", sans-serif'; g.letterSpacing = '1.5px'; g.fillText(l.toUpperCase(), x + 24, yy + 106);
      g.letterSpacing = '0px';
    });
    y += th * 2 + 18 + 46;
    // multisilábica más larga
    if (m.longestMultiText) {
      g.fillStyle = '#ffcc00'; g.font = '700 30px "Barlow", sans-serif';
      const txt = '“' + m.longestMultiText + '”';
      wrapText(g, txt, PAD, y, W - PAD * 2, 36, 2);
      y += g.measureText(txt).width > W - PAD * 2 ? 62 : 32;
    }
    // fragmento con rimas de colores
    const boxY = y, boxH = H - boxY - 150;
    g.fillStyle = '#121212'; roundRect(g, PAD, boxY, W - PAD * 2, boxH, 12); g.fill();
    g.strokeStyle = '#262626'; g.lineWidth = 2; g.stroke();
    const lineH = 50, maxLines = Math.floor((boxH - 40) / lineH);
    const LYR = '34px "Barlow", sans-serif';
    g.font = '500 ' + LYR;
    let ly = boxY + 52, lines = 0;
    const left = PAD + 28, right = W - PAD - 28;
    for (const v of bestExcerpt(r, 7)) {
      if (lines >= maxLines) break;
      let x = left;
      for (const t of v.tokens) {
        if (t.space) { x += g.measureText(' ').width + 8; continue; }   // +8: que los recuadros de color no se peguen
        g.font = (t.multi ? '700 ' : '500 ') + LYR;   // medir con el mismo grosor con que se dibuja
        const w = g.measureText(t.raw).width;
        if (x + w > right && x > left) { lines++; if (lines >= maxLines) break; ly += lineH; x = left + 30; }
        if (t.fam >= 0) {
          const col = colors[t.fam % colors.length];
          g.globalAlpha = t.multi ? 0.42 : 0.28; g.fillStyle = col; roundRect(g, x - 4, ly - 32, w + 8, 42, 6); g.fill();
          g.globalAlpha = 1; g.fillRect(x - 4, ly + 6, w + 8, t.multi ? 6 : 3);
        }
        g.fillStyle = '#f0ede6';
        g.fillText(t.raw, x, ly);
        g.font = '500 ' + LYR;
        x += w;
      }
      lines++; ly += lineH;
    }
    // pie
    g.fillStyle = '#ff3c00'; g.fillRect(PAD, H - 118, 90, 6);
    g.fillStyle = '#f0ede6'; g.font = '400 40px "Bebas Neue", sans-serif';
    g.fillText('ANALIZA TU LETRA GRATIS: RAPSCOREMX.COM', PAD, H - 72);
    g.fillStyle = '#8a8a8a'; g.font = '500 20px "Barlow", sans-serif';
    g.fillText('Índice automático: rima, multisilábicas y vocabulario. No mide flow ni contenido.', PAD, H - 40);
    return c;
  }

  function wrapText(g, text, x, y, maxW, lh, maxLines) {
    const words = text.split(' '); let line = '', n = 0;
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (g.measureText(test).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; if (++n >= maxLines - 1) { break; } }
      else line = test;
    }
    if (line) g.fillText(line.length > 60 ? line.slice(0, 58) + '…”' : line, x, y);
  }

  function modal() {
    let el = document.getElementById('ltShareModal');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'modal-overlay'; el.id = 'ltShareModal';
    el.innerHTML = `
      <div class="modal lt-share-modal" role="dialog" aria-labelledby="ltShareTitle">
        <button type="button" class="modal-close" aria-label="Cerrar" onclick="letrasShareClose()">✕</button>
        <div class="modal-title" id="ltShareTitle">Presume tus barras</div>
        <input class="auth-input" id="ltShareName" maxlength="24" autocomplete="off" placeholder="Tu nombre de MC (opcional)">
        <div class="lt-share-prev"><img id="ltShareImg" alt="Tarjeta con el análisis de tu letra"></div>
        <div class="lt-share-actions">
          <button type="button" class="lt-btn go" id="ltShareNative">Compartir</button>
          <button type="button" class="lt-btn" id="ltShareDl">Descargar imagen</button>
          <button type="button" class="lt-btn" id="ltShareFb">Abrir Facebook</button>
        </div>
        <p class="lt-share-note">La imagen se crea en tu celular y solo se comparte si tú lo decides. En el celular, toca <b>Compartir</b> y elige Facebook, Instagram o WhatsApp. En compu, descárgala y súbela a tu publicación.</p>
      </div>`;
    el.addEventListener('click', e => { if (e.target === el) letrasShareClose(); });
    document.body.appendChild(el);
    let tmr = 0;
    el.querySelector('#ltShareName').addEventListener('input', () => { clearTimeout(tmr); tmr = setTimeout(render, 350); });
    el.querySelector('#ltShareNative').addEventListener('click', shareNative);
    el.querySelector('#ltShareDl').addEventListener('click', () => download('descarga'));
    el.querySelector('#ltShareFb').addEventListener('click', () => {
      download('facebook');
      window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(SITE), '_blank', 'noopener,width=620,height=560');
    });
    return el;
  }

  async function render() {
    const r = window.LT_LAST;
    if (!r) return;
    const name = document.getElementById('ltShareName').value.trim();
    const c = await drawCard(r, name);
    lastBlob = await new Promise(ok => c.toBlob(ok, 'image/png'));
    const img = document.getElementById('ltShareImg');
    if (img.dataset.url) URL.revokeObjectURL(img.dataset.url);
    img.dataset.url = URL.createObjectURL(lastBlob);
    img.src = img.dataset.url;
    const file = new File([lastBlob], 'rapscore-letras.png', { type: 'image/png' });
    const can = !!(navigator.canShare && navigator.canShare({ files: [file] }));
    document.getElementById('ltShareNative').hidden = !can;
    document.getElementById('ltShareFb').hidden = can;     // en celular el menú de compartir ya incluye Facebook
  }

  async function shareNative() {
    if (!lastBlob) return;
    const file = new File([lastBlob], 'rapscore-letras.png', { type: 'image/png' });
    const m = window.LT_LAST.metrics;
    try {
      await navigator.share({ files: [file], title: 'Mi análisis en RapScore MX', text: `Mi letra sacó ${m.index}/100 en el índice de rima de RapScore MX. Analiza la tuya: ${SITE}` });
      if (window.rsTrack) rsTrack('share', { content_type: 'lyrics_card', method: 'native', rhyme_index: m.index });
    } catch (e) { /* el usuario canceló */ }
  }

  function download(method) {
    if (!lastBlob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(lastBlob); a.download = 'rapscore-letras.png';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    if (window.rsTrack) rsTrack('share', { content_type: 'lyrics_card', method, rhyme_index: window.LT_LAST.metrics.index });
  }

  window.letrasShareOpen = async function () {
    // sin índice (menos de 8 versos) no hay tarjeta: el número no sería justo
    if (!window.LT_LAST || typeof window.LT_LAST.metrics.index !== 'number') return;
    const el = modal();
    el.classList.add('open');
    document.getElementById('ltShareImg').removeAttribute('src');
    await render();
    if (window.rsTrack) rsTrack('popup_view', { popup: 'compartir_letras' });
  };
  window.letrasShareClose = () => { const el = document.getElementById('ltShareModal'); if (el) el.classList.remove('open'); };
  window.letrasDrawCard = drawCard;   // para pruebas
})();
