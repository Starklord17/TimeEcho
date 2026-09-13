import { expect, it } from 'vitest'
import { PlaybackClock } from './PlaybackClock'

it('pauses and starts from zero on every new cycle', () => {
  const clock = new PlaybackClock()
  expect(clock.update(1, 0, 0, true)).toBe(0)
  expect(clock.update(1, 1, 1, true)).toBe(1)
  expect(clock.update(1, 1, 20, false)).toBe(1)
  expect(clock.update(2, 0, 1, true)).toBe(0)
})
it('stays within one physics tick without running ahead at different display rates', () => {
  for (const hz of [30, 60, 144]) {
    const clock = new PlaybackClock()
    clock.update(1, 0, 0, true)
    for (let frame = 1; frame <= hz * 15; frame++) {
      const elapsed = Math.floor((frame / hz) * 60) / 60
      const time = clock.update(1, elapsed, 1 / hz, true)
      expect(time).toBeLessThanOrEqual(elapsed)
      expect(time).toBeGreaterThanOrEqual(Math.max(0, elapsed - 1 / 60) - 1e-9)
    }
  }
})
