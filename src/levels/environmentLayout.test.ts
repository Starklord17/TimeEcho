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
import {
  REVERSAL_BOXES,
  REVERSAL_DOORS,
  REVERSAL_EXIT,
  REVERSAL_PLATES,
} from './reversalLayout'

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
  {
    boxes: REVERSAL_BOXES,
    plates: REVERSAL_PLATES,
    doors: REVERSAL_DOORS,
    exit: REVERSAL_EXIT,
  },
]

const exportedLevels = LEVELS.filter((level) => level.environment === 'glb')

describe('Blender environment layout stays aligned with gameplay', () => {
  it('contains every authored and exported level', () => {
    expect(manifest.levels.map((level: { id: string }) => level.id)).toEqual(
      LEVELS.map((level) => level.id),
    )
    expect(
      exportedLevels.every((level) =>
        manifest.levels.some((entry: { id: string }) => entry.id === level.id),
      ),
    ).toBe(true)
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
  it('preserves the four observation apertures and the offset room bounds', () => {
    const room = manifest.levels.find(
      (level: { id: string }) => level.id === 'reversal',
    )
    expect(room.center).toEqual([0, 0, -1])
    expect(room.bounds).toEqual([12, 3.6, 32])
    expect(
      room.windows.map((window: { position: number[]; size: number[] }) => ({
        position: window.position,
        size: window.size,
      })),
    ).toEqual(
      REVERSAL_BOXES.filter((box) => box.window).map((box) => ({
        position: [box.position[0], 1.9, box.position[2]],
        size: [2.4, 1, 0.3],
      })),
    )
  })
})
