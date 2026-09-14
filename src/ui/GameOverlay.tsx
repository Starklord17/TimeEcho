import { downloadRun } from '../recording/downloadRun'
import { useGameStore } from '../state/gameStore'

export function GameOverlay() {
  const cyclePhase = useGameStore((state) => state.cyclePhase)
  const completed = useGameStore((state) => state.completed)
  const platePlayer = useGameStore((state) => state.platePlayer)
  const plateEcho = useGameStore((state) => state.plateEcho)
  const doorOpen = useGameStore((state) => state.doorOpen)
  const lastRun = useGameStore((state) => state.lastRun)
  const cycle = useGameStore((state) => state.cycle)
  const remainingSeconds = useGameStore((state) => state.remainingSeconds)
  const ready = useGameStore((state) => state.ready)
  const locked = useGameStore((state) => state.locked)
  const fallback = useGameStore((state) => state.fallback)
  const active = locked || fallback
  const error = useGameStore((state) => state.error)
  return (
    <div className="overlay">
      <div id="cycle-transition" aria-hidden="true" />
      <header>
        <a className="wordmark" href="./">
          TIME <span>ECHO</span>
          <span className="brand-dot" />
        </a>
        <span className="phase">TEMPORAL LAB / 005</span>
      </header>
      <div className="room-label">
        <span className="eyebrow">TEMPORAL LAB</span>
        <span>Empty Room</span>
      </div>
      <div className="cycle-hud" aria-label="Estado del ciclo">
        <span>CICLO {cycle.toString().padStart(2, '0')}</span>
        <strong>
          {Math.floor(remainingSeconds / 60)
            .toString()
            .padStart(2, '0')}
          :{(remainingSeconds % 60).toString().padStart(2, '0')}
        </strong>
        <small>
          {completed
            ? 'NIVEL COMPLETADO'
            : active
              ? cyclePhase === 'PLAYING'
                ? 'GRABANDO RECORRIDO'
                : 'REINICIANDO CICLO'
              : 'EN PAUSA'}
        </small>
        {lastRun && <small>ECHO DEL CICLO {lastRun.cycle}</small>}
        <small>
          PLACA:{' '}
          {platePlayer && plateEcho
            ? 'JUGADOR + ECHO'
            : platePlayer
              ? 'JUGADOR'
              : plateEcho
                ? 'ECHO'
                : 'LIBRE'}{' '}
          · PUERTA {doorOpen ? 'APERTURA ACTIVADA' : 'CERRADA'}
        </small>
      </div>
      <section
        className={`welcome ${active ? 'is-hidden' : ''}`}
        aria-hidden={active}
      >
        <p className="eyebrow">PHASE 5 — PUZZLE POLISH</p>
        <h1>
          {completed ? 'Puzzle completado.' : 'Tu pasado abre el camino.'}
        </h1>
        <p className="description">
          {completed
            ? 'El echo sostuvo la puerta mientras alcanzabas la salida.'
            : 'Ciclo 1: pisá la placa amarilla a la izquierda y presioná R. Ciclo 2: dejá que tu echo la active y cruzá la puerta hacia la zona ámbar.'}
        </p>
        <button id="enter-game" disabled={!ready || active || completed}>
          {ready ? 'Entrar / continuar' : 'Preparando la escena…'}
          <span aria-hidden="true">↗</span>
        </button>
        {!completed && ready && (
          <button
            className="secondary-action"
            onClick={() => useGameStore.getState().resetSession()}
          >
            Reiniciar partida
          </button>
        )}
        {completed && (
          <button onClick={() => useGameStore.getState().resetSession()}>
            Volver a jugar
          </button>
        )}
        <p className="hint">
          Click para capturar el mouse · Escape para liberarlo
        </p>
        {lastRun && (
          <div className="recording-summary">
            <p>
              Último recorrido: ciclo {lastRun.cycle} ·{' '}
              {lastRun.duration.toFixed(2)} s · {lastRun.frames.length} muestras
            </p>
            <button onClick={() => downloadRun(lastRun)}>
              Descargar recorrido JSON
            </button>
          </div>
        )}
        {error && <p role="alert">{error}</p>}
      </section>
      {active && (
        <>
          <div className="crosshair" aria-hidden="true" />
          <div className="objective" role="status">
            {plateEcho
              ? 'Tu echo sostiene la placa. Cruzá la puerta y alcanzá la salida.'
              : platePlayer
                ? 'Placa activada. Presioná R para dejarle este lugar a tu echo.'
                : lastRun
                  ? 'Esperá a tu echo o grabá un recorrido nuevo sobre la placa.'
                  : 'Buscá la placa amarilla a tu izquierda.'}
          </div>
        </>
      )}
      <footer>
        <div className="controls">
          <span>
            <kbd>R</kbd> Reiniciar ciclo
          </span>
          <span>
            <kbd>W</kbd>
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd> Mover
          </span>
          <span>
            MOUSE / ↑ ↓ ← →{' '}
            <span className="muted">
              {fallback ? 'Arrastrar para mirar' : 'Mirar'}
            </span>
          </span>
          <span>
            <kbd>ESC</kbd> Liberar mouse
          </span>
        </div>
        <span className="status">
          <i />
          {fallback
            ? 'MODO ARRASTRE'
            : locked
              ? 'EXPLORANDO'
              : ready
                ? 'LISTO PARA EXPLORAR'
                : 'CARGANDO'}
        </span>
      </footer>
    </div>
  )
}
