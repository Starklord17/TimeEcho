import { Recorder } from '../recording/Recorder'
import { TimeLoop } from '../time-loop/TimeLoop'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import RAPIER from '@dimforge/rapier3d-compat'
import { PHYSICS_STEP, PLAYER, PlayerController } from './PlayerController'
import { ROOM_BOXES, SPAWN } from '../levels/room'

beforeAll(async () => {
  await RAPIER.init()
})
const disposals: (() => void)[] = []
afterEach(() => {
  disposals.splice(0).forEach((dispose) => dispose())
})

function createRoom() {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  world.timestep = PHYSICS_STEP
  for (const { position, size } of ROOM_BOXES) {
    world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        size[0] / 2,
        size[1] / 2,
        size[2] / 2,
      ).setTranslation(...position),
    )
  }
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
  disposals.push(() => {
    controller.dispose(world)
    world.free()
  })
  const move = (right: number, forward: number, steps: number, yaw = 0) => {
    for (let i = 0; i < steps; i++) {
      controller.step(body, collider, right, forward, yaw)
      world.step()
    }
    return body.translation()
  }
  return { body, move, controller, world }
}

describe('character controller in the actual room geometry', () => {
  it('settles on the floor and stays stable for 30 seconds', () => {
    const { move } = createRoom()
    const start = move(0, 0, 120)
    const end = move(0, 0, 1800)
    expect(end.y).toBeGreaterThanOrEqual(0.9)
    expect(end.y).toBeLessThan(0.93)
    expect(end.y).toBeCloseTo(start.y, 5)
    expect(end.x).toBeCloseTo(0, 5)
    expect(end.z).toBeCloseTo(4, 5)
  })
  it.each([
    [0, 1, 'z', -6.69],
    [0, -1, 'z', 6.69],
    [1, 0, 'x', 5.69],
    [-1, 0, 'x', -5.69],
  ] as const)(
    'blocks direction (%s, %s) at the wall',
    (right, forward, axis, boundary) => {
      const { move } = createRoom()
      const end = move(right, forward, 600)
      expect(end[axis]).toBeCloseTo(boundary, 1)
      expect(end.y).toBeGreaterThanOrEqual(0.9)
    },
  )
  it('keeps diagonal speed equal to straight speed', () => {
    const straight = createRoom().move(0, 1, 60)
    const diagonal = createRoom().move(1, 1, 60)
    expect(Math.hypot(diagonal.x, diagonal.z - SPAWN[2])).toBeCloseTo(
      Math.abs(straight.z - SPAWN[2]),
      2,
    )
    expect(Math.abs(straight.z - SPAWN[2])).toBeCloseTo(PLAYER.speed, 2)
  })
  it('moves horizontally when looking in a different direction', () => {
    const end = createRoom().move(0, 1, 60, Math.PI / 2)
    expect(end.x).toBeCloseTo(-PLAYER.speed, 2)
    expect(end.z).toBeCloseTo(SPAWN[2], 2)
  })
  it('slides along a wall and remains inside a corner', () => {
    const { move } = createRoom()
    move(1, 0, 240)
    const end = move(1, 1, 600)
    expect(end.x).toBeCloseTo(5.69, 1)
    expect(end.z).toBeCloseTo(-6.69, 1)
    expect(end.y).toBeGreaterThanOrEqual(0.9)
  })
  it('stops horizontal motion as soon as input is cleared', () => {
    const { move } = createRoom()
    const start = move(0, 1, 30)
    const end = move(0, 0, 120)
    expect(end.x).toBeCloseTo(start.x, 5)
    expect(end.z).toBeCloseTo(start.z, 5)
  })
})

it('returns to the exact spawn on timeout and clears the queued kinematic target', () => {
  const { body, move, controller, world } = createRoom()
  const loop = new TimeLoop()
  move(1, 1, 80)
  for (let tick = 0; tick < 900; tick++) {
    if (loop.advance()) controller.reset(body)
  }
  world.step()
  expect(loop.cycle).toBe(2)
  expect(body.translation().x).toBeCloseTo(SPAWN[0], 6)
  expect(body.translation().y).toBeCloseTo(SPAWN[1], 6)
  expect(body.translation().z).toBeCloseTo(SPAWN[2], 6)
  expect(body.rotation()).toEqual({ x: 0, y: 0, z: 0, w: 1 })
  const afterReset = move(0, 1, 60)
  const fresh = createRoom().move(0, 1, 60)
  expect(afterReset.x).toBeCloseTo(fresh.x, 4)
  expect(afterReset.y).toBeCloseTo(fresh.y, 4)
  expect(afterReset.z).toBeCloseTo(fresh.z, 4)
})

it('records resolved collisions through the last tick, before teleporting', () => {
  const { body, controller, world } = createRoom()
  const loop = new TimeLoop()
  const recorder = new Recorder()
  const look = { x: 0, y: 0, z: 0, w: 1 }
  recorder.begin(loop.cycle, body.translation(), look)
  for (let tick = 0; tick < 900; tick++) {
    controller.step(body, body.collider(0), 1, 0, 0)
    world.step()
    recorder.capture(loop.nextSampleTime, body.translation(), look)
    if (loop.advance()) break
  }
  const run = recorder.finish('timeout')
  controller.reset(body)
  recorder.begin(loop.cycle, body.translation(), look)
  expect(run.frames).toHaveLength(901)
  expect(run.frames[900].position[0]).toBeCloseTo(5.69, 1)
  expect(run.frames.every((frame) => frame.position[0] <= 5.71)).toBe(true)
  expect(run.frames.every((frame) => frame.position[1] >= 0.9)).toBe(true)
  expect(run.frames[900].time).toBe(15)
  expect(body.translation().x).toBe(0)
  expect(recorder.finish('restart').frames[0].position[0]).toBe(0)
})
