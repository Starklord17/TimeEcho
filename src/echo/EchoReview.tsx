import { ReplayCollection } from './ReplayCollection'
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
import { EchoMotionReview } from './EchoMotionReview'

const views = {
  Front: [-4, 1.55, -1.3],
  Profile: [-0.7, 1.55, 2],
  Back: [-4, 1.55, 5.3],
  'Three-quarter': [-1.6, 1.55, -0.4],
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
function ComparisonCamera({ close }: { close: boolean }) {
  const { camera } = useThree()
  useEffect(() => {
    camera.position.set(0, close ? 1.43 : 1.3, close ? -1.8 : -3)
    camera.lookAt(0, close ? 1.38 : 0.9, 0)
  }, [camera, close])
  return null
}
function Simulation({ loop }: { loop: TimeLoop }) {
  const puzzle = useRef<PuzzleController | null>(null)
  const [echoes] = useState(() => new ReplayCollection())
  useBeforePhysicsStep(() => {
    const state = useGameStore.getState()
    if (!puzzle.current) return
    if (state.fallback) loop.advance()
    puzzle.current.update(
      { x: 0, y: 0.91, z: 4 },
      echoes.sample(state.runs, loop.elapsedSeconds),
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
  const [view, setView] = useState<keyof typeof views>('Front')
  const [variant, setVariant] = useState<'glb' | 'procedural'>('glb')
  const [generation, setGeneration] = useState(0)
  const [comparison, setComparison] = useState(false)
  const [close, setClose] = useState(false)
  const [light, setLight] = useState(false)
  const [time, setTime] = useState(0)
  const [yaw, setYaw] = useState(0)
  const [pitch, setPitch] = useState(0)
  const [speed, setSpeed] = useState(1)
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
        <strong>Echo review · development only</strong>
        <button onClick={() => setComparison((v) => !v)}>
          {comparison ? 'Puzzle scene' : 'Idle / Walk comparison'}
        </button>
        <button onClick={() => setLight((v) => !v)}>
          {light ? 'Dark background' : 'Light background'}
        </button>
        {comparison && (
          <>
            <button onClick={() => setClose((v) => !v)}>
              {close ? 'Full body' : 'Neck close-up'}
            </button>
            <label>
              Speed{' '}
              <select
                aria-label="Recorded speed"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
              >
                <option value={1}>1 m/s</option>
                <option value={3.5}>3.5 m/s</option>
              </select>
            </label>
            <label>
              Time{' '}
              <input
                aria-label="Animation time"
                type="number"
                min="0"
                max="15"
                step="0.05"
                value={time}
                onChange={(e) => {
                  setTime(Number(e.target.value))
                  useGameStore.getState().setFallback(false)
                }}
              />
            </label>
            <label>
              Yaw{' '}
              <input
                aria-label="Look yaw"
                type="number"
                step="0.1"
                value={yaw}
                onChange={(e) => setYaw(Number(e.target.value))}
              />
            </label>
            <label>
              Pitch{' '}
              <input
                aria-label="Look pitch"
                type="number"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
              />
            </label>
          </>
        )}
        {Object.keys(views).map((v) => (
          <button
            key={v}
            onClick={() => {
              setView(v as keyof typeof views)
              setYaw(
                v === 'Front'
                  ? 0
                  : v === 'Back'
                    ? Math.PI
                    : v === 'Profile'
                      ? Math.PI / 2
                      : Math.PI / 4,
              )
            }}
          >
            {v}
          </button>
        ))}
        <button onClick={() => load(false)}>Plate pose</button>
        <button onClick={() => load(false, true)}>Tilted look</button>
        <button onClick={() => load(true)}>Play run</button>
        <button onClick={() => useGameStore.getState().setFallback(!running)}>
          {running ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={() => {
            loop.restart()
            setTime(0)
            setGeneration((n) => n + 1)
          }}
        >
          Reset cycle
        </button>
        <button
          onClick={() => {
            const next = variant === 'glb' ? 'procedural' : 'glb'
            ECHO_VISUAL.mode = next
            setVariant(next)
          }}
        >
          Compare: {variant}
        </button>
        <span role="status">
          Cycle {cycle} · Plate {plate ? 'ECHO ACTIVE' : 'CLEAR'}
        </span>
      </div>
      <div style={{ height: 'calc(100vh - 100px)' }}>
        <Canvas
          key={comparison ? 'comparison' : 'puzzle'}
          camera={{ position: [0, 1.3, -3], fov: 55, near: 0.05, far: 80 }}
          dpr={[1, 1.5]}
          onCreated={({ camera }) => camera.lookAt(0, 0.9, 0)}
        >
          {!comparison && <CameraView view={view} />}
          {comparison && <ComparisonCamera close={close} />}
          <color attach="background" args={[light ? '#d9dde0' : '#10191b']} />
          <hemisphereLight args={['#e8e9ea', '#47494c', 2]} />
          <directionalLight position={[3, 7, 4]} intensity={2.2} />
          <pointLight position={[-3, 2.6, -4]} color="#f1f2f3" intensity={8} />
          <Suspense fallback={null}>
            {comparison ? (
              <group key={`${variant}-${generation}-${speed}`}>
                <EchoMotionReview
                  moving={false}
                  running={running}
                  time={time}
                  yaw={yaw}
                  pitch={pitch}
                  side={-1}
                  speed={speed}
                />
                <EchoMotionReview
                  moving
                  running={running}
                  time={time}
                  yaw={yaw}
                  pitch={pitch}
                  side={1}
                  speed={speed}
                />
                <mesh rotation={[-Math.PI / 2, 0, 0]}>
                  <planeGeometry args={[30, 30]} />
                  <meshStandardMaterial color={light ? '#d9dde0' : '#252e32'} />
                </mesh>
              </group>
            ) : (
              <Physics timeStep={1 / 60} gravity={[0, -9.81, 0]}>
                <group key={`${variant}-${generation}`}>
                  <Simulation loop={loop} />
                </group>
              </Physics>
            )}
          </Suspense>
        </Canvas>
      </div>
    </main>
  )
}
