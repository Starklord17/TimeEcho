import type { RapierContext } from '@react-three/rapier'
import type { RecordedRun } from '../recording/Recorder'

export type Position = { x: number; y: number; z: number }
export interface PuzzleRuntime {
  readonly platePlayer: boolean
  readonly plateEcho: boolean
  readonly doorOpen: boolean
  readonly doorLift: number
  // A zero step refreshes sensors after reset without advancing puzzle time.
  update(
    player: Position,
    run: RecordedRun | null,
    time: number,
    step?: number,
  ): void
  reset(): void
  reachedExit(player: Position): boolean
  dispose(world: RapierContext['world']): void
}
