export const LEVELS = [
  { id: 'empty-room', name: 'Empty Room', duration: 15, spawn: [0, 0.92, 4] },
  {
    id: 'split-signal',
    name: 'Split Signal',
    duration: 20,
    spawn: [0, 0.92, 7],
  },
] as const
export type LevelId = (typeof LEVELS)[number]['id']
export function levelMetadata(id: LevelId) {
  return LEVELS.find((level) => level.id === id)!
}
