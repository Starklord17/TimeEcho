import { LEVELS, levelMetadata, type LevelId } from '../levels/levelMetadata'
import { downloadRun } from '../recording/downloadRun'
import { useGameStore } from '../state/gameStore'

export function GameOverlay() {
  const currentLevel = useGameStore((s) => s.currentLevel)
  const unlockedLevels = useGameStore((s) => s.unlockedLevels)
  const level = levelMetadata(currentLevel)
  const nextLevel =
    LEVELS[LEVELS.findIndex((entry) => entry.id === currentLevel) + 1]
  const selectLevel = (id: LevelId) => {
    if (document.pointerLockElement) document.exitPointerLock()
    useGameStore.getState().selectLevel(id)
  }
  const cyclePhase = useGameStore((state) => state.cyclePhase)
  const completed = useGameStore((state) => state.completed)
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
        <span className="phase">TEMPORAL LAB</span>
      </header>
      <div className="room-label">
        <span className="eyebrow">TEMPORAL LAB</span>
        <span>{level.name}</span>
      </div>
      <div className="cycle-hud" aria-label="Cycle status">
        <span>CYCLE {cycle.toString().padStart(2, '0')}</span>
        <strong>
          {Math.floor(remainingSeconds / 60)
            .toString()
            .padStart(2, '0')}
          :{(remainingSeconds % 60).toString().padStart(2, '0')}
        </strong>
        <small>
          {completed
            ? 'LEVEL COMPLETE'
            : active
              ? cyclePhase === 'PLAYING'
                ? 'RECORDING RUN'
                : 'RESETTING CYCLE'
              : 'PAUSED'}
        </small>
        {lastRun && <small>ECHO FROM CYCLE {lastRun.cycle}</small>}
      </div>
      <section
        className={`welcome ${active ? 'is-hidden' : ''}`}
        aria-hidden={active}
        inert={active}
      >
        <p className="eyebrow">A PLACE OUTSIDE TIME</p>
        <h1>
          {completed
            ? nextLevel
              ? 'Puzzle complete.'
              : 'Demo complete.'
            : 'Time leaves traces.'}
        </h1>
        <p className="description">
          {completed
            ? 'You found a way forward.'
            : 'Every cycle returns to the beginning. Not everything you do disappears. Watch what changes around you.'}
        </p>
        <button id="enter-game" disabled={!ready || active || completed}>
          {ready ? 'Enter / continue' : 'Preparing the scene…'}
          <span aria-hidden="true">↗</span>
        </button>
        {!completed && ready && (
          <button
            className="secondary-action"
            onClick={() => useGameStore.getState().resetSession()}
          >
            Restart level
          </button>
        )}
        {completed && (
          <div className="level-actions">
            {nextLevel && (
              <button onClick={() => selectLevel(nextLevel.id)}>
                Next level
              </button>
            )}
            <button onClick={() => selectLevel(currentLevel)}>Replay</button>
          </div>
        )}
        {unlockedLevels.length > 1 && (
          <label className="level-selector">
            Level{' '}
            <select
              aria-label="Level"
              value={currentLevel}
              onChange={(event) => selectLevel(event.target.value as LevelId)}
            >
              {LEVELS.filter((entry) => unlockedLevels.includes(entry.id)).map(
                (entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ),
              )}
            </select>
          </label>
        )}
        <p className="hint">
          Click to capture the mouse · Escape to release it
        </p>
        {lastRun && (
          <div className="recording-summary">
            <p>
              Last run: cycle {lastRun.cycle} · {lastRun.duration.toFixed(2)} s
              · {lastRun.frames.length} samples
            </p>
            <button onClick={() => downloadRun(lastRun)}>
              Download run JSON
            </button>
          </div>
        )}
        {error && <p role="alert">{error}</p>}
      </section>
      {active && (
        <>
          <div className="crosshair" aria-hidden="true" />
          <div className="objective" role="status">
            {lastRun
              ? 'The room is the same. What happens is not.'
              : 'Take a moment to observe.'}
          </div>
        </>
      )}
      <footer>
        <div className="controls">
          <span>
            <kbd>R</kbd> Reset cycle
          </span>
          <span>
            <kbd>W</kbd>
            <kbd>A</kbd>
            <kbd>S</kbd>
            <kbd>D</kbd> Move
          </span>
          <span>
            MOUSE / ↑ ↓ ← →{' '}
            <span className="muted">{fallback ? 'Drag to look' : 'Look'}</span>
          </span>
          <span>
            <kbd>ESC</kbd> Release mouse
          </span>
        </div>
        <span className="status">
          <i />
          {fallback
            ? 'DRAG MODE'
            : locked
              ? 'EXPLORING'
              : ready
                ? 'READY TO EXPLORE'
                : 'LOADING'}
        </span>
      </footer>
    </div>
  )
}
