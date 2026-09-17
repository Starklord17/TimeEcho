import { expect, it } from 'vitest'
import { Recorder } from '../recording/Recorder'
import { EchoMotion } from './EchoMotion'

function recording() {
  const r = new Recorder()
  const q = { x: 0, y: 0, z: 0, w: 1 }
  r.begin(1, { x: 0, y: 0.91, z: 0 }, q)
  r.capture(1, { x: 0, y: 0.91, z: -1 }, q)
  r.capture(2, { x: 0, y: 0.91, z: -1 }, q)
  r.capture(3, { x: -1, y: 0.91, z: -1 }, q)
  return r.finish('restart')
}

it('blends in 150 ms using horizontal recorded movement and settles after partial playback', () => {
  const motion = new EchoMotion()
  const run = recording()
  expect(motion.sample(run, 0).weight).toBe(0)
  expect(motion.sample(run, 0.075).weight).toBeCloseTo(0.5)
  expect(motion.sample(run, 0.15).weight).toBeCloseTo(1)
  expect(motion.sample(run, 1.15).weight).toBeCloseTo(0)
  expect(motion.sample(run, 2.15).weight).toBeCloseTo(1)
  expect(motion.sample(run, 3.15).weight).toBeCloseTo(0)
  expect(motion.sample(run, 15).walkTime).toBeCloseTo(2 / 0.8)
})

it('reconstructs phases on backwards seek, restart and different render rates; pause is exact', () => {
  const run = recording()
  const reference = new EchoMotion().sample(run, 0.65)
  for (const hz of [30, 60, 144]) {
    const motion = new EchoMotion()
    for (let i = 0; i < hz * 3; i++) motion.sample(run, i / hz)
    expect(motion.sample(run, 0.65)).toEqual(reference)
    expect(motion.sample(run, 0.65)).toEqual(reference)
    expect(motion.sample(run, 0).walkTime).toBe(0)
  }
})

it('ignores vertical displacement and looking around; supports a single-frame run', () => {
  const motion = new EchoMotion()
  const r = new Recorder()
  r.begin(1, { x: 0, y: 0.91, z: 0 }, { x: 0, y: 0, z: 0, w: 1 })
  const single = r.finish('restart')
  expect(motion.sample(single, 8).weight).toBe(0)
  const run = {
    ...single,
    frames: [
      ...single.frames,
      {
        time: 1,
        position: [0, 2, 0] as const,
        rotation: [0, 1, 0, 0] as const,
      },
    ],
  }
  expect(motion.sample(run, 0.5).weight).toBe(0)
  expect(motion.sample(run, 0.5).walkTime).toBe(0)
})

it('advances phase by distance at game speed without depending on player input', () => {
  const run = recording()
  const fast = {
    ...run,
    frames: run.frames.map((f) => ({
      ...f,
      position: [
        f.position[0] * 3.5,
        f.position[1],
        f.position[2] * 3.5,
      ] as const,
    })),
  }
  const motion = new EchoMotion()
  const normal = motion.sample(run, 0.8)
  const accelerated = motion.sample(fast, 0.8)
  expect(accelerated.walkTime).toBeCloseTo(normal.walkTime * 3.5)
  expect(accelerated.weight).toBe(normal.weight)
})
