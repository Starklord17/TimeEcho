import { RigidBody } from '@react-three/rapier'
import { ROOM_BOXES, SPAWN } from './room'

export function EmptyRoom() {
  return (
    <group>
      {ROOM_BOXES.map(({ position, size }, index) => (
        <RigidBody
          key={index}
          type="fixed"
          colliders="cuboid"
          position={position}
        >
          <mesh>
            <boxGeometry args={size} />
            <meshStandardMaterial
              color={
                index === 0 ? '#526361' : index === 3 ? '#89948d' : '#687c7c'
              }
              roughness={0.95}
            />
          </mesh>
        </RigidBody>
      ))}
      <gridHelper
        args={[12, 12, '#859892', '#687b75']}
        position={[0, 0.003, 0]}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[SPAWN[0], 0.006, SPAWN[2]]}
      >
        <planeGeometry args={[0.8, 0.8]} />
        <meshBasicMaterial color="#bce8cc" />
      </mesh>
      <mesh position={[0, 1.8, -6.99]}>
        <boxGeometry args={[0.045, 2.8, 0.015]} />
        <meshBasicMaterial color="#c4ecce" />
      </mesh>
      <mesh position={[0, 3.1, -6.98]}>
        <boxGeometry args={[10, 0.055, 0.02]} />
        <meshBasicMaterial color="#c4ecce" />
      </mesh>
    </group>
  )
}
