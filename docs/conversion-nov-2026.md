# RapScore MX — Conversión antes de promover (24 nov 2026)

_Recorrido del sitio en vivo (www.rapscoremx.com) en celular 375×812 y escritorio 1024×768, lectura del código y datos de Firestore leídos en vivo. Sin acceso a GA4 ni a Clarity: lo que depende de esos datos está marcado como hipótesis._

## Recomendación: la conversión principal es "primera calificación guardada de una cuenta nueva"

**Evento:** `rate_artist` con `is_new = yes` de una cuenta que no había calificado antes (en GA4: usuarios con su primer `rate_artist`).

**Por qué esta y no otra:**
- **Es el producto.** El ranking "lo deciden los fans": sin calificaciones no hay ranking. Hoy hay **82 calificaciones en 79 raperos y 0 posiciones firmes** (nadie llega a 5 votos; el máximo es 3).
- **El cuello de botella son las personas, no los votos.** El ranking de contribuyentes tiene **4 cuentas con puntos** (sin contar bloqueadas): las 82 calificaciones salieron de 4 personas. Entre el 19 y el 24 nov entraron 12 calificaciones. Una cuenta nueva que califica vale más que 10 calificaciones de las mismas 4 cuentas.
- **Abre todo lo demás:** con cuenta, la persona regresa (sus puntos, su nivel), desbloquea beats del Freestyle Lab y comparte su voto.
- **Lo que no es la conversión principal:** escuchar en Spotify/YouTube es un **clic de salida** (bueno para el rapero, pero lo saca del sitio); jugar Batalla o usar el Lab es enganche, no deja nada en el ranking; leer noticias es entrada por Google.

**Conversiones secundarias** (en este orden): `share` (trae gente nueva), `vote_start` (intención), `listen_click` (clic de salida), `batalla_end` / `freestyle_end` (enganche que debe llevar a votar).

## Recorridos (lo que se reprodujo)

| # | Entrada | Qué intenté | Dónde apareció la fricción | Efecto |
|---|---|---|---|---|
| R1 | Celular, portada `/` | Calificar al #5 del ranking (Adán Cruz) | Al tocar la fila se abre la ficha, pero la caja de calificar queda a **~1,5 pantallas** abajo (bio, botones de escuchar, 3 datos, 6 barras, nota). El botón amarillo "Califica" de la fila **solo sale en raperos sin votos**, y hoy los primeros 79 lugares ya tienen al menos 1 voto. | Quien quiere votar a alguien del Top tiene que adivinar que debe bajar. |
| R2 | Celular, portada `/` | Mismo recorrido | Al bajar 500 px sale la barra "¿Nuevo aquí? Califica…" y **se queda encima de la caja de calificar y de "Guardar calificación"** aunque la persona ya esté tocando números. Su botón "Votar →" lo saca de la ficha que estaba calificando. | Tapa ~20% de la pantalla en el paso más importante y ofrece una salida equivocada. |
| R3 | Escritorio 1024×768, portada | Abrir la ficha de C-Kan | La caja de calificar empieza en el pixel 767 de 768: no se ve. La barra de bienvenida también sale. | Igual que R1 en compu. |
| R4 | Celular, link de campaña `/?calificar=lotus-dlc&utm_source=facebook…` | Calificar sin cuenta | Bien: abre Votar con el rapero listo. Al guardar sale "Crear cuenta" con "Tu calificación está apartada". | Funciona. Los eventos `vote_blocked_auth` y `signup_start` salen juntos (ver medición). |
| R5 | Mismo, después de "Registrarse" con correo (leído en el código; no se crearon cuentas reales) | Terminar el voto | La ventana **se cerraba** y quedaba un aviso de **6 segundos**: "Cuenta creada ✓ Confirma tu correo…". Sin botón para abrir el correo, sin "ya lo confirmé", sin reenviar. Si la persona entraba con cuenta sin confirmar, otro aviso de 7 s. | La persona no sabe qué sigue. Es el paso donde Clarity ya mostró la caída (6 de 7 chocaron con la cuenta, 1 terminó). |
| R6 | Link del correo de confirmación abierto en otro navegador (`/?verificado=1&calificar=…&voto=…`) | Guardar el voto | La caja aparece rellenada, pero no hay sesión en ese navegador y nada abre "Iniciar sesión": solo un aviso. | Pasa mucho desde la app de Facebook: el correo se abre en Chrome/Gmail. |
| R7 | Celular, `/#freestyle` | Practicar freestyle | Lo primero que se ve es el candado "Beats de la casa · Entrar y calificar"; el botón Empezar queda ~2 pantallas abajo. | Hipótesis: frena a quien llega a practicar. Requiere datos (`freestyle_start` / vistas de la sección). |
| R8 | Celular, `/noticias/` | Leer lo nuevo | La última edición publicada es la del 2–8 nov; la del 15 nov sigue en un PR sin fusionar. | Contenido viejo justo antes de promover. |
| R9 | Celular, `/batalla/` | Jugar | Bien: arranca en 1 toque y al final lleva a votar. | — |

## Objetivo de cada página

| Página o sección | Qué busca el visitante | Acción o resultado deseado | Fricción observada | Cambio propuesto | Métrica de éxito |
|---|---|---|---|---|---|
| Portada: hero + Top 5 | Saber qué es y quién va arriba | Entender que el ranking lo hace la gente y entrar al ranking o calificar a uno del Top 5 | Sin fricción grave. El hero lleva a "Ver ranking" (bien: primero quieren ver). | Ninguno por ahora. | `cta_click` `top5_calificar` / vistas de portada |
| Portada: ranking (10 filas) | Ver si "su" rapero está bien puesto | Abrir la ficha y calificar | R1, R2, R3 | **Mejoras 2 y 3** | `vote_start` / `view_artist` |
| Ficha del rapero (se abre en el ranking) | Ver su calificación por categoría y decidir si está justa | Calificar las 6 categorías; si no lo conoce, escucharlo | R1, R2, R3 | **Mejora 3:** botón "Califica a X ↓" arriba con "Le faltan N votos para posición firme" | `cta_click` `ficha_calificar` / `view_artist`; `vote_start` / `view_artist` |
| Votar (`#votar`, entrada de campañas `?calificar=`) | Calificar a un rapero concreto | Guardar la calificación | R4: la cuenta es obligatoria (anti-bots, se queda) | **Mejora 1** (después de la cuenta) | `rate_artist` / `vote_start` |
| Ventana de cuenta y confirmación de correo | Terminar rápido | Cuenta confirmada y voto guardado solo | R5, R6 | **Mejora 1:** pantalla "Confirma tu correo" que se queda, con abrir correo / ya lo confirmé / reenviar; login automático al volver del correo | `email_verified` / `sign_up` (correo); `rate_artist` `from_pending=yes` / `sign_up` |
| Cómo funciona (aviso) | Saber si el ranking es serio | Confianza: entender promedio bayesiano y "provisional" | Ninguna; su trabajo es explicar, no vender | Ninguno | Vistas (`cta_click` `barra_como_funciona`) |
| Por Estado | Ver a los raperos de su ciudad | Abrir uno y calificarlo | No se recorrió a fondo | — | `section_view` estados → `vote_start` |
| Freestyle Lab | Practicar con beat | Empezar una sesión; después, calificar 5 para desbloquear beats | R7 (hipótesis) | Medir antes de mover: si menos de la mitad de quienes ven la sección inician, poner el escenario arriba y el candado abajo | `freestyle_start` / `section_view` freestyle |
| Batalla (`/batalla/`) | Jugar | Terminar una batalla y luego ir a votar | Ninguna reproducida | Ninguno | `batalla_end` / `batalla_start`; `cta_click` `batalla_final_votar` |
| Rap News | Enterarse | Leer y tocar "Califica a…" | R8 | Fusionar la edición pendiente antes de la campaña | `cta_click` desde noticias |

## Las tres mejoras (en orden de prioridad) — implementadas en la rama `mejoras-conversion`

### 1. Paso "Confirma tu correo" que no desaparece
**Hipótesis:** si después de registrarse con correo la persona ve una pantalla fija con el siguiente paso (abrir su correo, "Ya lo confirmé", reenviar), **aumentará el porcentaje de registros con correo que terminan con una calificación guardada** (`rate_artist` con `from_pending=yes` ÷ `sign_up` con `method=email`).

**Por qué primero:** es el paso con la caída documentada (Clarity) y con la mayor distancia entre intención y resultado: 82 calificaciones, 4 cuentas. En apps de Facebook/TikTok (la mayoría del tráfico) no hay Google, así que **todo registro desde ahí pasa por este paso**.

Qué cambió:
- Al registrarse con correo, la ventana ya no se cierra: muestra **"Confirma tu correo"** con el correo al que se mandó, el aviso de que su calificación está apartada, **"Abrir Gmail / Outlook / Yahoo / iCloud ↗"** (si el correo es de uno de esos), **"Ya lo confirmé"** (revisa y guarda la calificación apartada) y **"Reenviar correo"** (con espera de 30 s).
- Si entra con una cuenta sin confirmar y tiene un voto apartado, ve la misma pantalla (antes: un aviso de 7 s).
- Al regresar a la pestaña, si ya confirmó, la pantalla se cierra sola y el voto se guarda (ya existía para el voto; ahora también cierra la pantalla).
- Si el link del correo se abre en otro navegador sin sesión (`?verificado=1`), se abre **"Iniciar sesión"** con "Tu correo ya está confirmado ✓ Entra… para guardar tu calificación". La caja sigue solo rellenada: **un link nunca guarda un voto solo** (se respeta la regla).

**Criterios de aceptación (verificados en local, celular y escritorio):** el registro sin cuenta abre "Crear cuenta" con `trigger=voto`; "Ya lo confirmé" sin sesión regresa al formulario de entrar; cambiar entre entrar/crear cuenta quita la pantalla; `?verificado=1` sin sesión abre "Iniciar sesión" con el aviso y la caja rellenada; un link `?calificar=` normal no abre ninguna ventana; consola sin errores.
**No verificado:** el registro, la confirmación y el guardado reales (no se crearon cuentas de prueba en el Firebase de producción). **Hay que probarlo con una cuenta real antes de fusionar** (ver "Cómo probar").

### 2. La barra "¿Nuevo aquí?" ya no tapa la caja de calificar
**Hipótesis:** si la barra de bienvenida no sale (o se quita) cuando la persona ya abrió una ficha o empezó a calificar, **aumentará el porcentaje de quienes empiezan a calificar que llegan a tocar Guardar** (`vote_blocked_auth` + `rate_artist` ÷ `vote_start`, en portada) y bajarán los toques a "Votar →" de la barra que la sacan de la ficha.

Qué cambió: la barra no sale si hay una ficha abierta o una calificación empezada, y se quita al abrir una ficha o al tocar el primer número. Sigue saliendo una sola vez y solo en la portada.

**Criterios de aceptación (verificados):** con la barra visible, abrir la ficha la quita; bajar 800 px con la ficha abierta no la vuelve a mostrar; sin ficha abierta sale igual que antes.

### 3. Botón "Califica a X ↓" arriba de la ficha
**Hipótesis:** si la ficha del rapero muestra arriba un botón para ir a calificar (con "Le faltan N votos para tener posición firme"), **aumentará el porcentaje de fichas abiertas que terminan en `vote_start`**.

Qué cambió: debajo del nombre, botón amarillo "Califica a C-Kan ↓" (o "Cambiar mi calificación ↓" si ya votó) que baja a la caja y pone el foco en el primer número. Al lado, el motivo para votar: "Nadie lo ha calificado: tu voto es el primero" / "Le faltan 2 votos para tener posición firme".

**Criterios de aceptación (verificados):** en celular el botón queda en la primera pantalla de la ficha (antes la caja estaba a 1.139 px; después del toque queda arriba, a 130 px); en escritorio 1024×768 el botón está a 178 px y la caja (a 900 px, fuera de pantalla) queda arriba tras el toque; manda `cta_click` con `cta=ficha_calificar`.

## Medición

### Eventos nuevos o cambiados

| Evento | Cuándo se dispara | Parámetros | Cómo se evitan duplicados |
|---|---|---|---|
| `signup_start` (cambia) | Al abrir la ventana de cuenta | + `trigger`: `voto` (se abrió sola al guardar), `verificado` (volvió del correo), `manual` (tocó Entrar) | Una vez por apertura. **Para el embudo usar solo `trigger=manual` como intención propia**; `trigger=voto` es igual a `vote_blocked_auth` (antes se contaban dos veces). |
| `verify_prompt_view` | Al mostrar "Confirma tu correo" | `trigger` (`registro`, `login`, `bloqueo`), `provider` (gmail, outlook, yahoo, icloud, otro), `has_pending`, `in_app` | Una vez por vez que se muestra; para tasas, contar **usuarios**, no eventos. |
| `verify_open_mail` | Toca "Abrir Gmail ↗" (etc.) | `provider`, `in_app` | No lleva `data-track` (si no, saldría también como `cta_click`). |
| `verify_check` | Toca "Ya lo confirmé" | `result`: `verified` / `not_yet` | Por toque; `not_yet` repetido = no le llega el correo. |
| `verify_resend` | Toca "Reenviar correo" | `result`: `ok` / `wait` | Botón desactivado 30 s. |
| `email_verified` | La primera vez que este navegador ve la cuenta confirmada | `via`: `boton`, `regreso` (volvió a la pestaña o intentó votar), `link` (llegó con `?verificado=1` y sesión), `in_app` | **Una vez por cuenta y navegador** (`localStorage rs_verified_ev`). Si confirma en otro navegador puede contarse dos veces: usar usuarios únicos. |
| `cta_click` `ficha_calificar` | Toca "Califica a X ↓" | `cta` | Por toque. |

Sin datos personales: nunca se manda el correo ni el texto, solo el proveedor (gmail/outlook…).

### Métricas y qué decidir

| Mejora | Numerador | Denominador | Decisión |
|---|---|---|---|
| 1 | Usuarios con `rate_artist` `from_pending=yes` | Usuarios con `sign_up` `method=email` | **Sube a ≥40%:** dejarla y pasar al siguiente arreglo del embudo (antes del registro). **No se mueve y `verify_check not_yet` es alto:** el correo no llega o cae en spam → revisar remitente/plantilla en Firebase Auth (dominio propio). **`verify_prompt_view` sin `verify_open_mail`:** la gente no sabe dónde está su correo → probar un código de 6 dígitos en lugar del enlace (requiere backend). |
| 1 (apoyo) | Usuarios con `email_verified` | Usuarios con `verify_prompt_view` | Dónde se pierde: antes o después de confirmar. |
| 2 | Usuarios con (`vote_blocked_auth` o `rate_artist`) | Usuarios con `vote_start` | Si sube, confirmar que nada flotante tape la caja (aplicarlo al buzón de sugerencias también). Si no cambia, la barra no era el freno: dejar el cambio (no estorba) y no invertir más ahí. |
| 3 | Usuarios con `vote_start` | Usuarios con `view_artist` | **Sube:** poner el mismo atajo en las tarjetas del Top 5 y en Por Estado. **No sube pero hay clics en `ficha_calificar`:** la gente llega a la caja y la abandona → el problema son las 6 categorías (probar empezar con 1 "calificación general" y las 6 como opcional). |

### Cómo juntar evidencia con poco tráfico
Con 4 cuentas activas no hay volumen para una prueba A/B ni para atribuir un cambio con confianza. Por eso:
1. **Línea base antes de fusionar:** anotar de GA4 (últimos 28 días, solo tráfico no interno) usuarios con `view_artist`, `vote_start`, `vote_blocked_auth`, `sign_up` (por `method`), `rate_artist` (por `from_pending`). Desde hoy, Firestore: 82 calificaciones, 79 raperos con voto, 0 firmes, 4 cuentas con puntos.
2. **Fusionar las 3 mejoras juntas** (tocan pasos distintos del embudo y cada una tiene su propia métrica; con este volumen separarlas en semanas solo retrasa).
3. **Leer por paso, no solo el total:** cada mejora tiene un evento propio (`verify_*`, `ficha_calificar`) que dice si se usó, aunque los totales sean chicos.
4. **Umbral para decidir:** esperar al menos **30 usuarios en el denominador** de cada métrica (o 2 semanas, lo que pase después). Con menos, revisar grabaciones de Clarity filtrando por el evento (`verify_prompt_view`, `ficha_calificar`): 10–15 grabaciones dicen más que un porcentaje de 5 personas.
5. **Separar campañas:** todo link de campaña con `utm_campaign`; comparar `in_app=yes` contra `no` (el paso de correo pesa mucho más dentro de Facebook/TikTok).

## Qué mirar en las primeras semanas de promoción

1. **Usuarios nuevos con `rate_artist`** por semana (la conversión principal) y cuántos raperos llegan a 5 votos.
2. **Embudo por paso:** `view_artist` → `vote_start` → `vote_blocked_auth` → `sign_up` → `email_verified` → `rate_artist`. El paso con la caída más grande decide el siguiente cambio.
3. **`in_app = yes` vs `no`** en `vote_blocked_auth` y en `rate_artist`: si casi todo el tráfico es de apps y no pasa del correo, lo siguiente es un acceso sin contraseña (enlace mágico o código).
4. **`verify_check` con `not_yet`:** si es alto, el correo de Firebase no está llegando (spam).
5. **Calificaciones por cuenta nueva:** si es 1, la gente vota por su favorito y se va → probar "Califica a 2 más de tu estado" después de guardar.
6. **`share` por cada `rate_artist`:** si es bajo, el siguiente experimento es el botón Compartir en la ficha (P2-8 de la auditoría).

## Siguientes cambios (no implementados)
- Fusionar la edición de Rap News del 15 nov (R8) antes de la campaña.
- Freestyle Lab: decidir con `freestyle_start` / `section_view` si el candado va abajo (R7).
- Botón "Compartir" en la ficha (P2-8) y botón Atrás que no saque del sitio (P2-7).

## Cómo probar la mejora 1 con una cuenta real (antes de fusionar)
1. Con la rama abierta en local (`python -m http.server 8765` en la carpeta del sitio; Firebase acepta `localhost`), en una ventana de incógnito entra a `http://localhost:8765/?calificar=c-kan`, califica las 6 y toca Guardar. Ojo: el enlace del correo regresa a `www.rapscoremx.com`, así que los pasos 4–5 se prueban del todo cuando esté publicado.
2. Crea una cuenta con un correo tuyo de Gmail: debe quedarse la pantalla "Confirma tu correo" con "Abrir Gmail ↗".
3. Toca "Ya lo confirmé" sin confirmar: debe decir "Todavía no aparece confirmado".
4. Confirma desde el correo en el mismo celular y regresa a la pestaña: la pantalla se cierra sola y sale "Listo: guardamos tu calificación de C-Kan ✓".
5. Repite abriendo el enlace del correo en otro navegador: debe abrir "Iniciar sesión" con "Tu correo ya está confirmado ✓".
6. Borra la calificación de prueba desde Admin si no quieres que cuente.
