import { levelDefinition } from '../levels/levelRegistry'
import type { LevelId } from '../levels/levelMetadata'
import type { PuzzleRuntime } from '../puzzle/PuzzleRuntime'
import { useRef, useState } from 'react'
import { TimeLoop } from '../time-loop/TimeLoop'
import { Echo } from '../echo/Echo'
import { Physics } from '@react-three/rapier'
import { Player } from '../player/Player'
import { PHYSICS_STEP } from '../player/PlayerController'

export function GameScene({ levelId }: { levelId: LevelId }) {
  const level = levelDefinition(levelId)
  const [loop] = useState(() => new TimeLoop(level.duration))
  const puzzle = useRef<PuzzleRuntime | null>(null)
  return (
    <>
      <color attach="background" args={['#10191b']} />
      <hemisphereLight args={['#e8e9ea', '#47494c', 2]} />
      <directionalLight position={[3, 7, 4]} intensity={2.2} />
      <pointLight position={[-3, 2.6, -4]} color="#f1f2f3" intensity={8} />
      <Physics timeStep={PHYSICS_STEP} interpolate gravity={[0, -9.81, 0]}>
        <level.Room />
        <level.Puzzle runtimeRef={puzzle} />
        <Player spawn={level.spawn} loop={loop} puzzle={puzzle} />
        <Echo loop={loop} />
      </Physics>
    </>
  )
}
