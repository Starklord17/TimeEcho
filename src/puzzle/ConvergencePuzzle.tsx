import type { RefObject } from 'react'
import type { PuzzleRuntime } from './PuzzleRuntime'
import { ConvergenceController } from './ConvergenceController'
import { StationPuzzle } from './StationPuzzle'
import {
  CONVERGENCE_PLATES,
  CONVERGENCE_DOOR,
  CONVERGENCE_EXIT,
} from '../levels/convergenceLayout'

export function ConvergencePuzzle({
  runtimeRef,
}: {
  runtimeRef: RefObject<PuzzleRuntime | null>
}) {
  return (
    <StationPuzzle
      runtimeRef={runtimeRef}
      createController={ConvergenceController}
      plates={CONVERGENCE_PLATES}
      door={CONVERGENCE_DOOR}
      exit={CONVERGENCE_EXIT}
    />
  )
}
