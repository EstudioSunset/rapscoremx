# RapScore MX — guía para Claude Code

Ranking comunitario de rap mexicano en **https://www.rapscoremx.com**. Proyecto de Estudio Sunset.
El dueño es Adn. Escríbele **en español**, claro y sin tecnicismos, y explica los cambios en términos de lo que ve el usuario del sitio.

## Cómo está armado
- **Sitio estático** en GitHub Pages desde la rama `main` del repo `EstudioSunset/rapscoremx` (dominio en `CNAME`). No hay build, ni npm, ni framework: HTML, CSS y JS sueltos. Un push a `main` se publica en 1–2 minutos.
- **Backend:** Firebase (proyecto `rapscoremx`). Auth con correo/contraseña y Google; Firestore para votos, propuestas y contribuyentes. El SDK se carga desde gstatic (v11.0.2) en un `<script type="module">` al final de `index.html`.
- **Avisos por correo:** Formspree (`https://formspree.io/f/xoejengj`). Se usa para propuestas nuevas y para el formulario de privacidad.

## Archivos
| Archivo | Qué es |
|---|---|
| `index.html` | Todo el sitio (~4,600 líneas): ranking, Votar, Por Estado, Admin, login, pop-ups. Las secciones se cambian con `goTo()` / `showSection()` y un hash (`#votar`, `#estados`, `#admin`…). |
| `firestore.rules` | Reglas de seguridad. **No se publican solas:** después de cambiarlas, Adn las pega en la consola de Firebase (Firestore Database → Reglas → Publicar). Siempre recuérdaselo. |
| `privacidad.html` | Aviso de privacidad con formulario de derechos (Formspree). |
| `votar.html`, `versus.html` | Solo redirigen a `index.html#votar` / `#comparar` conservando `location.search` (UTMs). |
| `artista.html` | Perfil de prueba de Alemán con datos inventados (89/100, etc.). Nadie lo enlaza. **Pendiente decidir:** borrarlo o convertirlo en perfil dinámico (`artista.html?a=slug`). |
| `images/rapscore-logo-transparente.png` | Logo oficial actual (el que usa el sitio). `images/rapscore-logo.png` es una versión vieja que solo usa `og:image`. |

## Datos y reglas del ranking
- Los artistas están en `const RAW_ARTISTS = [...]` dentro de `index.html`. Campos: `name`, `tier` (`legend` | `active` | `emerging`), `estado` (nombre exacto de la lista `ESTADOS`), `tags` (el primero se muestra como ciudad), `bio`, y `female: true` cuando aplica. Roster actual: 68.
- `slug = slugify(name)`. **Cada artista nuevo necesita su slug en `knownArtists()` de `firestore.rules`**, si no, sus votos fallan con permission-denied.
- Todos arrancan en `BASE_SCORE = 50`. Con votos: promedio bayesiano con `COMMUNITY_WEIGHT_K = 5`. 6 categorías: flow, lírica, contenido, versatilidad, hooks, impacto.
- El ranking muestra el **Top 50** por total (`RANKING_SIZE`). El resto aparece en **"En la fila"**. Desempate: más votos y luego el orden en `RAW_ARTISTS`.
- Puntos de contribuyente: +10 por cada artista calificado por primera vez, +20 por cada propuesta aprobada. Estas cifras están validadas también en `firestore.rules`.
- Admin = existe el doc `admins/{uid}` (se crea a mano en la consola) y el correo está verificado.
- Las bios deben ser **verificables**: sin calificaciones inventadas ni datos sin fuente. La investigación del roster está en el proyecto de claude.ai ("investigacion-roster-oct-2026").

## Diseño
- Estética de calle: muro de ladrillo con graffiti en el hero, ticker como cinta de precaución, Top 5 como carteles pegados, footer con goteo de pintura.
- Colores: fondo `#0a0a0a`, acento naranja `#ff3c00` (el del logo), amarillo `#ffcc00` para Votar. Fuentes: Bebas Neue, Permanent Marker y Space Mono.
- Todas las páginas llevan los mismos tabs: Rankings · Votar · Por Estado · Emergentes · Comparar · Editorial (Admin solo para admins en `index.html`).
- Tiene que funcionar en celular. La mayoría del tráfico viene de Facebook/TikTok.
- Fotos de raperos: solo con permiso, licencia o foto propia (sin descargar de Google o Instagram). Por ahora se usan iniciales.

## Medición
- **GA4** vía Firebase Analytics (`G-D6QMGC5N67`) y **Microsoft Clarity** (`yvosalsr5z`, en `window.RS_CLARITY_ID`).
- Para medir algo nuevo usa `rsTrack('nombre_evento', { ... })` (manda a GA4 y Clarity, con cola hasta que carga Firebase), o pon `data-track="nombre"` en un botón para mandar un `cta_click`.
- Eventos actuales: `rate_artist`, `sign_up`, `login`, `propose_artist`, `share` (estos cuatro son eventos clave), `section_view`, `view_artist`, `compare_artists`, `search`, `filter_ranking`, `popup_view`, `cta_click`.
- Tráfico interno: `?rs_internal=1` o sesión de admin → `traffic_type=internal`.
- Si cambia qué datos se recopilan, actualiza `privacidad.html`.

## Cómo trabajar
- Edita los archivos y **pruébalo antes de subirlo** (abre la página y revisa la consola). No rompas el flujo de votar ni el de login.
- Commits en español y descriptivos. Push directo a `main`, salvo que Adn pida rama o PR.
- Al terminar, dile a Adn en 2–3 líneas qué cambió en el sitio y si le toca hacer algo (por ejemplo, publicar reglas de Firebase).

## Pendientes conocidos
- Publicar `firestore.rules` en Firebase con los 13 slugs nuevos (sin eso no se puede votar por los artistas agregados el 10 oct 2026).
- En GA4: subir la retención de datos a 14 meses, marcar los eventos clave, crear dimensiones personalizadas (`artist_name`, `section`, `cta`, `filter`, `popup`, `estado`; de usuario: `logged_in`) y activar el filtro de tráfico interno.
- Decidir qué hacer con `artista.html`.
- Llenar las redes en `const SOCIAL = {facebook, instagram, tiktok}` (hoy están vacías y se muestran como "muy pronto").
- Verificar el origen de Lirika Inverza (está puesto como CDMX).
- Opcional: campo de foto con casilla de derechos en el formulario de propuestas.
