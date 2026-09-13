import { downloadRun } from '../recording/downloadRun'
import { useGameStore } from '../state/gameStore'

export function GameOverlay() {
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
      <header>
        <a className="wordmark" href="./">
          TIME <span>ECHO</span>
          <span className="brand-dot" />
        </a>
        <span className="phase">RECORDING / 002</span>
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
        <small>{active ? 'GRABANDO RECORRIDO' : 'EN PAUSA'}</small>
        {lastRun && <small>RECORRIDO {lastRun.cycle} GUARDADO</small>}
      </div>
      <section
        className={`welcome ${active ? 'is-hidden' : ''}`}
        aria-hidden={active}
      >
        <p className="eyebrow">PHASE 2 — RECORDING</p>
        <h1>
          Todo empieza
          <br />
          en esta habitación.
        </h1>
        <p className="description">
          Tenés 15 segundos para explorar.
          <br />
          Cada ciclo te devuelve al punto de partida.
        </p>
        <button id="enter-game" disabled={!ready || active}>
          {ready ? 'Entrar / continuar' : 'Preparando la escena…'}
          <span aria-hidden="true">↗</span>
        </button>
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
      {active && <div className="crosshair" aria-hidden="true" />}
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
