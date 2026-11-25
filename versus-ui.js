// Versus (nov 2026): duelo de 2 raperos con una pregunta ("¿Quién tiene mejor flow?") y hora de cierre.
// Página: index.html?versus=<id>#versus (link fijo: el mismo del post sirve para ver el resultado al día siguiente).
// Lista: index.html#versus. Bloque en la portada (#vsxHome) con la copia datos/ranking.json (0 lecturas).
// El marcador va APARTE del ranking: elegir a uno no cambia sus calificaciones. Mientras está abierto solo se
// muestra cuántos ya eligieron; el marcador sale al cierre.
// Firebase (leer, elegir, apartar la elección sin cuenta, admin) está en el módulo de index.html: window.RSV.
// Usa del sitio: ARTISTS, esc, artistAvatar, rankCmp, fmtScore, votesLabel, rsTrack, showToast, goTo, rateFromHome.
(function () {
  const TZ = 'America/Mexico_City';
  const QUESTIONS = ['¿Quién es mejor?', '¿Quién tiene mejor flow?', '¿Quién tiene mejor lírica?', '¿Quién tiene mejores coros?',
    '¿Quién tiene más impacto en la escena?', '¿Quién es más versátil?', '¿A quién pondrías a abrir un concierto?'];
  const st = { list: null, duel: null, mine: null, loading: false, timer: null, busy: false };

  const art = slug => ARTISTS.find(a => a.slug === slug) || { name: slug, slug, tier: 'active', tags: [] };
  const city = a => (a.tags || [])[0] || a.estado || '';
  const tierTxt = a => a.tier === 'legend' ? 'Leyenda' : a.tier === 'emerging' ? 'Emergente' : '';
  const isOpen = d => d && d.closes > Date.now();
  const total = d => (d.va || 0) + (d.vb || 0) || d.total || 0;
  function when(ms, withDay = true) {
    const o = { timeZone: TZ, hour: 'numeric', minute: '2-digit' };
    if (withDay) Object.assign(o, { weekday: 'long', day: 'numeric', month: 'long' });
    return new Date(ms).toLocaleString('es-MX', o);
  }
  function left(ms) {
    const d = ms - Date.now();
    if (d <= 0) return 'Cerrado';
    const h = Math.floor(d / 36e5);
    if (h >= 48) return `Faltan ${Math.floor(h / 24)} días`;
    if (h >= 1) return `Faltan ${h} h ${Math.floor(d % 36e5 / 6e4)} min`;
    return `Faltan ${Math.max(1, Math.ceil(d / 6e4))} min`;
  }
  const people = n => n === 1 ? '1 persona' : `${n} personas`;
  function rankInfo(a) {
    if (!a.votes) return 'Sin calificar todavía';
    const pos = [...ARTISTS].sort(rankCmp).indexOf(a) + 1;
    return `#${pos} · ${fmtScore(a.total, a.votes)} · ${votesLabel(a.votes)}`;
  }
  function urlId() { try { return new URLSearchParams(location.search).get('versus') || ''; } catch (e) { return ''; } }
  function setUrl(id) {
    try {
      const u = new URL(location.href);
      if (id) u.searchParams.set('versus', id); else u.searchParams.delete('versus');
      history.replaceState(null, '', u.pathname + u.search + '#versus');
    } catch (e) {}
  }

  // ── Abrir ──
  window.openVersus = function (id, from) {
    setUrl(id || '');
    st.duel = null; st.mine = null;
    if (from) rsTrack('cta_click', { cta: from, duel: id || '' });
    goTo('versus');
  };
  window.renderVersus = function () {
    const sec = document.getElementById('section-versus');
    if (!sec) return;
    const id = urlId();
    clearInterval(st.timer);
    if (id) renderDuel(sec, id); else renderList(sec);
  };
  window.versusStop = () => clearInterval(st.timer);
  window.versusRefresh = function () {
    if (document.getElementById('section-versus')?.style.display === 'none') return;
    st.duel = null; window.renderVersus();
  };

  // ── Un duelo ──
  async function renderDuel(sec, id) {
    if (!st.duel || st.duel.id !== id) {
      sec.innerHTML = `<div class="votar-wrap vsx"><p class="vcard-text">Cargando el Versus…</p></div>`;
      let d = null, err = false;
      try { d = window.RSV ? await window.RSV.get(id) : null; if (!window.RSV) err = true; } catch (e) { err = true; }
      if (!d && err) d = snapDuel(id);           // sin Firebase: lo que diga la copia (sin marcador si sigue abierto)
      if (urlId() !== id) return;                // se fue a otro lado mientras cargaba
      if (!d) {
        sec.innerHTML = `<div class="votar-wrap vsx">${backBtn()}<div class="vcard"><div class="vcard-title">No encontramos este Versus</div>
          <p class="vcard-text">${err ? 'No pudimos cargarlo. Revisa tu conexión y vuelve a intentar.' : 'Puede que el link esté incompleto o que el duelo se haya borrado.'}</p>
          <button class="rate-submit" onclick="${err ? 'versusRefresh()' : "openVersus('')"}">${err ? 'Reintentar' : 'Ver todos los Versus'}</button></div></div>`;
        return;
      }
      st.duel = d;
      st.mine = window.RSV ? await window.RSV.myPick(id) : null;
      rsTrack('versus_view', { duel: id, state: isOpen(d) ? 'open' : 'closed', has_pick: st.mine ? 'yes' : 'no' });
    }
    paintDuel(sec);
    if (isOpen(st.duel)) st.timer = setInterval(() => {
      const el = document.getElementById('vsxLeft');
      if (!el) return clearInterval(st.timer);
      if (!isOpen(st.duel)) { clearInterval(st.timer); window.versusRefresh(); return; }
      el.textContent = left(st.duel.closes);
    }, 30000);
  }
  function snapDuel(id) {
    const s = (window.RS_VERSUS_LIST || []).find(x => x.id === id);
    return s ? { ...s, closes: Date.parse(s.closes) } : null;
  }
  const backBtn = () => `<button type="button" class="vsx-back" onclick="openVersus('')">← Todos los Versus</button>`;

  function paintDuel(sec) {
    const d = st.duel, A = art(d.a), B = art(d.b), open = isOpen(d), n = total(d);
    const pend = window.getPendingVersus && window.getPendingVersus();
    const pending = pend && pend.id === d.id && !st.mine ? pend.side : null;
    const chosen = st.mine || pending;
    const pctA = n ? Math.round((d.va || 0) * 100 / n) : 0, pctB = n ? 100 - pctA : 0;
    const winner = !open && n ? (d.va > d.vb ? 'a' : d.vb > d.va ? 'b' : 'tie') : null;
    const side = (k, a) => {
      const votes = k === 'a' ? d.va : d.vb, pct = k === 'a' ? pctA : pctB;
      const cls = [chosen === k ? 'picked' : '', chosen && chosen !== k ? 'other' : '', winner === k ? 'won' : ''].join(' ');
      return `<div class="vsx-side ${cls}">
        <div class="vsx-av">${artistAvatar(a)}${winner === k ? '<span class="vsx-crown">Ganó</span>' : ''}</div>
        ${typeof photoCredit === 'function' ? photoCredit(a) : ''}
        <div class="vsx-name">${esc(a.name)}</div>
        <div class="vsx-sub">${esc([city(a), tierTxt(a)].filter(Boolean).join(' · '))}</div>
        ${open
          ? `<button type="button" class="vsx-pick" data-track="versus_elegir" onclick="versusPick('${k}')" ${st.mine || st.busy ? 'disabled' : ''}>${
              st.mine === k ? 'Tu elección ✓' : pending === k ? 'Apartada · falta tu cuenta' : 'Elijo a ' + esc(a.name)}</button>`
          : `<div class="vsx-res"><b>${n ? pct + '%' : '—'}</b><span>${people(votes || 0)}</span><i style="width:${n ? pct : 0}%"></i></div>`}
        <a class="vsx-ficha" href="artista/${encodeURIComponent(a.slug)}/" data-track="versus_ver_ficha">Ver su ficha</a>
      </div>`;
    };
    let status = '';
    if (open) {
      if (st.mine) status = `<div class="vsx-status ok">Elegiste a <b>${esc(art(st.mine === 'a' ? d.a : d.b).name)}</b> ✓ El resultado sale al cierre (${esc(when(d.closes))}) en este mismo link.</div>`;
      else if (pending) status = `<div class="vsx-status pend">Tu elección (<b>${esc(art(pending === 'a' ? d.a : d.b).name)}</b>) está apartada. <button type="button" class="vsx-link" onclick="versusPick('${pending}')">Entra o crea tu cuenta</button> y se guarda sola.</div>`;
      else status = `<div class="vsx-status">Toca a tu favorito. Para que tu elección cuente necesitas una cuenta con correo confirmado; si aún no tienes, queda apartada y se guarda sola al entrar.</div>`;
    } else if (st.mine) {
      status = `<div class="vsx-status ok">Tú elegiste a <b>${esc(art(st.mine === 'a' ? d.a : d.b).name)}</b>.</div>`;
    }
    const headline = open ? '' : !n ? `<div class="vsx-winner">Nadie eligió en este Versus</div>`
      : winner === 'tie' ? `<div class="vsx-winner">Empate: ${d.va} a ${d.vb}</div>`
      : `<div class="vsx-winner">Ganó <b>${esc(art(winner === 'a' ? d.a : d.b).name)}</b> · ${Math.max(d.va, d.vb)} a ${Math.min(d.va, d.vb)}</div>`;
    sec.innerHTML = `<div class="votar-wrap vsx">
      ${backBtn()}
      <div class="hero-label">${open ? 'Versus · abierto' : 'Versus · resultado'}</div>
      <h2 class="vsx-q">${esc(d.q || '¿Quién es mejor?')}</h2>
      <div class="vsx-meta">${open
        ? `<span class="vsx-live">● Abierto</span> Cierra el ${esc(when(d.closes))} (hora del centro) · <b id="vsxLeft">${left(d.closes)}</b>`
        : `Cerró el ${esc(when(d.closes))} (hora del centro) · ${people(n)} ${n === 1 ? 'eligió' : 'eligieron'}`}</div>
      ${headline}
      <div class="vsx-duel">${side('a', A)}<div class="vsx-vs" aria-hidden="true">VS</div>${side('b', B)}</div>
      ${status}
      ${open ? `<p class="vsx-note">${n ? `${people(n)} ya ${n === 1 ? 'eligió' : 'eligieron'}. ` : ''}El marcador se revela al cierre.</p>` : ''}
      <div class="vsx-after">
        <div class="vcard-title">${open && !chosen ? '¿Los conoces bien?' : '¿Y en las 6 categorías?'}</div>
        <p class="vcard-text">El Versus no cambia el ranking: una preferencia no dice cuánto vale cada uno. El ranking se hace con calificaciones del 1 al 10 en flow, lírica, contenido, versatilidad, coros e impacto.</p>
        <div class="vsx-rates">
          <button type="button" class="rate-submit" data-track="versus_calificar" onclick="versusRate('${esc(A.slug)}')">Califica a ${esc(A.name)}</button>
          <button type="button" class="rate-submit" data-track="versus_calificar" onclick="versusRate('${esc(B.slug)}')">Califica a ${esc(B.name)}</button>
        </div>
        <button type="button" class="vsx-share" onclick="versusShare()">Compartir este Versus</button>
      </div>
      <div class="vsx-rank">
        <div class="vcard-title">En el ranking general, hoy <small>(aparte del duelo)</small></div>
        <div class="vsx-rank-row"><span>${esc(A.name)}</span><b>${esc(rankInfo(A))}</b></div>
        <div class="vsx-rank-row"><span>${esc(B.name)}</span><b>${esc(rankInfo(B))}</b></div>
      </div>
    </div>`;
  }

  window.versusPick = async function (side) {
    const d = st.duel;
    if (!d || st.busy || st.mine) return;
    if (!isOpen(d)) { showToast('Este Versus ya cerró'); window.versusRefresh(); return; }
    if (!window.RSV) { showToast('No pudimos conectar. Revisa tu conexión y vuelve a intentar.'); return; }
    st.busy = true;
    const name = art(side === 'a' ? d.a : d.b).name;
    let r;
    try { r = await window.RSV.pick(d.id, side, name); } finally { st.busy = false; }
    if (r.status === 'ok' || r.status === 'dup') {
      st.mine = r.pick;
      if (r.status === 'ok') { d[side === 'a' ? 'va' : 'vb'] = (d[side === 'a' ? 'va' : 'vb'] || 0) + 1; showToast(`Elegiste a ${name} ✓`); }
      else showToast('Ya habías elegido en este Versus');
    } else if (r.status === 'closed') { showToast('Este Versus ya cerró'); st.duel = null; }
    else if (r.status === 'gone') { showToast('Este Versus ya no existe'); st.duel = null; }
    else if (r.status === 'error') showToast(r.code === 'permission-denied' ? 'No pudimos guardar tu elección. Intenta más tarde.' : 'Error al guardar tu elección');
    // "pending": se abrió la ventana de cuenta; la elección queda apartada y se manda sola al entrar
    window.renderVersus();
  };
  window.versusRate = function (slug) {
    const d = st.duel;
    if (d) try { sessionStorage.setItem('rs_from_versus', JSON.stringify({ id: d.id, a: d.a, b: d.b })); } catch (e) {}
    rateFromHome(slug);
  };
  window.versusShare = async function () {
    const d = st.duel;
    if (!d) return;
    const A = art(d.a), B = art(d.b), open = isOpen(d);
    const where = navigator.share ? 'native' : 'whatsapp';
    const url = `https://www.rapscoremx.com/?versus=${encodeURIComponent(d.id)}&utm_source=${where}&utm_medium=share&utm_campaign=versus_${encodeURIComponent(d.id)}`;
    const text = open ? `${d.q} ${A.name} vs ${B.name}. Elige en RapScore MX:` : `Resultado del Versus ${A.name} vs ${B.name} en RapScore MX:`;
    rsTrack('share', { method: where, content_type: 'versus', item_id: d.id });
    if (navigator.share) { try { await navigator.share({ title: 'Versus · RapScore MX', text, url }); } catch (e) {} }
    else window.open('https://wa.me/?text=' + encodeURIComponent(text + ' ' + url), '_blank', 'noopener');
  };

  // ── Lista ──
  async function renderList(sec) {
    let list = st.list, live = true;
    if (!list) {
      sec.innerHTML = `<div class="votar-wrap vsx"><p class="vcard-text">Cargando los Versus…</p></div>`;
      try { list = window.RSV ? await window.RSV.list(12) : null; } catch (e) { list = null; }
      if (!list) { live = false; list = (window.RS_VERSUS_LIST || []).map(x => ({ ...x, closes: Date.parse(x.closes) })); }
      else st.list = list;
      if (urlId()) return;
    }
    const open = list.filter(isOpen).sort((a, b) => a.closes - b.closes), past = list.filter(d => !isOpen(d));
    const card = d => {
      const A = art(d.a), B = art(d.b), n = total(d), o = isOpen(d);
      const res = o ? `Cierra el ${esc(when(d.closes))} · ${people(n)} ${n === 1 ? 'eligió' : 'eligieron'}`
        : d.va == null ? `Cerró el ${esc(when(d.closes))}`
        : !n ? 'Nadie eligió' : d.va === d.vb ? `Empate ${d.va} a ${d.vb}`
        : `Ganó ${esc(d.va > d.vb ? A.name : B.name)} · ${Math.max(d.va, d.vb)} a ${Math.min(d.va, d.vb)}`;
      return `<button type="button" class="vsx-item ${o ? 'open' : ''}" onclick="openVersus('${esc(d.id)}', 'versus_lista')">
        <span class="vsx-item-av">${artistAvatar(A)}</span><span class="vsx-item-av">${artistAvatar(B)}</span>
        <span class="vsx-item-txt"><b>${esc(A.name)} vs ${esc(B.name)}</b><span>${esc(d.q)}</span><small>${res}</small></span>
        <span class="vsx-item-go">${o ? 'Elegir →' : 'Resultado →'}</span></button>`;
    };
    sec.innerHTML = `<div class="votar-wrap vsx">
      <div class="hero-label">Versus</div>
      <h2 class="vsx-q">Dos raperos, una pregunta</h2>
      <p class="vcard-text">Eliges a uno y el resultado sale al cierre, en el mismo link. El Versus va aparte del ranking: el ranking se hace con calificaciones del 1 al 10.</p>
      ${open.length ? `<div class="vcard-title">Abiertos</div>${open.map(card).join('')}`
        : `<div class="vp-empty">No hay Versus abiertos ahora. <button type="button" class="vsx-link" onclick="goTo('votar')">Mientras, califica a tus raperos →</button></div>`}
      ${past.length ? `<div class="vcard-title" style="margin-top:22px">Resultados</div>${past.map(card).join('')}` : ''}
      ${live ? '' : '<p class="vsx-note">Lista de hace unos minutos.</p>'}
    </div>`;
  }

  // ── Portada: el Versus abierto (o el resultado de uno que cerró en los últimos 3 días) ──
  window.renderVersusHome = function () {
    const el = document.getElementById('vsxHome');
    if (!el) return;
    const list = (window.RS_VERSUS_LIST || []).map(x => ({ ...x, closes: Date.parse(x.closes) }));
    const open = list.filter(isOpen).sort((a, b) => a.closes - b.closes);
    const d = open[0] || list.find(x => !isOpen(x) && Date.now() - x.closes < 3 * 864e5);
    if (!d) { el.hidden = true; return; }
    const A = art(d.a), B = art(d.b), o = isOpen(d), n = total(d);
    const sub = o ? `Cierra el ${when(d.closes)}${n ? ' · ' + people(n) + (n === 1 ? ' ya eligió' : ' ya eligieron') : ''}`
      : d.va == null || !n ? 'Ya cerró: mira el resultado'
      : d.va === d.vb ? `Empate ${d.va} a ${d.vb}` : `Ganó ${d.va > d.vb ? A.name : B.name} · ${Math.max(d.va, d.vb)} a ${Math.min(d.va, d.vb)}`;
    el.innerHTML = `
      <div class="vsx-h-txt"><span class="vsx-h-label">${o ? 'Versus · abierto' : 'Versus · resultado'}</span>
        <b class="vsx-h-q">${esc(d.q)}</b><span class="vsx-h-sub">${esc(sub)}</span></div>
      <div class="vsx-h-duel"><span class="vsx-h-av">${artistAvatar(A)}</span><span class="vsx-h-n">${esc(A.name)}</span>
        <span class="vsx-h-vs">VS</span><span class="vsx-h-n">${esc(B.name)}</span><span class="vsx-h-av">${artistAvatar(B)}</span></div>
      <button type="button" class="nh-btn" onclick="openVersus('${esc(d.id)}', 'home_versus')">${o ? 'Elige tu lado →' : 'Ver resultado →'}</button>`;
    el.hidden = false;
  };

  // ── Admin → Versus ──
  let adminList = null;
  window.renderAdminVersus = async function (sec, switchHtml) {
    if (!adminList) {
      sec.innerHTML = `<div class="votar-wrap">${switchHtml}<p class="vcard-text">Cargando Versus…</p></div>`;
      try { adminList = await window.RSV.list(40); } catch (e) { adminList = { error: e.code || e.message }; }
    }
    const opts = [...ARTISTS].sort((a, b) => a.name.localeCompare(b.name, 'es')).map(a => `<option value="${a.slug}">${esc(a.name)}</option>`).join('');
    const tomorrow = new Date(Date.now() + 864e5); tomorrow.setHours(22, 0, 0, 0);
    const pad = x => String(x).padStart(2, '0');
    const local = t => `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}T${pad(t.getHours())}:${pad(t.getMinutes())}`;
    const rows = Array.isArray(adminList) ? adminList.map(d => {
      const A = art(d.a), B = art(d.b), o = isOpen(d);
      return `<div class="adm-card" data-vs="${esc(d.id)}">
        <div class="adm-head"><div>
          <div class="adm-name">${esc(A.name)} vs ${esc(B.name)}</div>
          <div class="vs-sub">${esc(d.q)} · ${o ? 'Abierto, cierra' : 'Cerró'} el ${esc(when(d.closes))} (hora del centro)</div>
          <div class="vs-sub"><b>${esc(A.name)} ${d.va}</b> · <b>${esc(B.name)} ${d.vb}</b> · ${people(d.va + d.vb)}${o ? ' (solo tú ves el marcador antes del cierre)' : ''}</div>
        </div><button class="btn-sm" onclick="openVersus('${esc(d.id)}')">Abrir ↗</button></div>
        <div class="pop-actions vsx-adm-link">
          <select class="auth-input" data-f="src"><option value="facebook">Facebook</option><option value="instagram">Instagram</option><option value="tiktok">TikTok</option><option value="whatsapp">WhatsApp</option></select>
          <select class="auth-input" data-f="pieza"><option value="pregunta">Post de la pregunta</option><option value="recordatorio">Recordatorio</option><option value="resultado">Post del resultado</option></select>
          <button class="btn-sm" onclick="adminVersusCopy('${esc(d.id)}', this)">Copiar link</button>
        </div>
        <div class="pop-actions">
          ${o ? `<button class="btn-sm" onclick="adminVersusClose('${esc(d.id)}')">Cerrar ya</button>` : ''}
          <button class="btn-sm adm-del" onclick="adminVersusDelete('${esc(d.id)}')">Borrar</button>
        </div>
      </div>`;
    }).join('') : `<div class="vp-empty">No se pudieron leer los Versus (${esc(adminList.error)}). Revisa que las reglas nuevas de Firestore estén publicadas.</div>`;
    sec.innerHTML = `<div class="votar-wrap">
      <div class="hero-label">Administración</div>
      <h2 class="adm-title">Versus</h2>
      ${switchHtml}
      <p class="vcard-text">Crea un duelo, copia el link para tu post y usa <b>el mismo link</b> para el post del resultado: al cierre la página muestra ganador, marcador y cuántos participaron. No cambia el ranking.</p>
      <div class="adm-card">
        <div class="adm-name">Nuevo Versus</div>
        <div class="sug-grid">
          <select class="auth-input" id="vxA"><option value="">Rapero 1…</option>${opts}</select>
          <select class="auth-input" id="vxB"><option value="">Rapero 2…</option>${opts}</select>
          <input class="auth-input sug-wide" id="vxQ" list="vxQs" maxlength="90" value="¿Quién tiene mejor flow?" placeholder="Pregunta">
          <datalist id="vxQs">${QUESTIONS.map(q => `<option value="${esc(q)}">`).join('')}</datalist>
          <label class="sug-wide vs-sub">Cierra (hora de tu compu o celular)
            <input class="auth-input" type="datetime-local" id="vxC" value="${local(tomorrow)}" oninput="adminVersusHint()"></label>
          <div class="sug-wide vs-sub" id="vxHint"></div>
        </div>
        <button class="rate-submit" onclick="adminVersusCreate(this)">Crear Versus</button>
      </div>
      ${rows}
    </div>`;
    window.adminVersusHint();
  };
  window.adminVersusHint = function () {
    const v = document.getElementById('vxC')?.value, el = document.getElementById('vxHint');
    if (!el) return;
    const t = v ? new Date(v).getTime() : NaN;
    el.textContent = isNaN(t) ? '' : `Cierra el ${when(t)} (hora del centro de México) · ${left(t)}`;
  };
  window.adminVersusCreate = async function (btn) {
    const a = document.getElementById('vxA').value, b = document.getElementById('vxB').value;
    const q = document.getElementById('vxQ').value.trim(), c = new Date(document.getElementById('vxC').value).getTime();
    if (!a || !b || a === b) { showToast('Elige dos raperos distintos'); return; }
    if (q.length < 3 || q.length > 90) { showToast('Escribe la pregunta (máx. 90 letras)'); return; }
    if (isNaN(c) || c < Date.now() + 10 * 6e4 || c > Date.now() + 30 * 864e5) { showToast('El cierre debe ser entre 10 minutos y 30 días desde ahora'); return; }
    btn.disabled = true;
    try {
      const id = await window.RSV.create(a, b, q, c);
      showToast('Versus creado ✓ Copia el link para tu post');
      adminList = null; st.list = null;
      rsTrack('versus_create', { duel: id });
      window.renderAdmin();
    } catch (e) { console.error(e); showToast(e.code === 'permission-denied' ? 'Sin permiso: publica primero las reglas nuevas de Firestore' : 'No se pudo crear el Versus'); }
    finally { btn.disabled = false; }
  };
  window.adminVersusCopy = async function (id, btn) {
    const card = btn.closest('[data-vs]'), src = card.querySelector('[data-f="src"]').value, pieza = card.querySelector('[data-f="pieza"]').value;
    const url = `https://www.rapscoremx.com/?versus=${encodeURIComponent(id)}&utm_source=${src}&utm_medium=social&utm_campaign=versus_${encodeURIComponent(id)}&utm_content=${pieza}`;
    try { await navigator.clipboard.writeText(url); showToast('Link copiado ✓'); } catch (e) { prompt('Copia el link:', url); }
  };
  window.adminVersusClose = async function (id) {
    if (!confirm('¿Cerrar este Versus ahora? Ya nadie podrá elegir y se mostrará el resultado.')) return;
    try { await window.RSV.setCloses(id, Date.now()); adminList = null; st.list = null; window.renderAdmin(); }
    catch (e) { console.error(e); showToast('No se pudo cerrar'); }
  };
  window.adminVersusDelete = async function (id) {
    if (!confirm('¿Borrar este Versus? El link dejará de funcionar.')) return;
    try { await window.RSV.remove(id); adminList = null; st.list = null; window.renderAdmin(); }
    catch (e) { console.error(e); showToast('No se pudo borrar'); }
  };
})();
