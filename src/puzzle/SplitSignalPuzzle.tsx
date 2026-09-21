import type { RefObject } from 'react'
import type { PuzzleRuntime } from './PuzzleRuntime'
import { SplitSignalController } from './SplitSignalController'
import { StationPuzzle } from './StationPuzzle'
import {
  SPLIT_PLATES,
  SPLIT_DOOR,
  SPLIT_EXIT,
} from '../levels/splitSignalLayout'

export function SplitSignalPuzzle({
  runtimeRef,
}: {
  runtimeRef: RefObject<PuzzleRuntime | null>
}) {
  return (
    <StationPuzzle
      runtimeRef={runtimeRef}
      createController={SplitSignalController}
      plates={SPLIT_PLATES}
      door={SPLIT_DOOR}
      exit={SPLIT_EXIT}
    />
  )
}
