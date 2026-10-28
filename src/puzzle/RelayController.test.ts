import { afterEach, beforeAll, expect, it } from 'vitest'
import RAPIER from '@dimforge/rapier3d-compat'
import { RelayController } from './RelayController'
import { RELAY_PLATES } from '../levels/relayLayout'

beforeAll(async () => {
  await RAPIER.init()
})
const cleanup: (() => void)[] = []
afterEach(() => cleanup.splice(0).forEach((fn) => fn()))
const plates = RELAY_PLATES.map((p) => ({ ...p, y: 0.91 }))
const away = { x: 0, y: 0.91, z: 13 }
function setup() {
  const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 })
  const puzzle = new RelayController(world, RAPIER)
  world.step()
  cleanup.push(() => {
    puzzle.dispose(world)
    world.free()
  })
  return { world, puzzle }
}
function repeat(
  puzzle: RelayController,
  player = away,
  echoes = [] as (typeof away)[],
  ticks = 150,
  step = 1 / 60,
) {
  for (let i = 0; i < ticks; i++) puzzle.update(player, echoes, step)
}

it('requires four distinct actors, ordered phases and continuous charges', () => {
  const { puzzle } = setup()
  repeat(puzzle, plates[4], plates.slice(5), 200)
  expect(puzzle.phase).toBe('PHASE_A')
  repeat(puzzle, plates[0], plates.slice(1, 3), 200)
  expect(puzzle.charge).toBe(0)
  repeat(puzzle, plates[0], plates.slice(1, 4), 119)
  expect(puzzle.charge).toBeCloseTo(119 / 120)
  repeat(puzzle, plates[0], plates.slice(1, 4), 50, 0)
  expect(puzzle.phase).toBe('PHASE_A')
  repeat(puzzle, plates[0], plates.slice(1, 4), 1)
  expect(puzzle.phase).toBe('PHASE_B')
  expect(puzzle.charge).toBe(0)
  repeat(puzzle, plates[4], plates.slice(5), 100)
  repeat(puzzle, away, [], 1)
  expect(puzzle.charge).toBe(0)
  expect(puzzle.phase).toBe('PHASE_B')
  repeat(puzzle, plates[4], plates.slice(5), 179)
  expect(puzzle.doorOpen).toBe(false)
  repeat(puzzle, plates[4], plates.slice(5), 1)
  expect(puzzle.doorOpen).toBe(true)
  repeat(puzzle)
  expect(puzzle.doorOpen).toBe(true)
  expect(puzzle.reachedExit(away)).toBe(false)
  puzzle.reset()
  expect(puzzle.phase).toBe('PHASE_A')
  expect(puzzle.doorOpen).toBe(false)
  expect(puzzle.charge).toBe(0)
  expect(puzzle.plates.every((p) => !p.player && !p.echo)).toBe(true)
})
it('stationary echoes in A cannot activate B and disposal releases all sensors', () => {
  const { world, puzzle } = setup()
  repeat(puzzle, plates[0], plates.slice(1, 4), 120)
  repeat(puzzle, plates[4], plates.slice(1, 4), 300)
  expect(puzzle.phase).toBe('PHASE_B')
  expect(puzzle.charge).toBe(0)
  const baseline = world.colliders.len()
  for (let i = 0; i < 5; i++) {
    const other = new RelayController(world, RAPIER)
    expect(world.colliders.len()).toBe(baseline + 10)
    other.dispose(world)
    expect(world.colliders.len()).toBe(baseline)
  }
})
