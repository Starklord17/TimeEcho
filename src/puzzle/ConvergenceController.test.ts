import { afterEach, beforeAll, expect, it } from 'vitest'
import RAPIER from '@dimforge/rapier3d-compat'
import { ConvergenceController } from './ConvergenceController'
import {
  CONVERGENCE_BOXES,
  CONVERGENCE_PLATES,
} from '../levels/convergenceLayout'
import { levelMetadata } from '../levels/levelMetadata'
import { Recorder, type RecordedRun } from '../recording/Recorder'
import { ReplayCollection } from '../echo/ReplayCollection'
import {
  PLAYER,
  PlayerController,
  PHYSICS_STEP,
} from '../player/PlayerController'

beforeAll(async () => {
  await RAPIER.init()
})
const cleanup: (() => void)[] = []
afterEach(() => cleanup.splice(0).forEach((fn) => fn()))
const stations = CONVERGENCE_PLATES.map((p) => ({ ...p, y: 0.91 }))
const spawn = { x: 0, y: 0.92, z: 7 }
function setup() {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  world.timestep = PHYSICS_STEP
  const puzzle = new ConvergenceController(world, RAPIER)
  world.step()
  cleanup.push(() => {
    puzzle.dispose(world)
    world.free()
  })
  return { world, puzzle }
}
it('cannot charge with fewer than three actors or three actors on fewer than three stations', () => {
  const { puzzle } = setup()
  for (const echoes of [[], [stations[1]], [stations[0], stations[1]]]) {
    for (let tick = 0; tick < 150; tick++) puzzle.update(stations[0], echoes)
    expect(puzzle.charge).toBe(0)
    expect(puzzle.doorOpen).toBe(false)
  }
  for (let tick = 0; tick < 150; tick++)
    puzzle.update(spawn, [stations[0], stations[1]])
  expect(puzzle.doorOpen).toBe(false)
})
it.each([
  [0, 1, 2],
  [0, 2, 1],
  [1, 0, 2],
  [1, 2, 0],
  [2, 0, 1],
  [2, 1, 0],
])(
  'accepts distinct actor assignment %s/%s/%s after exactly 120 active steps',
  (p, a, b) => {
    const { puzzle } = setup()
    const echoes = [stations[a], stations[b]]
    for (let tick = 0; tick < 119; tick++) puzzle.update(stations[p], echoes)
    expect(puzzle.doorOpen).toBe(false)
    expect(puzzle.charge).toBeCloseTo(119 / 120)
    for (let tick = 0; tick < 300; tick++) puzzle.update(stations[p], echoes, 0)
    expect(puzzle.charge).toBeCloseTo(119 / 120)
    puzzle.update(stations[p], echoes)
    expect(puzzle.doorOpen).toBe(true)
    for (let tick = 0; tick < 60; tick++) puzzle.update(spawn, [])
    expect(puzzle.doorLift).toBeCloseTo(3.8)
    expect(puzzle.doorOpen).toBe(true)
    puzzle.reset()
    expect(puzzle.plates.every((plate) => !plate.player && !plate.echo)).toBe(
      true,
    )
    expect(puzzle.charge).toBe(0)
    expect(puzzle.doorLift).toBe(0)
    expect(puzzle.doorOpen).toBe(false)
  },
)
it('loses interrupted charge and releases all five owned colliders', () => {
  const { puzzle, world } = setup()
  for (let tick = 0; tick < 100; tick++)
    puzzle.update(stations[0], [stations[1], stations[2]])
  puzzle.update(stations[0], [stations[1], spawn])
  expect(puzzle.charge).toBe(0)
  for (let tick = 0; tick < 119; tick++)
    puzzle.update(stations[0], [stations[1], stations[2]])
  expect(puzzle.doorOpen).toBe(false)
  const count = world.colliders.len()
  const other = new ConvergenceController(world, RAPIER)
  expect(world.colliders.len()).toBe(count + 5)
  other.dispose(world)
  expect(world.colliders.len()).toBe(count)
})
it('solves three cycles through real walls with two partial recordings and time to spare', () => {
  const { world, puzzle } = setup()
  const level = levelMetadata('convergence')
  for (const box of CONVERGENCE_BOXES)
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        box.size[0] / 2,
        box.size[1] / 2,
        box.size[2] / 2,
      ).setTranslation(box.position[0], box.position[1], box.position[2]),
    )
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
  const controller = new PlayerController(
    world,
    RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
  )
  cleanup.unshift(() => controller.dispose(world))
  const sampler = new ReplayCollection()
  const recorder = new Recorder(level.duration)
  const runs: RecordedRun[] = []
  let ticks = 0
  const step = (right = 0, forward = 0) => {
    puzzle.update(body.translation(), sampler.sample(runs, ticks / 60))
    controller.step(body, collider, right, forward, 0)
    world.step()
    recorder.capture(++ticks / 60, body.translation(), {
      x: 0,
      y: 0,
      z: 0,
      w: 1,
    })
  }
  const travel = (x: number, z: number) => {
    let count = 0
    while (
      Math.hypot(body.translation().x - x, body.translation().z - z) > 0.07 &&
      count++ < 600
    ) {
      const p = body.translation()
      step(x - p.x, p.z - z)
    }
    expect(count).toBeLessThan(600)
  }
  world.step()
  const colliders = world.colliders.len()
  for (const x of [-5, 5]) {
    recorder.begin(runs.length + 1, body.translation(), {
      x: 0,
      y: 0,
      z: 0,
      w: 1,
    })
    travel(x, 6)
    travel(x, -3)
    for (let tick = 0; tick < 150; tick++) step()
    expect(puzzle.doorOpen).toBe(false)
    runs.push(recorder.finish('restart'))
    controller.reset(body, level.spawn)
    puzzle.reset()
    world.step()
    ticks = 0
  }
  recorder.begin(3, body.translation(), { x: 0, y: 0, z: 0, w: 1 })
  travel(0, -3)
  while (!puzzle.doorOpen && ticks < 900) step()
  expect(puzzle.doorOpen).toBe(true)
  travel(0, -8)
  expect(puzzle.reachedExit(body.translation())).toBe(true)
  expect(ticks / 60).toBeLessThan(16)
  expect(world.colliders.len()).toBe(colliders)
  puzzle.reset()
  controller.reset(body, [0, 0.92, -5])
  world.step()
  for (let tick = 0; tick < 60; tick++) {
    puzzle.update(body.translation(), [])
    controller.step(body, collider, 0, 1, 0)
    world.step()
  }
  expect(body.translation().z).toBeGreaterThan(-5.6)
  expect(puzzle.reachedExit(body.translation())).toBe(false)
})
