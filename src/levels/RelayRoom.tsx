import { CuboidCollider, RigidBody } from '@react-three/rapier'
import { RELAY_BOXES } from './relayLayout'
import { useEnvironmentReady } from './environmentContext'
export function RelayRoom() {
  const ready = useEnvironmentReady()
  return (
    <group>
      {RELAY_BOXES.map(({ position, size }, i) => (
        <RigidBody key={i} type="fixed" colliders={false} position={position}>
          <CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} />
          {!ready && (
            <mesh>
              <boxGeometry args={size} />
              <meshStandardMaterial color={i === 0 ? '#303c42' : '#536269'} />
            </mesh>
          )}
        </RigidBody>
      ))}
    </group>
  )
}
