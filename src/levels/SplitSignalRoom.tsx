import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { SPLIT_BOXES } from './splitSignalLayout'
import { useEnvironmentReady } from './environmentContext'

export function SplitSignalRoom() {
  const environment = useEnvironmentReady()
  return (
    <group visible={!environment}>
      {SPLIT_BOXES.map(({ position, size }, index) => (
        <RigidBody
          key={index}
          type="fixed"
          colliders={false}
          position={[...position]}
        >
          <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
          <mesh>
            <boxGeometry args={[...size]} />
            <meshStandardMaterial
              color={index === 0 ? '#353e43' : '#657076'}
              roughness={0.95}
            />
          </mesh>
        </RigidBody>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 7]}>
        <planeGeometry args={[0.8, 0.8]} />
        <meshBasicMaterial color="#dadde0" />
      </mesh>
    </group>
  )
}
