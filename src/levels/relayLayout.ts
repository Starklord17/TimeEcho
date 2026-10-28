export const RELAY_PLATES = [
  { x: -6, y: 0.15, z: 6 },
  { x: -2, y: 0.15, z: 6 },
  { x: 2, y: 0.15, z: 6 },
  { x: 6, y: 0.15, z: 6 },
  { x: -6, y: 0.15, z: -6 },
  { x: -2, y: 0.15, z: -6 },
  { x: 2, y: 0.15, z: -6 },
  { x: 6, y: 0.15, z: -6 },
] as const
export const RELAY_DOOR = { x: 0, y: 1.8, z: -12 }
export const RELAY_EXIT = { x: 0, y: 0.6, z: -14 }
export const RELAY_BOXES: {
  position: [number, number, number]
  size: [number, number, number]
}[] = [
  { position: [0, -0.15, 0], size: [20.6, 0.3, 32.6] },
  { position: [-10.15, 1.8, 0], size: [0.3, 3.6, 32.6] },
  { position: [10.15, 1.8, 0], size: [0.3, 3.6, 32.6] },
  { position: [0, 1.8, 16.15], size: [20, 3.6, 0.3] },
  { position: [0, 1.8, -16.15], size: [20, 3.6, 0.3] },
  { position: [-5.6, 1.8, -12], size: [8.8, 3.6, 0.3] },
  { position: [5.6, 1.8, -12], size: [8.8, 3.6, 0.3] },
]
