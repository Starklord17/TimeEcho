import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { GameScene } from './GameScene'

export function Game() {
  return (
    <div className="game-viewport">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ fov: 70, near: 0.05, far: 80, position: [0, 1.65, 4] }}
        gl={{ antialias: true }}
        fallback={
          <div className="error-screen">
            Este navegador necesita WebGL para ejecutar Time Echo.
          </div>
        }
      >
        <Suspense fallback={null}>
          <GameScene />
        </Suspense>
      </Canvas>
    </div>
  )
}
