import { ReversalRoom } from './ReversalRoom'
import { ReversalPuzzle } from '../puzzle/ReversalPuzzle'
import { ConvergenceRoom } from './ConvergenceRoom'
import { ConvergencePuzzle } from '../puzzle/ConvergencePuzzle'
import { EmptyRoom } from './EmptyRoom'
import { SplitSignalRoom } from './SplitSignalRoom'
import { TemporalPuzzle } from '../puzzle/TemporalPuzzle'
import { SplitSignalPuzzle } from '../puzzle/SplitSignalPuzzle'
import { levelMetadata, type LevelId } from './levelMetadata'

const components = {
  'empty-room': { Room: EmptyRoom, Puzzle: TemporalPuzzle },
  'split-signal': { Room: SplitSignalRoom, Puzzle: SplitSignalPuzzle },
  convergence: { Room: ConvergenceRoom, Puzzle: ConvergencePuzzle },
  reversal: { Room: ReversalRoom, Puzzle: ReversalPuzzle },
} satisfies Record<
  LevelId,
  { Room: typeof EmptyRoom; Puzzle: typeof TemporalPuzzle }
>

export function levelDefinition(id: LevelId) {
  return { ...levelMetadata(id), ...components[id] }
}
