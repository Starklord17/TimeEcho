import { useGameStore } from '../state/gameStore'
import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { GameScene } from './GameScene'

export function Game() {
  const levelId = useGameStore((state) => state.currentLevel)
  const sessionId = useGameStore((state) => state.sessionId)
  return (
    <div className="game-viewport">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ fov: 70, near: 0.05, far: 80, position: [0, 1.65, 4] }}
        gl={{ antialias: true }}
        fallback={
          <div className="error-screen">
            This browser needs WebGL to run Time Echo.
          </div>
        }
      >
        <Suspense fallback={null}>
          <GameScene key={sessionId} levelId={levelId} />
        </Suspense>
      </Canvas>
    </div>
  )
}
