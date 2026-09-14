# Time Echo

## Ejecutar

Node 22.12+ (validado con 22.21.0) y pnpm 10.33.2.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Abrir la dirección que imprime Vite en un navegador de escritorio con WebGL.

## Controles y ciclos

- **Entrar / continuar:** inicia o reanuda el juego y solicita capturar el mouse.
- **WASD:** caminar; **mouse o flechas:** mirar. ←/→ giran, ↑/↓ inclinan la cámara. Sin salto ni sprint.
- **Modo arrastre:** si Pointer Lock se rechaza, mantener el botón izquierdo para mirar.
- **R:** abandona el ciclo actual y empieza el siguiente en el spawn, con 15 segundos.
- **Escape / pérdida de foco:** pausa el jugador y timer y libera el mouse.
- **Timeout:** al completar 15 segundos simulados vuelve al spawn y avanza el ciclo.
- **Recargar:** comienza una sesión nueva desde ciclo 1.

## Arquitectura

Directorios dentro de `src/`:

- `app/`: composición UI/Canvas y error boundary.
- `game/`: Canvas, luces y mundo Rapier.
- `levels/`: habitación greybox, dimensiones y spawn.
- `player/`: cápsula cinemática, character controller, cámara y reset físico.
- `input/`: WASD/R, Pointer Lock nativo y fallback de arrastre.
- `puzzle/`: sensores Rapier, placa, puerta y salida.
- `echo/`: entidad visual, muestreo interpolado y reloj de playback.
- `recording/`: recorder, tipos de ejecución y descarga JSON local.
- `time-loop/`: reloj de ticks enteros, duración y reglas de reinicio.
- `state/`: Zustand con metadatos de UI y solicitudes de restart, sin transforms.
- `ui/`: interfaz HTML, contador y timer.

React y sus tipos declaran rangos compatibles con 19.2; las versiones resueltas
quedan registradas en `pnpm-lock.yaml`.
Vite + TypeScript strict, Three, React Three Rapier, Zustand. Drei queda instalado
para carga GLB y helpers; la cámara utiliza la API nativa tras la corrección de Pointer Lock.
No se añadieron dependencias en Phase 1.

El jugador avanza a 3.5 m/s dentro de una habitación de 12 × 14 m. El reloj usa
900 pasos de 1/60 s. El timer del HUD se publica por segundo; los demás cambios de UI se publican
al cambiar su estado, sin guardar transforms por frame.
El reset restablece cuerpo actual y próximo target, orientación, velocidades,
gravedad acumulada, cámara e input. La cámara evita interpolar el teletransporte.

## Validación

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm format:check
pnpm build
pnpm preview
```

En el árbol de trabajo con Echo GLB, 57 tests cubren física, input, fallback, ciclo exacto, restart, 100 ciclos sin
drift regreso al spawn y grabación de colisiones con Rapier real. Tipos, lint, formato y build verificados.
Cuatro de esas pruebas validan el contrato del Echo GLB.
La revisión visual usa un recorrido de QA y no sustituye una partida manual completa
de aceptación del nuevo modelo.

Para aceptar la fase, caminar/girar hasta vencer el tiempo y comprobar el retorno
al marcador claro mirando hacia la pared de referencia; probar también R,
Escape y reanudación sin teclas retenidas.

## Límites actuales

- Tiempo de simulación, no reloj de pared: con bajo rendimiento puede avanzar más lento.
- El spawn es [0, 0.92, 4] al reset; la gravedad asienta la cápsula después.
- Pausa del jugador/timer; el mundo estático Rapier sigue ejecutando pasos.
- Solo desktop. Pointer Lock depende del navegador; arrastre es el fallback.
- Bundle ~1.18 MB gzip; Vite advierte sobre tamaño. Persisten avisos upstream de
  THREE.Clock e inicialización WASM. No se ocultaron avisos ni modificaron dependencias.
- Sin mediciones de FPS en equipos variados ni garantía de replay determinista por input.

## Inspeccionar una grabación

1. Entrar y caminar/girar durante un ciclo, o presionar R para cerrar uno parcial.
2. Presionar Escape: el panel muestra ciclo, duración y cantidad de muestras.
3. Usar **Descargar recorrido JSON** para guardar la última ejecución finalizada.

El buffer activo vive fuera de React; solo el recorrido finalizado se publica.
El JSON v1 contiene timestamps en segundos, posición mundial del cuerpo y quaternion
de mirada. Se graban 901 muestras por ciclo completo (incluye t=0 y t=15).
Solo se conserva la última ejecución; recargar borra la memoria no exportada.
El echo usa la ejecución en memoria; no hay importación de archivos JSON.

## Ver el echo

1. Caminar por la habitación durante el primer ciclo.
2. Dejar que termine o presionar R para guardar un recorrido parcial.
3. En el siguiente ciclo tomar otro camino: una figura cian reproduce el anterior.
4. Escape pausa jugador, timer y echo; Entrar / continuar reanuda.

Se muestra solo el último recorrido. Un echo parcial permanece en su punto final;
no vuelve a empezar hasta otro ciclo. No tiene colisión. La cabeza indica la mirada.
En el spawn puede superponerse con el jugador: alejarse permite verlo.

## Resolver el primer puzzle

1. Caminar hasta la placa amarilla a la izquierda del spawn. El HUD confirma PLACA: JUGADOR.
2. Permanecer allí hasta terminar el ciclo o presionar R sobre ella.
3. En el siguiente ciclo dejar que el echo llegue a la placa: la puerta central se abre.
4. Cruzar hacia la zona ámbar del fondo. Aparece Puzzle completado.
5. Volver a jugar reinicia la sesión completa sin recargar la página.

La placa permanece activa con cualquiera de los dos actores. La puerta no se
cierra mientras el jugador ocupa el vano. El echo no puede ganar por sí solo.
El ciclo ganador se congela al completar; la exportación conserva el último recorrido finalizado.

## Pulido de la experiencia

Las señales 01/02/03 y el objetivo del HUD guían placa, puerta y salida. La puerta
se eleva en 0.4 segundos con su colisión. Escape pausa también la animación.
**Reiniciar partida** en pausa y **Volver a jugar** en victoria limpian la sesión
sin recargar: ciclo 1, sin grabaciones, cámara al spawn y puerta cerrada. **R**
continúa reiniciando únicamente el ciclo actual.

## Transición y feedback

R y timeout cierran el recorrido y ejecutan una transición de 0.3 s (18 pasos).
En el punto medio se restaura el mundo y se publica el último recorrido como echo.
El siguiente ciclo tiene 15 segundos completos. Movimiento, mirada y R quedan
bloqueados durante la transición; Escape o pérdida de foco la pausan.

La placa distingue jugador (ámbar), echo (cian) y ambos con indicadores separados
y texto. Su panel baja 2 cm sin modificar el sensor. La puerta usa easing para
abrir/cerrar, con collider sincronizado y protección del vano. La salida es ámbar;
el echo continúa cian y sin colisión. No hay nuevos niveles ni mecánicas temporales.

## Assets Blender

Consultar [Fuentes Blender](assets/blender/README.md) para los contratos y destinos.
El primer modelo artístico creado e integrado es Echo. Door tiene
un pipeline preparado y conserva `mode: 'procedural'` en `src/puzzle/doorAsset.ts`;
no existe todavía `door.blend` ni un `door.glb` de producción. La fixture GLB de
puerta es exclusivamente para tests. Un error de carga o contrato conserva el
visual procedural y la física del puzzle.

## Echo Blender

El Echo usa un GLB propio de 4.556 triángulos, con fallback procedural.
[Especificación y renders](assets/blender/ECHO_SPEC.md). En desarrollo,
`/echo-review.html` permite comparar vistas, movimiento y activación de placa
con los componentes reales y un recorrido de QA. No se publica en el build normal.
El fallback procedural cubre errores de carga o contrato.
