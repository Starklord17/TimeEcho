import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Euler, Group, Quaternion, Vector3 } from 'three'
import { useGameStore } from '../state/gameStore'
import type { TimeLoop } from '../time-loop/TimeLoop'
import { PlaybackClock } from './PlaybackClock'
import { ReplaySampler } from './ReplaySampler'

export function Echo({ loop }: { loop: TimeLoop }) {
  const run = useGameStore((state) => state.lastRun)
  const root = useRef<Group>(null)
  const torso = useRef<Group>(null)
  const head = useRef<Group>(null)
  const [sampler] = useState(() => new ReplaySampler())
  const [clock] = useState(() => new PlaybackClock())
  const position = useRef(new Vector3())
  const rotation = useRef(new Quaternion())
  const angles = useRef(new Euler(0, 0, 0, 'YXZ'))

  useFrame((_state, delta) => {
    if (!root.current || !torso.current || !head.current) return
    const state = useGameStore.getState()
    const time = clock.update(
      loop.cycle,
      loop.elapsedSeconds,
      delta,
      state.locked || state.fallback,
    )
    root.current.visible =
      !!run && sampler.sample(run, time, position.current, rotation.current)
    if (!root.current.visible) return
    root.current.position.copy(position.current)
    angles.current.setFromQuaternion(rotation.current, 'YXZ')
    torso.current.rotation.set(0, angles.current.y, 0)
    head.current.quaternion.copy(rotation.current)
  })

  // Visual only: deliberately no rigid body, collider or physics interaction.
  return (
    <group ref={root} visible={false}>
      <group ref={torso}>
        <mesh position={[0, -0.16, 0]}>
          <capsuleGeometry args={[0.27, 0.88, 4, 12]} />
          <meshStandardMaterial
            color="#84e9ed"
            emissive="#226d79"
            emissiveIntensity={0.6}
            transparent
            opacity={0.35}
            depthWrite={false}
          />
        </mesh>
      </group>
      <group ref={head} position={[0, 0.57, 0]}>
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
    </group>
  )
}
