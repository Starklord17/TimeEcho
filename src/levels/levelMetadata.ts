export const LEVELS = [
  {
    id: 'empty-room',
    name: 'Empty Room',
    duration: 15,
    echoLimit: 1,
    environment: 'glb',
    spawn: [0, 0.92, 4],
  },
  {
    id: 'split-signal',
    name: 'Split Signal',
    duration: 20,
    echoLimit: 1,
    environment: 'glb',
    spawn: [0, 0.92, 7],
  },
  {
    id: 'convergence',
    name: 'Convergence',
    duration: 20,
    echoLimit: 2,
    environment: 'glb',
    spawn: [0, 0.92, 7],
  },
  {
    id: 'reversal',
    name: 'Reversal',
    duration: 45,
    echoLimit: 2,
    environment: 'glb',
    spawn: [0, 0.92, 13],
  },
  {
    id: 'relay',
    name: 'Relay',
    duration: 60,
    echoLimit: 3,
    environment: 'glb',
    spawn: [0, 0.92, 13],
  },
] as const
export type LevelId = (typeof LEVELS)[number]['id']
export function levelMetadata(id: LevelId) {
  return LEVELS.find((level) => level.id === id)!
}

export function levelMusic(id: LevelId) {
  return id === 'reversal' || id === 'relay' ? 'convergence' : id
}
