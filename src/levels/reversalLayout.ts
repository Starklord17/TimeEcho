export const REVERSAL_PLATES = [
  { x: -4, y: 0.15, z: 11 },
  { x: -4, y: 0.15, z: 2 },
  { x: 4, y: 0.15, z: -6 },
  { x: 4, y: 0.15, z: 11 },
] as const
export const REVERSAL_DOORS = [
  { id: 'entry', x: 0, y: 1.8, z: 6 },
  { id: 'inner', x: 0, y: 1.8, z: -2 },
  { id: 'exit', x: 0, y: 1.8, z: -10 },
] as const
export const REVERSAL_EXIT = { x: 0, y: 0.6, z: -14 }

type Box = {
  position: [number, number, number]
  size: [number, number, number]
  window?: boolean
}
export const REVERSAL_BOXES: Box[] = [
  { position: [0, -0.15, -1], size: [12.6, 0.3, 32.6] },
  { position: [-6.15, 1.8, -1], size: [0.3, 3.6, 32.6] },
  { position: [6.15, 1.8, -1], size: [0.3, 3.6, 32.6] },
  { position: [0, 1.8, 15.15], size: [12, 3.6, 0.3] },
  { position: [0, 1.8, -17.15], size: [12, 3.6, 0.3] },
  { position: [4, 0.85, 9.5], size: [1.8, 1.7, 0.18] },
  { position: [4, 0.85, -7.5], size: [1.8, 1.7, 0.18] },
  ...REVERSAL_DOORS.flatMap((door) =>
    [-3.6, 3.6].map((x): Box => ({
      position: [x, 1.8, door.z],
      size: [4.8, 3.6, 0.3],
      window: door.id !== 'exit',
    })),
  ),
]
