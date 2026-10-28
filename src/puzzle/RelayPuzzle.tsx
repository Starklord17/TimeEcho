import { useEffect, useRef, useState, type RefObject } from 'react'
import type { Mesh } from 'three'
import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import { RelayController } from './RelayController'
import type { PuzzleRuntime } from './PuzzleRuntime'
import { RELAY_PLATES, RELAY_DOOR } from '../levels/relayLayout'
import { PressurePlateVisual } from './PressurePlateVisual'
import { DoorVisual } from './DoorVisual'

const CHARGE_LINE_LENGTH = 5.84

function RelayChargeLines({
  controller,
}: {
  controller: RefObject<RelayController | null>
}) {
  const fills = useRef<(Mesh | null)[]>([])
  useFrame(() => {
    const puzzle = controller.current
    fills.current.forEach((mesh, index) => {
      if (!mesh) return
      const phaseA = index < 2
      const progress = !puzzle
        ? 0
        : phaseA
          ? puzzle.phase === 'PHASE_A'
            ? puzzle.charge
            : 1
          : puzzle.phase === 'PHASE_A'
            ? 0
            : puzzle.charge
      mesh.visible = progress > 0
      mesh.scale.z = progress
      // Start at the exit-facing end so charging is visible from the plates.
      mesh.position.z = -((1 - progress) * CHARGE_LINE_LENGTH) / 2
    })
  })
  return (
    <group>
      {[6, -6].flatMap((z, phase) =>
        [-1, 1].map((side, wall) => (
          <group key={`${phase}-${side}`} position={[side * 9.78, 1.15, z]}>
            <mesh>
              <boxGeometry args={[0.025, 0.22, 5.9]} />
              <meshBasicMaterial color="#17282d" />
            </mesh>
            <mesh
              ref={(mesh) => {
                fills.current[phase * 2 + wall] = mesh
              }}
              position={[-side * 0.025, 0, -CHARGE_LINE_LENGTH / 2]}
              scale={[1, 1, 0]}
              visible={false}
            >
              <boxGeometry args={[0.02, 0.14, CHARGE_LINE_LENGTH]} />
              <meshBasicMaterial
                color={phase === 0 ? '#90efff' : '#ffcf83'}
                toneMapped={false}
              />
            </mesh>
          </group>
        )),
      )}
    </group>
  )
}

export function RelayPuzzle({
  runtimeRef,
}: {
  runtimeRef: RefObject<PuzzleRuntime | null>
}) {
  const { world, rapier } = useRapier()
  const controller = useRef<RelayController | null>(null)
  const [display, setDisplay] = useState({
    bits: 0,
    phase: 'PHASE_A',
    percent: 0,
  })
  const previous = useRef('')
  useEffect(() => {
    const puzzle = new RelayController(world, rapier)
    controller.current = puzzle
    runtimeRef.current = puzzle
    return () => {
      controller.current = null
      runtimeRef.current = null
      puzzle.dispose(world)
    }
  }, [world, rapier, runtimeRef])
  useFrame(() => {
    const p = controller.current
    if (!p) return
    const bits = p.plates.reduce(
      (mask, plate, i) =>
        mask |
        (Number(plate.player) << (i * 2)) |
        (Number(plate.echo) << (i * 2 + 1)),
      0,
    )
    const percent = Math.floor(p.charge * 100)
    const key = `${bits}:${p.phase}:${percent}`
    if (key !== previous.current) {
      previous.current = key
      setDisplay({ bits, phase: p.phase, percent })
    }
  })
  return (
    <group>
      <RelayChargeLines controller={controller} />
      {RELAY_PLATES.map((position, i) => (
        <group key={i}>
          <PressurePlateVisual
            position={position}
            index={i % 4}
            player={!!(display.bits & (1 << (i * 2)))}
            echo={!!(display.bits & (2 << (i * 2)))}
          />
          <Html
            zIndexRange={[1, 0]}
            position={[position.x, 0.5, position.z]}
            center
            distanceFactor={12}
            style={{ pointerEvents: 'none' }}
          >
            <span className="relay-label">
              {i < 4 ? 'A' : 'B'}
              {(i % 4) + 1}
            </span>
          </Html>
        </group>
      ))}
      {[6, -6].map((z, i) => (
        <Html
          zIndexRange={[1, 0]}
          key={z}
          position={[0, 2.8, z - 2]}
          center
          distanceFactor={15}
          style={{ pointerEvents: 'none' }}
        >
          <div className="relay-sign">
            <strong>RELAY {i === 0 ? 'A' : 'B'}</strong>
            <br />
            {i === 0
              ? display.phase !== 'PHASE_A'
                ? 'COMPLETE'
                : `4 ACTORS · HOLD 2s · ${display.percent}%`
              : display.phase === 'PHASE_A'
                ? 'COMPLETE A FIRST'
                : display.phase === 'EXIT_OPEN'
                  ? 'COMPLETE · EXIT OPEN'
                  : `4 ACTORS · HOLD 3s · ${display.percent}%`}
          </div>
        </Html>
      ))}
      <DoorVisual
        runtimeRef={runtimeRef}
        open={display.phase === 'EXIT_OPEN'}
        position={RELAY_DOOR}
      />
    </group>
  )
}
