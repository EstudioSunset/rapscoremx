// freestyle-ui.js — Interfaz del Freestyle Lab (la lógica de palabras y beats está en freestyle.js).
// Guarda en el navegador solo preferencias y minutos practicados. No graba ni manda audio a ningún lado.
(function () {
  'use strict';
  const F = window.Freestyle;
  const $ = id => document.getElementById(id);
  const escH = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const track = (n, p) => { try { if (window.rsTrack) window.rsTrack(n, p); } catch (e) {} };
  const ls = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };
  const DURS = [[30, '30 s'], [60, '1 min'], [90, '1:30'], [120, '2 min'], [0, 'Libre']];
  const prefs = Object.assign({ style: 'boombap', bpm: {}, level: 1, mode: 'ronda', dur: 60, theme: 'todo', vol: 0.8, tab: 'beat' }, ls.get('rs_fl_prefs', {}));
  const savePrefs = () => ls.set('rs_fl_prefs', prefs);
  const eng = new F.BeatEngine();
  let gen = null, S = null, raf = 0, wakeLock = null, rendered = false;

  const styleOf = id => F.STYLES.find(s => s.id === id) || F.STYLES[0];
  const bpmOf = st => st.file ? st.bpm : Math.min(st.range[1], Math.max(st.range[0], prefs.bpm[st.id] || st.bpm));
  const todayKey = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const fmt = sec => { sec = Math.max(0, Math.round(sec)); return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); };
  // Reto del día: mismo beat, nivel elegido y palabras iguales para todos ese día
  const retoStyle = () => F.STYLES_PRACTICE[F.hashStr(todayKey()) % F.STYLES_PRACTICE.length];
  // Calificaciones del usuario (cuenta del servidor, validada en firestore.rules)
  const myRatings = () => (window.RS_USER && window.RS_ME && window.RS_ME.ratings) || 0;
  const unlocked = st => F.isUnlocked(st, myRatings());
  const usableStyle = id => { const st = styleOf(id); return unlocked(st) ? st : F.STYLES_PRACTICE[0]; };

  function render() {
    const sec = $('section-freestyle');
    if (!sec || rendered) return;
    rendered = true;
    sec.innerHTML = `
    <div class="fl-wrap">
      <header class="fl-head">
        <div>
          <h2 class="fl-title">FREESTYLE <em>LAB</em></h2>
          <span class="fl-kicker">Beats · Palabras · Práctica real</span>
        </div>
        <p class="fl-tag">Practica<br>Improvisa<br>Evoluciona</p>
      </header>

      <div class="fl-setup" id="flSetup">
        <div class="fl-tabs" role="tablist">
          <button type="button" role="tab" data-tab="beat">Beat</button>
          <button type="button" role="tab" data-tab="nivel">Nivel</button>
          <button type="button" role="tab" data-tab="modo">Modo</button>
        </div>
        <div class="fl-panel" data-panel="beat">
          <div class="fl-house" id="flHouse" hidden></div>
          <div class="fl-beats" id="flBeats"></div>
          <div class="fl-bpm" id="flBpmRow">
            <span>Tempo</span>
            <button type="button" class="fl-ic" aria-label="Más lento" data-bpm="-2">−</button>
            <input type="range" id="flBpmRange" aria-label="BPM">
            <button type="button" class="fl-ic" aria-label="Más rápido" data-bpm="2">+</button>
            <b id="flBpmVal">90</b><small>BPM</small>
          </div>
        </div>
        <div class="fl-panel" data-panel="nivel"><div class="fl-levels" id="flLevels"></div></div>
        <div class="fl-panel" data-panel="modo">
          <div class="fl-label">Duración</div>
          <div class="fl-chips" id="flDurs"></div>
          <div class="fl-label">Palabras de</div>
          <div class="fl-chips" id="flThemes"></div>
          <div class="fl-label">Reto del día</div>
          <button type="button" class="fl-reto" id="flReto"></button>
        </div>
      </div>

      <div class="fl-livebar" id="flLiveBar">
        <span id="flLiveInfo"></span>
        <button type="button" class="fl-link" id="flAjustes">Ajustes</button>
      </div>

      <section class="fl-stage" id="flStage" aria-live="polite">
        <div class="fl-top">
          <div><span class="fl-lbl" id="flRoundLbl">Listo</span><b class="fl-timer" id="flTimer">00:00</b></div>
          <div class="fl-meta"><b id="flMetaBpm">90 BPM</b><span id="flMetaBars"></span></div>
        </div>
        <div class="fl-prompt" id="flPrompt">Elige beat y nivel, y dale play</div>
        <div class="fl-word" id="flWord">¿LISTO?</div>
        <div class="fl-sub" id="flSub"></div>
        <div class="fl-segs" id="flSegs"></div>
        <canvas class="fl-viz" id="flViz" aria-hidden="true"></canvas>
        <div class="fl-dots" id="flDots"><i></i><i></i><i></i><i></i></div>
        <div class="fl-next" id="flNext">&nbsp;</div>
        <div class="fl-controls">
          <button type="button" class="fl-ctl" id="flRestart" aria-label="Reiniciar"><svg viewBox="0 0 24 24"><path d="M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z"/></svg><span>Reiniciar</span></button>
          <button type="button" class="fl-play" id="flPlay" aria-label="Empezar"><svg viewBox="0 0 24 24" id="flPlayIc"><path d="M8 5v14l11-7z"/></svg><span id="flPlayLbl">Empezar</span></button>
          <button type="button" class="fl-ctl" id="flSkip" aria-label="Saltar palabra"><svg viewBox="0 0 24 24"><path d="M6 6l8.5 6L6 18zM16 6h2v12h-2z"/></svg><span>Saltar</span></button>
        </div>
        <div class="fl-vol"><span aria-hidden="true">🔈</span><input type="range" id="flVol" min="0" max="1" step="0.01" aria-label="Volumen"><span aria-hidden="true">🔊</span></div>
        <div class="fl-summary" id="flSummary" hidden></div>
      </section>

      <div class="fl-stats">
        <div><b id="flStTime">00:00</b><span>Tiempo</span></div>
        <div><b id="flStWords">0</b><span>Palabras</span></div>
        <div><b id="flStBars">0</b><span>Compases</span></div>
        <div><b id="flStBpm">90</b><span>BPM</span></div>
      </div>
      <button type="button" class="fl-end" id="flEnd">■ Terminar sesión</button>
      <p class="fl-hist" id="flHist"></p>
      <p class="fl-note">Usa audífonos o una bocina. No grabamos tu voz ni guardamos nada de lo que improvises. Los beats de prueba se generan en tu navegador; pronto llegan los beats originales de la casa.</p>
    </div>`;
    buildSetup();
    bindEvents();
    refreshIdle();
  }

  function buildBeats() {
    const r = myRatings();
    $('flBeats').innerHTML = F.STYLES.map(st => {
      const lock = !unlocked(st);
      return `
      <button type="button" class="fl-beat${st.house ? ' house' : ''}${lock ? ' locked' : ''}" data-style="${st.id}" ${lock ? `aria-label="${escH(st.name)}: bloqueado, califica ${st.unlock} raperos"` : ''}>
        <span class="fl-beat-art fl-art-${st.house ? 'house' : st.id}" aria-hidden="true">${lock ? '<em>🔒</em>' : ''}</span>
        <b>${escH(st.name)}</b><small>${st.house ? (lock ? `Califica ${Math.max(0, st.unlock - r)} más` : escH(st.sub)) : 'Práctica · ' + escH(st.sub)} · ${Math.round(st.bpm)} BPM</small>
      </button>`;
    }).join('');
    const h = $('flHouse');
    if (!F.HOUSE_BEATS.length) { h.hidden = true; return; }
    const need = F.UNLOCK_RATINGS, done = Math.min(r, need), all = F.HOUSE_BEATS.every(unlocked);
    h.hidden = false;
    h.innerHTML = all
      ? `<b>Beats de la casa desbloqueados</b><span>${F.HOUSE_PRODUCER ? 'Producidos por ' + escH(F.HOUSE_PRODUCER) + '. ' : ''}Gracias por calificar.</span>`
      : `<b>🔒 Beats de la casa</b><span>${F.HOUSE_PRODUCER ? 'Beats originales de ' + escH(F.HOUSE_PRODUCER) + '. ' : 'Beats originales. '}Se desbloquean al calificar ${need} raperos.</span>
         <div class="fl-house-bar"><i style="width:${done / need * 100}%"></i></div>
         <span class="fl-house-n">${window.RS_USER ? `Llevas ${done} de ${need}` : 'Necesitas una cuenta para calificar'}</span>
         <button type="button" class="fl-btn go" id="flHouseCta">${window.RS_USER ? 'Calificar raperos' : 'Entrar y calificar'}</button>`;
    const cta = $('flHouseCta');
    if (cta) cta.onclick = () => { if (window.RS_USER) window.goTo && goTo('votar'); else if (window.openAuthModal) openAuthModal('login'); };
  }

  function buildSetup() {
    buildBeats();
    $('flLevels').innerHTML = [1, 2, 3].map(l => {
      const L = F.LEVELS[l];
      return `<button type="button" class="fl-level" data-level="${l}"><span class="fl-stars">${'★'.repeat(L.stars)}</span><b>${L.name}</b><small>${L.desc}</small></button>`;
    }).join('');
    $('flDurs').innerHTML = DURS.map(([v, l]) => `<button type="button" class="fl-chip" data-dur="${v}">${l}</button>`).join('');
    $('flThemes').innerHTML = Object.entries(F.CATS).map(([k, l]) => `<button type="button" class="fl-chip" data-theme="${k}">${l}</button>`).join('');
    $('flVol').value = prefs.vol;
    syncSetup();
  }

  function syncSetup() {
    document.querySelectorAll('.fl-tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === prefs.tab));
    document.querySelectorAll('.fl-panel').forEach(p => p.hidden = p.dataset.panel !== prefs.tab);
    const reto = prefs.mode === 'reto';
    const st = reto ? retoStyle() : usableStyle(prefs.style);
    document.querySelectorAll('.fl-beat').forEach(b => b.classList.toggle('on', b.dataset.style === st.id));
    document.querySelectorAll('.fl-level').forEach(b => b.classList.toggle('on', +b.dataset.level === prefs.level));
    document.querySelectorAll('[data-dur]').forEach(b => b.classList.toggle('on', !reto && +b.dataset.dur === prefs.dur));
    document.querySelectorAll('[data-theme]').forEach(b => b.classList.toggle('on', !reto && b.dataset.theme === prefs.theme));
    const r = $('flBpmRange'), bpm = bpmOf(st);
    r.min = st.file ? st.bpm : st.range[0]; r.max = st.file ? st.bpm : st.range[1]; r.value = bpm;
    r.disabled = !!st.file || reto;
    $('flBpmVal').textContent = Math.round(bpm);
    $('flReto').classList.toggle('on', reto);
    $('flReto').innerHTML = `<b>${reto ? '✓ ' : ''}Reto del ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</b><small>Mismas palabras para todos hoy · ${escH(retoStyle().name)} · 1 min · nivel ${F.LEVELS[prefs.level].name}</small>`;
    $('flMetaBpm').textContent = Math.round(bpm) + ' BPM';
    $('flStBpm').textContent = Math.round(bpm);
    $('flMetaBars').textContent = F.barsFor(prefs.level, bpm) + ' compases por palabra';
    $('flLiveInfo').textContent = `${st.name} · ${Math.round(bpm)} BPM · ${F.LEVELS[prefs.level].name}${reto ? ' · Reto del día' : prefs.dur ? ' · ' + DURS.find(d => d[0] === prefs.dur)[1] : ' · Libre'}`;
    renderHist();
  }

  function bindEvents() {
    const sec = $('section-freestyle');
    sec.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.tab) { prefs.tab = b.dataset.tab; savePrefs(); syncSetup(); return; }
      if (b.dataset.style) {
        const st = styleOf(b.dataset.style);
        if (!unlocked(st)) { toast(`Califica ${Math.max(0, st.unlock - myRatings())} raperos más para usar este beat`); $('flHouse').scrollIntoView({ behavior: 'smooth', block: 'nearest' }); return; }
        if (prefs.mode === 'reto') prefs.mode = 'ronda'; prefs.style = b.dataset.style; savePrefs(); applyLive('style'); syncSetup(); return;
      }
      if (b.dataset.level) { prefs.level = +b.dataset.level; savePrefs(); applyLive('level'); syncSetup(); return; }
      if (b.dataset.dur !== undefined) { prefs.dur = +b.dataset.dur; prefs.mode = prefs.dur ? 'ronda' : 'libre'; savePrefs(); syncSetup(); return; }
      if (b.dataset.theme) { prefs.theme = b.dataset.theme; if (prefs.mode === 'reto') prefs.mode = 'ronda'; savePrefs(); applyLive('level'); syncSetup(); return; }
      if (b.dataset.bpm) { setBpm(bpmOf(styleOf(prefs.style)) + +b.dataset.bpm); return; }
    });
    $('flBpmRange').addEventListener('input', e => setBpm(+e.target.value));
    $('flReto').addEventListener('click', () => { prefs.mode = prefs.mode === 'reto' ? 'ronda' : 'reto'; savePrefs(); syncSetup(); if (S) restart(); });
    $('flVol').addEventListener('input', e => { prefs.vol = +e.target.value; eng.setVolume(prefs.vol); savePrefs(); });
    $('flPlay').addEventListener('click', togglePlay);
    $('flRestart').addEventListener('click', () => { if (S) restart(); else togglePlay(); });
    $('flSkip').addEventListener('click', skipWord);
    $('flEnd').addEventListener('click', () => finish(true));
    $('flAjustes').addEventListener('click', () => { if (S && !S.paused) togglePlay(); sec.classList.remove('fl-live'); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && S && !S.paused) togglePlay(); });
    document.addEventListener('keydown', e => {
      if (sec.style.display === 'none' || /input|textarea|select/i.test(e.target.tagName)) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'ArrowRight') skipWord();
    });
  }

  function setBpm(v) {
    const st = styleOf(prefs.style);
    if (st.file || prefs.mode === 'reto') return;
    prefs.bpm[st.id] = Math.min(st.range[1], Math.max(st.range[0], v));
    savePrefs();
    eng.setBpm(bpmOf(st));
    if (S) S.bpm = bpmOf(st);
    syncSetup();
  }

  // Cambios durante la sesión: el beat cambia al siguiente compás; nivel/tema aplican desde la próxima palabra
  function applyLive(what) {
    if (!S) return;
    if (what === 'style') {
      const st = usableStyle(prefs.style);
      const go = () => { eng.setStyle(st.id); eng.setBpm(bpmOf(st)); S.bpm = bpmOf(st); };
      if (st.file) eng.load(st).then(go).catch(() => toast('No se pudo cargar ese beat')); else go();
    } else {
      gen = F.createGenerator({ level: prefs.level, theme: prefs.theme });
      S.next = gen.next();
      showNext();
    }
  }

  function toast(m) { if (window.showToast) window.showToast(m); }

  async function togglePlay() {
    if (!S) return start();
    if (S.paused) {
      S.paused = false; eng.resume(); setPlayIcon(true); keepAwake(true); startViz();
      $('section-freestyle').classList.add('fl-live');
    } else {
      S.paused = true; eng.pause(); setPlayIcon(false); keepAwake(false); stopViz(false);
      $('flPrompt').textContent = 'En pausa';
    }
  }

  async function start() {
    const reto = prefs.mode === 'reto';
    const st = reto ? retoStyle() : usableStyle(prefs.style);
    try {
      eng.init();
      if (st.file) { $('flPrompt').textContent = 'Cargando beat…'; await eng.load(st); }
    } catch (e) { toast('Tu navegador no pudo reproducir el audio'); return; }
    const bpm = reto ? st.bpm : bpmOf(st);
    eng.setStyle(st.id, true); eng.setBpm(bpm); eng.setVolume(prefs.vol);
    gen = F.createGenerator({ level: prefs.level, theme: reto ? 'todo' : prefs.theme, seed: reto ? F.hashStr(todayKey() + '|' + prefs.level) : null });
    S = { st, bpm, reto, dur: reto ? 60 : (prefs.mode === 'libre' ? 0 : prefs.dur), paused: false, musicStart: null, bars: 0, words: 0,
      card: gen.next(), next: null, barInCard: 0, cardBars: 0, seen: [], round: 1, ended: false };
    S.next = gen.next();
    $('flSummary').hidden = true;
    $('section-freestyle').classList.add('fl-live');
    eng.start(true);
    setPlayIcon(true); keepAwake(true); startViz();
    $('flRoundLbl').textContent = (S.reto ? 'Reto del día' : 'Ronda ' + S.round);
    $('flPrompt').textContent = 'Prepárate';
    $('flWord').textContent = '4';
    $('flSub').textContent = ''; $('flSegs').innerHTML = '';
    $('flNext').innerHTML = `Primera: <b>${escH(S.card.text)}</b>`;
    fitWord();
    track('freestyle_start', { style: st.id, bpm, level: prefs.level, mode: S.reto ? 'reto' : S.dur ? 'ronda' : 'libre', theme: prefs.theme });
    clearInterval(raf); raf = setInterval(loop, 25);   // reloj de pantalla (no depende de animaciones)
  }

  function startRound(n) {
    S = null;
    start().then(() => { if (S) { S.round = n; $('flRoundLbl').textContent = S.reto ? 'Reto del día' : 'Ronda ' + n; } });
  }
  function restart() { const r = S ? S.round : 1; eng.stop(); startRound(r); }

  function setPlayIcon(playing) {
    $('flPlayIc').innerHTML = playing ? '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>' : '<path d="M8 5v14l11-7z"/>';
    $('flPlayLbl').textContent = playing ? 'Pausar' : (S ? 'Seguir' : 'Empezar');
    $('flPlay').setAttribute('aria-label', $('flPlayLbl').textContent);
  }

  async function keepAwake(on) {
    try {
      if (on && 'wakeLock' in navigator && !wakeLock) wakeLock = await navigator.wakeLock.request('screen');
      if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
    } catch (e) { wakeLock = null; }
  }

  // Reloj: procesa los tiempos (beats) que el motor ya programó, justo cuando suenan
  function loop() {
    if (!S || S.ended) return;
    const now = eng.now;
    while (eng.events.length && eng.events[0].t <= now + 0.01) onBeat(eng.events.shift());
    if (S.musicStart != null && !S.paused) {
      const el = now - S.musicStart;
      $('flTimer').textContent = S.dur ? fmt(S.dur - el) : fmt(el);
      $('flStTime').textContent = fmt(el);
    }
  }

  function onBeat(ev) {
    const dots = $('flDots').children;
    for (let i = 0; i < 4; i++) dots[i].classList.toggle('on', i === ev.beat);
    if (ev.bar < 0) {                                     // cuenta de entrada 4-3-2-1
      $('flWord').textContent = String(4 - ev.beat);
      $('flWord').classList.remove('fl-pop'); void $('flWord').offsetWidth; $('flWord').classList.add('fl-pop');
      return;
    }
    if (ev.beat !== 0) { markSegs(); return; }
    // inicio de compás
    if (S.musicStart == null) { S.musicStart = ev.t; showCard(); return; }
    S.bars++; $('flStBars').textContent = S.bars;
    if (S.dur && ev.t - S.musicStart >= S.dur - 0.05) return finish(false);
    S.barInCard++;
    if (S.barInCard >= S.cardBars) { S.card = S.next; S.next = gen.next(); showCard(); }
    else markSegs();
  }

  function cardBarsFor(card) {
    const base = F.barsFor(prefs.level, S.bpm);
    return card.type === 'word' ? base : Math.min(8, base * 2);   // retos especiales: el doble de tiempo
  }

  function showCard() {
    const c = S.card;
    S.barInCard = 0; S.cardBars = cardBarsFor(c); S.words++; S.seen.push(c.text);
    $('flStWords').textContent = S.words;
    const P = { word: 'Improvisa con esta palabra', pair: 'Conecta estas dos palabras', end: 'Cierra tus versos con', tema: 'Cambia de tema' };
    $('flPrompt').textContent = P[c.type];
    const w = $('flWord');
    w.dataset.type = c.type;
    w.innerHTML = c.type === 'pair' ? `${escH(c.words[0])}<i>+</i>${escH(c.words[1])}` : escH(c.text);
    $('flSub').textContent = c.hint || '';
    w.classList.remove('fl-pop'); void w.offsetWidth; w.classList.add('fl-pop');
    $('flSegs').innerHTML = '<i></i>'.repeat(S.cardBars);
    $('flMetaBars').textContent = S.cardBars + (S.cardBars === 1 ? ' compás' : ' compases');
    fitWord(); markSegs(); showNext();
  }

  function markSegs() {
    const segs = $('flSegs').children;
    for (let i = 0; i < segs.length; i++) segs[i].className = i < S.barInCard ? 'done' : i === S.barInCard ? 'now' : '';
    $('flNext').classList.toggle('soon', S.barInCard >= S.cardBars - 1);
  }

  function showNext() { if (S && S.next) $('flNext').innerHTML = `Siguiente: <b>${escH(S.next.text)}</b>`; }

  function skipWord() {
    if (!S || S.musicStart == null || S.ended) return;
    S.card = S.next; S.next = gen.next(); showCard();
    S.barInCard = -1;          // el compás en curso no cuenta; la palabra dura completa desde el siguiente
    markSegs();
  }

  // Ajusta el tamaño para que palabras largas ("globalización") quepan sin cortarse
  function fitWord() {
    const w = $('flWord'), box = $('flStage');
    const txt = w.textContent, lines = w.dataset.type === 'pair' ? 2 : 1;
    const longest = w.dataset.type === 'pair' ? Math.max(...txt.split('+').map(x => x.trim().length)) : txt.length;
    const max = Math.min(170, box.clientWidth * 0.26), avail = box.clientWidth * 0.92;
    const size = Math.max(32, Math.min(max / (lines > 1 ? 1.45 : 1), avail / (Math.max(3, longest) * 0.5)));
    w.style.fontSize = size + 'px';
  }

  function finish(manual) {
    if (!S || S.ended) return;
    S.ended = true;
    const secs = S.musicStart != null ? Math.max(0, eng.now - S.musicStart) : 0;
    eng.stop(); keepAwake(false); setPlayIcon(false); stopViz(true);
    $('section-freestyle').classList.remove('fl-live');
    if (secs >= 15) {
      const h = ls.get('rs_fl_hist', { sessions: 0, seconds: 0, days: [] });
      h.sessions++; h.seconds += Math.round(secs);
      const k = todayKey(); if (!h.days.includes(k)) h.days.push(k); h.days = h.days.slice(-60);
      ls.set('rs_fl_hist', h);
    }
    track('freestyle_end', { seconds: Math.round(secs), words: S.words, bars: S.bars, level: prefs.level, manual: manual ? 'yes' : 'no' });
    const sm = $('flSummary');
    sm.innerHTML = `
      <div class="fl-sum-k">${S.reto ? 'Reto del día terminado' : manual ? 'Sesión terminada' : 'Ronda ' + S.round + ' terminada'}</div>
      <div class="fl-sum-row"><div><b>${fmt(secs)}</b><span>Tiempo</span></div><div><b>${S.words}</b><span>Palabras</span></div><div><b>${S.bars}</b><span>Compases</span></div></div>
      <div class="fl-sum-q">Revisa: ¿las metiste todas en tus rimas?</div>
      <div class="fl-sum-words">${S.seen.map(x => `<span>${escH(x)}</span>`).join('')}</div>
      <div class="fl-sum-actions">
        <button type="button" class="fl-btn go" id="flAgain">${S.reto ? 'Repetir reto' : 'Otra ronda'}</button>
        <button type="button" class="fl-btn" id="flChange">Cambiar ajustes</button>
      </div>`;
    sm.hidden = false;
    const round = S.round;
    $('flAgain').onclick = () => startRound(manual ? round : round + 1);
    $('flChange').onclick = () => { sm.hidden = true; S = null; refreshIdle(); $('flSetup').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
    renderHist();
  }

  function refreshIdle() {
    $('flRoundLbl').textContent = 'Listo';
    $('flTimer').textContent = prefs.mode === 'reto' ? '01:00' : prefs.dur ? fmt(prefs.dur) : '00:00';
    $('flPrompt').textContent = 'Elige beat y nivel, y dale play';
    $('flWord').textContent = '¿LISTO?'; $('flWord').dataset.type = 'word';
    $('flSub').textContent = ''; $('flSegs').innerHTML = ''; $('flNext').innerHTML = '&nbsp;';
    $('flStTime').textContent = '00:00'; $('flStWords').textContent = '0'; $('flStBars').textContent = '0';
    setPlayIcon(false); fitWord(); syncSetup(); stopViz(true);
  }

  function renderHist() {
    const h = ls.get('rs_fl_hist', null), el = $('flHist');
    if (!el) return;
    if (!h || !h.sessions) { el.textContent = 'Tu práctica se cuenta solo en este dispositivo.'; return; }
    const weekAgo = Date.now() - 7 * 864e5;
    const week = h.days.filter(d => new Date(d + 'T12:00:00').getTime() >= weekAgo).length;
    const mins = h.seconds < 60 ? 'menos de 1' : Math.round(h.seconds / 60);
    el.textContent = `En este dispositivo: ${mins} min practicados · ${h.sessions} sesión${h.sessions === 1 ? '' : 'es'} · ${week} día${week === 1 ? '' : 's'} esta semana.`;
  }

  // ── Visualizador de frecuencias (lee el audio real con un AnalyserNode) ──
  let vizRaf = 0, vizData = null, peaks = [], vizGrad = null, vizW = 0;
  function vizCanvas() {
    const c = $('flViz'); if (!c) return null;
    const dpr = Math.min(2, window.devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight;
    if (!w || !h) return null;
    if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); vizGrad = null; }
    const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!vizGrad || vizW !== w) {
      vizW = w; vizGrad = g.createLinearGradient(0, h, 0, 0);
      vizGrad.addColorStop(0, '#ff3c00'); vizGrad.addColorStop(1, '#ff8a3d');
    }
    return { g, w, h };
  }
  function drawViz(live) {
    const v = vizCanvas(); if (!v) return;
    const { g, w, h } = v, n = Math.max(16, Math.min(64, Math.floor(w / 9))), gap = 3, bw = (w - gap * (n - 1)) / n;
    g.clearRect(0, 0, w, h);
    const an = eng.analyser;
    if (live && an) { if (!vizData || vizData.length !== an.frequencyBinCount) vizData = new Uint8Array(an.frequencyBinCount); an.getByteFrequencyData(vizData); }
    const binHz = (eng.ctx ? eng.ctx.sampleRate : 44100) / 2 / (vizData ? vizData.length : 1024);
    for (let i = 0; i < n; i++) {
      let val = 0;
      if (live && vizData) {
        // bandas logarítmicas de 40 Hz a 14 kHz (como se oye: más detalle en graves)
        const f0 = 40 * Math.pow(350, i / n), f1 = 40 * Math.pow(350, (i + 1) / n);
        const b0 = Math.floor(f0 / binHz), b1 = Math.max(b0 + 1, Math.ceil(f1 / binHz));
        for (let b = b0; b < b1 && b < vizData.length; b++) val = Math.max(val, vizData[b]);
        val = Math.min(1, Math.pow(val / 255, 1.4) * (1 + 0.5 * i / n));
      }
      const bh = Math.max(2, val * (h - 3)), x = i * (bw + gap);
      g.globalAlpha = live ? 0.9 : 0.35; g.fillStyle = vizGrad; g.fillRect(x, h - bh, bw, bh);
      peaks[i] = Math.max(bh, (peaks[i] || 0) - 0.7);
      if (live && peaks[i] > 4) { g.globalAlpha = 0.9; g.fillStyle = '#ffcc00'; g.fillRect(x, h - peaks[i] - 2, bw, 2); }
    }
    g.globalAlpha = 1;
  }
  // Para pruebas desde la consola: dibuja un cuadro y dice qué tan fuerte llega el audio (0–255)
  window.freestyleVizFrame = () => { drawViz(true); return vizData ? Math.max(...vizData) : 0; };
  function vizLoop() { vizRaf = requestAnimationFrame(vizLoop); drawViz(true); }
  function startViz() { cancelAnimationFrame(vizRaf); vizRaf = requestAnimationFrame(vizLoop); }
  function stopViz(idle) { cancelAnimationFrame(vizRaf); vizRaf = 0; if (idle) { peaks = []; drawViz(false); } }

  // Si sales de la sección, pausa el beat
  window.freestylePause = () => { if (S && !S.paused && !S.ended) togglePlay(); };
  // Se llama al iniciar/cerrar sesión y al guardar una calificación (desbloqueo en vivo)
  window.freestyleRefresh = () => { if (rendered) { buildBeats(); syncSetup(); } };
  window.renderFreestyle = () => { render(); syncSetup(); setTimeout(fitWord, 50); };
  window.addEventListener('resize', () => { if (rendered) { fitWord(); if (!vizRaf) drawViz(false); } });
})();
