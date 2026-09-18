import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, MathUtils, MeshStandardMaterial } from 'three'
import { PLATE } from './PuzzleController'
import { useGameStore } from '../state/gameStore'

export function PressurePlateVisual({
  player,
  echo,
  position = PLATE,
}: {
  position?: { x: number; z: number }
  player: boolean
  echo: boolean
}) {
  const panel = useRef<Group>(null)
  const material = useRef<MeshStandardMaterial>(null)
  const progress = useRef(0)
  const sessionCycle = useRef(0)
  useFrame((_state, delta) => {
    const state = useGameStore.getState()
    if (state.cycle !== sessionCycle.current) {
      sessionCycle.current = state.cycle
      progress.current = 0
    }
    if (
      (state.locked || state.fallback) &&
      state.cyclePhase === 'PLAYING' &&
      !state.completed
    ) {
      const target = player || echo ? 1 : 0
      progress.current = MathUtils.clamp(
        progress.current + ((target ? 1 : -1) * delta) / 0.12,
        0,
        1,
      )
    }
    const t = progress.current
    if (panel.current) panel.current.position.y = -0.02 * t * t * (3 - 2 * t)
    if (material.current) material.current.emissiveIntensity = 0.15 + t * 0.7
  })
  return (
    <group position={[position.x, 0, position.z]}>
      <mesh position={[0, 0.015, 0]}>
        <boxGeometry args={[1.8, 0.03, 1.8]} />
        <meshStandardMaterial color="#292e32" />
      </mesh>
      <group ref={panel}>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[1.65, 0.035, 1.65]} />
          <meshStandardMaterial
            ref={material}
            color="#8c7852"
            emissive={echo && !player ? '#4eacbe' : '#b57a28'}
            roughness={0.7}
          />
        </mesh>
        {[-0.7, 0.7].map((x, i) => (
          <mesh key={x} position={[x, 0.072, 0]}>
            <boxGeometry args={[0.07, 0.012, 1.45]} />
            <meshBasicMaterial
              color={
                (i === 0 ? player : echo)
                  ? i === 0
                    ? '#ffc574'
                    : '#87e6f2'
                  : '#625746'
              }
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}
