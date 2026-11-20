# RapScore MX — Plan de crecimiento (90 días)

_Escrito el 19 nov 2026. Presupuesto bajo, poco mantenimiento. Todo en español de México._

## Punto de partida (medido, no supuesto)

| Dato | Valor | Fuente |
|---|---|---|
| Raperos en el roster | 107 | `RAW_ARTISTS` en `index.html` |
| Calificaciones totales | **70** | Firestore `artistStats`, leído en vivo el 19 nov 2026 |
| Raperos con al menos 1 voto | 69 | igual |
| Raperos con 5 votos o más | **0** | igual (68 tienen 1 voto; C-Kan tiene 2) |
| Visitas, registros, fuentes de tráfico | **No verificado** | No tenemos acceso a GA4 / Clarity desde aquí. Adn debe sacar la línea base (ver abajo). |

**Conclusión:** hoy el ranking es, en la práctica, la opinión de 1 o 2 personas. El objetivo número uno de los primeros 30 días no es tráfico: es **que 30–50 personas reales califiquen** para que el Top tenga sentido. Por eso el sitio ahora marca "provisional" cualquier lugar con menos de 5 votos.

### Línea base que Adn debe anotar antes de promover (10 minutos en GA4)
1. GA4 → Informes → Adquisición de tráfico, últimos 28 días: usuarios, sesiones con interacción, por fuente.
2. GA4 → Eventos: conteo de `rate_artist`, `sign_up`, `share`, `vote_start` (nuevo), `vote_blocked_auth` (nuevo).
3. Search Console (si no está dado de alta, darlo de alta con el dominio `rapscoremx.com` y mandar `sitemap.xml`).
Anota los números en la tabla de KPIs de abajo, columna "Base".

## Embudo y dónde se rompe

Visita → ve el Top → toca un rapero → califica las 6 categorías → **le pide cuenta** → confirma correo → guarda → comparte → regresa.

- El paso que más gente pierde (por diseño) es **la cuenta**. Ya no se pierde la calificación al pedir la cuenta (se queda apartada), y el evento `vote_blocked_auth` mide cuánta gente choca ahí.
- Medir: `vote_start` → `vote_blocked_auth` → `sign_up` → `rate_artist`. Si de 100 `vote_start` menos de 25 terminan en `rate_artist`, el siguiente arreglo es en el login (ver "Experimentos").

## Antes de promover (esta semana)
1. Publicar los cambios de esta auditoría (push a `main`).
2. Revisar los puntos "Falló" de `docs/launch-checklist.md`.
3. Dar de alta Search Console y mandar el sitemap.
4. En GA4: marcar como eventos clave `rate_artist`, `sign_up`, `share`; crear la dimensión `artist_slug`.
5. Tener listas 10 piezas de video corto (ver formatos).

## Días 1–14: los primeros 50 votantes reales
Meta: **50 cuentas que califiquen**, **5 raperos con 5+ votos** (sale el aviso de "ranking en arranque" del Top).

- **Grupos de Facebook de rap mexicano por estado** (Chiapas, Veracruz, NL, Jalisco…): post con la pregunta "¿Quién es el mejor de [estado]? Califíquenlo aquí" + link `rapscoremx.com/?calificar=<slug>` del rapero más querido del estado. Un estado por día, sin spam: un post por grupo.
- **Raperos emergentes del roster** (los 22 sin estado confirmado y los emergentes): mandarles por DM su link directo `?calificar=<slug>` y pedirles que confirmen su ciudad. Ellos lo comparten con sus fans → votos reales + datos verificados. Aclararles que se vale pedir votos a fans reales, no hacer cuentas falsas (Admin → "Votos sospechosos" las detecta).
- **TikTok / Reels / Shorts, 1 al día:** formato "Top 5 provisional: ¿está bien o está mal? Comenta a quién le falta", pantalla del sitio grabada en celular.
- **Rap News semanal:** ya existe; cada edición lleva "★ Califica a …". Compartirla los domingos.

## Días 15–30: hacer que regresen
Meta: 150 cuentas, 20 raperos con 5+ votos, primeras visitas de Google.

- **"Movimientos de la semana"** (video + post): quién subió y quién bajó. Necesita votos reales; no inventar cambios.
- **Retos por estado:** "Semana de Nuevo León": se comparte el mapa por estado y el link a sus raperos.
- **Freestyle Lab / Batalla:** clips de gente usando el Freestyle Lab con el "Reto del día" (ya existe semilla diaria).

## Días 31–60: Google
Meta: aparecer para "ranking raperos mexicanos" y "raperos de [estado]".

- **Páginas por rapero estáticas** (`/artistas/<slug>/`), generadas con un script como el de `noticias/fuente/build.js`: bio verificada, estado, calificación actual con número de votos, botones "Escúchalo" y "Califícalo". Solo para raperos con bio con fuente. Es el mayor salto de SEO posible; hoy los 107 raperos solo existen dentro de JavaScript.
- **Páginas por estado** (`/raperos-de-chiapas/` etc.) solo para estados con 5+ raperos y texto propio (escena, ciudades). Nada de páginas vacías.
- Enlazar desde las noticias a las páginas de rapero.

## Días 61–90: comunidad
Meta: 500 cuentas, 50 raperos con 5+ votos, 30% de visitantes que regresan.

- Ranking mensual "oficial" (solo raperos con 5+ votos) con video de anuncio.
- Invitar a 3–5 creadores de contenido de rap a hacer su "Top 5" en el sitio.
- Perfil verificado para raperos que lo pidan (corrigen bio y ciudad con link de prueba). Ya está planeado como "proponer ciudad" (en pausa).

## Formatos de contenido que se repiten (sin costo)
1. "¿Quién gana? A vs B" con la calificación de cada uno (link a ambos).
2. Top 5 por estado.
3. Emergente de la semana (con su link `?calificar=`).
4. Movimientos de la semana.
5. Reto de freestyle del día (Freestyle Lab).
6. Dato de historia del rap mexicano (verificable, con fuente).

## KPIs

| KPI | Base | Meta día 14 | Meta día 30 | Meta día 90 |
|---|---|---|---|---|
| Calificaciones totales | 70 | 400 | 1,200 | 6,000 |
| Cuentas que calificaron | ~1–2 | 50 | 150 | 500 |
| Raperos con 5+ votos | 0 | 5 | 20 | 50 |
| `vote_start` → `rate_artist` | por medir | >25% | >35% | >40% |
| Calificaciones por cuenta | por medir | 4 | 5 | 6 |
| Shares (`share`) | por medir | 30 | 120 | 600 |
| Clics de Google (Search Console) | por medir | — | 50/mes | 500/mes |
| Visitantes que regresan | por medir | — | 15% | 30% |

Las metas son propuestas, no resultados. Ajustarlas con la línea base real.

## Experimentos recomendados (uno a la vez, 2 semanas cada uno)
1. Abrir el registro en modo "Crear cuenta" en lugar de "Entrar" cuando la persona viene de calificar. Medir `sign_up` / `vote_blocked_auth`.
2. Mostrar "Sé el voto #2 de C-Kan" en el Top 5 (empuja a los raperos con pocos votos).
3. Botón "Compartir" directo en la ficha del rapero (hoy solo sale tras votar).

## Pago (opcional, solo después del día 30)
- Si la conversión `vote_start` → `rate_artist` es mayor a 30%: anuncios de Meta de $50–100 MXN/día a fans de rap mexicano en 3 estados, link directo a `?calificar=` de un rapero local. Medir costo por calificación. Parar si pasa de $10 MXN por calificación.
- No pagar por seguidores ni por votos. Nunca.
