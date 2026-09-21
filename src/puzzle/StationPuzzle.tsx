import { useEffect, useRef, useState, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import { Mesh } from 'three'
import type { RapierContext } from '@react-three/rapier'
import type { PuzzleRuntime } from './PuzzleRuntime'
import { DoorVisual } from './DoorVisual'
import { PressurePlateVisual } from './PressurePlateVisual'
import type { Position } from './PuzzleRuntime'

function Signal({ index, active }: { index: number; active: boolean }) {
  return (
    <mesh
      rotation={[0, 0, index === 0 ? Math.PI / 2 : 0]}
      scale={active ? 1.12 : 1}
    >
      <ringGeometry
        args={[0.16, 0.23, index === 0 ? 3 : index === 1 ? 32 : 4]}
      />
      <meshBasicMaterial color={active ? '#d9fbff' : '#727d83'} />
    </mesh>
  )
}

interface StationRuntime extends PuzzleRuntime {
  plates: { player: boolean; echo: boolean }[]
  readonly charge: number
}
export function StationPuzzle({
  runtimeRef,
  createController,
  plates,
  door,
  exit,
}: {
  runtimeRef: RefObject<PuzzleRuntime | null>
  createController: new (
    world: RapierContext['world'],
    rapier: RapierContext['rapier'],
  ) => StationRuntime
  plates: readonly Position[]
  door: Position
  exit: Position
}) {
  const { world, rapier } = useRapier()
  const controller = useRef<StationRuntime>(null)
  const chargeBar = useRef<Mesh>(null)
  const [signals, setSignals] = useState(0)
  const previous = useRef(0)
  useEffect(() => {
    const puzzle = new createController(world, rapier)
    controller.current = puzzle
    runtimeRef.current = puzzle
    return () => {
      controller.current = null
      runtimeRef.current = null
      puzzle.dispose(world)
    }
  }, [world, rapier, runtimeRef, createController])
  useFrame(() => {
    const puzzle = controller.current
    if (!puzzle) return
    const next = puzzle.plates.reduce(
      (bits, plate, index) =>
        bits |
        (Number(plate.player) << (index * 2)) |
        (Number(plate.echo) << (index * 2 + 1)),
      Number(puzzle.doorOpen) << (plates.length * 2),
    )
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
      {plates.map((position, index) => {
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
              position={[
                (index - (plates.length - 1) / 2) * 0.7,
                3.3,
                door.z + 0.17,
              ]}
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
        open={!!(signals & (1 << (plates.length * 2)))}
        position={door}
      />
      <group position={[0, 2.9, door.z + 0.18]}>
        <mesh>
          <boxGeometry args={[2.05, 0.12, 0.03]} />
          <meshBasicMaterial color="#222b30" />
        </mesh>
        <mesh ref={chargeBar} position={[-1, 0, 0.025]} scale={[0.001, 1, 1]}>
          <boxGeometry args={[2, 0.07, 0.02]} />
          <meshBasicMaterial color="#bcf5f1" />
        </mesh>
      </group>
      <mesh position={[exit.x, 0.02, exit.z]}>
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
