import { expect, it } from 'vitest'
import { Recorder } from '../recording/Recorder'
import { ReplayCollection } from './ReplayCollection'
import { PlaybackClock } from './PlaybackClock'

function run(cycle: number, length: number) {
  const recorder = new Recorder(20)
  recorder.begin(cycle, { x: cycle, y: 1, z: 0 }, { x: 0, y: 0, z: 0, w: 1 })
  recorder.capture(
    length,
    { x: cycle, y: 1, z: -length },
    { x: 0, y: 0, z: 0, w: 1 },
  )
  return recorder.finish('restart')
}
it('samples both memories at one clock time, holds partial endpoints, pauses and rewinds together', () => {
  const sampler = new ReplayCollection()
  const clock = new PlaybackClock()
  const runs = [run(1, 2), run(2, 4)]
  clock.update(3, 0, 0, true)
  let time = clock.update(3, 3, 3, true)
  expect(sampler.sample(runs, time).map((p) => p.z)).toEqual([-2, -3])
  time = clock.update(3, 3, 20, false)
  expect(sampler.sample(runs, time).map((p) => p.z)).toEqual([-2, -3])
  time = clock.update(4, 0, 1, true)
  expect(sampler.sample(runs, time).map((p) => p.z)).toEqual([0, 0])
  expect(sampler.sample(runs, 1).map((p) => p.z)).toEqual([-1, -1])
  expect(sampler.sample([], 0)).toEqual([])
})
it('keeps independent positions in FIFO order and never exposes more than two actors', () => {
  const sampler = new ReplayCollection()
  const result = sampler.sample([run(1, 1), run(2, 1), run(3, 1)], 0.5)
  expect(result.map((p) => p.x)).toEqual([2, 3])
  expect(result[0]).not.toBe(result[1])
})
