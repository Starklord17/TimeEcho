# Time Echo

**Phase 4 — First Temporal Interaction.** Primer puzzle temporal jugable:
una placa activada por jugador o echo abre una puerta para alcanzar la salida.
Mantiene controles FPS, recording, replay y ciclos de 15 segundos.

La historia desde cero, las decisiones, correcciones, validaciones y límites se
conservan en [DEVELOPMENT_HISTORY.md](docs/DEVELOPMENT_HISTORY.md).

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

React 19.2 y sus tipos están fijados por compatibilidad con Fiber 9.7.
Vite + TypeScript strict, Three, React Three Rapier, Zustand. Drei queda instalado
para helpers; la cámara utiliza la API nativa tras la corrección de Pointer Lock.
No se añadieron dependencias en Phase 1.

El jugador avanza a 3.5 m/s dentro de una habitación de 12 × 14 m. El reloj usa
900 pasos de 1/60 s. El HUD se actualiza por segundo, sin writes al store por frame.
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

43 tests cubren física, input, fallback, ciclo exacto, restart, 100 ciclos sin
drift regreso al spawn y grabación de colisiones con Rapier real. Tipos, lint, formato y build verificados.
En navegador se comprobó avance automático, restart con R y pausa con Escape.

Para aceptar la fase, caminar/girar hasta vencer el tiempo y comprobar el retorno
al marcador verde mirando hacia la pared de referencia; probar también R,
Escape y reanudación sin teclas retenidas.

## Límites actuales

- Tiempo de simulación, no reloj de pared: con bajo rendimiento puede avanzar más lento.
- El spawn es [0, 0.92, 4] al reset; la gravedad asienta la cápsula después.
- Pausa del jugador/timer; el mundo estático Rapier sigue ejecutando pasos.
- Solo desktop. Pointer Lock depende del navegador; arrastre es el fallback.
- Bundle ~1.15 MB gzip; Vite advierte sobre tamaño. Persisten avisos upstream de
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
4. Cruzar hacia la zona celeste del fondo. Aparece Puzzle completado.
5. Volver a jugar reinicia la sesión completa.

La placa permanece activa con cualquiera de los dos actores. La puerta no se
cierra mientras el jugador ocupa el vano. El echo no puede ganar por sí solo.
El ciclo ganador se congela al completar; la exportación conserva el último recorrido finalizado.

## Próximo paso

Validar Phase 4 y definir la siguiente milestone. El roadmap inicial está implementado.
