// freestyle.js — Freestyle Lab de RapScore MX (MVP).
// Practica improvisación sobre beats mientras aparecen palabras sincronizadas con los compases.
//
// • Beats: se GENERAN en el navegador con Web Audio (batería, bajo y acordes sintetizados). Son 100% originales,
//   no usan música de nadie, el BPM es exacto (los cambios caen justo en el compás) y el tempo se ajusta sin perder calidad.
//   Para agregar beats propios en archivo (fase 2) ver el comentario "BEATS EN ARCHIVO".
// • Palabras: banco local (sin IA ni APIs): funciona sin conexión, sin costo y sin esperas.
// • No se graba ni se manda nada. En el navegador solo se guardan preferencias y minutos practicados (localStorage).
// • Pruebas: runFreestyleTests() en la consola  (o:  node freestyle.js).
(function (root) {
  'use strict';

  // ═══════════════════════ PALABRAS ═══════════════════════
  // Nivel 1 = comunes · 2 = menos predecibles · 3 = complejas / abstractas.
  // Categorías: obj objetos · emo emociones · lug lugares · per personajes · acc acciones · abs ideas · mex México.
  const BANK_SRC = {
    1: {
      obj: 'casa,carro,llave,puerta,ventana,mesa,foto,reloj,cadena,gorra,tenis,celular,libreta,pluma,micrófono,bocina,espejo,botella,vaso,dinero,moneda,cartera,mochila,bici,pelota,guitarra,radio,cama,cobija,chamarra,lápiz,cuaderno,zapato,maleta,vela',
      emo: 'amor,miedo,odio,rabia,alegría,tristeza,orgullo,envidia,celos,paz,calma,nervios,dolor,risa,llanto,coraje,esperanza,soledad,ganas,flojera',
      lug: 'barrio,calle,esquina,parque,escuela,cancha,mercado,tienda,iglesia,plaza,azotea,hospital,playa,río,montaña,ciudad,pueblo,metro,camión,cocina,fiesta,oficina',
      per: 'amigo,hermano,madre,padre,abuela,vecino,maestro,doctor,policía,payaso,rey,reina,niño,carnal,jefe,novia,enemigo,perro,gato,bebé',
      acc: 'correr,saltar,bailar,cantar,gritar,soñar,pelear,ganar,perder,volar,caer,buscar,llorar,reír,escribir,manejar,comer,dormir,luchar,brillar,jugar,trabajar',
      abs: 'noche,día,sol,luna,fuego,agua,tiempo,vida,sueño,verdad,mentira,suerte,fama,música,ritmo,flow,lluvia,viento,estrella,frío,calor',
      mex: 'tacos,tortilla,mole,tequila,mariachi,piñata,chile,nopal,pesero,tianguis,cantina,cumbia,elote,aguacate,pozole,tamal,frijoles,quesadilla,torta,paletas',
    },
    2: {
      obj: 'brújula,candado,linterna,mapa,ancla,anillo,corona,espada,escudo,máscara,cámara,vinilo,tornamesa,cassette,aerosol,ladrillo,alambre,cohete,telescopio,paraguas,semáforo,balanza,cerillo,termómetro,péndulo,trofeo,cuerda,dado,bandera,diamante',
      emo: 'nostalgia,ansiedad,euforia,rencor,culpa,vergüenza,ternura,angustia,ilusión,desprecio,gratitud,melancolía,adrenalina,paranoia,confianza,desconfianza,impaciencia,asombro',
      lug: 'laberinto,desierto,volcán,frontera,aeropuerto,estadio,panteón,callejón,vecindad,laboratorio,museo,selva,isla,faro,puente,túnel,ring,estudio,autopista,gasolinera,azotea,mina',
      per: 'profeta,pirata,fantasma,soldado,detective,campeón,poeta,villano,testigo,juez,traidor,mesero,boxeador,abogado,astronauta,brujo,guerrero,turista,cartero,vampiro',
      acc: 'escapar,construir,destruir,negociar,traicionar,sobrevivir,conquistar,olvidar,perdonar,rebotar,explotar,navegar,hackear,improvisar,sudar,apostar,rimar,rescatar,despertar,cruzar,derrumbar,heredar',
      abs: 'destino,tormenta,eco,silencio,gravedad,caos,karma,herencia,raíz,límite,libertad,poder,justicia,futuro,pasado,memoria,distancia,hambre,sombra,reflejo,cicatriz,promesa',
      mex: 'luchador,alebrije,catrina,ofrenda,Tenochtitlan,Xochimilco,trajinera,sonidero,quinceañera,posada,charro,rebozo,huarache,molcajete,comal,Zócalo,Teotihuacán,lotería,cempasúchil,tlacoyo',
    },
    3: {
      obj: 'holograma,satélite,microscopio,partitura,manuscrito,caleidoscopio,guillotina,metrónomo,sismógrafo,prisma,pergamino,reloj de arena,brújula rota,espejo roto',
      emo: 'incertidumbre,resiliencia,frustración,empatía,indiferencia,obsesión,arrepentimiento,desamparo,vanidad,apatía,nostalgia del futuro,euforia colectiva',
      lug: 'purgatorio,Olimpo,inframundo,Mictlán,catacumbas,Atlántida,rascacielos,refinería,bolsa de valores,quirófano,metaverso,frontera invisible',
      per: 'filósofo,dictador,mesías,titiritero,alquimista,náufrago,ermitaño,mercenario,cartógrafo,influencer,tecnócrata,francotirador de ideas',
      acc: 'descifrar,desmantelar,cuestionar,transformar,manipular,trascender,evolucionar,deconstruir,sabotear,reciclar,colonizar,hipnotizar,reinventar',
      abs: 'paradoja,entropía,utopía,ironía,dogma,efímero,algoritmo,metamorfosis,vértigo,nihilismo,simetría,espejismo,inercia,dilema,epifanía,hipocresía,burocracia,censura,propaganda,democracia,globalización,gentrificación,inflación,privilegio,conciencia,existencia,infinito,vacío,anarquía,revolución,catarsis,alquimia,ecosistema,frecuencia,horizonte,eclipse',
      mex: 'Quetzalcóatl,Nezahualcóyotl,malinchismo,huachicol,sincretismo,chilango,ambulantaje,Revolución,Mictlantecuhtli,narcocultura,maquiladora,Malinche',
    },
  };
  const CATS = { todo: 'Todo', obj: 'Objetos', emo: 'Emociones', lug: 'Lugares', per: 'Personajes', acc: 'Acciones', abs: 'Ideas', mex: 'México' };
  // Terminaciones para el reto "cierra con…" (nivel experto)
  const ENDINGS = [
    { e: '-ción', ej: 'canción, emoción, nación' }, { e: '-ado', ej: 'pasado, cansado, olvidado' },
    { e: '-ente', ej: 'gente, mente, presente' }, { e: '-ura', ej: 'locura, altura, cultura' },
    { e: '-ero', ej: 'dinero, primero, sincero' }, { e: '-ía', ej: 'poesía, día, energía' },
    { e: '-al', ej: 'final, carnal, real' }, { e: '-ar', ej: 'mar, cantar, lugar' },
    { e: '-or', ej: 'amor, dolor, mejor' }, { e: '-ida', ej: 'vida, herida, salida' },
  ];
  // Temas para el reto "cambia de tema" (nivel experto)
  const TEMAS = ['Tu barrio', 'Un amor que se fue', 'Crítica social', 'Tu primera batalla', 'La fiesta del sábado', 'El dinero',
    'Tu familia', 'Tu ciudad en 20 años', 'Contra el sistema', 'Un día perfecto', 'Tu peor enemigo', 'El tráfico', 'La escuela', 'Un viaje'];

  function buildBank() {
    const out = [], seen = new Set();
    Object.entries(BANK_SRC).forEach(([lvl, cats]) => Object.entries(cats).forEach(([cat, list]) => list.split(',').forEach(raw => {
      const w = raw.trim();
      const k = w.toLowerCase();
      if (!w || seen.has(k)) return;
      seen.add(k);
      out.push({ w, lvl: +lvl, cat });
    })));
    return out;
  }
  const BANK = buildBank();

  // Tres niveles que cambian MÁS que la velocidad: vocabulario, tipo de reto y tiempo para pensar.
  const LEVELS = {
    1: { name: 'Novato', stars: 1, desc: 'Palabras comunes · tiempo para pensar', target: 12, vocab: [1], mix: { word: 1 } },
    2: { name: 'Intermedio', stars: 2, desc: 'Más variedad · a veces dos palabras', target: 7, vocab: [1, 2, 2], mix: { word: 0.72, pair: 0.28 } },
    3: { name: 'Experto', stars: 3, desc: 'Conceptos difíciles · terminaciones · cambios de tema', target: 4.5, vocab: [2, 3, 3], mix: { word: 0.45, pair: 0.25, end: 0.15, tema: 0.15 } },
  };

  // Aleatorio con semilla (para el reto del día: todos reciben las mismas palabras)
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function hashStr(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

  // Compases por palabra: el más cercano a los segundos objetivo del nivel, en 1, 2, 4 u 8 compases.
  function barsFor(level, bpm) {
    const barSec = 240 / bpm, want = LEVELS[level].target / barSec;
    return [1, 2, 4, 8].reduce((best, b) => Math.abs(Math.log(b / want)) < Math.abs(Math.log(best / want)) ? b : best, 4);
  }

  // Generador: aleatorio pero sin repetir hasta agotar el mazo, y sin repetir las últimas palabras al rebarajar.
  function createGenerator(opts) {
    const o = Object.assign({ level: 1, theme: 'todo', seed: null }, opts);
    const rng = o.seed == null ? Math.random : mulberry32(o.seed);
    const L = LEVELS[o.level];
    const byLvl = lv => {
      let list = BANK.filter(x => x.lvl === lv && (o.theme === 'todo' || x.cat === o.theme));
      if (list.length < 8) list = BANK.filter(x => x.lvl === lv);        // tema con pocas palabras → usa todas
      return list;
    };
    const decks = {}, recent = [];
    const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    function draw(lv, avoidCat) {
      for (let tries = 0; tries < 30; tries++) {
        if (!decks[lv] || !decks[lv].length) decks[lv] = shuffle(byLvl(lv)).filter(x => !recent.includes(x.w));
        if (!decks[lv].length) decks[lv] = shuffle(byLvl(lv));
        const x = decks[lv].pop();
        if (avoidCat && x.cat === avoidCat && tries < 10) { decks[lv].unshift(x); continue; }
        recent.push(x.w); if (recent.length > 24) recent.shift();
        return x;
      }
      return decks[lv].pop();
    }
    const pickLvl = () => L.vocab[Math.floor(rng() * L.vocab.length)];
    const pickType = () => {
      let r = rng();
      for (const [k, p] of Object.entries(L.mix)) { if ((r -= p) <= 0) return k; }
      return 'word';
    };
    let last = '';
    return {
      next() {
        let type = pickType();
        if (type === last && type !== 'word') type = 'word';   // no encadenar retos especiales
        last = type;
        if (type === 'pair') {
          const a = draw(pickLvl()), b = draw(pickLvl(), a.cat);   // categorías distintas = conexión más creativa
          return { type, words: [a.w, b.w], text: a.w + ' + ' + b.w };
        }
        if (type === 'end') { const e = ENDINGS[Math.floor(rng() * ENDINGS.length)]; return { type, text: e.e, hint: 'ej. ' + e.ej }; }
        if (type === 'tema') { const t = TEMAS[Math.floor(rng() * TEMAS.length)]; return { type, text: t }; }
        const x = draw(pickLvl());
        return { type: 'word', text: x.w, cat: x.cat };
      },
    };
  }

  // ═══════════════════════ BEATS (síntesis Web Audio) ═══════════════════════
  const m2f = m => 440 * Math.pow(2, (m - 69) / 12);
  // BEATS DE LA CASA (en archivo): súbelos a /beats y regístralos en HOUSE_BEATS, por ejemplo:
  //   { id: 'callejero', name: 'Callejero', sub: 'Boom bap', bpm: 90, bars: 8, file: 'beats/boombap-90-8c.mp3' },
  // Se desbloquean al calificar UNLOCK_RATINGS raperos (o el número en `unlock` de cada beat). El conteo viene
  // del servidor (contributors/{uid}.ratings, validado en firestore.rules), no del celular.
  // El loop se corta por BPM × compases y se salta el silencio inicial de los MP3, así que repite sin brincos.
  // Los beats en archivo no permiten cambiar el BPM (cambiaría el tono).
  const UNLOCK_RATINGS = 5;
  const HOUSE_PRODUCER = 'RapScore MX';   // crédito de los beats de la casa
  // Beats completos exportados desde el DAW: el compás 1 empieza en el segundo 0 (offset 0) y el BPM es el del productor.
  // Se repite de loopFrom a loopTo (compases) para saltar la intro suave y el fade final.
  const HOUSE_BEATS = [
    { id: 'dusty-boom-bap', name: 'Dusty Boom Bap', sub: 'Boom bap', bpm: 92, offset: 0, bars: 52, loopFrom: 4, loopTo: 48, file: 'beats/Dusty-Boom-Bap.m4a' },
    { id: 'vinyl-battle', name: 'Vinyl Battle', sub: 'Boom bap de batalla', bpm: 85, offset: 0, bars: 42, loopFrom: 0, loopTo: 40, file: 'beats/Vinyl-Battle.m4a' },
    { id: 'piano-loop-trap', name: 'Piano Loop Trap', sub: 'Trap con piano', bpm: 134, offset: 0, bars: 79, loopFrom: 8, loopTo: 72, file: 'beats/Piano-Loop-Trap.m4a' },
    { id: 'menace-in-the-air', name: 'Menace in the Air', sub: 'Trap oscuro', bpm: 142, offset: 0, bars: 61, loopFrom: 8, loopTo: 60, file: 'beats/Menace-in-th-Air.m4a' },
    { id: 'frase-intima', name: 'Frase íntima', sub: 'Íntimo', bpm: 85, offset: 0, bars: 53, loopFrom: 4, loopTo: 52, file: 'beats/Frase-intima.m4a' },
    { id: 'guitar-loop', name: 'Guitar Loop', sub: 'Guitarra', bpm: 80, offset: 0, bars: 51, loopFrom: 4, loopTo: 48, file: 'beats/Guitar-Loop.m4a' },
    { id: 'banjo-beat', name: 'Banjo Beat', sub: 'Banjo', bpm: 91, offset: 0, bars: 44, loopFrom: 4, loopTo: 44, file: 'beats/Banjo-Beat.m4a' },
  ].map(b => Object.assign({ house: true, unlock: UNLOCK_RATINGS, range: [b.bpm, b.bpm], swing: 0, play: () => {} }, b));
  // ¿Puede usar este beat? Los de práctica siempre; los de la casa con suficientes calificaciones.
  const isUnlocked = (st, ratings) => !st.house || (ratings || 0) >= (st.unlock || UNLOCK_RATINGS);
  const STYLES_PRACTICE = [
    { id: 'boombap', name: 'Boom bap', sub: 'Clásico noventero', bpm: 90, range: [78, 100], swing: 0.16, play: playBoombap },
    { id: 'trap', name: 'Trap', sub: 'Hi-hats y 808', bpm: 140, range: [120, 155], swing: 0, play: playTrap },
    { id: 'lofi', name: 'Lo-fi', sub: 'Relajado, jazzy', bpm: 80, range: [68, 92], swing: 0.22, play: playLofi },
    { id: 'oldschool', name: 'Old school', sub: 'Caja de ritmos', bpm: 98, range: [88, 110], swing: 0.06, play: playOldschool },
    { id: 'cumbia', name: 'Cumbia rap', sub: 'Güiro y bajo, mexa', bpm: 96, range: [86, 106], swing: 0, play: playCumbia },
  ];
  const STYLES = HOUSE_BEATS.concat(STYLES_PRACTICE);
  const chordAt = (prog, bar) => prog[((bar % prog.length) + prog.length) % prog.length];

  function playBoombap(e, bar, s, t) {
    const prog = [[57, 60, 64, 67], [50, 53, 57, 60], [53, 57, 60, 64], [52, 56, 59, 62]];   // Am7 Dm7 Fmaj7 E7
    const ch = chordAt(prog, bar), root = ch[0] - 24, six = e.six();
    const kicks = bar % 2 === 0 ? [0, 10] : [0, 7, 10];
    if (kicks.includes(s)) { e.kick(t, 1); e.bass(t, root, six * 3.5, 0.55); }
    if (s === 4 || s === 12) e.snare(t, 0.95);
    if (s === 15 && bar % 4 === 3) e.snare(t, 0.25);
    if (s % 2 === 0) e.hat(t, s % 4 === 0 ? 0.8 : 0.5, s === 14 && bar % 4 === 3);
    if (s === 0) e.chord(t, ch, six * 14, 0.2, 'triangle', 1600);
    if (s === 7 && bar % 2 === 1) e.chord(t, ch, six * 2, 0.12, 'triangle', 1800);
  }
  function playTrap(e, bar, s, t) {
    const roots = [36, 32, 34, 31];                    // C Ab Bb G
    const r = chordAt(roots, bar), six = e.six();
    const kicks = bar % 2 === 0 ? [0, 11] : [0, 3, 11];
    if (kicks.includes(s)) e.b808(t, r, six * 6, 0.9), e.kick(t, 0.85);
    if (s === 8) e.clap(t, 0.95);
    if (s % 2 === 0) e.hat(t, s % 4 === 0 ? 0.7 : 0.45);
    if (s % 2 === 1 && bar % 2 === 1 && s >= 11) e.hat(t, 0.35);
    if (s === 14 && bar % 4 === 3) { e.hat(t + six / 3, 0.35); e.hat(t + 2 * six / 3, 0.4); }
    const bell = [r + 36, r + 39, r + 43, r + 46];
    if ([0, 3, 6, 10].includes(s)) e.tone(t, m2f(bell[[0, 3, 6, 10].indexOf(s)]), six * 2.5, 'sine', 0.08, 4000);
  }
  function playLofi(e, bar, s, t) {
    const prog = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];  // Fmaj7 Em7 Dm7 Cmaj7
    const ch = chordAt(prog, bar), six = e.six();
    const kicks = bar % 2 === 0 ? [0, 9] : [0, 7, 9];
    if (kicks.includes(s)) { e.kick(t, 0.75); e.bass(t, ch[0] - 12, six * 3, 0.45); }
    if (s === 4 || s === 12) e.snare(t, 0.5, true);
    if (s % 2 === 0) e.hat(t, 0.28);
    if (s === 0) e.chord(t, ch, six * 15, 0.2, 'sine', 900);
    if (s === 10 && bar % 2 === 0) e.chord(t, ch.slice(1), six * 4, 0.1, 'sine', 900);
    e.crackle(t);
  }
  function playOldschool(e, bar, s, t) {
    const line = [40, 40, 43, 45], six = e.six();
    if ([0, 6, 10].includes(s)) e.kick(t, 0.95);
    if (s === 4 || s === 12) { e.snare(t, 0.8); e.clap(t, 0.5); }
    if (s % 2 === 0) e.hat(t, 0.55); else e.hat(t, 0.22);
    const bassSteps = [0, 6, 10, 14];
    if (bassSteps.includes(s)) e.bass(t, line[bassSteps.indexOf(s)], six * 2.5, 0.6, 'sawtooth', 700);
    if ((s === 0 || s === 10) && bar % 2 === 0) e.chord(t, [52, 55, 59, 62], six * 1.5, 0.12, 'sawtooth', 2000);
  }
  function playCumbia(e, bar, s, t) {
    const prog = [[50, 53, 57], [55, 58, 62], [57, 61, 64], [50, 53, 57]];   // Dm Gm A Dm
    const ch = chordAt(prog, bar), root = ch[0] - 24, six = e.six();
    if (s % 4 === 0) e.guiro(t, 0.55, true); else if (s % 4 === 2 || s % 4 === 3) e.guiro(t, 0.4, false);
    if (s === 0 || s === 8) e.kick(t, 0.8);
    if (s === 4 || s === 12) e.rim(t, 0.6);
    if (s === 0) e.bass(t, root, six * 3, 0.65);
    if (s === 8) e.bass(t, root + 7, six * 3, 0.6);
    if (s === 14) e.bass(t, root + 5, six * 1.5, 0.45);
    if (s % 4 === 2) e.chord(t, ch.map(n => n + 12), six * 1.2, 0.1, 'square', 1800);
  }

  class BeatEngine {
    constructor() { this.ctx = null; this.playing = false; this.style = STYLES[0]; this.pendingStyle = null; this.bpm = 90; this.vol = 0.8; this.events = []; }
    init() {
      if (this.ctx) return;
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) throw new Error('Este navegador no soporta audio web');
      try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}   // iPhone: que suene aunque esté en silencio
      const ctx = this.ctx = new AC();
      this.master = ctx.createGain(); this.master.gain.value = this.vol;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -12; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.15;
      this.bus = ctx.createGain(); this.bus.gain.value = 0.7;
      // analizador para el visualizador de frecuencias (antes del volumen, así no se apaga al bajarle)
      this.analyser = ctx.createAnalyser(); this.analyser.fftSize = 2048; this.analyser.smoothingTimeConstant = 0.78;
      this.bus.connect(comp); comp.connect(this.analyser); this.analyser.connect(this.master); this.master.connect(ctx.destination);
      const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      this.loopSrc = null;
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    }
    six() { return 60 / this.bpm / 4; }
    isFile(st) { return !!(st || this.style).file; }
    async load(st) {
      // Descarga y decodifica un beat en archivo (se guarda en memoria para no bajarlo dos veces)
      this.init();
      this.buffers = this.buffers || {};
      if (this.buffers[st.id]) return this.buffers[st.id];
      const res = await fetch(st.file);
      if (!res.ok) throw new Error('No se pudo cargar ' + st.file);
      const data = await res.arrayBuffer();
      const buf = await new Promise((ok, bad) => {      // forma con callbacks: funciona también en Safari viejo
        const p = this.ctx.decodeAudioData(data, ok, bad);
        if (p && p.then) p.then(ok, bad);
      });
      // primer golpe: salta el silencio que agregan los codificadores MP3/AAC al inicio
      const d = buf.getChannelData(0); let off = 0;
      for (let i = 0; i < Math.min(d.length, buf.sampleRate); i++) if (Math.abs(d[i]) > 0.02) { off = i / buf.sampleRate; break; }
      this.buffers[st.id] = { buf, off };
      return this.buffers[st.id];
    }
    startLoop(st, t) {
      // Arranca el loop del archivo exactamente en el tiempo t (inicio de compás)
      this.stopLoop(t);
      const b = this.buffers && this.buffers[st.id];
      if (!b) return;
      const src = this.ctx.createBufferSource();
      // offset = segundo del primer golpe (tiempo 1). loopFrom/loopTo = compases que se repiten (sin intro ni fade final).
      const off = st.offset != null ? st.offset : b.off, bar = 240 / st.bpm;
      const from = st.loopFrom || 0, to = st.loopTo || st.bars;
      src.buffer = b.buf; src.loop = true;
      src.loopStart = off + from * bar; src.loopEnd = Math.min(b.buf.duration, off + to * bar);
      src.connect(this.bus); src.start(t, off);
      this.loopSrc = src;
    }
    stopLoop(t) { if (this.loopSrc) { try { this.loopSrc.stop(t || 0); } catch (e) {} this.loopSrc = null; } }
    setVolume(v) { this.vol = v; if (this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02); }
    setStyle(id, now) { const st = STYLES.find(x => x.id === id) || STYLES[0]; if (now || !this.playing) this.style = st; else this.pendingStyle = st; }
    setBpm(b) { this.bpm = b; }
    get now() { return this.ctx ? this.ctx.currentTime : 0; }
    start(countIn = true) {
      this.init();
      this.ctx.resume();
      this.stopTimer();
      this.stopLoop();
      this.step = 0; this.bar = countIn ? -1 : 0; this.events = [];
      this.nextTime = this.ctx.currentTime + 0.12;
      this.playing = true;
      this.timer = setInterval(() => this.schedule(), 25);
      this.schedule();
    }
    pause() { this.playing = false; this.stopTimer(); if (this.ctx) this.ctx.suspend(); }
    resume() {
      if (!this.ctx) return;
      this.ctx.resume().then(() => { this.nextTime = Math.max(this.nextTime, this.ctx.currentTime + 0.05); });
      this.playing = true; this.stopTimer(); this.timer = setInterval(() => this.schedule(), 25);
    }
    stop() { this.playing = false; this.stopTimer(); this.events = []; this.stopLoop(); if (this.ctx) this.ctx.suspend(); }
    stopTimer() { if (this.timer) clearInterval(this.timer); this.timer = null; }
    schedule() {
      if (!this.playing || !this.ctx) return;
      while (this.nextTime < this.ctx.currentTime + 0.12) { this.playStep(this.nextTime); this.advance(); }
    }
    playStep(t) {
      const s = this.step, st = this.style, six = this.six();
      if (s % 4 === 0) this.events.push({ t, bar: this.bar, beat: s / 4 });
      if (this.bar < 0) { if (s % 4 === 0) this.click(t, s === 0); return; }
      if (st.file) { if (s === 0 && (this.bar === 0 || this.loopStyleChanged)) { this.loopStyleChanged = false; this.startLoop(st, t); } return; }
      let tt = t;
      if (s % 4 === 2) tt += st.swing * six;                  // swing en las corcheas de contratiempo
      else if (s % 2 === 1) tt += st.swing * six * 0.5;
      st.play(this, this.bar, s, tt);
    }
    advance() {
      this.nextTime += this.six(); this.step++;
      if (this.step === 16) {
        this.step = 0; this.bar++;
        if (this.pendingStyle) {
          if (this.style.file && !this.pendingStyle.file) this.stopLoop(this.nextTime);
          this.style = this.pendingStyle; this.pendingStyle = null; this.loopStyleChanged = true;
        }
      }
    }
    // ── instrumentos ──
    env(g, t, v, dur) { g.gain.setValueAtTime(Math.max(v, 0.0002), t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
    noise(t, dur, type, freq, v, q) {
      const c = this.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = this.noiseBuf; f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
      this.env(g, t, v, dur); src.connect(f); f.connect(g); g.connect(this.bus);
      src.start(t, Math.random() * 1.5); src.stop(t + dur + 0.05);
    }
    tone(t, freq, dur, type, v, lp) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(v, 0.0002), t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      if (lp) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; o.connect(f); f.connect(g); } else o.connect(g);
      g.connect(this.bus); o.start(t); o.stop(t + dur + 0.05);
    }
    kick(t, v) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      this.env(g, t, v, 0.45); o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + 0.5);
    }
    snare(t, v, soft) { this.noise(t, soft ? 0.14 : 0.18, soft ? 'bandpass' : 'highpass', soft ? 1800 : 1400, v * 0.55, soft ? 0.8 : 0); this.tone(t, 185, 0.09, 'triangle', v * 0.35); }
    clap(t, v) { for (let i = 0; i < 3; i++) this.noise(t + i * 0.011, 0.03, 'bandpass', 1300, v * 0.5, 1.4); this.noise(t + 0.033, 0.16, 'bandpass', 1300, v * 0.42, 1.4); }
    hat(t, v, open) { this.noise(t, open ? 0.22 : 0.045, 'highpass', 8000, v * 0.3); }
    rim(t, v) { this.tone(t, 1750, 0.035, 'square', v * 0.18, 3000); this.noise(t, 0.02, 'bandpass', 2500, v * 0.2, 2); }
    guiro(t, v, long) { const n = long ? 6 : 2; for (let i = 0; i < n; i++) this.noise(t + i * 0.014, 0.012, 'bandpass', 4200, v * 0.35, 2.5); }
    click(t, accent) { this.tone(t, accent ? 2000 : 1500, 0.05, 'sine', accent ? 0.5 : 0.35); }
    bass(t, midi, dur, v, type, lp) { this.tone(t, m2f(midi), dur, type || 'triangle', v, lp || 600); }
    b808(t, midi, dur, v) {
      const c = this.ctx, o = c.createOscillator(), g = c.createGain(), f = m2f(midi);
      o.type = 'sine'; o.frequency.setValueAtTime(f * 1.6, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.05);
      g.gain.setValueAtTime(v, t); g.gain.setValueAtTime(v, t + dur * 0.5); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(this.bus); o.start(t); o.stop(t + dur + 0.05);
    }
    chord(t, midis, dur, v, type, lp) { midis.forEach((m, i) => this.tone(t + i * 0.004, m2f(m) * (1 + (i % 2 ? 0.0015 : -0.0015)), dur, type, v / midis.length * 1.6, lp)); }
    crackle(t) { if (Math.random() < 0.35) this.noise(t + Math.random() * this.six(), 0.004, 'highpass', 2500, 0.12); }
  }

  // ═══════════════════════ PRUEBAS ═══════════════════════
  function runFreestyleTests() {
    const T = [], t = (caso, ok, detalle) => T.push({ caso, ok: !!ok, detalle: detalle === undefined ? '' : String(detalle) });
    t('Banco con 400+ palabras sin repetir', BANK.length >= 400 && new Set(BANK.map(x => x.w.toLowerCase())).size === BANK.length, BANK.length + ' palabras');
    [1, 2, 3].forEach(l => t(`Nivel ${l} tiene 80+ palabras propias`, BANK.filter(x => x.lvl === l).length >= 80, BANK.filter(x => x.lvl === l).length));
    const g = createGenerator({ level: 1 }); const seq = Array.from({ length: 120 }, () => g.next().text);
    let rep = 0; for (let i = 0; i < seq.length; i++) for (let j = Math.max(0, i - 20); j < i; j++) if (seq[i] === seq[j]) rep++;
    t('Novato: sin repetir palabras en ventanas de 20', rep === 0, rep + ' repeticiones');
    t('Novato: solo palabras sueltas', seq.every(x => !x.includes(' + ')), '');
    const g3 = createGenerator({ level: 3 }); const types = {}; for (let i = 0; i < 300; i++) { const c = g3.next(); types[c.type] = (types[c.type] || 0) + 1; }
    t('Experto: mezcla palabras, pares, terminaciones y temas', types.word && types.pair && types.end && types.tema, JSON.stringify(types));
    const a = createGenerator({ level: 2, seed: 20261011 }), b = createGenerator({ level: 2, seed: 20261011 });
    const sa = Array.from({ length: 30 }, () => a.next().text).join('|'), sb = Array.from({ length: 30 }, () => b.next().text).join('|');
    t('Reto del día: misma semilla = mismas palabras', sa === sb, '');
    t('Compases por palabra a 90 BPM: 4 / 2 / 2', barsFor(1, 90) === 4 && barsFor(2, 90) === 2 && barsFor(3, 90) === 2, [1, 2, 3].map(l => barsFor(l, 90)).join('/'));
    t('Compases por palabra a 140 BPM: 8 / 4 / 2', barsFor(1, 140) === 8 && barsFor(2, 140) === 4 && barsFor(3, 140) === 2, [1, 2, 3].map(l => barsFor(l, 140)).join('/'));
    const gm = createGenerator({ level: 1, theme: 'mex' }); const mex = Array.from({ length: 15 }, () => gm.next().cat);
    t('Tema México: solo palabras de México', mex.every(c => c === 'mex'), mex.join(','));
    const fakeHouse = { house: true, unlock: 5 };
    t('Beats de la casa: bloqueados con 4 calificaciones, libres con 5', !isUnlocked(fakeHouse, 4) && isUnlocked(fakeHouse, 5) && isUnlocked(STYLES_PRACTICE[0], 0), '');
    const ok = T.filter(x => x.ok).length;
    if (typeof console !== 'undefined') { (console.table || console.log)(T); console.log(`Freestyle: ${ok}/${T.length} pruebas pasaron`); }
    return { passed: ok, total: T.length, results: T };
  }

  const api = { BANK, CATS, LEVELS, STYLES, STYLES_PRACTICE, HOUSE_BEATS, HOUSE_PRODUCER, UNLOCK_RATINGS, isUnlocked, ENDINGS, TEMAS, barsFor, createGenerator, hashStr, BeatEngine, runFreestyleTests };
  root.Freestyle = api;
  root.runFreestyleTests = runFreestyleTests;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
    if (typeof require !== 'undefined' && require.main === module) runFreestyleTests();
  }
})(typeof window !== 'undefined' ? window : globalThis);
