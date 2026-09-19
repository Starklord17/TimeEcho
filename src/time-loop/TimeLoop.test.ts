import { expect, it } from 'vitest'
import { TimeLoop } from './TimeLoop'

it('resets exactly on tick 900 and advances one cycle', () => {
  const loop = new TimeLoop()
  for (let i = 0; i < 899; i++) expect(loop.advance()).toBe(false)
  expect(loop.remainingSeconds).toBe(1)
  expect(loop.advance()).toBe(true)
  expect(loop.cycle).toBe(2)
  expect(loop.remainingSeconds).toBe(15)
})
it('manual restart clears elapsed time and increments the cycle', () => {
  const loop = new TimeLoop()
  for (let i = 0; i < 345; i++) loop.advance()
  loop.restart()
  expect(loop.cycle).toBe(2)
  expect(loop.remainingSeconds).toBe(15)
  for (let i = 0; i < 899; i++) expect(loop.advance()).toBe(false)
  expect(loop.advance()).toBe(true)
})
it('does not drift across 100 cycles', () => {
  const loop = new TimeLoop()
  for (let i = 0; i < 90000; i++) loop.advance()
  expect(loop.cycle).toBe(101)
  expect(loop.remainingSeconds).toBe(15)
})

it('supports a 20-second level without changing the 15-second default', () => {
  const longer = new TimeLoop(20)
  expect(new TimeLoop().remainingSeconds).toBe(15)
  for (let i = 0; i < 1199; i++) expect(longer.advance()).toBe(false)
  expect(longer.remainingSeconds).toBe(1)
  expect(longer.advance()).toBe(true)
  expect(longer.cycle).toBe(2)
  expect(longer.remainingSeconds).toBe(20)
})
