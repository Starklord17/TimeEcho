import { LEVELS, levelMetadata, type LevelId } from '../levels/levelMetadata'
import { useGameStore } from '../state/gameStore'
import { useEffect } from 'react'
import { activateAudio } from '../audio/audioBridge'
import {
  getAudioSettings,
  setAudioSettings,
  useAudioSettings,
} from '../audio/audioSettings'

export function GameOverlay() {
  const audio = useAudioSettings()
  useEffect(() => {
    const toggle = (event: KeyboardEvent) => {
      if (
        event.code !== 'KeyM' ||
        event.repeat ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement
      )
        return
      event.preventDefault()
      setAudioSettings({ muted: !getAudioSettings().muted })
    }
    window.addEventListener('keydown', toggle)
    return () => window.removeEventListener('keydown', toggle)
  }, [])
  const currentLevel = useGameStore((s) => s.currentLevel)
  const unlockedLevels = useGameStore((s) => s.unlockedLevels)
  const levelAccessMode = useGameStore((s) => s.levelAccessMode)
  const freeAccess = levelAccessMode === 'free'
  const level = levelMetadata(currentLevel)
  const nextLevel =
    LEVELS[LEVELS.findIndex((entry) => entry.id === currentLevel) + 1]
  const selectLevel = (id: LevelId) => {
    if (document.pointerLockElement) document.exitPointerLock()
    useGameStore.getState().selectLevel(id)
  }
  const cyclePhase = useGameStore((state) => state.cyclePhase)
  const completed = useGameStore((state) => state.completed)
  const runs = useGameStore((state) => state.runs)
  const hasMemories = runs.length > 0
  const cycle = useGameStore((state) => state.cycle)
  const remainingSeconds = useGameStore((state) => state.remainingSeconds)
  const ready = useGameStore((state) => state.ready)
  const locked = useGameStore((state) => state.locked)
  const fallback = useGameStore((state) => state.fallback)
  const active = locked || fallback
  const platePlayer = useGameStore((state) => state.platePlayer)
  const resetHint =
    active && cyclePhase === 'PLAYING' && !completed && platePlayer
  const error = useGameStore((state) => state.error)
  return (
    <div className="overlay">
      <div id="cycle-transition" aria-hidden="true" />
      <header>
        <a className="wordmark" href="./">
          TIME <span>ECHO</span>
          <span className="brand-dot" />
        </a>
        <span className="phase">
          TEMPORAL LAB · AUDIO {audio.muted ? 'OFF' : 'ON'} · M
        </span>
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
        <small>
          MEMORIES {runs.length} / {level.echoLimit}
        </small>
        {runs.map((run) => (
          <small key={run.cycle}>
            CYCLE {run.cycle}
            {runs.length === level.echoLimit && run === runs[0]
              ? ' · NEXT TO FADE'
              : ''}
          </small>
        ))}
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
        <button
          id="enter-game"
          disabled={!ready || active || completed}
          onClick={activateAudio}
        >
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
        <fieldset className="audio-settings">
          <legend>Audio</legend>
          <label>
            Music <output>{Math.round(audio.music * 100)}%</output>
            <input
              aria-label="Music volume"
              type="range"
              min="0"
              max="100"
              value={Math.round(audio.music * 100)}
              onChange={(event) =>
                setAudioSettings({ music: Number(event.target.value) / 100 })
              }
            />
          </label>
          <label>
            Effects <output>{Math.round(audio.effects * 100)}%</output>
            <input
              aria-label="Effects volume"
              type="range"
              min="0"
              max="100"
              value={Math.round(audio.effects * 100)}
              onChange={(event) =>
                setAudioSettings({ effects: Number(event.target.value) / 100 })
              }
            />
          </label>
          <button
            type="button"
            className="secondary-action"
            aria-pressed={audio.muted}
            onClick={() => setAudioSettings({ muted: !audio.muted })}
          >
            {audio.muted ? 'Unmute audio' : 'Mute audio'}
          </button>
        </fieldset>
        {completed && (
          <div className="level-actions">
            {nextLevel &&
              (freeAccess || unlockedLevels.includes(nextLevel.id)) && (
                <button onClick={() => selectLevel(nextLevel.id)}>
                  Next level
                </button>
              )}
            <button onClick={() => selectLevel(currentLevel)}>Replay</button>
          </div>
        )}
        <label className="level-access-switch">
          <span>
            <input
              type="checkbox"
              role="switch"
              checked={freeAccess}
              aria-describedby="level-access-description"
              onChange={(event) =>
                useGameStore
                  .getState()
                  .setLevelAccessMode(
                    event.target.checked ? 'free' : 'progression',
                  )
              }
            />{' '}
            Free level access
          </span>
          <small id="level-access-description">
            {freeAccess
              ? 'Choose any level for a demo. Progression stays unchanged.'
              : 'Complete each level to unlock the next.'}
          </small>
        </label>
        {(freeAccess || unlockedLevels.length > 1) && (
          <label className="level-selector">
            Level{' '}
            <select
              aria-label="Level"
              value={currentLevel}
              onChange={(event) => selectLevel(event.target.value as LevelId)}
            >
              {LEVELS.filter(
                (entry) => freeAccess || unlockedLevels.includes(entry.id),
              ).map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <p className="hint">
          Click to capture the mouse · Escape to release it
        </p>
        {error && <p role="alert">{error}</p>}
      </section>
      {active && (
        <>
          <div className="crosshair" aria-hidden="true" />
          <div className="objective" role="status">
            {hasMemories
              ? 'The room is the same. What happens is not.'
              : 'Take a moment to observe.'}
          </div>
        </>
      )}
      <footer>
        <div className="controls">
          <span
            className={`reset-control${resetHint ? ' is-highlighted' : ''}`}
          >
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
