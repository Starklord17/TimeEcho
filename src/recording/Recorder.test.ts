import { expect, it } from 'vitest'
import { Recorder } from './Recorder'

const position = { x: 0, y: 0.92, z: 4 }
const rotation = { x: 0, y: 0, z: 0, w: 1 }

it('copies samples and seals completed runs independently of the next cycle', () => {
  const recorder = new Recorder()
  const mutable = { ...position }
  recorder.begin(1, mutable, rotation)
  mutable.x = 2
  recorder.capture(1 / 60, mutable, rotation)
  const run = recorder.finish('restart')
  recorder.begin(2, position, rotation)
  expect(run.frames[0].position[0]).toBe(0)
  expect(run.frames[1].position[0]).toBe(2)
  expect(run.frames).toHaveLength(2)
  expect(Object.isFrozen(run.frames)).toBe(true)
  expect(Object.isFrozen(run.frames[0].position)).toBe(true)
  expect(run.endReason).toBe('restart')
})
it('records an initial sample plus 900 samples ending exactly at 15 seconds', () => {
  const recorder = new Recorder()
  recorder.begin(3, position, rotation)
  for (let i = 1; i <= 900; i++) recorder.capture(i / 60, position, rotation)
  const run = recorder.finish('timeout')
  expect(run.frames).toHaveLength(901)
  expect(run.duration).toBe(15)
  expect(run.frames[0].time).toBe(0)
  expect(run.frames[900].time).toBe(15)
  expect(JSON.parse(JSON.stringify(run))).toEqual(run)
})
it('rejects duplicate, backwards and out-of-cycle timestamps', () => {
  const recorder = new Recorder()
  recorder.begin(1, position, rotation)
  for (const time of [0, -1, NaN, Infinity, 16]) {
    expect(() => recorder.capture(time, position, rotation)).toThrow()
  }
  recorder.capture(0.5, position, rotation)
  expect(() => recorder.capture(0.25, position, rotation)).toThrow()
})
it('allows a restart before the first movement tick', () => {
  const recorder = new Recorder()
  recorder.begin(1, position, rotation)
  const run = recorder.finish('restart')
  expect(run.duration).toBe(0)
  expect(run.frames).toHaveLength(1)
  expect(() => recorder.finish('restart')).toThrow()
})
