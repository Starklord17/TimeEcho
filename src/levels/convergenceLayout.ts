import { SPLIT_BOXES } from './splitSignalLayout'

export const CONVERGENCE_PLATES = [
  { x: -5, y: 0.15, z: -3 },
  { x: 5, y: 0.15, z: -3 },
  { x: 0, y: 0.15, z: -3 },
] as const
export const CONVERGENCE_DOOR = { x: 0, y: 1.8, z: -6 }
export const CONVERGENCE_EXIT = { x: 0, y: 0.6, z: -8 }
// Reuse the laboratory footprint: the central gallery now contains a third station.
export const CONVERGENCE_BOXES = SPLIT_BOXES
