/* =====================================================================
 * CONFIGURACIÓN DE LA BÚSQUEDA DEL TESORO · ADA LOVELACE DAY
 * ---------------------------------------------------------------------
 * Todo el contenido editable está en este archivo. Para cambiar mensajes,
 * pistas, videos o ubicaciones NO es necesario tocar js/app.js.
 *
 * - Los textos marcados como [... PENDIENTE ...] deben reemplazarse antes
 *   del evento. La página herramientas/organizadores.html lista cuáles
 *   faltan.
 * - Formato de los textos largos (challengeText, nextMessage, searchHint,
 *   FIRST_QR_MESSAGE, FIRST_QR_HINT):
 *     · una línea en blanco separa párrafos;
 *     · un bloque entre dos líneas con ~~~ se muestra en letra
 *       monoespaciada (código, fórmulas, cuadrículas).
 * ===================================================================== */
window.CONFIG = {
  // Póster de la pantalla inicial: ruta dentro del proyecto o URL completa.
  POSTER_URL: 'assets/poster.jpg',

  // Mensaje para buscar el primer QR (estación 1: Atrio).
  // BORRADOR: ajústenlo si quieren otro texto.
  FIRST_QR_MESSAGE: '¡Que comience la búsqueda! Su primer código QR los espera en el Atrio de la Facultad. Encuéntrenlo y escanéenlo con la cámara del celular.',

  // Pista adicional para el primer QR (se habilita a los 10 minutos).
  FIRST_QR_HINT: '[PISTA DESPUÉS DE 10 MIN - PENDIENTE]',

  // Tiempo para habilitar "Pedir pista" (600000 ms = 10 minutos).
  HINT_DELAY_MS: 600000,

  // Longitud de la reflexión final (caracteres, contando espacios, tras trim).
  FINAL_MIN_CHARS: 150,
  FINAL_MAX_CHARS: 200,

  // URL de la aplicación web de Google Apps Script (termina en /exec).
  // Ver README.md, sección "Google Sheet + Apps Script".
  FINAL_SUBMIT_URL: '',

  // Destino final que se muestra al terminar.
  FINAL_ROOM: 'Salón 27-302',

  // Permite reiniciar el recorrido de un celular abriendo la página con
  // ?reiniciar (pide confirmación). Pongan false para desactivarlo.
  ALLOW_RESET: true,

  // Proporción por defecto de los videos incrustados (YouTube, Drive...).
  // Para un video vertical usen '9:16' (o videoAspect en la estación).
  VIDEO_ASPECT: '16:9',

  // Mensajes generales.
  MESSAGES: {
    WRONG: 'Respuesta incorrecta. Revisa la digitación o vuelve a evaluar tu solución.',
    CORRECT: '¡Correcto! Has superado esta estación.',
    LOCKED: 'Esta estación todavía no ha sido desbloqueada',
    SEND_FAILED: 'No se pudo enviar. Inténtalo nuevamente.',
    FINAL_TITLE: '¡Respuesta enviada correctamente!',
    FINAL_TEXT: 'Han completado la búsqueda. Diríjanse ahora al',
    FINAL_NOTE: 'Allí termina oficialmente el recorrido. Las reflexiones serán revisadas por los organizadores y el texto que más nos guste será seleccionado como ganador.',
    STORAGE_WARNING: 'Este navegador no permite guardar el avance (¿modo incógnito?). Si cierran o recargan la página perderán el progreso. Usen una ventana normal del navegador.',
  },

  /* -------------------------------------------------------------------
   * ESTACIONES
   * -------------------------------------------------------------------
   * name            Nombre de la estación (se muestra arriba del video).
   * videoUrl        MP4 (ruta o URL), enlace de YouTube, Google Drive,
   *                 Vimeo u otro enlace para incrustar. '[PENDIENTE]'
   *                 muestra un recuadro "Video pendiente".
   * videoAspect     (opcional) '16:9', '9:16'... solo para videos
   *                 incrustados.
   * challengeText   Texto del reto.
   * acceptedAnswers Hashes SHA-256 de las variantes aceptadas, ya
   *                 normalizadas. Se generan en
   *                 herramientas/organizadores.html. También se puede
   *                 escribir el texto de la variante tal cual, pero
   *                 quedará visible en el código fuente.
   * nextMessage     Mensaje al responder bien: indica el siguiente destino.
   * searchHint      Pista adicional (a los 10 min) para encontrar el QR
   *                 de la SIGUIENTE estación.
   * qrKey           Código que llevan los QR (?station=N&k=qrKey) para
   *                 que no baste con escribir ?station=N a mano. Si se
   *                 cambia después de imprimir los QR, estos dejan de
   *                 funcionar. Vacío ('') = no se exige.
   *
   * La ÚLTIMA estación es la reflexión final: no lleva acceptedAnswers,
   * nextMessage ni searchHint.
   * ------------------------------------------------------------------- */
  stations: {
    1: {
      name: 'Atrio',
      videoUrl: '[PENDIENTE]',
      challengeText: `
        Una cadena fue almacenada utilizando el siguiente procedimiento:

        1. Cada carácter fue desplazado 3 posiciones hacia adelante en el alfabeto.
        2. El resultado fue invertido.
        3. Finalmente, cada carácter fue convertido a su representación ASCII hexadecimal.

        ~~~
        RESULTADO ALMACENADO:
        55 48 45 42 46
        ~~~

        Reconstruyan la palabra original. Escriban únicamente la palabra final.
      `,
      acceptedAnswers: [
        'c9b27cf8124e59a02a3bc0dc488cee4b9a73c80fa2508b2278447007d897779c',
      ],
      nextMessage: '¡Correcto! La palabra obtenida es la primera parte del nombre de su siguiente destino. Busquen el espacio donde computadores, pantallas y tecnología hacen sentir que entraron a un centro de control. Siguiente estación: Cyber Range.',
      searchHint: '[PISTA ADICIONAL DEL QR DE CYBER RANGE - PENDIENTE POR DEFINIR]',
      qrKey: '99fb53',
    },

    2: {
      name: 'Cyber Range',
      videoUrl: '[PENDIENTE]',
      challengeText: `
        Sean:

        ~~~
        A = 0x1D
        B = 10110 (base 2)
        ~~~

        Calculen:

        ~~~
        X = (A XOR B) >> 1
        ~~~

        Los operandos están expresados en bases diferentes. Expresen X en decimal.
      `,
      acceptedAnswers: [
        'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
        'c97550ce8213ef5cf6ed4ba48790c137df3ef6a5da20b48961001a634b6cead2',
        'a19a1584344c1f3783bff51524a5a4b86f2cc09356c9dbfb6af9cd236e314362',
        '5fc7339643ae4e37e870f6d51fe57def3270e5d685ee9826ca43469f1cfbd6fe',
        'f2038234658c04e19ded6f7efc7196ef761257357b57e38d261729dc7c7bfffb',
      ],
      nextMessage: '¡Correcto! El resultado no es una contraseña: es un piso. Suban hasta allí y busquen una sala poco conocida donde es posible estudiar, descansar o pasar un rato con amigos. Siguiente estación: piso 5.',
      searchHint: '[PISTA ADICIONAL DEL QR DE LA SALA DEL PISO 5 - PENDIENTE POR DEFINIR]',
      qrKey: '526967',
    },

    3: {
      name: 'Sala del piso 5',
      videoUrl: '[PENDIENTE]',
      challengeText: `
        Una imagen digital contiene un píxel definido por:

        ~~~
        R = 11111111 (base 2)
        G = 11111111 (base 2)
        B = 00000000 (base 2)
        ~~~

        Se aplica primero la transformación:

        ~~~
        nuevo canal = 255 - canal original
        ~~~

        Después se intercambian los canales así:

        ~~~
        R' = B
        G' = G
        B' = R
        ~~~

        ¿Qué color resulta finalmente? Respondan únicamente con el nombre del color.
      `,
      acceptedAnswers: [
        '0a326c61a4681e0f368b9ead964bdfd7ad9b19f5ff44b0ddac427aca80603aea',
        '2df352df6b2f8772d8fcaf02a67f1dd85be066cc4fa62c4c9cf977a1483cdf8e',
        'b6e74f9d3ab811f828c08d3f87aaa1ab6c8137a99cf2bf87ba0cfa43171306fa',
        'e73c25866977b6698494a0e5f0b7899d93cefc92a5d763c83354c0af67ad49a4',
      ],
      nextMessage: '¡Correcto! Ahora busquen ese color en un elemento real del edificio. Pocos estudiantes suben muchos pisos por allí y existe una teoría según la cual su color estaría relacionado con la afición del creador del edificio por el Barcelona. Siguiente estación: escaleras rojas.',
      searchHint: '[PISTA ADICIONAL DEL QR DE LAS ESCALERAS ROJAS - PENDIENTE POR DEFINIR]',
      qrKey: '8a7944',
    },

    4: {
      name: 'Escaleras rojas',
      videoUrl: '[PENDIENTE]',
      challengeText: `
        Una red no dirigida tiene las siguientes conexiones:

        ~~~
        A-B, A-C, B-C, C-D, D-E, D-F, E-F, F-G, E-G
        ~~~

        Determinen qué conexión tiene la siguiente propiedad:

        Si se elimina, aumenta el número de componentes conexos de la red.

        Respondan en formato X-Y.
      `,
      acceptedAnswers: [
        '542734634326e5e86ce8bbfba8188562c08801bac5b948f41c06b273c92b40c2',
        '08307e9cf97f783a98a369760c87fe99dc944bf0541476441f3721e7503951a8',
        '90ec58127ec472ffb7e3f90c3ee320f8bb1dc6bc64a48143e6d91f7d9a6de236',
        'ecdba0e2f6615760b196edd49a2f1bf0d0d6dfccbf0ad8fe9ee55722dcca42a4',
      ],
      nextMessage: '¡Correcto! La conexión que encontraron es un puente. Ahora busquen uno en la Facultad: no cruza agua, pero une dos zonas importantes, el edificio principal y el sector administrativo. Siguiente estación: pasillo entre ambos edificios.',
      searchHint: '[PISTA ADICIONAL DEL QR DEL PASILLO - PENDIENTE POR DEFINIR]',
      qrKey: '47e056',
    },

    5: {
      name: 'Pasillo entre edificios',
      videoUrl: '[PENDIENTE]',
      challengeText: `
        Se dispone de la coordenada:

        ~~~
        (4.628, -74.064)
        ~~~

        Deben decidir cuál sistema puede almacenarla directamente en ese formato:

        ~~~
        EPSG:3857
        EPSG:4326
        ~~~

        Antes de responder, verifiquen cuál utiliza latitud/longitud en grados y cuál utiliza coordenadas proyectadas en metros.

        Respondan únicamente con el número EPSG correcto.
      `,
      acceptedAnswers: [
        'cd2ed2d000e7d0e9826f8fa11e7910a8893afad851bd0f1dc1f845f032d654b6',
        '21c662fd1a246c3def8d4ee7f9d71c317c042c0546a1c3b46f223678ee9e8e3b',
        '663e48ceded77a0f68313ddc79f0fffa411b3c70160f4f17badf6219c2e61a08',
      ],
      nextMessage: '¡Correcto! Acaban de trabajar con un sistema utilizado para localizar posiciones sobre la Tierra. Ahora busquen el espacio donde mapas, territorio, coordenadas y datos se encuentran. Siguiente estación: Geoinformática.',
      searchHint: '[PISTA ADICIONAL DEL QR DE GEOINFORMÁTICA - PENDIENTE POR DEFINIR]',
      qrKey: '57ae0c',
    },

    6: {
      name: 'Geoinformática',
      videoUrl: '[PENDIENTE]',
      challengeText: `
        Dos resistencias están conectadas en paralelo:

        ~~~
        R1: Rojo - Rojo - Rojo - Dorado
        R2: Rojo - Rojo - Rojo - Dorado
        ~~~

        Una tercera resistencia está conectada en serie con ese conjunto:

        ~~~
        R3: Amarillo - Violeta - Rojo - Dorado
        ~~~

        Ignoren la tolerancia. Calculen la resistencia equivalente total y escriban el resultado en ohmios.
      `,
      acceptedAnswers: [
        '5246272819cf9d3f50bdf7d03ac84ed65e5604ae8b4cd831e027813a258e03fc',
        '47ea001782c7d4fce57c44656fe1c29742c4883d9c7bee1322a4162d647a22d0',
        '60324ef6659bba3bff43a954b87e4e55846cbd655575946a54953026eaf228cb',
        '0430dcfa50a5a31b6433442c40516ff29ceb02eb6c78317cc895679fa630a276',
        'e961ac6ed0fc98311c5f4e5f364e3bbab7d6b52ce4fe8aa690b4b876bdf92e79',
        '2c84df70afbb411b2cdda41b4fc688e5cef4a1badb3676d64d8f09743e1a0fdb',
        'bb2a4ab565ebb6180c86282b42f5fb45f2ede215122dbbfdc29733ac6c2a63dc',
        '9a7aa203e774cf363d7eeeab53188bf9e0075700901769545442e5dc07fe8e00',
        'de0eb72e334824ded1afd2f30a2eb1d2dbd557be2d159c2a7ecd0a7e3b148f0a',
        'd56187d27224aadf795a4d67d6454c55363286fd354a7880513adf8a772775b5',
        '59b75b9eceac50bab3bfccaa70d8e0940c6cfecf6f3d2fba229d0ce1526316c7',
        '3eebae6015b19b9086421ce661910b717db7ca6076d19453812f72b15c6a9864',
        '993025f33f19f41159d1fd9069933754fededec53b0b7b82460fc5e7c466a97c',
      ],
      nextMessage: '¡Correcto! Interpretaron códigos de colores, una conexión en paralelo y una conexión en serie. Busquen ahora el piso donde se encuentra el jefe del área asociada a circuitos, señales y componentes. Siguiente estación: Electrónica.',
      searchHint: '[PISTA ADICIONAL DEL QR DEL PISO DE ELECTRÓNICA - PENDIENTE POR DEFINIR]',
      qrKey: '197c48',
    },

    7: {
      name: 'Piso del jefe de Electrónica',
      videoUrl: '[PENDIENTE]',
      challengeText: `
        En una representación a escala, la base rectangular de un edificio mide:

        ~~~
        12 cm x 16 cm
        ~~~

        La diagonal real correspondiente mide 50 m.

        Determinen la escala de la representación. Respondan en formato 1:N.
      `,
      acceptedAnswers: [
        '6c77e33af359f4f5082e68f1f8b3e67f2dac8b01f107468dce2b7b40ab519afd',
        'cd44030c4fbd4198670e4ac49c997a6333d8051a474ec110ee26b48ac49e5453',
        'bc2e4591cfd94cb8f94f9a9a7604e30e10535922a5a427f413f628398e35ad78',
        '1e472b39b105d349bcd069c4a711b44a2fffb8e274714bb07ecfff69a9a7f67b',
      ],
      nextMessage: '¡Correcto! Acaban de calcular cómo representar una estructura real en un tamaño mucho menor. Ahora encuentren precisamente eso: el edificio de Ingeniería completo, pero reducido para poder observarlo entero. Siguiente estación: maqueta del edificio.',
      searchHint: '[PISTA ADICIONAL DEL QR DE LA MAQUETA - PENDIENTE POR DEFINIR]',
      qrKey: '1ab9ba',
    },

    8: {
      name: 'Maqueta del edificio',
      videoUrl: '[PENDIENTE]',
      challengeText: `
        Cuadrícula (filas A-D, columnas 1-4):

        ~~~
             1     2     3     4
        A: [   ] [   ] [   ] [   ]
        B: [   ] [   ] [   ] [ S ]
        C: [ R ] [   ] [   ] [ A ]
        D: [INI] [   ] [   ] [   ]

        INI = casilla de INICIO
        ~~~

        El robot inicia en D1 mirando hacia el norte. Ejecuta:

        ~~~
        n = 3
        AVANZAR
        GIRAR_DERECHA
        MIENTRAS n > 0:
            AVANZAR
            n = n - 1
        GIRAR_IZQUIERDA
        AVANZAR
        ~~~

        Registren únicamente las letras de las casillas visitadas y concaténenlas en orden.
      `,
      acceptedAnswers: [
        '8a84fd359f8103230fb6d3f16f55a4c077bf1813b828216da3b1bd3272326774',
        'ba082ebc11f7478aea30eee88f72d7722f7449edcfda48bcd2f7509fe87720ff',
        '1282c11fb8d8dc93c02c0ad25892fb6c78265f3f436a7e3847a2570855f63ec2',
      ],
      nextMessage: '¡Correcto! Las letras obtenidas son unas siglas. Busquen el semillero donde algoritmos, sensores y máquinas dejan de ser solamente código y comienzan a moverse. Siguiente estación: Semillero RAS.',
      searchHint: '[PISTA ADICIONAL DEL QR DEL SEMILLERO RAS - PENDIENTE POR DEFINIR]',
      qrKey: 'f40b8e',
    },

    9: {
      name: 'Semillero RAS',
      videoUrl: '[PENDIENTE]',
      challengeText: `
        Analicen la siguiente secuencia:

        ~~~
        x = 0x6
        x = x << 1
        x = x XOR 0x3
        x = x - 1
        ~~~

        Expresen el valor final en decimal.
      `,
      acceptedAnswers: [
        '8527a891e224136950ff32ca212b45bc93f69fbb801c3b1ebedac52775f99e61',
        '65cebb6f370f68502d4af051143fcd0def5afa569cf0176964bdf95bdf1ce5f1',
        '9d9e227b2d751dc8cd5422079f46c95842554385ab0dfd4e13d2eb406c3fa064',
        '176710c1788be9660b5fc61335472b21e1ec7d9b7e2e6e85da4e485ccc7b32c5',
      ],
      nextMessage: '¡Correcto! Esta vez el número obtenido representa directamente su siguiente destino. Suban hasta ese piso y busquen el lugar desde el cual pueden observar buena parte de Bogotá. Siguiente estación: piso 14 / terraza.',
      searchHint: '[PISTA ADICIONAL DEL QR DE LA TERRAZA / PISO 14 - PENDIENTE POR DEFINIR]',
      qrKey: '5047f3',
    },

    // Reflexión final: no se valida contra una respuesta, solo su longitud.
    10: {
      name: 'Piso 14 / Terraza',
      videoUrl: '[PENDIENTE]',
      challengeText: `
        Han llegado al final del recorrido. Durante estas diez estaciones conocieron a profesoras y estudiantes de la Facultad de Ingeniería, sus experiencias, proyectos, áreas de trabajo, aprendizajes y caminos dentro de la ingeniería.

        Escriban un texto en el que mencionen algo que haya dicho cada profesora o estudiante de los videos y destaquen aquello que más los marcó. No buscamos una transcripción literal: queremos saber qué recordaron y qué significado tuvo para ustedes.
      `,
      qrKey: 'dd0d10',
    },
  },
};
