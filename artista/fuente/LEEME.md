# Fichas de artista (`/artista/<slug>/`)

Una página pública por rapero, para compartir y para Google. **No se editan a mano** `artista/index.html` ni `artista/<slug>/`.

## Regenerar (al agregar o quitar raperos, o cambiar bios)
1. `node artista/fuente/build.js` — lee `RAW_ARTISTS`, `SPOTIFY_IDS` y `ARTIST_PHOTOS` de `index.html` y escribe las páginas. Borra las fichas de raperos que ya no están.
2. `node noticias/fuente/build.js` — vuelve a hacer `sitemap.xml` con las fichas.
3. Si el build dice "Faltan N imágenes para redes":
   - `python artista/fuente/og-servidor.py`
   - Abre `http://localhost:8766/artista/fuente/og.html` (o `?solo=<slug>` para una sola) y espera "Listo".
   - Cierra el servidor con Ctrl+C. Las imágenes quedan en `artista/<slug>/og.jpg` (1200×630).

Si cambia el nombre o la ciudad de alguien, vuelve a hacer su imagen con `?solo=<slug>`.

## Cómo funciona
- Los números del HTML son de cuando se generó (primera pintura); en el navegador se recalculan con `datos/ranking.json` usando el mismo cálculo que `index.html` (promedio bayesiano, `K`, `MIN_VOTES_FIRM`, orden `rankCmp`).
- "Calificar a X" lleva a `index.html?calificar=<slug>`: el mismo formulario de voto de siempre (voto pendiente, verificación de correo, etc.).
- La imagen para redes no lleva fotos de personas: las de Commons piden crédito visible y una foto genérica haría creer que es el rapero.
- Medición: `view_artist` (`page: ficha`), `cta_click` `ficha_pagina_calificar`, `listen_click` (`page: ficha`), `share` (`content_type: artista`).
