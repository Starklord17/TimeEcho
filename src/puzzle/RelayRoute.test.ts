import { beforeAll, expect, it } from 'vitest'
import RAPIER from '@dimforge/rapier3d-compat'
import { RelayController } from '../puzzle/RelayController'
import { RELAY_BOXES } from '../levels/relayLayout'
import { levelMetadata } from '../levels/levelMetadata'
import {
  PlayerController,
  PLAYER,
  PHYSICS_STEP,
} from '../player/PlayerController'
import { Recorder, type RecordedRun } from '../recording/Recorder'
import { ReplayCollection } from '../echo/ReplayCollection'

beforeAll(async () => {
  await RAPIER.init()
})
function session() {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  world.timestep = PHYSICS_STEP
  for (const { position, size } of RELAY_BOXES)
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        size[0] / 2,
        size[1] / 2,
        size[2] / 2,
      ).setTranslation(...position),
    )
  const puzzle = new RelayController(world, RAPIER)
  const level = levelMetadata('relay')
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      level.spawn[0],
      level.spawn[1],
      level.spawn[2],
    ),
  )
  const collider = world.createCollider(
    RAPIER.ColliderDesc.capsule(PLAYER.halfHeight, PLAYER.radius),
    body,
  )
  const movement = new PlayerController(
    world,
    RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
  )
  const recorder = new Recorder(60),
    sampler = new ReplayCollection()
  const rotation = { x: 0, y: 0, z: 0, w: 1 }
  let runs: RecordedRun[] = [],
    ticks = 0,
    cycle = 1
  world.step()
  recorder.begin(cycle, body.translation(), rotation)
  const baseline = world.colliders.len()
  const step = (right = 0, forward = 0) => {
    puzzle.update(body.translation(), sampler.sample(runs, ticks / 60))
    movement.step(body, collider, right, forward, 0)
    world.step()
    recorder.capture(++ticks / 60, body.translation(), rotation)
    expect(world.colliders.len()).toBe(baseline)
  }
  const travel = (x: number, z: number, maxTicks = 1200) => {
    let count = 0
    while (
      Math.hypot(body.translation().x - x, body.translation().z - z) > 0.06 &&
      count++ < maxTicks
    ) {
      const p = body.translation(),
        d = Math.hypot(x - p.x, z - p.z)
      step((x - p.x) / d, (p.z - z) / d)
    }
    return count < maxTicks
  }
  return {
    world,
    puzzle,
    body,
    step,
    travel,
    get seconds() {
      return ticks / 60
    },
    get runs() {
      return runs
    },
    get cycle() {
      return cycle
    },
    wait(n: number) {
      for (let i = 0; i < n * 60; i++) step()
    },
    record() {
      const run = recorder.finish('restart')
      runs = [...runs, run].slice(-3)
      movement.reset(body, level.spawn)
      puzzle.reset()
      world.step()
      ticks = 0
      cycle++
      recorder.begin(cycle, body.translation(), rotation)
      return run
    },
    free() {
      movement.dispose(world)
      puzzle.dispose(world)
      world.free()
    },
  }
}

it.each([-1, 0, 1])(
  'solves four recorded cycles with arrival offset %s and ten seconds spare',
  (offset) => {
    const s = session()
    try {
      for (const x of [-6, -2, 2]) {
        expect(s.travel(x, 6)).toBe(true)
        while (s.seconds < 17) s.step()
        expect(s.travel(x, -6)).toBe(true)
        while (s.seconds < 36) s.step()
        s.record()
      }
      expect(s.runs).toHaveLength(3)
      while (s.seconds < 10 + offset) s.step()
      expect(s.travel(6, 6)).toBe(true)
      while (s.seconds < 17) s.step()
      expect(s.puzzle.phase).toBe('PHASE_B')
      while (s.seconds < 26 + offset) s.step()
      expect(s.travel(6, -6)).toBe(true)
      while (!s.puzzle.doorOpen && s.seconds < 40) s.step()
      expect(s.puzzle.doorOpen).toBe(true)
      expect(s.travel(0, -11)).toBe(true)
      expect(s.travel(0, -14)).toBe(true)
      expect(s.puzzle.reachedExit(s.body.translation())).toBe(true)
      expect(s.seconds).toBeLessThan(50)
    } finally {
      s.free()
    }
  },
)
