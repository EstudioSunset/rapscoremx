# RapScore MX — Checklist de lanzamiento

_19 nov 2026. Estados: ✅ Pasó · ❌ Falló · ⚪ No verificado · ➖ No aplica. "Local" = probado con el commit local antes de publicar._

## Funciona lo básico
| Requisito | Estado | Evidencia / cómo verificar |
|---|---|---|
| Portada carga sin errores en consola | ✅ | En vivo y local, consola limpia |
| Top 5 y ranking se llenan con los votos reales | ✅ | 50 en el Top + 57 "En la fila", conteos iguales a Firestore |
| Raperos sin votos no muestran número | ✅ | "Sin calificar", van al final |
| Posiciones con menos de 5 votos se marcan "provisional" | ✅ Local | Tabla, Top 5 y aviso "Ranking en arranque" |
| Buscar y filtrar raperos | ✅ | Probado en commits previos (b2e59a9, cc32521); código sin cambios |
| Votar sin cuenta → pide cuenta y **no se pierde la calificación** | ✅ Local | Borrador sobrevive a redibujar y a recargar |
| Registro con correo | ⚪ | No se crearon cuentas en producción. Adn: probar en incógnito |
| Entrar con Google | ⚪ | Igual |
| Confirmar correo y votar | ⚪ | Igual |
| El voto se guarda y el ranking se actualiza | ⚪ | Igual (la lógica no cambió; las reglas sí: probar después de publicarlas) |
| Cambiar una calificación (esperar 30 s) | ⚪ | Nuevo límite en reglas: probar después de publicarlas |
| Proponer un rapero | ⚪ | Cambió la regla del límite: probar después de publicarlas |
| Por Estado (mapa y lista) | ✅ Local | Abre sin errores |
| Letras (analizador) | ✅ | `node letras.js` 25/25 |
| Freestyle Lab | ✅ | `node freestyle.js` 12/12; abre sin errores |
| Batalla de Freestyle | ⚪ | No se revisó a fondo; no usa Firestore |
| Rap News | ✅ | Páginas estáticas con canonical y JSON-LD |
| Comparar artistas | ➖ | Se quitó en oct 2026 |
| Cerrar sesión y volver | ⚪ | Adn: probar |
| Compartir abre el rapero exacto | ✅ Local | `/?calificar=<slug>&utm_…` |

## Seguridad e integridad
| Requisito | Estado | Evidencia |
|---|---|---|
| Un voto por cuenta y artista | ✅ | Regla `uid_slug` |
| Estadísticas no se pueden inflar | ✅ | `statsConsistent` + `getAfter` |
| Nadie se da puntos de más | ✅ | Regla de contribuyentes |
| Correos de los usuarios no son públicos | ✅ | `users` solo su dueño |
| Sin XSS con datos de usuarios | ✅ | Todo pasa por `esc()` |
| Correos desechables bloqueados (misma lista en sitio y reglas) | ✅ | 54 dominios en ambos |
| Correos con "+" bloqueados | ✅ Local / ❌ en vivo | Falta publicar reglas |
| Puntuaciones solo 1–10 | ✅ Local / ❌ en vivo | Falta publicar reglas |
| Límite de propuestas no se puede saltar | ✅ Local / ❌ en vivo | Falta publicar reglas |
| Todos los slugs en `knownArtists()` | ✅ | 107/107 |
| Reglas del repo = reglas publicadas | ⚪ | Adn: GitHub → Actions o consola de Firebase |
| App Check activo | ❌ | Pendiente (Adn crea la llave reCAPTCHA v3) |
| Alerta de presupuesto en Google Cloud | ⚪ | Adn: Facturación → Presupuestos |
| Sin secretos en el repo | ✅ | Solo la `apiKey` pública |

## Google y redes
| Requisito | Estado | Evidencia |
|---|---|---|
| http→https y sin-www→www en un salto | ✅ | 301 directo |
| `robots.txt` | ✅ | `Allow: /` + sitemap |
| `sitemap.xml` | ✅ | 6 URLs (7 al fusionar la edición del 15 nov) |
| Canonical en cada página indexable | ✅ | inicio, noticias, batalla, privacidad |
| Páginas de prueba fuera de Google | ✅ | `artista.html`, `votar.html`, `versus.html` con `noindex` |
| Página 404 propia | ✅ Local | `404.html` |
| Imagen para compartir 1200×630 | ✅ Local | `images/og-rapscore.jpg` (noticias: en la siguiente edición) |
| Raperos visibles para Google sin JavaScript | ❌ | 0 nombres en el HTML. Siguiente proyecto: páginas por estado |
| Search Console dado de alta y sitemap enviado | ⚪ | Adn |
| `lang="es"` y textos en español de México | ✅ | |

## Celular, velocidad y accesibilidad
| Requisito | Estado | Evidencia |
|---|---|---|
| Sin scroll horizontal a 375 px | ✅ Local | ancho = 375 |
| Contraste de texto gris ≥ 4.5:1 | ✅ Local | `#8f8f8f` ≈ 6:1 |
| Fuentes: solo lo que se usa + preconnect | ✅ Local | 7 variantes |
| Imagen del hero con tamaño y prioridad | ✅ | `fetchpriority="high"`, width/height |
| Esc cierra ventanas | ✅ Local | |
| Etiqueta LEYENDA no se encima con el score en celular | ❌ | Ya pasaba antes; pendiente P2-5 |
| Core Web Vitals (LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1) | ⚪ | Sin Lighthouse aquí. Adn: pagespeed.web.dev con la URL; datos reales en Search Console → Métricas web principales |

## Medición
| Requisito | Estado | Evidencia |
|---|---|---|
| GA4 y Clarity cargan una sola vez | ✅ | Un solo `rsTrack` |
| Tráfico interno marcado | ✅ | `?rs_internal=1`, admin, localhost |
| Eventos sin datos personales | ✅ | Revisados todos |
| Embudo medible (`vote_start` → `vote_blocked_auth` → `sign_up` → `rate_artist`) | ✅ Local | Probado en local |
| Eventos clave marcados en GA4 | ⚪ | Adn: `rate_artist`, `sign_up`, `share` |
| Dimensiones personalizadas (`artist_slug`, `cta`, `section`, `popup`, `filter`) | ⚪ | Adn |
| Retención de datos 14 meses | ⚪ | Adn |

## Antes de anunciar
- [ ] Push del commit local
- [ ] Reglas publicadas (Actions en verde o a mano)
- [ ] Prueba completa en celular: registro → votar → cambiar voto → compartir
- [ ] Depurador de Facebook: volver a extraer la portada
- [ ] Search Console + sitemap
- [ ] App Check en modo "monitorear" (luego "obligatorio")
- [ ] Fusionar la edición de Rap News del 15 nov
