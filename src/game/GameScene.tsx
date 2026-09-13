import { TemporalPuzzle } from '../puzzle/TemporalPuzzle'
import type { PuzzleController } from '../puzzle/PuzzleController'
import { useRef, useState } from 'react'
import { TimeLoop } from '../time-loop/TimeLoop'
import { Echo } from '../echo/Echo'
import { Physics } from '@react-three/rapier'
import { EmptyRoom } from '../levels/EmptyRoom'
import { Player } from '../player/Player'
import { PHYSICS_STEP } from '../player/PlayerController'

export function GameScene() {
  const [loop] = useState(() => new TimeLoop())
  const puzzle = useRef<PuzzleController | null>(null)
  return (
    <>
      <color attach="background" args={['#10191b']} />
      <hemisphereLight args={['#d9edee', '#647170', 2]} />
      <directionalLight position={[3, 7, 4]} intensity={2.2} />
      <pointLight position={[-3, 2.6, -4]} color="#b4e5d8" intensity={12} />
      <Physics timeStep={PHYSICS_STEP} interpolate gravity={[0, -9.81, 0]}>
        <EmptyRoom />
        <TemporalPuzzle runtimeRef={puzzle} />
        <Player loop={loop} puzzle={puzzle} />
        <Echo loop={loop} />
      </Physics>
    </>
  )
}
