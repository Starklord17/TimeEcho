import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { LEVELS } from './levelMetadata'
import { ROOM_BOXES } from './room'
import {
  SPLIT_BOXES,
  SPLIT_DOOR,
  SPLIT_EXIT,
  SPLIT_PLATES,
} from './splitSignalLayout'
import {
  CONVERGENCE_BOXES,
  CONVERGENCE_DOOR,
  CONVERGENCE_EXIT,
  CONVERGENCE_PLATES,
} from './convergenceLayout'
import { DIVIDER_BOXES, DOOR, EXIT, PLATE } from '../puzzle/PuzzleController'

const manifest = JSON.parse(
  readFileSync('assets/blender/environment-layout.json', 'utf8'),
)
const layouts = [
  {
    boxes: [...ROOM_BOXES, ...DIVIDER_BOXES],
    plates: [PLATE],
    door: DOOR,
    exit: EXIT,
  },
  {
    boxes: SPLIT_BOXES,
    plates: SPLIT_PLATES,
    door: SPLIT_DOOR,
    exit: SPLIT_EXIT,
  },
  {
    boxes: CONVERGENCE_BOXES,
    plates: CONVERGENCE_PLATES,
    door: CONVERGENCE_DOOR,
    exit: CONVERGENCE_EXIT,
  },
]

describe('Blender environment layout stays aligned with gameplay', () => {
  it('contains exactly the playable levels', () => {
    expect(manifest.levels.map((level: { id: string }) => level.id)).toEqual(
      LEVELS.map((level) => level.id),
    )
  })
  LEVELS.forEach((level, index) => {
    it(`preserves ${level.id} collision geometry, stations and spawn`, () => {
      expect(manifest.levels[index]).toMatchObject({
        ...layouts[index],
        id: level.id,
        spawn: level.spawn,
      })
    })
  })
})
