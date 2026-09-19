export const SPLIT_PLATES = [
  { x: -5, y: 0.15, z: -3 },
  { x: 5, y: 0.15, z: -3 },
] as const
export const SPLIT_DOOR = { x: 0, y: 1.8, z: -6 }
export const SPLIT_EXIT = { x: 0, y: 0.6, z: -8 }
export const SPLIT_BOXES = [
  { position: [0, -0.15, 0], size: [16.6, 0.3, 18.6] },
  { position: [-8.15, 1.8, 0], size: [0.3, 3.6, 18.6] },
  { position: [8.15, 1.8, 0], size: [0.3, 3.6, 18.6] },
  { position: [0, 1.8, -9.15], size: [16, 3.6, 0.3] },
  { position: [0, 1.8, 9.15], size: [16, 3.6, 0.3] },
  { position: [-2, 1.8, 0], size: [0.3, 3.6, 8] },
  { position: [2, 1.8, 0], size: [0.3, 3.6, 8] },
  { position: [-4.6, 1.8, -6], size: [6.8, 3.6, 0.3] },
  { position: [4.6, 1.8, -6], size: [6.8, 3.6, 0.3] },
] as const
