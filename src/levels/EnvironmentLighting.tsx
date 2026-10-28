import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type { PointLight } from 'three'
import layout from '../../assets/blender/environment-layout.json'
import type { LevelId } from './levelMetadata'
import type { TimeLoop } from '../time-loop/TimeLoop'

export function EnvironmentLighting({
  levelId,
  loop,
}: {
  levelId: LevelId
  loop: TimeLoop
}) {
  const lights = useRef<(PointLight | null)[]>([])
  const fixtures = layout.levels.find((level) => level.id === levelId)!.fixtures
  useFrame(() => {
    // Simulation time freezes on pause and resets with the cycle, unlike wall time.
    const pulse = 1 + 0.025 * Math.sin((loop.elapsedSeconds * Math.PI) / 3)
    lights.current.forEach((light, index) => {
      if (light) light.intensity = fixtures[index].watts * 0.075 * pulse
    })
  })
  return (
    <>
      <hemisphereLight
        args={['#c5d8e2', '#263239', levelId === 'relay' ? 2.4 : 1.25]}
      />
      {fixtures.map((fixture, index) => (
        <pointLight
          key={fixture.id}
          ref={(light) => {
            lights.current[index] = light
          }}
          position={[fixture.position[0], 3.35, fixture.position[2]]}
          intensity={fixture.watts * 0.075}
          distance={10}
          decay={2}
          color="#d5e8ef"
        />
      ))}
    </>
  )
}
