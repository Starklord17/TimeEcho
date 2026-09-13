import { afterEach, beforeAll, expect, it } from 'vitest'
import RAPIER from '@dimforge/rapier3d-compat'
import { PuzzleController, PLATE } from './PuzzleController'
import {
  PLAYER,
  PlayerController,
  PHYSICS_STEP,
} from '../player/PlayerController'
import { ROOM_BOXES, SPAWN } from '../levels/room'
import { Recorder } from '../recording/Recorder'
import type { RecordedRun } from '../recording/Recorder'

beforeAll(async () => {
  await RAPIER.init()
})
const cleanup: (() => void)[] = []
afterEach(() => cleanup.splice(0).forEach((fn) => fn()))
function setup() {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  world.timestep = PHYSICS_STEP
  for (const box of ROOM_BOXES)
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        box.size[0] / 2,
        box.size[1] / 2,
        box.size[2] / 2,
      ).setTranslation(...box.position),
    )
  const puzzle = new PuzzleController(world, RAPIER)
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(...SPAWN),
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
  cleanup.push(() => {
    controller.dispose(world)
    puzzle.dispose(world)
    world.free()
  })
  const move = (
    right: number,
    forward: number,
    steps: number,
    run: RecordedRun | null = null,
    time = 0,
  ) => {
    for (let i = 0; i < steps; i++) {
      puzzle.update(body.translation(), run, time + i / 60)
      controller.step(body, collider, right, forward, 0)
      world.step()
    }
  }
  return { puzzle, body, controller, world, move }
}
function plateRun() {
  const recorder = new Recorder()
  recorder.begin(
    1,
    { x: PLATE.x, y: 0.91, z: PLATE.z },
    { x: 0, y: 0, z: 0, w: 1 },
  )
  return recorder.finish('restart')
}
it('opens for either actor, supports both and clears occupancy on reset', () => {
  const { puzzle } = setup()
  const plate = { x: -4, y: 0.91, z: 2 },
    spawn = { x: 0, y: 0.92, z: 4 }
  puzzle.update(plate, null, 0)
  expect([puzzle.platePlayer, puzzle.plateEcho, puzzle.doorOpen]).toEqual([
    true,
    false,
    true,
  ])
  puzzle.update(plate, plateRun(), 10)
  expect([puzzle.platePlayer, puzzle.plateEcho, puzzle.doorOpen]).toEqual([
    true,
    true,
    true,
  ])
  puzzle.update(spawn, plateRun(), 10)
  expect([puzzle.platePlayer, puzzle.plateEcho, puzzle.doorOpen]).toEqual([
    false,
    true,
    true,
  ])
  puzzle.update(spawn, null, 0)
  expect(puzzle.doorOpen).toBe(false)
})
it('a closed door blocks the real character controller', () => {
  const { move, body, puzzle } = setup()
  move(0, 1, 300)
  expect(body.translation().z).toBeGreaterThan(-2.56)
  expect(puzzle.reachedExit(body.translation())).toBe(false)
})
it('solves two cycles using the recorded player on the plate and an echo opening the door', () => {
  const { move, body, controller, world, puzzle } = setup()
  move(-1, 0, 68)
  move(0, 1, 34)
  puzzle.update(body.translation(), null, 0)
  expect(puzzle.platePlayer).toBe(true)
  const recorder = new Recorder()
  recorder.begin(
    1,
    { x: SPAWN[0], y: SPAWN[1], z: SPAWN[2] },
    { x: 0, y: 0, z: 0, w: 1 },
  )
  recorder.capture(2, body.translation(), { x: 0, y: 0, z: 0, w: 1 })
  const run = recorder.finish('restart')
  controller.reset(body)
  world.step()
  move(0, 0, 130, run)
  expect(puzzle.plateEcho).toBe(true)
  move(0, 1, 160, run, 130 / 60)
  expect(body.translation().z).toBeLessThan(-5)
  expect(puzzle.reachedExit(body.translation())).toBe(true)
})
it('keeps an occupied doorway open until the player clears it', () => {
  const { puzzle } = setup()
  puzzle.update({ x: 0, y: 0.91, z: 4 }, plateRun(), 0)
  puzzle.update({ x: 0, y: 0.91, z: -3 }, null, 0)
  expect(puzzle.doorOpen).toBe(true)
  puzzle.update({ x: 0, y: 0.91, z: -4 }, null, 0)
  expect(puzzle.doorOpen).toBe(false)
})

it('animates the door progressively and resets its physical pose', () => {
  const { puzzle, move, body } = setup()
  const spawn = { x: 0, y: 0.92, z: 4 }
  puzzle.update(spawn, plateRun(), 0)
  expect(puzzle.doorLift).toBeGreaterThan(0)
  expect(puzzle.doorLift).toBeLessThan(3.8)
  for (let i = 0; i < 24; i++) puzzle.update(spawn, plateRun(), 0)
  expect(puzzle.doorLift).toBe(3.8)
  puzzle.reset()
  expect(puzzle.doorLift).toBe(0)
  expect(puzzle.doorOpen).toBe(false)
  move(0, 1, 300)
  expect(body.translation().z).toBeGreaterThan(-2.56)
})
