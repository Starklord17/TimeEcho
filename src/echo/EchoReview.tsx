// Development-only review surface. Reuses production Echo, clock, sensors and lighting.
import { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { Physics, useBeforePhysicsStep } from '@react-three/rapier'
import { Euler, Quaternion } from 'three'
import { Echo } from './Echo'
import { ECHO_VISUAL } from './echoAsset'
import { TimeLoop } from '../time-loop/TimeLoop'
import { Recorder } from '../recording/Recorder'
import { TemporalPuzzle } from '../puzzle/TemporalPuzzle'
import type { PuzzleController } from '../puzzle/PuzzleController'
import { EmptyRoom } from '../levels/EmptyRoom'
import { useGameStore } from '../state/gameStore'

const views = {
  Frente: [-4, 1.55, -1.3],
  Perfil: [-0.7, 1.55, 2],
  Espalda: [-4, 1.55, 5.3],
  'Tres cuartos': [-1.6, 1.55, -0.4],
} as const
function CameraView({ view }: { view: keyof typeof views }) {
  const { camera } = useThree()
  useEffect(() => {
    const [x, y, z] = views[view]
    camera.position.set(x, y, z)
    camera.lookAt(-4, 0.85, 2)
  }, [camera, view])
  return null
}
function Simulation({ loop }: { loop: TimeLoop }) {
  const puzzle = useRef<PuzzleController | null>(null)
  useBeforePhysicsStep(() => {
    const state = useGameStore.getState()
    if (!puzzle.current) return
    if (state.fallback) loop.advance()
    puzzle.current.update(
      { x: 0, y: 0.91, z: 4 },
      state.lastRun,
      loop.elapsedSeconds,
    )
    state.publishPuzzle(
      puzzle.current.platePlayer,
      puzzle.current.plateEcho,
      puzzle.current.doorOpen,
    )
    state.publishCycle(loop.cycle, loop.remainingSeconds)
  })
  return (
    <>
      <EmptyRoom />
      <TemporalPuzzle runtimeRef={puzzle} />
      <Echo loop={loop} />
    </>
  )
}
export function EchoReview() {
  const [loop] = useState(() => new TimeLoop())
  const [view, setView] = useState<keyof typeof views>('Frente')
  const [variant, setVariant] = useState<'glb' | 'procedural'>('glb')
  const [generation, setGeneration] = useState(0)
  const plate = useGameStore((s) => s.plateEcho)
  const cycle = useGameStore((s) => s.cycle)
  const running = useGameStore((s) => s.fallback)
  const load = (moving: boolean, tilted = false) => {
    const recorder = new Recorder()
    const q = new Quaternion()
    if (tilted) q.setFromEuler(new Euler(0.4, 0.7, 0, 'YXZ'))
    recorder.begin(1, { x: moving ? -1 : -4, y: 0.91, z: 2 }, q)
    if (moving) {
      q.setFromEuler(new Euler(0.2, Math.PI / 2, 0, 'YXZ'))
      recorder.capture(1.5, { x: -2.5, y: 0.91, z: 2 }, q)
      q.identity()
      recorder.capture(3, { x: -4, y: 0.91, z: 2 }, q)
    }
    useGameStore.getState().saveRun(recorder.finish('restart'))
    loop.restart()
    useGameStore.getState().setFallback(moving)
  }
  return (
    <main
      style={{
        fontFamily: 'system-ui',
        background: '#171d22',
        color: '#e0f4f6',
        height: '100vh',
      }}
    >
      <div
        style={{
          padding: 12,
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <strong>Revisión Echo · solo desarrollo</strong>
        {Object.keys(views).map((v) => (
          <button key={v} onClick={() => setView(v as keyof typeof views)}>
            {v}
          </button>
        ))}
        <button onClick={() => load(false)}>Pose en placa</button>
        <button onClick={() => load(false, true)}>Mirada inclinada</button>
        <button onClick={() => load(true)}>Reproducir recorrido</button>
        <button onClick={() => useGameStore.getState().setFallback(!running)}>
          {running ? 'Pausar' : 'Reanudar'}
        </button>
        <button
          onClick={() => {
            loop.restart()
            setGeneration((n) => n + 1)
          }}
        >
          Reiniciar ciclo
        </button>
        <button
          onClick={() => {
            const next = variant === 'glb' ? 'procedural' : 'glb'
            ECHO_VISUAL.mode = next
            setVariant(next)
          }}
        >
          Comparar: {variant}
        </button>
        <span role="status">
          Ciclo {cycle} · Placa {plate ? 'ECHO ACTIVADO' : 'LIBRE'}
        </span>
      </div>
      <div style={{ height: 'calc(100vh - 100px)' }}>
        <Canvas camera={{ fov: 70, near: 0.05, far: 80 }} dpr={[1, 1.5]}>
          <CameraView view={view} />
          <color attach="background" args={['#10191b']} />
          <hemisphereLight args={['#e8e9ea', '#47494c', 2]} />
          <directionalLight position={[3, 7, 4]} intensity={2.2} />
          <pointLight position={[-3, 2.6, -4]} color="#f1f2f3" intensity={8} />
          <Suspense fallback={null}>
            <Physics timeStep={1 / 60} gravity={[0, -9.81, 0]}>
              <group key={`${variant}-${generation}`}>
                <Simulation loop={loop} />
              </group>
            </Physics>
          </Suspense>
        </Canvas>
      </div>
    </main>
  )
}
