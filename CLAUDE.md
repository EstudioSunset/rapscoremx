# RapScore MX — guía para Claude Code

Ranking comunitario de rap mexicano en **https://www.rapscoremx.com**. Proyecto de Estudio Sunset.
El dueño es Adn. Escríbele **en español**, claro y sin tecnicismos, y explica los cambios en términos de lo que ve el usuario del sitio.

## Cómo está armado
- **Sitio estático** en GitHub Pages desde la rama `main` del repo `EstudioSunset/rapscoremx` (dominio en `CNAME`). No hay build, ni npm, ni framework: HTML, CSS y JS sueltos. Un push a `main` se publica en 1–2 minutos.
- **Backend:** Firebase (proyecto `rapscoremx`). Auth con correo/contraseña y Google; Firestore para votos, propuestas y contribuyentes. El SDK se carga desde gstatic (v11.0.2) en un `<script type="module">` al final de `index.html`.
- **Avisos por correo:** Formspree (`https://formspree.io/f/xoejengj`). Se usa para propuestas nuevas, el buzón de sugerencias y el formulario de privacidad.
- **Buzón de sugerencias:** sale solo tras 60 s de uso activo (`SUG_ACTIVE_SECONDS`), una vez; si lo cierran queda la pestaña "Sugerencias" y no se reabre solo en 7 días.

## Archivos
| Archivo | Qué es |
|---|---|
| `index.html` | Todo el sitio: portada, ranking, Votar, Por Estado, Admin, login, pop-ups. Las secciones se cambian con `goTo()` / `showSection()` y un hash (`#votar`, `#estados`, `#emergentes`, `#admin`). La portada (clases `nh-*`, oct 2026) tiene hero con imagen, franja de características, Top 5 en tarjetas, ranking corto (10 filas + "Ver todos"), Explora por estado/categoría y franja final para votar. |
| `firestore.rules` | Reglas de seguridad. **No se publican solas:** después de cambiarlas, Adn las pega en la consola de Firebase (Firestore Database → Reglas → Publicar). Siempre recuérdaselo. |
| `privacidad.html` | Aviso de privacidad con formulario de derechos (Formspree). |
| `votar.html`, `versus.html` | Solo redirigen a `index.html#votar` / `index.html` conservando `location.search` (UTMs). |
| `artista.html` | Perfil de prueba de Alemán con datos inventados (89/100, etc.). Nadie lo enlaza. **Pendiente decidir:** borrarlo o convertirlo en perfil dinámico (`artista.html?a=slug`). |
| `images/rapscore-logo-transparente.png` | Logo oficial actual (el que usa el sitio). `images/rapscore-logo.png` es una versión vieja que solo usa `og:image`. |

## Datos y reglas del ranking
- Los artistas están en `const RAW_ARTISTS = [...]` dentro de `index.html`. Campos: `name`, `tier` (`legend` | `active` | `emerging`), `estado` (nombre exacto de la lista `ESTADOS`), `tags` (el primero se muestra como ciudad), `bio`, y `female: true` cuando aplica. Roster actual: 89 (21 agregados el 11 oct 2026; 20 de ellos sin estado confirmado).
- Mapa por estado: cada artista es un punto en su ciudad (primer tag) si está en `CITY_COORDS` de `index.html` (lat/lon); si no, en el centro de su estado; sin estado, gris en el centro del país ("origen por confirmar"). Al agregar un artista de una ciudad nueva, agrega la ciudad a `CITY_COORDS`.
- Botones "Escúchalo" en Votar y en la ficha del ranking. Spotify: si el slug está en `SPOTIFY_IDS` (index.html) el botón va al perfil oficial y aparece "▶ Escuchar aquí", que carga el reproductor oficial **solo al tocarlo**; si no, búsqueda. YouTube: `youtube` en `RAW_ARTISTS` o búsqueda.
- `embeds-artistas.json`: investigación de perfiles de Spotify (oct 2026), verificados con créditos de canciones + oEmbed oficial. En `SPOTIFY_IDS` solo están los "confirmado" (67; Hadrian, Sick Morrison, Smoky y Eanz los confirmó Adn). Falta Eric El Niño: no se encontró perfil. Nunca usar URLs de imágenes: solo embeds oficiales (lo dice el aviso legal del footer).
- `slug = slugify(name)`. **Cada artista nuevo necesita su slug en `knownArtists()` de `firestore.rules`**, si no, sus votos fallan con permission-denied.
- Todos arrancan en `BASE_SCORE = 50`. Con votos: promedio bayesiano con `COMMUNITY_WEIGHT_K = 5`. 6 categorías: flow, lírica, contenido, versatilidad, hooks, impacto.
- El ranking muestra el **Top 50** por total (`RANKING_SIZE`). El resto aparece en **"En la fila"**. Desempate: más votos y luego el orden en `RAW_ARTISTS`.
- Puntos de contribuyente: +10 por cada artista calificado por primera vez, +20 por cada propuesta aprobada. Estas cifras están validadas también en `firestore.rules`.
- Admin = existe el doc `admins/{uid}` (se crea a mano en la consola) y el correo está verificado.
- Las bios deben ser **verificables**: sin calificaciones inventadas ni datos sin fuente. La investigación del roster está en el proyecto de claude.ai ("investigacion-roster-oct-2026").

## Diseño
- Estética de calle pero seria: hero con foto (`images/artistas/rapero-entre-humo-y-sombras.webp`), Top 5 en tarjetas oscuras, footer con goteo de pintura.
- Colores: fondo `#0a0a0a`, acento naranja `#ff3c00` (el del logo), amarillo `#ffcc00` para Votar. Fuentes: Bebas Neue, Saira Stencil One (toques de calle) y Space Mono. **No usar Permanent Marker** (Adn la quitó: se ve infantil).
- Todas las páginas llevan los mismos tabs: Rankings · Votar · Por Estado · Emergentes (Admin solo para admins en `index.html`). Comparar y Editorial se quitaron en oct 2026 por no ser útiles todavía.
- Tiene que funcionar en celular. La mayoría del tráfico viene de Facebook/TikTok.
- Fotos de raperos: solo con permiso escrito, licencia libre verificada (Creative Commons) o foto propia; nunca descargadas de Google o redes, ni links directos a imágenes. Las fotos van en `images/artistas/<slug>.jpg` (máx. 600 px) y en `ARTIST_PHOTOS` de `index.html` con autor, licencia y link: el crédito se muestra junto a la foto y en "Créditos de fotos" del footer (lo exige la licencia). Hoy hay 11 de Wikimedia Commons. Quien no tiene foto lleva un avatar de graffiti generado (`graffitiAvatar`, iniciales + colores fijos por nombre; corona = leyenda, estrella = emergente).
- Fotos de Commons descartadas tras revisarlas (oct 2026): Akwid y Neto Peña (no se distingue a la persona), Charles Ans (solo un letrero). Sabino: no se usa (retrato de estudio profesional subido como "obra propia" en CC0; probable foto de un tercero). Alemán, Kinto Sol y Mare Advertencia los confirmó Adn.

## Medición
- **GA4** vía Firebase Analytics (`G-D6QMGC5N67`) y **Microsoft Clarity** (`yvosalsr5z`, en `window.RS_CLARITY_ID`).
- Para medir algo nuevo usa `rsTrack('nombre_evento', { ... })` (manda a GA4 y Clarity, con cola hasta que carga Firebase), o pon `data-track="nombre"` en un botón para mandar un `cta_click`.
- Eventos actuales: `rate_artist`, `sign_up`, `login`, `propose_artist`, `share` (estos cuatro son eventos clave), `section_view`, `view_artist`, `search`, `filter_ranking`, `popup_view`, `cta_click`, `listen_click` (YouTube/Spotify), `send_suggestion`.
- Tráfico interno: `?rs_internal=1` o sesión de admin → `traffic_type=internal`.
- Si cambia qué datos se recopilan, actualiza `privacidad.html`.

## Cómo trabajar
- Edita los archivos y **pruébalo antes de subirlo** (abre la página y revisa la consola). No rompas el flujo de votar ni el de login.
- Commits en español y descriptivos. Push directo a `main`, salvo que Adn pida rama o PR.
- Al terminar, dile a Adn en 2–3 líneas qué cambió en el sitio y si le toca hacer algo (por ejemplo, publicar reglas de Firebase).

## Pendientes conocidos
- Publicar `firestore.rules` en Firebase: trae los slugs de los 13 artistas del 10 oct y los 21 del 11 oct 2026. Sin eso, sus votos fallan con permission-denied.
- Confirmar estado y ciudad de los agregados el 11 oct (todos menos Primero Company, que es de Ecatepec). Excluidos de esa lista por falta de datos o por no ser raperos: Tocadiscos Trez, Shei Durand, Mezcal Music, Phrase, Mess, Esencia Mx, Bajo Perfil Crew, JASE ODC, Cadeellac, Blanco Pikete.
- En GA4: subir la retención de datos a 14 meses, marcar los eventos clave, crear dimensiones personalizadas (`artist_name`, `section`, `cta`, `filter`, `popup`, `estado`; de usuario: `logged_in`) y activar el filtro de tráfico interno.
- Decidir qué hacer con `artista.html`.
- Agregar Instagram en `const SOCIAL` de `index.html` cuando exista la cuenta (Facebook y TikTok ya están puestos; Instagram se muestra como "muy pronto").
- Verificar el origen de Lirika Inverza (está puesto como CDMX).
- Opcional: campo de foto con casilla de derechos en el formulario de propuestas.
- En pausa (Adn lo pidió así): que usuarios propongan corregir la ciudad de origen de un rapero (ciudad + link de prueba → revisión en Admin → se mueve el punto; da puntos). Requiere cambiar `firestore.rules`.
