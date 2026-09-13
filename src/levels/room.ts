export const ROOM = {
  halfWidth: 6,
  halfDepth: 7,
  height: 3.6,
  thickness: 0.3,
} as const
export const SPAWN: [number, number, number] = [0, 0.92, 4]

// Shared physical dimensions for scene construction and collision tests.
export const ROOM_BOXES: {
  position: [number, number, number]
  size: [number, number, number]
}[] = [
  { position: [0, -0.15, 0], size: [12.6, 0.3, 14.6] },
  { position: [-6.15, 1.8, 0], size: [0.3, 3.6, 14.6] },
  { position: [6.15, 1.8, 0], size: [0.3, 3.6, 14.6] },
  { position: [0, 1.8, -7.15], size: [12, 3.6, 0.3] },
  { position: [0, 1.8, 7.15], size: [12, 3.6, 0.3] },
]
