import type { RapierContext } from '@react-three/rapier'

export type Position = { x: number; y: number; z: number }
export interface PuzzleRuntime {
  readonly platePlayer: boolean
  readonly plateEcho: boolean
  readonly doorOpen: boolean
  readonly doorLift: number
  readonly plates?: readonly { player: boolean; echo: boolean }[]
  readonly charge?: number
  // A zero step refreshes sensors after reset without advancing puzzle time.
  update(player: Position, echoes: readonly Position[], step?: number): void
  reset(): void
  reachedExit(player: Position): boolean
  dispose(world: RapierContext['world']): void
}
