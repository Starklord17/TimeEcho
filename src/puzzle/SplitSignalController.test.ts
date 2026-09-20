import { update } from './replayTestUtils'
import { afterEach, beforeAll, expect, it } from 'vitest'
import RAPIER from '@dimforge/rapier3d-compat'
import { SplitSignalController, CHARGE_TICKS } from './SplitSignalController'
import { SPLIT_BOXES, SPLIT_PLATES } from '../levels/splitSignalLayout'
import { LEVELS } from '../levels/levelMetadata'
import { Recorder, type RecordedRun } from '../recording/Recorder'
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
const left = { ...SPLIT_PLATES[0], y: 0.91 }
const right = { ...SPLIT_PLATES[1], y: 0.91 }
function setup() {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  world.timestep = PHYSICS_STEP
  const puzzle = new SplitSignalController(world, RAPIER)
  world.step()
  cleanup.push(() => {
    puzzle.dispose(world)
    world.free()
  })
  return { puzzle, world }
}
function stationary(position: { x: number; y: number; z: number } = left) {
  const r = new Recorder(20)
  r.begin(1, position, { x: 0, y: 0, z: 0, w: 1 })
  return r.finish('restart')
}
it('requires different plates and both actors; neither actor alone or together on one plate unlocks', () => {
  const { puzzle } = setup()
  for (let i = 0; i < 180; i++) update(puzzle, left, null, i / 60)
  expect(puzzle.charge).toBe(0)
  for (let i = 0; i < 180; i++)
    update(puzzle, { x: 0, y: 0.91, z: 7 }, stationary(), i / 60)
  expect(puzzle.charge).toBe(0)
  for (let i = 0; i < 180; i++) update(puzzle, left, stationary(), i / 60)
  expect(puzzle.doorOpen).toBe(false)
})
it.each([false, true])(
  'requires exactly 120 continuous active steps and latches until reset (swapped=%s)',
  (swapped) => {
    const { puzzle } = setup()
    const player = swapped ? left : right
    const run = stationary(swapped ? right : left)
    for (let i = 0; i < CHARGE_TICKS - 1; i++)
      update(puzzle, player, run, i / 60)
    expect(puzzle.doorOpen).toBe(false)
    expect(puzzle.charge).toBeCloseTo(119 / 120)
    // Sensor refresh and a paused clock cannot count as active simulation.
    for (let i = 0; i < 200; i++) update(puzzle, player, run, 2, 0)
    expect(puzzle.charge).toBeCloseTo(119 / 120)
    update(puzzle, player, run, 2)
    expect(puzzle.doorOpen).toBe(true)
    for (let i = 0; i < 60; i++)
      update(puzzle, { x: 0, y: 0.91, z: 0 }, null, 3)
    expect(puzzle.doorOpen).toBe(true)
    expect(puzzle.doorLift).toBeCloseTo(3.8)
    puzzle.reset()
    update(puzzle, player, run, 0, 0)
    expect(puzzle.charge).toBe(0)
    expect(puzzle.doorLift).toBe(0)
    expect(puzzle.doorOpen).toBe(false)
  },
)
it('discards interrupted charge and frees every owned collider', () => {
  const { puzzle, world } = setup()
  for (let i = 0; i < 90; i++) update(puzzle, right, stationary(), i / 60)
  update(puzzle, left, stationary(), 1.5)
  expect(puzzle.charge).toBe(0)
  const count = world.colliders.len()
  const other = new SplitSignalController(world, RAPIER)
  expect(world.colliders.len()).toBe(count + 4)
  other.dispose(world)
  expect(world.colliders.len()).toBe(count)
})
it('solves the authored corridors in two cycles with real collisions and time to spare', () => {
  const { puzzle, world } = setup()
  for (const box of SPLIT_BOXES)
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        box.size[0] / 2,
        box.size[1] / 2,
        box.size[2] / 2,
      ).setTranslation(box.position[0], box.position[1], box.position[2]),
    )
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(
      ...LEVELS[1].spawn,
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
  const recorder = new Recorder(20)
  world.step()
  recorder.begin(1, body.translation(), { x: 0, y: 0, z: 0, w: 1 })
  let ticks = 0
  const travel = (
    x: number,
    z: number,
    run: RecordedRun | null = null,
    record = false,
  ) => {
    let steps = 0
    while (
      Math.hypot(body.translation().x - x, body.translation().z - z) > 0.07 &&
      steps++ < 600
    ) {
      const p = body.translation()
      update(puzzle, p, run, ticks / 60)
      controller.step(body, collider, x - p.x, p.z - z, 0)
      world.step()
      ticks++
      if (record)
        recorder.capture(ticks / 60, body.translation(), {
          x: 0,
          y: 0,
          z: 0,
          w: 1,
        })
    }
    expect(steps).toBeLessThan(600)
  }
  travel(-5, 6, null, true)
  travel(-5, -3, null, true)
  expect(puzzle.doorOpen).toBe(false)
  const run = recorder.finish('restart')
  controller.reset(body, LEVELS[1].spawn)
  puzzle.reset()
  world.step()
  ticks = 0
  travel(5, 6, run)
  travel(5, -3, run)
  for (let i = 0; i < 120; i++) {
    update(puzzle, body.translation(), run, ticks++ / 60)
    world.step()
  }
  expect(puzzle.doorOpen).toBe(true)
  travel(5, -5, run)
  travel(0, -5, run)
  travel(0, -8, run)
  expect(puzzle.reachedExit(body.translation())).toBe(true)
  expect(ticks / 60).toBeLessThan(18)
  controller.dispose(world)
})
it('keeps the door impassable without a recording', () => {
  const { puzzle, world } = setup()
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0.92, -5),
  )
  const collider = world.createCollider(
    RAPIER.ColliderDesc.capsule(PLAYER.halfHeight, PLAYER.radius),
    body,
  )
  const controller = new PlayerController(
    world,
    RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
  )
  world.step()
  for (let i = 0; i < 30; i++) {
    update(puzzle, body.translation(), null, i / 60)
    controller.step(body, collider, 0, 1, 0)
    world.step()
  }
  expect(body.translation().z).toBeGreaterThan(-5.6)
  expect(puzzle.reachedExit(body.translation())).toBe(false)
  controller.dispose(world)
})
