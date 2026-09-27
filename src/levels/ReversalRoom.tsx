import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { REVERSAL_BOXES } from './reversalLayout'
import { useEnvironmentReady } from './environmentContext'

export function ReversalRoom() {
  const environmentReady = useEnvironmentReady()
  return (
    <group>
      {REVERSAL_BOXES.map(({ position, size, window }, index) => (
        <RigidBody
          key={index}
          type="fixed"
          colliders={false}
          position={position}
        >
          <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
          {!environmentReady &&
            (window ? (
              <>
                {/* The viewing aperture is visual only: the collider remains solid. */}
                {(
                  [
                    [0, -1.1, 4.8, 1.4],
                    [0, 1.2, 4.8, 1.2],
                    [-1.8, 0.1, 1.2, 1],
                    [1.8, 0.1, 1.2, 1],
                  ] as const
                ).map(([x, y, width, height], part) => (
                  <mesh key={part} position={[x, y, 0]}>
                    <boxGeometry args={[width, height, 0.3]} />
                    <meshStandardMaterial color="#536269" roughness={0.9} />
                  </mesh>
                ))}
                <mesh position={[0, 0.1, 0]}>
                  <boxGeometry args={[2.4, 1, 0.06]} />
                  <meshStandardMaterial
                    color="#9caeb3"
                    transparent
                    opacity={0.13}
                    depthWrite={false}
                    roughness={0.2}
                  />
                </mesh>
                {[-0.8, 0, 0.8].map((x) => (
                  <mesh key={x} position={[x, 0.1, 0]}>
                    <boxGeometry args={[0.035, 1, 0.08]} />
                    <meshStandardMaterial color="#27343a" />
                  </mesh>
                ))}
              </>
            ) : (
              <mesh>
                <boxGeometry args={size} />
                <meshStandardMaterial
                  color={index === 0 ? '#303c42' : '#536269'}
                  roughness={0.95}
                />
              </mesh>
            ))}
        </RigidBody>
      ))}
      {!environmentReady && (
        <group>
          {[11, 2, -6, -14].map((z) => (
            <group key={z}>
              <pointLight
                position={[0, 3.2, z]}
                intensity={12}
                distance={12}
                color="#d3e3e8"
              />
              <mesh position={[0, 3.5, z]}>
                <boxGeometry args={[3, 0.06, 0.16]} />
                <meshBasicMaterial color="#d3e3e8" />
              </mesh>
            </group>
          ))}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 13]}>
            <ringGeometry args={[0.32, 0.36, 32]} />
            <meshBasicMaterial color="#abbcc2" />
          </mesh>
        </group>
      )}
    </group>
  )
}
