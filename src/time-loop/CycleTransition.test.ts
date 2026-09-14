import { expect, it } from 'vitest'
import { CycleTransition } from './CycleTransition'
import { TimeLoop } from './TimeLoop'

it('resets once at midpoint and finishes after 18 steps, rejecting repeat requests', () => {
  const transition = new CycleTransition()
  expect(transition.begin()).toBe(true)
  expect(transition.begin()).toBe(false)
  let resets = 0
  for (let i = 1; i <= 18; i++) {
    resets += Number(transition.step())
    if (i === 9) {
      expect(transition.phase).toBe('RESETTING')
      expect(transition.opacity).toBe(1)
    }
  }
  expect(resets).toBe(1)
  expect(transition.phase).toBe('PLAYING')
  expect(transition.opacity).toBe(0)
  expect(transition.step()).toBe(false)
})
it('holds the old cycle until the transition midpoint and starts a full 900-step cycle', () => {
  const loop = new TimeLoop()
  for (let i = 0; i < 899; i++) expect(loop.advance(true)).toBe(false)
  expect(loop.advance(true)).toBe(true)
  expect(loop.cycle).toBe(1)
  expect(loop.elapsedSeconds).toBe(15)
  const transition = new CycleTransition()
  transition.begin()
  for (let i = 0; i < 8; i++) transition.step()
  const opacity = transition.opacity
  // Paused simulation makes no step call.
  expect(transition.opacity).toBe(opacity)
  expect(loop.cycle).toBe(1)
  if (transition.step()) loop.restart()
  expect(loop.cycle).toBe(2)
  expect(loop.remainingSeconds).toBe(15)
  for (let i = 0; i < 9; i++) transition.step()
  expect(loop.elapsedSeconds).toBe(0)
  for (let i = 0; i < 899; i++) expect(loop.advance(true)).toBe(false)
  expect(loop.advance(true)).toBe(true)
})
