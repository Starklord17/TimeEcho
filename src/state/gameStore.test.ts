import { expect, it } from 'vitest'
import { useGameStore } from './gameStore'
import { Recorder } from '../recording/Recorder'

it('starts a fresh session while preserving store actions', () => {
  const recorder = new Recorder()
  recorder.begin(4, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 0, w: 1 })
  useGameStore.setState({
    cycle: 4,
    cyclePhase: 'RESETTING',
    remainingSeconds: 3,
    completed: true,
    plateEcho: true,
    doorOpen: true,
    lastRun: recorder.finish('restart'),
    restartRequested: true,
  })
  const oldId = useGameStore.getState().sessionId
  useGameStore.getState().resetSession()
  const state = useGameStore.getState()
  expect(state.sessionId).toBe(oldId + 1)
  expect(state.cyclePhase).toBe('PLAYING')
  expect(state.cycle).toBe(1)
  expect(state.remainingSeconds).toBe(15)
  expect(state.lastRun).toBe(null)
  expect([
    state.completed,
    state.plateEcho,
    state.doorOpen,
    state.restartRequested,
    state.ready,
    state.locked,
    state.fallback,
  ]).toEqual(Array(7).fill(false))
  state.requestRestart()
  expect(useGameStore.getState().restartRequested).toBe(true)
  state.resetSession()
})
