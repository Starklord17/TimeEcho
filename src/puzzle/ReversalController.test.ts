import { afterEach, beforeAll, expect, it } from 'vitest'
import RAPIER from '@dimforge/rapier3d-compat'
import { ReversalController } from './ReversalController'
import { REVERSAL_DOORS, REVERSAL_PLATES } from '../levels/reversalLayout'

beforeAll(async () => {
  await RAPIER.init()
})
const cleanup: (() => void)[] = []
afterEach(() => cleanup.splice(0).forEach((fn) => fn()))
const plates = REVERSAL_PLATES.map((p) => ({ ...p, y: 0.91 }))
const away = { x: 0, y: 0.91, z: 13 }
function setup() {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  const puzzle = new ReversalController(world, RAPIER)
  world.step()
  cleanup.push(() => {
    puzzle.dispose(world)
    world.free()
  })
  return { world, puzzle }
}
function repeat(
  puzzle: ReversalController,
  player = away,
  echoes = [] as (typeof away)[],
  ticks = 150,
  step = 1 / 60,
) {
  for (let i = 0; i < ticks; i++) puzzle.update(player, echoes, step)
}
it('opens each support gate only while its own station is occupied', () => {
  const { puzzle } = setup()
  repeat(puzzle, plates[0])
  expect(puzzle.doors.map((d) => d.open)).toEqual([true, false, false])
  expect(puzzle.doors[0].lift).toBe(3.8)
  repeat(puzzle, away, [plates[1]])
  expect(puzzle.doors.map((d) => d.open)).toEqual([false, true, false])
  expect(puzzle.doors[0].lift).toBe(0)
  repeat(puzzle)
  expect(puzzle.doors.every((d) => !d.open && d.lift === 0)).toBe(true)
})
it.each([false, true])(
  'requires two distinct actors and exactly 120 active steps (swap=%s)',
  (swap) => {
    const { puzzle } = setup()
    repeat(puzzle, plates[2])
    expect(puzzle.charge).toBe(0)
    const p = plates[swap ? 3 : 2],
      e = plates[swap ? 2 : 3]
    repeat(puzzle, p, [e], 119)
    expect(puzzle.charge).toBeCloseTo(119 / 120)
    repeat(puzzle, p, [e], 400, 0)
    expect(puzzle.doorOpen).toBe(false)
    puzzle.update(p, [e])
    expect(puzzle.doorOpen).toBe(true)
    repeat(puzzle)
    expect(puzzle.charge).toBe(1)
    expect(puzzle.doorLift).toBe(3.8)
    puzzle.reset()
    expect(puzzle.charge).toBe(0)
    expect(puzzle.doors.every((d) => !d.open && d.lift === 0)).toBe(true)
    expect(puzzle.plates.every((p) => !p.player && !p.echo)).toBe(true)
    puzzle.update(p, [e], 0)
    expect(puzzle.charge).toBe(0)
    expect(puzzle.doorOpen).toBe(false)
  },
)
it('resets interrupted charge, accepts two Echoes and rejects a discarded third memory', () => {
  const { puzzle } = setup()
  repeat(puzzle, away, [plates[2], plates[3]], 80)
  puzzle.update(away, [plates[2]])
  expect(puzzle.charge).toBe(0)
  repeat(puzzle, away, [plates[2], away, plates[3]])
  expect(puzzle.doorOpen).toBe(false)
  repeat(puzzle, away, [plates[2], plates[3]], 119)
  expect(puzzle.doorOpen).toBe(false)
  puzzle.update(away, [plates[2], plates[3]])
  expect(puzzle.doorOpen).toBe(true)
})
it.each([0, 1])(
  'freezes closure for the player, not an Echo, at gate %s',
  (index) => {
    const { puzzle } = setup()
    repeat(puzzle, plates[index])
    const threshold = { ...REVERSAL_DOORS[index], y: 0.91 }
    const height = puzzle.doors[index].lift
    repeat(puzzle, threshold)
    expect(puzzle.doors[index].open).toBe(false)
    expect(puzzle.doors[index].lift).toBe(height)
    repeat(puzzle, away, [threshold])
    expect(puzzle.doors[index].lift).toBe(0)
    repeat(puzzle, plates[index])
    repeat(puzzle, away, [], 2)
    const partial = puzzle.doors[index].lift
    repeat(puzzle, threshold)
    expect(puzzle.doors[index].lift).toBe(partial)
    puzzle.update(away, [])
    expect(puzzle.doors[index].lift).toBeLessThan(partial)
    repeat(puzzle)
    expect(puzzle.doors[index].lift).toBe(0)
  },
)
it('owns exactly eight colliders and disposes cleanly through repeated sessions', () => {
  const { world } = setup()
  const baseline = world.colliders.len()
  for (let i = 0; i < 5; i++) {
    const puzzle = new ReversalController(world, RAPIER)
    expect(world.colliders.len()).toBe(baseline + 8)
    puzzle.dispose(world)
    expect(world.colliders.len()).toBe(baseline)
  }
})
