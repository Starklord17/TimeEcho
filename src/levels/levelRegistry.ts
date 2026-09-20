import { ConvergenceRoom } from './ConvergenceRoom'
import { ConvergencePuzzle } from '../puzzle/ConvergencePuzzle'
import { EmptyRoom } from './EmptyRoom'
import { SplitSignalRoom } from './SplitSignalRoom'
import { TemporalPuzzle } from '../puzzle/TemporalPuzzle'
import { SplitSignalPuzzle } from '../puzzle/SplitSignalPuzzle'
import { levelMetadata, type LevelId } from './levelMetadata'

export function levelDefinition(id: LevelId) {
  return {
    ...levelMetadata(id),
    Room:
      id === 'empty-room'
        ? EmptyRoom
        : id === 'split-signal'
          ? SplitSignalRoom
          : ConvergenceRoom,
    Puzzle:
      id === 'empty-room'
        ? TemporalPuzzle
        : id === 'split-signal'
          ? SplitSignalPuzzle
          : ConvergencePuzzle,
  }
}
