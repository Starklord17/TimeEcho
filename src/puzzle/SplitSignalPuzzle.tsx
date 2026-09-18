import { useEffect, useRef, useState, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import { Mesh } from 'three'
import { SplitSignalController } from './SplitSignalController'
import type { PuzzleRuntime } from './PuzzleRuntime'
import { DoorVisual } from './DoorVisual'
import { PressurePlateVisual } from './PressurePlateVisual'
import {
  SPLIT_PLATES,
  SPLIT_DOOR,
  SPLIT_EXIT,
} from '../levels/splitSignalLayout'

function Signal({ index, active }: { index: number; active: boolean }) {
  return (
    <mesh
      rotation={[0, 0, index === 0 ? Math.PI / 2 : 0]}
      scale={active ? 1.12 : 1}
    >
      <ringGeometry args={[0.16, 0.23, index === 0 ? 3 : 32]} />
      <meshBasicMaterial color={active ? '#d9fbff' : '#727d83'} />
    </mesh>
  )
}

export function SplitSignalPuzzle({
  runtimeRef,
}: {
  runtimeRef: RefObject<PuzzleRuntime | null>
}) {
  const { world, rapier } = useRapier()
  const controller = useRef<SplitSignalController>(null)
  const chargeBar = useRef<Mesh>(null)
  const [signals, setSignals] = useState(0)
  const previous = useRef(0)
  useEffect(() => {
    const puzzle = new SplitSignalController(world, rapier)
    controller.current = puzzle
    runtimeRef.current = puzzle
    return () => {
      controller.current = null
      runtimeRef.current = null
      puzzle.dispose(world)
    }
  }, [world, rapier, runtimeRef])
  useFrame(() => {
    const puzzle = controller.current
    if (!puzzle) return
    const next =
      Number(puzzle.plates[0].player) |
      (Number(puzzle.plates[0].echo) << 1) |
      (Number(puzzle.plates[1].player) << 2) |
      (Number(puzzle.plates[1].echo) << 3) |
      (Number(puzzle.doorOpen) << 4)
    if (next !== previous.current) {
      previous.current = next
      setSignals(next)
    }
    if (chargeBar.current) {
      chargeBar.current.scale.x = Math.max(0.001, puzzle.charge)
      chargeBar.current.position.x = -(1 - puzzle.charge)
    }
  })
  return (
    <group>
      {SPLIT_PLATES.map((position, index) => {
        const player = !!(signals & (1 << (index * 2)))
        const echo = !!(signals & (2 << (index * 2)))
        return (
          <group key={index}>
            <PressurePlateVisual
              position={position}
              player={player}
              echo={echo}
            />
            <group
              position={[position.x, 0.085, position.z]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <Signal index={index} active={player || echo} />
            </group>
            <group
              position={[index === 0 ? -1.65 : 1.65, 2, SPLIT_DOOR.z + 0.17]}
            >
              <Signal index={index} active={player || echo} />
            </group>
            <pointLight
              position={[position.x, 2.5, position.z]}
              intensity={5}
              distance={6}
              color="#c3d5da"
            />
          </group>
        )
      })}
      <DoorVisual
        runtimeRef={runtimeRef}
        open={!!(signals & 16)}
        position={SPLIT_DOOR}
      />
      <group position={[0, 2.9, SPLIT_DOOR.z + 0.18]}>
        <mesh>
          <boxGeometry args={[2.05, 0.12, 0.03]} />
          <meshBasicMaterial color="#222b30" />
        </mesh>
        <mesh ref={chargeBar} position={[-1, 0, 0.025]} scale={[0.001, 1, 1]}>
          <boxGeometry args={[2, 0.07, 0.02]} />
          <meshBasicMaterial color="#bcf5f1" />
        </mesh>
      </group>
      <mesh position={[SPLIT_EXIT.x, 0.02, SPLIT_EXIT.z]}>
        <boxGeometry args={[2, 0.04, 1.4]} />
        <meshBasicMaterial color="#efb462" />
      </mesh>
      <pointLight
        position={[0, 2, -8]}
        color="#ffcf8a"
        intensity={5}
        distance={5}
      />
      <mesh position={[0, 2, -8.98]}>
        <boxGeometry args={[1.8, 0.2, 0.02]} />
        <meshBasicMaterial color="#efb462" />
      </mesh>
    </group>
  )
}
