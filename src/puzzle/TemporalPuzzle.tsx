import { DoorVisual } from './DoorVisual'
import { PressurePlateVisual } from './PressurePlateVisual'
import { Html } from '@react-three/drei'
import { useEffect, type RefObject } from 'react'
import { useRapier } from '@react-three/rapier'
import { useGameStore } from '../state/gameStore'
import {
  DIVIDER_BOXES,
  DOOR,
  EXIT,
  PLATE,
  PuzzleController,
} from './PuzzleController'

export function TemporalPuzzle({
  runtimeRef,
}: {
  runtimeRef: RefObject<PuzzleController | null>
}) {
  const { world, rapier } = useRapier()
  const open = useGameStore((state) => state.doorOpen)
  const player = useGameStore((state) => state.platePlayer)
  const echo = useGameStore((state) => state.plateEcho)
  useEffect(() => {
    const puzzle = new PuzzleController(world, rapier)
    runtimeRef.current = puzzle
    return () => {
      runtimeRef.current = null
      puzzle.dispose(world)
    }
  }, [world, rapier, runtimeRef])
  return (
    <group>
      <Html
        position={[PLATE.x, 0.65, PLATE.z]}
        center
        occlude
        style={{ pointerEvents: 'none' }}
      >
        <div className="world-label">
          <b>01 · PLACA</b>
          <span>
            {player && echo
              ? 'JUGADOR + ECHO'
              : player
                ? 'JUGADOR · GRABÁ CON R'
                : echo
                  ? 'ECHO · ACTIVADA'
                  : 'PISÁ Y GRABÁ CON R'}
          </span>
        </div>
      </Html>
      <Html
        position={[DOOR.x, 2.8, DOOR.z + 0.22]}
        center
        occlude
        style={{ pointerEvents: 'none' }}
      >
        <div className="world-label">
          <b>02 · PUERTA</b>
          <span>{open ? 'APERTURA ACTIVADA' : 'TU ECHO PUEDE ABRIRLA'}</span>
        </div>
      </Html>
      <Html
        position={[EXIT.x, 1.2, EXIT.z]}
        center
        occlude
        style={{ pointerEvents: 'none' }}
      >
        <div className="world-label">
          <b>03 · SALIDA</b>
        </div>
      </Html>
      {DIVIDER_BOXES.map((wall, index) => (
        <mesh key={index} position={[...wall.position]}>
          <boxGeometry args={[...wall.size]} />
          <meshStandardMaterial color="#4c5155" />
        </mesh>
      ))}
      <DoorVisual runtimeRef={runtimeRef} open={open} />
      <PressurePlateVisual player={player} echo={echo} />
      <mesh position={[EXIT.x, 0.02, EXIT.z]}>
        <boxGeometry args={[2, 0.04, 1.4]} />
        <meshBasicMaterial color="#efb462" />
      </mesh>
      <pointLight
        position={[EXIT.x, 1.5, EXIT.z]}
        color="#ffcf8a"
        intensity={2}
        distance={4}
      />
      {[-1.05, 1.05].map((x) => (
        <mesh key={x} position={[x, 1, -6.95]}>
          <boxGeometry args={[0.045, 2, 0.04]} />
          <meshBasicMaterial color="#efb462" />
        </mesh>
      ))}
      <mesh position={[EXIT.x, 2, -6.98]}>
        <boxGeometry args={[1.8, 0.25, 0.02]} />
        <meshBasicMaterial color="#efb462" />
      </mesh>
    </group>
  )
}
