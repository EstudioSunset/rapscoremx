# RapScore MX — Auditoría de lanzamiento

_19 nov 2026. Revisión del repo (`main` @ 33941b3 + cambios de esta auditoría) y del sitio en vivo. Nada se publicó: todo está en un commit local esperando el visto bueno de Adn._

## Cómo se hizo
- Lectura del código completo y prueba del sitio en vivo y en local (navegador, escritorio y celular 375 px).
- Tres revisiones en paralelo: seguridad de Firebase (Opus 5.5), SEO + velocidad (Sonnet 5.5), experiencia + medición (Sonnet 5.5). La consolidación y los cambios los hizo Opus 5.5.
- Pruebas automáticas existentes: `node letras.js` 25/25 ✓, `node freestyle.js` 12/12 ✓. Sintaxis de los 12 bloques de script de `index.html` ✓. Consola sin errores en vivo y en local.
- **No verificado:** reglas de Firebase en un emulador (no hay Java en esta compu), registro/login reales, guardar un voto real (no se crearon cuentas ni votos de prueba en producción, a propósito), Lighthouse (no instalado), datos de GA4 / Clarity / Search Console (sin acceso).

## Respuesta corta: ¿está listo para promoverse hoy?
**Casi.** El sitio funciona, es seguro en lo básico y se ve bien en celular. Lo que faltaba para promoverlo sin quedar mal ya está arreglado en el commit local (ranking honesto, voto que no se pierde, link de compartir directo, imagen para Facebook, reglas más duras). Faltan 3 cosas que solo Adn puede hacer: **publicar (push)**, **confirmar que las reglas de Firebase se publicaron** y **activar App Check**. Ver orden exacto al final.

---

## Hallazgos

### P0 — Bloqueaban el lanzamiento

| # | Hallazgo y evidencia | Impacto | Solución | Estado |
|---|---|---|---|---|
| P0-1 | **El "Top 5 de la comunidad" era la opinión de 1–2 personas.** En vivo: 70 calificaciones en 69 raperos; 68 con 1 voto, C-Kan con 2; nadie con 5+. `rankCmp` solo separaba "con votos" de "sin votos". | Quien llega de TikTok ve un "ranking de la comunidad" que no lo es. Daña la credibilidad, que es todo el producto. | Posición **firme** = 5+ votos (`MIN_VOTES_FIRM`). Con 1–4 votos se marca **"provisional"** en tabla y Top 5. El orden es firmes → provisionales → sin calificar. Aviso "Ranking en arranque" con conteos reales mientras haya menos de 5 firmes. **El cálculo del score no cambió.** Por qué 5: con K=2, a los 5 votos la comunidad ya pesa 71% y una sola cuenta mueve el promedio menos de 20%. | ✅ Hecho y probado |
| P0-2 | **La calificación se borraba al pedir cuenta.** Lo que tocaba la persona vivía solo en la pantalla; `refreshVotar()` la redibuja al iniciar sesión, al llegar los votos o tras el login de Google con recarga. | Se pierde a la gente justo en el paso más caro del embudo: tenían que volver a tocar las 6 categorías. | Borrador en `sessionStorage` (`RATE_DRAFT`, solo en esa pestaña, se borra al guardar). Mensajes nuevos: "Tu calificación queda apartada…". | ✅ Hecho y probado (sobrevive a redibujar y a recargar) |
| P0-3 | **Compartir mandaba al link genérico `/votar`**, aunque el texto nombraba al rapero. Sin UTM. | El tráfico compartido no llegaba al rapero ni se podía medir de qué red venía. | Link `/?calificar=<slug>&utm_source=<red>&utm_medium=share&utm_campaign=voto_artista`. Texto: "¿Tú cuánto le pones del 1 al 10?". | ✅ Hecho y probado |
| P0-4 | **Una persona podía crear muchas cuentas "verificadas"** con `nombre+1@gmail.com`, `nombre+2@…` (todos los correos llegan al mismo buzón). `verified()` en `firestore.rules`. | Con K=2 y pocos votos, 3–4 cuentas así deciden el #1. | Regla `aliasEmail()`: correos con `+` no pueden votar ni proponer; el registro avisa antes. (El truco de los puntos de Gmail sigue abierto: ver P1-6.) | ✅ En el commit; **falta publicar reglas** |

### P1 — Alto impacto

| # | Hallazgo y evidencia | Solución | Estado |
|---|---|---|---|
| P1-1 | Imagen para compartir = logo de 1448×426 y 694 KB. Facebook lo recorta mal; es la fuente principal de tráfico. | `images/og-rapscore.jpg` 1200×630, 109 KB (foto del hero + logo + "El ranking del rap mexicano"). Más `og:image:width/height/alt`, `og:locale es_MX`, `twitter:*`, `theme-color`. También en `votar.html` y en `noticias/fuente/build.js` (las noticias se actualizan en la siguiente edición). | ✅ Hecho |
| P1-2 | Fuentes: se bajaban 11 variantes, se usan 7; sin `preconnect`. Frena la primera pintura en celular. | `preconnect` y solo los pesos usados (Barlow 400/700, Syne 700). | ✅ Hecho (verificado: cargan las 7 y nada se ve distinto) |
| P1-3 | Texto gris `#666` sobre negro: contraste 3.4:1 (no pasa WCAG AA). Se usa en 94 lugares. | `--muted: #8f8f8f` (~6:1). | ✅ Hecho |
| P1-4 | Sin `vote_start`, `signup_start` ni evento de "chocó con la cuenta": el embudo no se podía medir. | Nuevos: `vote_start` (primer toque por rapero), `vote_blocked_auth` (`reason: anon / unverified`), `signup_start` (`mode`). Sin datos personales. | ✅ Hecho y probado |
| P1-5 | Puntuaciones fuera de escala: las reglas aceptaban 1–100; alguien podía mandar 1 (= "0.1"). | `validScore`: solo 10, 20 … 100. Los votos viejos no se tocan. | ✅ En el commit; falta publicar reglas |
| P1-6 | Truco de puntos de Gmail (`n.ombre@gmail.com`). | Opción: exigir "Entrar con Google" para Gmail (obligaría a los usuarios de Gmail con contraseña a cambiar). **Decisión de Adn.** Mientras, el panel "Votos sospechosos" y App Check. | ⏳ Pendiente de decisión |
| P1-7 | Sin App Check: cualquiera con la llave pública puede leer en bucle. Cada visita lee ~135 documentos (artistStats completo, propuestas, `banned` completo). En plan gratis, ~350 visitas/día agotan las 50 mil lecturas y el ranking sale vacío. | Activar App Check (reCAPTCHA v3, ya documentado en CLAUDE.md) + alerta de presupuesto en Google Cloud. Después: no leer `banned` completo. | ⏳ Lo activa Adn |
| P1-8 | Se podían meter muchas propuestas en un solo lote (el límite de 10 min no se cumplía). | `limits/{uid}.lastProposalId` debe ser la propuesta que se crea (regla + cliente). | ✅ En el commit; falta publicar reglas |
| P1-9 | Cambiar una calificación sin límite: una cuenta podía saturar `artistStats` de un artista. | Máximo un cambio cada 30 s por calificación; mensaje claro si pasa. | ✅ En el commit; falta publicar reglas |
| P1-10 | Los 107 raperos solo existen dentro de JavaScript: 0 nombres en el HTML, 2 encabezados. Google los ve tarde o nunca. | Generar páginas estáticas por estado (`/raperos/nuevo-leon/` …) con un script como `noticias/fuente/build.js`. Solo estados con 3+ raperos (NL 22, CDMX 12, Jalisco 8, Veracruz 6, Sonora 5, Chiapas 5…). Páginas por rapero: después, cuando haya más texto verificable por bio. | ⏳ Siguiente proyecto (no se hizo: es contenido nuevo y necesita revisión de Adn) |
| P1-11 | Batalla (`/batalla/`) no regresa a votar: fuga del embudo. | Botón en la pantalla de resultado: "Califica a tus raperos" → `/?calificar=…`. | ⏳ Pendiente |

### P2 — Crecimiento

| # | Hallazgo | Solución | Estado |
|---|---|---|---|
| P2-1 | Sin página 404 propia (salía la de GitHub). | `404.html` con la marca y links a ranking, votar y noticias. | ✅ Hecho |
| P2-2 | Las ventanas no cerraban con Esc. | Esc cierra registro, compartir, bienvenida, ajuste y la ficha por estado. | ✅ Hecho y probado |
| P2-3 | `votar.html` con canonical a `/#votar` (un fragmento). | Canonical a `/`. | ✅ Hecho |
| P2-4 | En celular, los textos de aviso quedaban pegados a la orilla. | Margen de 14 px. | ✅ Hecho |
| P2-5 | En celular la etiqueta "LEYENDA" se encima con el score en la tabla (ya pasaba antes). | Mover la etiqueta abajo del nombre en pantallas angostas. | ⏳ Pendiente |
| P2-6 | La fila del ranking solo se abre con la flechita "▾"; la flecha no tiene `aria-label`/`aria-expanded`. | Que toda la fila abra la ficha. | ⏳ Pendiente |
| P2-7 | El botón Atrás saca del sitio (`goTo` usa `replaceState`). | Usar `pushState` + escuchar `popstate`. | ⏳ Pendiente (tocar navegación tiene riesgo; probar bien) |
| P2-8 | No hay botón "Compartir" en la ficha del rapero, solo tras votar. | Botón con el mismo link directo. | ⏳ Pendiente |
| P2-9 | Si Firestore falla al cargar, el contador se queda en "…" sin aviso. | Mensaje "No pudimos cargar las calificaciones · Reintentar" + evento. | ⏳ Pendiente |
| P2-10 | La edición de Rap News del 15 nov está en la rama `noticias/2026-11-15` sin fusionar. | Revisar y fusionar el PR (actualiza el sitemap solo). | ⏳ Adn |
| P2-11 | `users/{uid}` acepta cualquier campo; el correo viene del formulario y no del token. | Limitar campos e igualar `email` al del token. No se hizo porque un error aquí rompe el registro y no hay emulador para probarlo. | ⏳ Pendiente (con emulador) |
| P2-12 | Los datos públicos de `banned` y `artistStats.lastVoid` muestran IDs de cuentas. | Guardar `hidden:true` en el contribuyente en lugar de leer `banned` completo. | ⏳ Pendiente |

### P3 — Futuro
- Páginas por rapero cuando haya bios más completas (y decidir `artista.html`, que tiene datos inventados y ya es `noindex`).
- `stats.json` semanal generado por GitHub Actions para no leer Firestore en cada visita.
- Imagen del hero en 800 px con `srcset` para celular; cargar Firebase Auth/Firestore después de la primera interacción.
- Borrar imágenes sin uso en `images/` (~1 MB: `473069010_…jpg`, `Babo,_Cartel_de_Santa.jpg`, etc.) tras confirmar que nada las usa.
- JSON-LD de `noticias/fuente/build.js`: escapar `<` (`JSON.stringify(x).replace(/</g,'\\u003c')`).
- Usar `data-id` + `addEventListener` en los botones del Admin en lugar de `onclick` con texto.
- Aviso de cookies / forma de desactivar Clarity (la ley mexicana no lo exige como en Europa; el aviso de privacidad ya lo menciona).

## Lo que está bien (verificado)
- **Integridad del voto:** una calificación por cuenta y artista (`uid_slug`); las estadísticas solo cambian junto con tu propia calificación y deben cuadrar al punto; no se pueden tocar votos ajenos; las carreras se rechazan.
- **Puntos:** nadie se da puntos de más; +20 solo lo da el admin.
- **Datos personales:** los correos (`users`) solo los lee su dueño; las calificaciones individuales solo su dueño y el admin.
- **XSS:** todo texto de usuario que entra al HTML pasa por `esc()`. No se encontró forma de inyectar código.
- **Listas iguales:** correos desechables en `index.html` y `firestore.rules` (54 dominios). Slugs: los 107 raperos están en `knownArtists()`.
- **Secretos:** la única llave en el repo es la `apiKey` pública de Firebase (normal). No hay llaves privadas en el historial.
- **Dominio:** http → https y sin-www → www en un solo salto (301). `robots.txt` y `sitemap.xml` correctos. Canonicals bien en inicio, noticias, batalla y privacidad.
- **Medición:** sin datos personales en eventos; tráfico interno marcado; Clarity no graba bots ni visitas internas.

## Archivos que cambiaron
| Archivo | Cambio |
|---|---|
| `index.html` | Ranking provisional (`MIN_VOTES_FIRM`, `rankTier`, `votesLabel`, `updateRankNotice`, `#rankNotice`), borrador de calificación (`RATE_DRAFT`), mensajes de cuenta, link de compartir con UTM, Esc, eventos nuevos, bloqueo de correos con `+` al registrarse, `lastProposalId`, contraste, fuentes, metadatos para compartir, márgenes en celular. |
| `firestore.rules` | `aliasEmail()`, `validScore` en múltiplos de 10, límite de 30 s para cambiar calificación, `lastProposalId`. |
| `votar.html` | Imagen para compartir y canonical. |
| `noticias/fuente/build.js` | `OG_IMG` → `og-rapscore.jpg`. |
| `404.html` | Nuevo. |
| `images/og-rapscore.jpg` | Nuevo (1200×630, 109 KB). |
| `docs/*.md` | Esta auditoría, el checklist y el plan de crecimiento. |
| `CLAUDE.md` | Notas de las reglas nuevas. |

## Cómo publicar sin riesgo (para Adn)
1. Revisa el commit local y haz push a `main` (o pídeselo a Claude).
2. En GitHub → **Actions**: revisa que "Publicar reglas de Firebase" salga en verde. Si dice que falta `FIREBASE_SERVICE_ACCOUNT`, copia `firestore.rules` a Firebase → Firestore → Reglas → Publicar.
3. Prueba en tu celular, en una ventana de incógnito: entra, califica a un rapero, guarda. Luego cambia la calificación (espera 30 s) y guarda otra vez. Propón un rapero de prueba y bórralo desde Admin.
4. Si algo falla al votar: en Firebase → Reglas, botón "Historial" → restaura la versión anterior (es inmediato) y avísale a Claude con el mensaje que salió.
5. En el [Depurador de Facebook](https://developers.facebook.com/tools/debug/) pega `https://www.rapscoremx.com/` y toca "Volver a extraer" para que tome la imagen nueva.
