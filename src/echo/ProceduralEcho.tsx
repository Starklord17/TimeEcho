import type { RefObject } from 'react'
import type { Object3D } from 'three'
export type EchoVisualRefs = {
  bodyRef: RefObject<Object3D | null>
  headRef: RefObject<Object3D | null>
}
export function ProceduralEcho({ bodyRef, headRef }: EchoVisualRefs) {
  return (
    <>
      <group ref={bodyRef}>
        <mesh position={[0, -0.16, 0]}>
          <capsuleGeometry args={[0.27, 0.88, 4, 12]} />
          <meshStandardMaterial
            color="#84e9ed"
            emissive="#226d79"
            emissiveIntensity={0.85}
            transparent
            opacity={0.46}
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
            opacity={0.5}
            depthWrite={false}
          />
        </mesh>
        <mesh position={[0, 0, -0.25]}>
          <boxGeometry args={[0.25, 0.055, 0.16]} />
          <meshBasicMaterial
            color="#d6ffff"
            transparent
            opacity={0.8}
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
  )
}
