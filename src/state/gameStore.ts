import type { RecordedRun } from '../recording/Recorder'
import { CYCLE_SECONDS } from '../time-loop/TimeLoop'
import { create } from 'zustand'

type GameState = {
  lastRun: RecordedRun | null
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

// Only low-frequency UI/session state. Transforms stay in Three and Rapier.
export const useGameStore = create<GameState>((set) => ({
  lastRun: null,
  saveRun: (lastRun) => set({ lastRun }),
  cycle: 1,
  remainingSeconds: CYCLE_SECONDS,
  restartRequested: false,
  requestRestart: () => set({ restartRequested: true }),
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
