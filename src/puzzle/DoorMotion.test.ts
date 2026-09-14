import { expect, it } from 'vitest'
import { DoorMotion } from './DoorMotion'
it('eases, reverses continuously and reaches exact endpoints', () => {
  const motion = new DoorMotion(3.8, 0.4)
  const first = motion.step(true, 1 / 60)
  expect(first).toBeLessThan(3.8 / 24)
  for (let i = 0; i < 11; i++) motion.step(true, 1 / 60)
  const mid = motion.value
  expect(mid).toBeCloseTo(1.9)
  motion.step(false, 1 / 60)
  expect(motion.value).toBeLessThan(mid)
  expect(mid - motion.value).toBeLessThan(0.05)
  for (let i = 0; i < 24; i++) motion.step(false, 1 / 60)
  expect(motion.value).toBe(0)
  for (let i = 0; i < 25; i++) motion.step(true, 1 / 60)
  expect(motion.value).toBe(3.8)
  motion.reset()
  expect(motion.value).toBe(0)
})
