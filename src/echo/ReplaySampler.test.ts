import { expect, it } from 'vitest'
import { Quaternion, Vector3 } from 'three'
import { Recorder } from '../recording/Recorder'
import { ReplaySampler } from './ReplaySampler'

function fixture() {
  const recorder = new Recorder()
  recorder.begin(1, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 0, w: 1 })
  recorder.capture(2, { x: 4, y: 1, z: -2 }, { x: 0, y: 1, z: 0, w: 0 })
  recorder.capture(5, { x: 10, y: 1, z: -8 }, { x: 0, y: 1, z: 0, w: 0 })
  return recorder.finish('restart')
}

it('interpolates position and quaternion using timestamps, not frame indices', () => {
  const position = new Vector3(),
    rotation = new Quaternion()
  new ReplaySampler().sample(fixture(), 1, position, rotation)
  expect(position.toArray()).toEqual([2, 1, -1])
  expect(rotation.y).toBeCloseTo(Math.SQRT1_2)
  expect(rotation.w).toBeCloseTo(Math.SQRT1_2)
  expect(rotation.length()).toBeCloseTo(1)
})
it('supports irregular samples, exact samples and backwards seeks', () => {
  const sampler = new ReplaySampler(),
    position = new Vector3(),
    rotation = new Quaternion()
  const run = fixture()
  sampler.sample(run, 3.5, position, rotation)
  expect(position.toArray()).toEqual([7, 1, -5])
  sampler.sample(run, 2, position, rotation)
  expect(position.toArray()).toEqual([4, 1, -2])
  sampler.sample(run, 0, position, rotation)
  expect(position.toArray()).toEqual([0, 1, 0])
})
it('clamps before start and holds a partial run after its end', () => {
  const sampler = new ReplaySampler(),
    position = new Vector3(),
    rotation = new Quaternion()
  sampler.sample(fixture(), -1, position, rotation)
  expect(position.x).toBe(0)
  sampler.sample(fixture(), 15, position, rotation)
  expect(position.toArray()).toEqual([10, 1, -8])
})
it('supports a zero-duration run and leaves the immutable recording untouched', () => {
  const recorder = new Recorder()
  recorder.begin(1, { x: 2, y: 3, z: 4 }, { x: 0, y: 0, z: 0, w: 1 })
  const run = recorder.finish('restart'),
    original = JSON.stringify(run)
  const position = new Vector3(),
    rotation = new Quaternion()
  new ReplaySampler().sample(run, 10, position, rotation)
  expect(position.toArray()).toEqual([2, 3, 4])
  expect(JSON.stringify(run)).toBe(original)
})
it('uses the short quaternion path for equivalent opposite-sign quaternions', () => {
  const run = fixture()
  const opposite = {
    ...run,
    frames: [
      run.frames[0],
      { ...run.frames[0], time: 1, rotation: [0, 0, 0, -1] as const },
    ],
  }
  const rotation = new Quaternion()
  new ReplaySampler().sample(opposite, 0.5, new Vector3(), rotation)
  expect(Math.abs(rotation.w)).toBeCloseTo(1)
})
