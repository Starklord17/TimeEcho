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
                index === 0 ? '#474b4e' : index === 3 ? '#777a7d' : '#565b60'
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
        <meshBasicMaterial color="#dadde0" />
      </mesh>
      <mesh position={[0, 1.8, -6.99]}>
        <boxGeometry args={[0.045, 2.8, 0.015]} />
        <meshBasicMaterial color="#e2e5e8" />
      </mesh>
      <mesh position={[0, 3.1, -6.98]}>
        <boxGeometry args={[10, 0.055, 0.02]} />
        <meshBasicMaterial color="#e2e5e8" />
      </mesh>
    </group>
  )
}
