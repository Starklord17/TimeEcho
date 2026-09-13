import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Mesh } from 'three'
import { useEffect, useRef, type RefObject } from 'react'
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
  const doorMesh = useRef<Mesh>(null)
  const { world, rapier } = useRapier()
  const open = useGameStore((state) => state.doorOpen)
  const pressed = useGameStore((state) => state.platePlayer || state.plateEcho)
  useEffect(() => {
    const puzzle = new PuzzleController(world, rapier)
    runtimeRef.current = puzzle
    return () => {
      runtimeRef.current = null
      puzzle.dispose(world)
    }
  }, [world, rapier, runtimeRef])
  useFrame(() => {
    if (doorMesh.current && runtimeRef.current)
      doorMesh.current.position.y = DOOR.y + runtimeRef.current.doorLift
  })
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
          <span>{pressed ? 'ACTIVADA' : 'PISÁ Y GRABÁ CON R'}</span>
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
          <span>{open ? 'PASÁ HACIA LA SALIDA' : 'TU ECHO PUEDE ABRIRLA'}</span>
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
          <meshStandardMaterial color="#586c70" />
        </mesh>
      ))}
      <mesh ref={doorMesh} position={[DOOR.x, DOOR.y, DOOR.z]}>
        <boxGeometry args={[2.4, 3.6, 0.3]} />
        <meshStandardMaterial color="#ba865a" />
      </mesh>
      <mesh position={[0, 3.45, -2.82]}>
        <boxGeometry args={[2.2, 0.09, 0.04]} />
        <meshBasicMaterial color={open ? '#9cffa7' : '#ffb76b'} />
      </mesh>
      <mesh position={[PLATE.x, 0.018, PLATE.z]}>
        <boxGeometry args={[1.8, 0.036, 1.8]} />
        <meshStandardMaterial
          color={pressed ? '#9cffa7' : '#f4c76d'}
          emissive={pressed ? '#43754d' : '#4e3a0e'}
        />
      </mesh>
      <mesh position={[EXIT.x, 0.02, EXIT.z]}>
        <boxGeometry args={[2, 0.04, 1.4]} />
        <meshBasicMaterial color="#88e0ee" />
      </mesh>
      <mesh position={[EXIT.x, 1.5, -6.98]}>
        <boxGeometry args={[1.8, 0.25, 0.02]} />
        <meshBasicMaterial color="#88e0ee" />
      </mesh>
    </group>
  )
}
