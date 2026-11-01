# Agente de Rap News — instrucciones

Cada semana (domingo) un agente prepara **"Rap News"**: un resumen corto de lo más importante que pasó en el rap mexicano en los últimos 7 días. **Nunca publica solo:** abre un Pull Request en GitHub y Adn decide si se publica (Merge) o no (Close).

Este archivo es la receta completa. Si eres el agente, síguela paso a paso.

---

## 1. Preparar

1. Trabaja en el repo `EstudioSunset/rapscoremx` (clónalo si no está: `git clone --depth 1 https://github.com/EstudioSunset/rapscoremx`). Lee `CLAUDE.md`.
2. Fecha de la edición = **hoy** (AAAA-MM-DD). Semana = de hace 6 días a hoy.
3. Mira las ediciones anteriores en `noticias/fuente/ediciones/` para **no repetir noticias** ya publicadas.
4. La lista de raperos del ranking está en `RAW_ARTISTS` de `index.html` (107+). La cobertura es **todo el rap mexicano**, no solo el ranking; pero si la nota es de alguien del ranking, ponlo en `artistas` para que salga el botón "Califica a…".

## 2. Investigar (con búsqueda web, en español)

Busca noticias **publicadas en la semana**. Haz búsquedas separadas, por ejemplo:
- `rap mexicano noticias`, `hip hop mexicano`, `nuevo disco rapero mexicano`, `estreno rap mexicano`
- `gira 2026 rapero mexicano`, `concierto rap CDMX`, `festival hip hop México`
- `Red Bull Batalla México`, `FMS México`, `batallas de freestyle México`
- Por nombre, los más grandes del ranking (Santa Fe Klan, Alemán, Gera MX, C-Kan, Dharius, Aczino, Cartel de Santa, Lefty SM, Millonario, Neto Peña, Charles Ans, Bipo Montana…) y alguno de la escena regional.
- Premios y listas: Latin Grammy, Premios Lo Nuestro, Billboard, Spotify (listas oficiales).

Para cada posible nota **abre la página** (WebFetch) y confirma: qué pasó, quién, cuándo (fecha dentro de la semana) y que el medio es real.

**Buenas fuentes:** medios de noticias y música (Milenio, El Universal, Excélsior, Infobae, El Financiero, Billboard, Rolling Stone en Español, Indie Rocks!, Red Bull, Swaggerty, Chilango, Sopitas, medios regionales), comunicados oficiales y cuentas oficiales verificadas del artista o del evento.
**No sirven solas:** páginas de chismes sin autor, foros, videos de "reacción", TikTok/YouTube de terceros, sitios de letras, wikis, otras IAs. Si solo hay una cuenta de fans, no es noticia.

Elige **de 4 a 7 notas**, las más relevantes. Mezcla: lanzamientos, giras/conciertos, batallas, colaboraciones, premios/industria. Si en la semana no hubo al menos 3 noticias confirmadas, **no hagas edición**: termina diciendo "Semana sin noticias suficientes" (eso es mejor que rellenar).

## 3. Escribir

Crea `noticias/fuente/ediciones/AAAA-MM-DD.json` con este formato:

```json
{
  "fecha": "2026-11-01",
  "slug": "rap-mexicano-semana-26-octubre-1-noviembre-2026",
  "semana": { "desde": "2026-10-26", "hasta": "2026-11-01" },
  "titulo": "Rap mexicano esta semana: <lo más fuerte en pocas palabras>",
  "descripcion": "120–160 caracteres. Qué incluye la edición, con 2–3 nombres. Es lo que sale en Google.",
  "intro": "2–3 frases (máx. 80 palabras) que enganchen.",
  "notas": [
    {
      "titulo": "Titular claro, con el nombre del artista",
      "fecha": "2026-10-28",
      "tipo": "lanzamiento",
      "texto": "Un párrafo de 40 a 110 palabras.",
      "artistas": ["Nombre exacto como en el ranking"],
      "fuentes": [ { "nombre": "Medio", "url": "https://link-directo-a-la-nota" } ],
      "delicado": false
    }
  ],
  "cierre": "Una frase final opcional que invite a votar en RapScore."
}
```

- `tipo`: `lanzamiento`, `gira`, `concierto`, `batalla`, `premio`, `colaboracion`, `video`, `entrevista`, `industria`, `polemica`, `otro`.
- `artistas`: escribe el nombre **igual que en `RAW_ARTISTS`** (con acentos) para que salga el botón de calificar.

### Reglas de escritura (no negociables)

1. **Solo hechos que dicen las fuentes.** Nada inventado, nada "se rumora", nada de cifras que no estén en la fuente. Si algo no está confirmado, no va.
2. **Con tus palabras.** Nunca copies párrafos ni la estructura de la nota original. Máximo **una cita textual por nota y de menos de 15 palabras**, entre comillas, solo si las palabras exactas importan.
3. **Nunca letras de canciones**, ni un verso. Puedes decir de qué trata una canción.
4. **Cada nota con su link directo** al medio (no a Google ni acortadores). Si dos medios lo cuentan, pon los dos.
5. **Temas delicados** (muerte, arresto, demanda, acusación, violencia, salud, conflictos con la ley o el crimen): solo si hay **2 medios serios distintos**, tono neutro y sin adjetivos, decir exactamente lo que se sabe y lo que no, y marcar `"delicado": true`. Nunca vincules a alguien con un delito si las fuentes no lo dicen con claridad. Ante la duda, **déjala fuera**.
6. **No hagas promoción del crimen** ni de personas sancionadas o investigadas (ver casos excluidos del roster en `CLAUDE.md`).
7. **Sin opiniones** sobre si un disco es bueno o malo. El tono es de calle pero informado: claro, directo, sin exagerar ("histórico", "rompió el internet") si la fuente no lo respalda.
8. **Sin imágenes** de internet ni portadas (el sitio solo usa fotos con licencia).
9. Español de México, frases cortas, para leer en celular.

## 4. Revisar y generar

```bash
node noticias/fuente/validar.js      # 0 errores para seguir; lee los avisos
node noticias/fuente/build.js        # genera noticias/<slug>/, noticias/index.html, feed.xml y sitemap.xml
```

Antes de seguir, vuelve a abrir **cada fuente** y compara contra tu texto: fechas, nombres, cifras. Corrige lo que no cuadre.

## 5. Proponer (Pull Request, nunca push a `main`)

```bash
git checkout -b noticias/AAAA-MM-DD
git add noticias sitemap.xml
git commit -m "Rap News: semana del <rango>"
git push -u origin noticias/AAAA-MM-DD
# Abrir el PR con la API REST (gh pr create usa GraphQL y no funciona desde las sesiones de Claude):
gh api repos/EstudioSunset/rapscoremx/pulls -f title="Rap News: semana del <rango>" \
  -f head="noticias/AAAA-MM-DD" -f base="main" -F body=@<archivo-del-cuerpo.md> --jq .html_url
```
Si la rama ya existe (corrida repetida el mismo día), usa `noticias/AAAA-MM-DD-2`.

El cuerpo del PR (en español, para Adn) debe tener:
- Una línea: "Revisa y dale **Merge** para publicar, o **Close** para descartar."
- La lista de notas: titular + fuente(s) en link.
- **Avisos del validador** (temas delicados, artistas que no están en el ranking, etc.).
- Link de cómo se verá: `https://www.rapscoremx.com/noticias/<slug>/` (funciona después del Merge).
- Si encontraste raperos con noticias que **no están en el ranking**, sugiérelos al final ("Podrían agregarse al ranking: …").

Al terminar, responde con 2–3 líneas: cuántas notas, el link del PR y si hay algo delicado que revisar.

## Si Adn pide cambios

Edita el JSON en la misma rama, vuelve a correr `validar.js` y `build.js`, y haz push a la misma rama (el PR se actualiza solo).
