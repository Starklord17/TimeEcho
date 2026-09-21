import { ReplayCollection } from '../echo/ReplayCollection'
import type { RecordedRun } from '../recording/Recorder'
import type { Position, PuzzleRuntime } from './PuzzleRuntime'
export function update(
  puzzle: PuzzleRuntime,
  player: Position,
  run: RecordedRun | null,
  time: number,
  step?: number,
) {
  puzzle.update(
    player,
    new ReplayCollection().sample(run ? [run] : [], time),
    step,
  )
}
