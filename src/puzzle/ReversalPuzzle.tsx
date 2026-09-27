import { useEffect, useRef, useState, type RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import type { Mesh } from 'three'
import {
  REVERSAL_DOORS,
  REVERSAL_EXIT,
  REVERSAL_PLATES,
} from '../levels/reversalLayout'
import { ReversalController } from './ReversalController'
import type { PuzzleRuntime } from './PuzzleRuntime'
import { PressurePlateVisual } from './PressurePlateVisual'
import { DoorVisual } from './DoorVisual'
import { PuzzleSignal } from './PuzzleSignal'

function ChargeIndicator({
  runtimeRef,
  position,
}: {
  runtimeRef: RefObject<PuzzleRuntime | null>
  position: [number, number, number]
}) {
  const bar = useRef<Mesh>(null)
  useFrame(() => {
    const charge = runtimeRef.current?.charge ?? 0
    if (bar.current) {
      bar.current.scale.x = Math.max(0.001, charge)
      bar.current.position.x = (charge - 1) * 0.7
    }
  })
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[1.5, 0.12, 0.06]} />
        <meshBasicMaterial color="#1c292e" />
      </mesh>
      <mesh ref={bar} position={[-0.7, 0, 0.04]} scale={[0.001, 1, 1]}>
        <boxGeometry args={[1.4, 0.06, 0.02]} />
        <meshBasicMaterial color="#d2faf3" />
      </mesh>
    </group>
  )
}

function Conduit({
  from,
  to,
  active,
}: {
  from: [number, number]
  to: [number, number]
  active: boolean
}) {
  const dx = to[0] - from[0],
    dz = to[1] - from[1]
  return (
    <mesh
      position={[(from[0] + to[0]) / 2, 0.013, (from[1] + to[1]) / 2]}
      rotation={[0, Math.atan2(dx, dz), 0]}
    >
      <boxGeometry args={[0.045, 0.018, Math.hypot(dx, dz)]} />
      <meshBasicMaterial color={active ? '#b4d9dc' : '#647d85'} />
    </mesh>
  )
}

export function ReversalPuzzle({
  runtimeRef,
}: {
  runtimeRef: RefObject<PuzzleRuntime | null>
}) {
  const { world, rapier } = useRapier()
  const [signals, setSignals] = useState(0)
  const previous = useRef(0)
  useEffect(() => {
    const puzzle = new ReversalController(world, rapier)
    runtimeRef.current = puzzle
    return () => {
      runtimeRef.current = null
      puzzle.dispose(world)
    }
  }, [world, rapier, runtimeRef])
  useFrame(() => {
    const puzzle = runtimeRef.current
    if (!puzzle) return
    const bits =
      puzzle.plates!.reduce(
        (mask, plate, index) =>
          mask |
          (Number(plate.player) << (index * 2)) |
          (Number(plate.echo) << (index * 2 + 1)),
        0,
      ) |
      puzzle.doors!.reduce(
        (mask, door, index) => mask | (Number(door.open) << (8 + index)),
        0,
      )
    if (bits !== previous.current) {
      previous.current = bits
      setSignals(bits)
    }
  })
  const occupied = (index: number) => !!(signals & (3 << (index * 2)))
  return (
    <group>
      {REVERSAL_PLATES.map((position, index) => (
        <PressurePlateVisual
          key={index}
          position={position}
          index={index}
          player={!!(signals & (1 << (index * 2)))}
          echo={!!(signals & (2 << (index * 2)))}
        />
      ))}
      {REVERSAL_DOORS.map((door, index) => (
        <group key={door.id}>
          <DoorVisual
            runtimeRef={runtimeRef}
            doorId={door.id}
            position={door}
            open={!!(signals & (1 << (8 + index)))}
          />
          {(index === 2 ? [2, 3] : [index]).map((plate, offset) => (
            <group
              key={plate}
              position={[-1.8, 2.25 - offset * 0.6, door.z + 0.18]}
            >
              <PuzzleSignal index={plate} active={occupied(plate)} />
            </group>
          ))}
        </group>
      ))}
      {/* Remote status at both ends makes the link discoverable without a solution label. */}
      {[11, -6].map((z) => (
        <group key={z} position={[4, 0, z - 1.5]}>
          {[2, 3].map((index) => (
            <group key={index} position={[(index - 2.5) * 0.75, 1.3, 0.11]}>
              <PuzzleSignal index={index} active={occupied(index)} />
            </group>
          ))}
          <ChargeIndicator runtimeRef={runtimeRef} position={[0, 0.65, 0.12]} />
        </group>
      ))}
      <ChargeIndicator runtimeRef={runtimeRef} position={[2.4, 1.3, -9.8]} />
      {[
        { plate: 0, end: 6.5 },
        { plate: 1, end: -1.5 },
      ].map(({ plate, end }) => (
        <group key={plate}>
          <Conduit
            from={[-4, REVERSAL_PLATES[plate].z]}
            to={[-4, end]}
            active={occupied(plate)}
          />
          <Conduit from={[-4, end]} to={[-1.4, end]} active={occupied(plate)} />
        </group>
      ))}
      {[2, 3].map((plate) => (
        <Conduit
          key={plate}
          from={[4, REVERSAL_PLATES[plate].z]}
          to={[5.5, REVERSAL_PLATES[plate].z]}
          active={occupied(plate)}
        />
      ))}
      <Conduit
        from={[5.5, 11]}
        to={[5.5, -9.5]}
        active={!!(signals & (1 << 10))}
      />
      <Conduit
        from={[5.5, -9.5]}
        to={[1.4, -9.5]}
        active={!!(signals & (1 << 10))}
      />
      <mesh position={[REVERSAL_EXIT.x, 0.025, REVERSAL_EXIT.z]}>
        <boxGeometry args={[2, 0.05, 1.4]} />
        <meshBasicMaterial color="#efb462" />
      </mesh>
      <mesh position={[0, 2, -16.98]}>
        <boxGeometry args={[1.8, 0.2, 0.02]} />
        <meshBasicMaterial color="#efb462" />
      </mesh>
    </group>
  )
}
