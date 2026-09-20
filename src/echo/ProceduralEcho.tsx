import type { RefObject } from 'react'
import type { Object3D } from 'three'
import type { EchoAnimator } from './EchoAnimator'
export type EchoVisualRefs = {
  intensity?: number
  bodyRef: RefObject<Object3D | null>
  headRef: RefObject<Object3D | null>
  animatorRef?: RefObject<EchoAnimator | null>
}
export function ProceduralEcho({
  bodyRef,
  headRef,
  intensity = 1,
}: EchoVisualRefs) {
  return (
    <>
      <group ref={bodyRef}>
        <mesh position={[0, -0.16, 0]}>
          <capsuleGeometry args={[0.27, 0.88, 4, 12]} />
          <meshStandardMaterial
            color="#84e9ed"
            emissive="#226d79"
            emissiveIntensity={0.85 * intensity}
            transparent
            opacity={0.46 * intensity}
            depthWrite={false}
          />
        </mesh>
      </group>
      <group ref={headRef} position={[0, 0.57, 0]}>
        <mesh>
          <sphereGeometry args={[0.21, 12, 8]} />
          <meshStandardMaterial
            color="#b6ffff"
            transparent
            opacity={0.5 * intensity}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 0, -0.25]}>
          <boxGeometry args={[0.25, 0.055, 0.16]} />
          <meshBasicMaterial
            color="#d6ffff"
            transparent
            opacity={0.8 * intensity}
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
  )
}
