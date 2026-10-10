# Ada Lovelace Day · Búsqueda del tesoro

Página web de la búsqueda del tesoro de la Facultad de Ingeniería. Es HTML + CSS + JavaScript
sin servidor propio: se publica en GitHub Pages, Netlify o Vercel. El avance de cada equipo se
guarda en el navegador (localStorage) y las reflexiones finales llegan a una Google Sheet a través
de un Google Apps Script.

Recorrido: póster → registro → búsqueda del QR (contador y pista a los 10 min) → video y reto →
siguiente QR → … → reflexión final → envío a la Google Sheet → Salón 27-302.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| `index.html` | Página que usan los participantes. |
| `js/config.js` | **Todo el contenido editable**: póster, mensajes, pistas, videos, respuestas, URL del Apps Script. |
| `js/app.js` | Lógica de la aplicación. No hace falta tocarla para cambiar contenido. |
| `js/respuestas.js` | Normalización y verificación de respuestas. |
| `css/estilos.css` | Estilos (paleta azul, pensado primero para celular). |
| `herramientas/organizadores.html` | Lista de pendientes, códigos QR para imprimir, prueba de respuestas y generador de hashes. |
| `apps-script/Code.gs` | Script que guarda las respuestas finales en la Google Sheet. |

## Pendientes antes del evento

La página `herramientas/organizadores.html` muestra en verde lo listo y en amarillo lo que falta.

1. **Póster**: copien la imagen en `assets/poster.jpg` (o cambien `POSTER_URL`). Mientras no exista
   se muestra una portada provisional.
2. **Videos**: pongan la URL de cada estación en `videoUrl`.
3. **Pistas de los 10 minutos**: reemplacen `FIRST_QR_HINT` y cada `searchHint` marcado como
   `PENDIENTE`. Ojo: el `searchHint` de la estación N es la pista para encontrar el QR de la
   estación N+1.
4. **Mensaje del primer QR**: `FIRST_QR_MESSAGE` trae un borrador; ajústenlo si quieren.
5. **Google Sheet**: configuren el Apps Script (abajo) y peguen su URL en `FINAL_SUBMIT_URL`.
6. **Publicar** la página y **generar e imprimir los QR**.

## Editar el contenido (`js/config.js`)

- **Textos largos** (`challengeText`, `nextMessage`, `searchHint`, `FIRST_QR_MESSAGE`,
  `FIRST_QR_HINT`): una línea en blanco separa párrafos; un bloque entre dos líneas `~~~` se
  muestra en letra monoespaciada (código, fórmulas, cuadrículas).
- **Videos** (`videoUrl`) admite:
  - un MP4 dentro del proyecto (`videos/estacion1.mp4`) o en otra web. Usen MP4 (H.264): los `.mov`
    grabados en iPhone no se reproducen en todos los celulares;
  - un enlace de YouTube (normal, `youtu.be` o Shorts);
  - un enlace de Google Drive, compartido como "Cualquier persona con el enlace";
  - un enlace de Vimeo o cualquier otra URL que se pueda incrustar.

  Si el video es vertical y está en YouTube normal, Drive o Vimeo, agreguen `videoAspect: '9:16'`
  en esa estación.
- **Límite de la reflexión**: `FINAL_MIN_CHARS` y `FINAL_MAX_CHARS` (hoy 150 y 200). Se cuentan los
  caracteres con espacios, después de quitar los espacios del inicio y del final.
- **Tiempo de la pista**: `HINT_DELAY_MS` (600000 = 10 minutos).
- **Mensajes generales** (error, éxito, envío fallido, pantalla final): `MESSAGES` y `FINAL_ROOM`.

### Respuestas de las estaciones 1-9

Las respuestas no están en texto plano: `acceptedAnswers` guarda el hash SHA-256 de cada variante
aceptada, ya normalizada. Antes de comparar, la respuesta del equipo se normaliza: se quitan los
espacios del inicio y del final, se ignoran mayúsculas y tildes, y se eliminan los espacios
internos (salvo entre dos números). Por eso `c - d`, `C-D` y `cd` cuentan igual si están en la lista.

Ya están cargadas las variantes de la especificación y algunas equivalentes, por ejemplo `5,0`,
`14,0`, `5800 ohms` o `5.800`.
Para agregar o cambiar variantes:

1. Abran `herramientas/organizadores.html` → **Generar hashes de variantes**.
2. Escriban una variante por línea y pulsen **Generar**.
3. Copien el resultado en `acceptedAnswers` de la estación.
4. Compruébenlo en **Probar una respuesta**.

También se puede escribir la variante en texto plano dentro de `acceptedAnswers` (funciona igual),
pero quedará visible para quien mire el código fuente.

### Claves de los QR (`qrKey`)

Cada QR abre `…/?station=N&k=CLAVE`. Si alguien escribe `?station=5` a mano, sin la clave, la
página responde "Código QR no reconocido". Si cambian una `qrKey` después de imprimir los QR, el QR
impreso deja de funcionar. Con `qrKey: ''` no se exige clave.

Ni los hashes ni las claves son seguridad fuerte (el código es público); solo evitan que las
respuestas o los enlaces se vean a simple vista.

## Google Sheet + Apps Script

1. Creen una hoja de cálculo nueva en Google Drive con la cuenta de los organizadores. Recomendado:
   **Archivo → Configuración → Zona horaria: (GMT-05:00) Bogotá**.
2. En la hoja: **Extensiones → Apps Script**. Borren el contenido de `Código.gs`, peguen el
   contenido de `apps-script/Code.gs` y guarden.
3. Elijan la función `inicializar` en la barra superior y pulsen **Ejecutar**. Autoricen el acceso.
   Se crea la pestaña **Respuestas** con las columnas `sessionId`, `integrante1`, `integrante2`,
   `integrante3`, `respuestaFinal`, `startedAt`, `completedAt`, `duracionSegundos` y `recibidoEn`.
4. **Implementar → Nueva implementación** → tipo **Aplicación web**:
   - Ejecutar como: **Yo**
   - Quién tiene acceso: **Cualquier persona**
5. Copien la URL que termina en `/exec` y péguenla en `FINAL_SUBMIT_URL` de `js/config.js`.
6. Compruébenlo en `herramientas/organizadores.html` → **Probar conexión**, o abriendo esa URL en
   el navegador: debe mostrar `{"ok":true,…}`.

Si un equipo envía dos veces (por ejemplo, reintentando tras un corte de Internet), el script no
duplica la fila: reconoce el mismo `sessionId`.

Si después modifican el script: **Implementar → Gestionar implementaciones → editar (lápiz) →
Versión: Nueva versión → Implementar**. Así la URL no cambia.

## Publicar

**GitHub Pages**: creen un repositorio, suban todos los archivos y en **Settings → Pages** elijan
*Deploy from a branch*, rama `main`, carpeta `/ (root)`. La dirección queda como
`https://USUARIO.github.io/REPOSITORIO/`.

**Netlify**: arrastren la carpeta del proyecto a <https://app.netlify.com/drop>.

**Probar en el computador**: dentro de la carpeta ejecuten `python3 -m http.server 8000` y abran
<http://localhost:8000>.

Si cambian algo durante el evento (por ejemplo, una pista), puede tardar unos minutos en llegar a
los celulares por la caché del navegador.

## Códigos QR

1. Con la página ya publicada, abran `https://…/herramientas/organizadores.html`.
2. En **Enlaces de las estaciones** revisen la dirección pública y pulsen **Generar**.
3. Pulsen **Imprimir**: salen los 10 QR con su número de estación.

Prueben cada QR impreso con un celular antes de pegarlo.

## Probar el recorrido completo

- En la página de herramientas, los enlaces de cada estación funcionan como si se escanearan los QR
  (en orden: 1, 2, 3…).
- Para no esperar 10 minutos por la pista, pongan temporalmente `HINT_DELAY_MS: 10000` y luego
  devuélvanlo a `600000`.
- Para empezar de cero en un celular, abran `https://…/?reiniciar` y confirmen. Esto solo borra el
  avance de ese celular. Para desactivarlo, `ALLOW_RESET: false`.

## Cómo se comporta

- **Avance**: se guarda en el celular, en el navegador donde se registró el equipo. Sobrevive a
  recargas y a cerrar y abrir el navegador. Se pierde si borran los datos del navegador, usan modo
  incógnito o cambian de celular.
- **Un celular por equipo**: cada registro es un equipo distinto en la Google Sheet.
- **Escanear con la cámara normal**: el QR abre la estación en el navegador. Si a un equipo le
  aparece "Primero registren a su equipo" después de haberse registrado, su lector de QR abrió el
  enlace en otro navegador. Que lo abran en el mismo navegador del registro (Chrome o Safari).
- **Contador**: se calcula con la hora guardada al empezar cada búsqueda, así que no se reinicia
  al recargar. "Pedir pista" se habilita a los 10 minutos.
- **Estaciones**: solo se puede abrir la que sigue. Una adelantada muestra "Esta estación todavía
  no ha sido desbloqueada". Una ya superada muestra de nuevo el mensaje de su siguiente destino.
- **Envío final**: solo cuando la Google Sheet confirma la recepción se marca el recorrido como
  terminado y se muestra el Salón 27-302. Si falla, el texto se conserva y se puede reintentar.
