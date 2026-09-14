import { EchoVisual } from './EchoVisual'
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Euler, Group, Object3D, Quaternion, Vector3 } from 'three'
import { useGameStore } from '../state/gameStore'
import type { TimeLoop } from '../time-loop/TimeLoop'
import { PlaybackClock } from './PlaybackClock'
import { ReplaySampler } from './ReplaySampler'

export function Echo({ loop }: { loop: TimeLoop }) {
  const run = useGameStore((state) => state.lastRun)
  const root = useRef<Group>(null)
  const torso = useRef<Object3D>(null)
  const head = useRef<Object3D>(null)
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
      (state.locked || state.fallback) && state.cyclePhase === 'PLAYING',
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
      <EchoVisual bodyRef={torso} headRef={head} />
    </group>
  )
}
