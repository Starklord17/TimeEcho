import type { RecordedRun } from '../recording/Recorder'
import { LEVELS, levelMetadata, type LevelId } from '../levels/levelMetadata'
import { create } from 'zustand'

type GameState = {
  currentLevel: LevelId
  unlockedLevels: LevelId[]
  selectLevel: (id: LevelId) => void
  cyclePhase: 'PLAYING' | 'CYCLE_ENDING' | 'RESETTING'
  setCyclePhase: (phase: GameState['cyclePhase']) => void
  sessionId: number
  resetSession: () => void
  platePlayer: boolean
  plateEcho: boolean
  doorOpen: boolean
  completed: boolean
  completeLevel: () => void
  publishPuzzle: (
    platePlayer: boolean,
    plateEcho: boolean,
    doorOpen: boolean,
  ) => void
  runs: readonly RecordedRun[]
  saveRun: (run: RecordedRun) => void
  cycle: number
  remainingSeconds: number
  restartRequested: boolean
  requestRestart: () => void
  publishCycle: (cycle: number, remainingSeconds: number) => void

  fallback: boolean
  setFallback: (fallback: boolean) => void
  ready: boolean
  locked: boolean
  error: string | null
  setReady: (ready: boolean) => void
  setLocked: (locked: boolean) => void
  setError: (error: string | null) => void
}

function freshSession(currentLevel: LevelId, sessionId: number) {
  return {
    currentLevel,
    sessionId,
    cyclePhase: 'PLAYING' as const,
    platePlayer: false,
    plateEcho: false,
    doorOpen: false,
    completed: false,
    runs: [],
    cycle: 1,
    remainingSeconds: levelMetadata(currentLevel).duration,
    restartRequested: false,
    fallback: false,
    ready: false,
    locked: false,
    error: null,
  }
}

// Only low-frequency UI/session state. Transforms stay in Three and Rapier.
export const useGameStore = create<GameState>((set) => ({
  cyclePhase: 'PLAYING',
  setCyclePhase: (cyclePhase) => {
    if (useGameStore.getState().cyclePhase !== cyclePhase) set({ cyclePhase })
  },
  sessionId: 0,
  currentLevel: 'empty-room',
  unlockedLevels: ['empty-room'],
  selectLevel: (id) => {
    const state = useGameStore.getState()
    if (state.unlockedLevels.includes(id))
      set(freshSession(id, state.sessionId + 1))
  },
  resetSession: () =>
    set((state) => freshSession(state.currentLevel, state.sessionId + 1)),
  platePlayer: false,
  plateEcho: false,
  doorOpen: false,
  completed: false,
  completeLevel: () =>
    set((state) => {
      const next =
        LEVELS[LEVELS.findIndex((level) => level.id === state.currentLevel) + 1]
      return {
        completed: true,
        fallback: false,
        locked: false,
        unlockedLevels:
          next && !state.unlockedLevels.includes(next.id)
            ? [...state.unlockedLevels, next.id]
            : state.unlockedLevels,
      }
    }),
  publishPuzzle: (platePlayer, plateEcho, doorOpen) => {
    const state = useGameStore.getState()
    if (
      state.platePlayer !== platePlayer ||
      state.plateEcho !== plateEcho ||
      state.doorOpen !== doorOpen
    )
      set({ platePlayer, plateEcho, doorOpen })
  },
  runs: [],
  saveRun: (run) =>
    set((state) => ({
      runs: [...state.runs, run].slice(
        -levelMetadata(state.currentLevel).echoLimit,
      ),
    })),
  cycle: 1,
  remainingSeconds: LEVELS[0].duration,
  restartRequested: false,
  requestRestart: () => {
    const state = useGameStore.getState()
    if (state.cyclePhase === 'PLAYING' && !state.completed)
      set({ restartRequested: true })
  },
  publishCycle: (cycle, remainingSeconds) => {
    const current = useGameStore.getState()
    if (
      current.cycle !== cycle ||
      current.remainingSeconds !== remainingSeconds ||
      current.restartRequested
    )
      set({ cycle, remainingSeconds, restartRequested: false })
  },
  fallback: false,
  setFallback: (fallback) => set({ fallback, error: null }),
  ready: false,
  locked: false,
  error: null,
  setReady: (ready) => set({ ready }),
  setLocked: (locked) => set({ locked, error: null }),
  setError: (error) => set({ error }),
}))
