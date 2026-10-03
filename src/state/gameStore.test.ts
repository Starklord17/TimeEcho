import { beforeEach, expect, it } from 'vitest'
import { LEVELS } from '../levels/levelMetadata'
import { useGameStore } from './gameStore'
import { Recorder } from '../recording/Recorder'

beforeEach(() => {
  useGameStore.setState(useGameStore.getInitialState(), true)
})

it('starts in progression and rejects locked levels', () => {
  const state = useGameStore.getState()
  expect(state.levelAccessMode).toBe('progression')
  state.selectLevel('reversal')
  expect(useGameStore.getState()).toBe(state)
})

it('allows every level in free mode without unlocking progression', () => {
  const store = useGameStore.getState
  store().setLevelAccessMode('free')
  for (const level of LEVELS) {
    store().selectLevel(level.id)
    expect(store().currentLevel).toBe(level.id)
    expect(store().remainingSeconds).toBe(level.duration)
    store().completeLevel()
    expect(store().completed).toBe(true)
    expect(store().unlockedLevels).toEqual(['empty-room'])
    store().resetSession()
    expect(store().levelAccessMode).toBe('free')
    expect(store().completed).toBe(false)
  }
})

it('returns from a locked demo to the most advanced unlocked level with a fresh session', () => {
  const store = useGameStore.getState
  useGameStore.setState({ unlockedLevels: ['split-signal', 'empty-room'] })
  store().setLevelAccessMode('free')
  store().selectLevel('reversal')
  const recorder = new Recorder(45)
  recorder.begin(2, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 0, w: 1 })
  store().saveRun(recorder.finish('restart'))
  store().completeLevel()
  useGameStore.setState({ cycle: 2, ready: true, error: 'demo error' })
  const sessionId = store().sessionId
  store().setLevelAccessMode('progression')
  expect(store().currentLevel).toBe('split-signal')
  expect(store().sessionId).toBe(sessionId + 1)
  expect(store().remainingSeconds).toBe(20)
  expect(store().runs).toEqual([])
  expect(store().cycle).toBe(1)
  expect(store().completed).toBe(false)
  expect(store().ready).toBe(false)
  expect(store().error).toBeNull()
  expect(store().unlockedLevels).toEqual(['split-signal', 'empty-room'])
})

it('preserves an unlocked session when switching modes and resumes progression unlocks', () => {
  const store = useGameStore.getState
  store().setLevelAccessMode('free')
  useGameStore.setState({ cycle: 3, remainingSeconds: 7, ready: true })
  const before = store()
  store().setLevelAccessMode('progression')
  expect(store()).toEqual({ ...before, levelAccessMode: 'progression' })
  store().completeLevel()
  expect(store().unlockedLevels).toEqual(['empty-room', 'split-signal'])
})

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
    runs: [recorder.finish('restart')],
    restartRequested: true,
  })
  const oldId = useGameStore.getState().sessionId
  useGameStore.getState().resetSession()
  const state = useGameStore.getState()
  expect(state.sessionId).toBe(oldId + 1)
  expect(state.cyclePhase).toBe('PLAYING')
  expect(state.cycle).toBe(1)
  expect(state.remainingSeconds).toBe(15)
  expect(state.runs).toEqual([])
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

it('unlocks levels in order and clears transient state without losing session progress', () => {
  useGameStore.setState({
    currentLevel: 'empty-room',
    unlockedLevels: ['empty-room'],
  })
  useGameStore.getState().resetSession()
  useGameStore.getState().selectLevel('split-signal')
  expect(useGameStore.getState().currentLevel).toBe('empty-room')
  useGameStore.getState().completeLevel()
  expect(useGameStore.getState().unlockedLevels).toEqual([
    'empty-room',
    'split-signal',
  ])
  useGameStore.getState().selectLevel('split-signal')
  expect(useGameStore.getState().remainingSeconds).toBe(20)
  expect(useGameStore.getState().completed).toBe(false)
  expect(useGameStore.getState().ready).toBe(false)
  expect(useGameStore.getState().runs).toEqual([])
  useGameStore.getState().completeLevel()
  useGameStore.getState().resetSession()
  expect(useGameStore.getState().currentLevel).toBe('split-signal')
  expect(useGameStore.getState().completed).toBe(false)
  expect(useGameStore.getState().cycle).toBe(1)
  useGameStore.getState().selectLevel('empty-room')
  expect(useGameStore.getState().remainingSeconds).toBe(15)
  expect(useGameStore.getState().unlockedLevels).toEqual([
    'empty-room',
    'split-signal',
    'convergence',
  ])
  useGameStore.setState({ unlockedLevels: ['empty-room'] })
  useGameStore.getState().resetSession()
})

it('keeps the two newest memories in FIFO order in Convergence, and clears them on level changes', () => {
  useGameStore.setState({
    currentLevel: 'convergence',
    unlockedLevels: ['empty-room', 'split-signal', 'convergence'],
  })
  useGameStore.getState().resetSession()
  const run = (cycle: number) => {
    const r = new Recorder(20)
    r.begin(cycle, { x: cycle, y: 1, z: 0 }, { x: 0, y: 0, z: 0, w: 1 })
    return r.finish(cycle === 3 ? 'timeout' : 'restart')
  }
  const first = run(1),
    second = run(2),
    third = run(3)
  useGameStore.getState().saveRun(first)
  useGameStore.getState().saveRun(second)
  expect(useGameStore.getState().runs).toEqual([first, second])
  useGameStore.getState().saveRun(third)
  expect(useGameStore.getState().runs).toEqual([second, third])
  expect(useGameStore.getState().runs[0]).toBe(second)
  useGameStore.getState().completeLevel()
  expect(useGameStore.getState().unlockedLevels).toHaveLength(4)
  useGameStore.getState().resetSession()
  expect(useGameStore.getState().runs).toEqual([])
  expect(useGameStore.getState().remainingSeconds).toBe(20)
  for (const level of ['split-signal', 'empty-room'] as const) {
    useGameStore.getState().selectLevel(level)
    expect(useGameStore.getState().runs).toEqual([])
    useGameStore.getState().saveRun(first)
    useGameStore.getState().saveRun(second)
    expect(useGameStore.getState().runs).toEqual([second])
  }
  useGameStore.setState({ unlockedLevels: ['empty-room'] })
  useGameStore.getState().resetSession()
})

it('unlocks Reversal after Convergence and resets its two memories on Replay', () => {
  const store = useGameStore.getState
  useGameStore.setState({
    currentLevel: 'convergence',
    unlockedLevels: ['empty-room', 'split-signal', 'convergence'],
  })
  store().resetSession()
  store().selectLevel('reversal')
  expect(store().currentLevel).toBe('convergence')
  store().completeLevel()
  expect(store().unlockedLevels).toEqual([
    'empty-room',
    'split-signal',
    'convergence',
    'reversal',
  ])
  store().selectLevel('reversal')
  expect(store().remainingSeconds).toBe(45)
  for (let cycle = 1; cycle <= 3; cycle++) {
    const r = new Recorder(45)
    r.begin(cycle, { x: 0, y: 0.92, z: 13 }, { x: 0, y: 0, z: 0, w: 1 })
    store().saveRun(r.finish('restart'))
  }
  expect(store().runs.map((run) => run.cycle)).toEqual([2, 3])
  store().completeLevel()
  expect(store().unlockedLevels).toHaveLength(4)
  store().selectLevel('reversal')
  expect(store().runs).toEqual([])
  expect(store().cycle).toBe(1)
  expect(store().remainingSeconds).toBe(45)
  expect(
    store().completed ||
      store().ready ||
      store().locked ||
      store().fallback ||
      store().doorOpen,
  ).toBe(false)
  store().selectLevel('empty-room')
  useGameStore.setState({ unlockedLevels: ['empty-room'] })
})
