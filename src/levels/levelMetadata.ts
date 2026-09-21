export const LEVELS = [
  {
    id: 'empty-room',
    name: 'Empty Room',
    duration: 15,
    echoLimit: 1,
    spawn: [0, 0.92, 4],
  },
  {
    id: 'split-signal',
    name: 'Split Signal',
    duration: 20,
    echoLimit: 1,
    spawn: [0, 0.92, 7],
  },
  {
    id: 'convergence',
    name: 'Convergence',
    duration: 20,
    echoLimit: 2,
    spawn: [0, 0.92, 7],
  },
] as const
export type LevelId = (typeof LEVELS)[number]['id']
export function levelMetadata(id: LevelId) {
  return LEVELS.find((level) => level.id === id)!
}
