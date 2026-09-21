import { EchoVisual } from './EchoVisual'
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Euler, Group, Object3D, Quaternion, Vector3 } from 'three'
import { useGameStore } from '../state/gameStore'
import type { TimeLoop } from '../time-loop/TimeLoop'
import { PlaybackClock } from './PlaybackClock'
import { ReplaySampler } from './ReplaySampler'
import type { RecordedRun } from '../recording/Recorder'
import type { RefObject } from 'react'
import type { EchoAnimator } from './EchoAnimator'

export function Echo({ loop }: { loop: TimeLoop }) {
  const runs = useGameStore((state) => state.runs)
  const [clock] = useState(() => new PlaybackClock())
  const time = useRef(0)
  useFrame((_state, delta) => {
    const state = useGameStore.getState()
    time.current = clock.update(
      loop.cycle,
      loop.elapsedSeconds,
      delta,
      (state.locked || state.fallback) &&
        !state.completed &&
        state.cyclePhase === 'PLAYING',
    )
  }, -1)
  return runs.map((run, index) => (
    <EchoActor
      key={run.cycle}
      run={run}
      time={time}
      intensity={runs.length === 2 && index === 0 ? 0.55 : 1}
    />
  ))
}

function EchoActor({
  run,
  time,
  intensity,
}: {
  run: RecordedRun
  time: RefObject<number>
  intensity: number
}) {
  const root = useRef<Group>(null)
  const torso = useRef<Object3D>(null)
  const head = useRef<Object3D>(null)
  const animator = useRef<EchoAnimator>(null)
  const [sampler] = useState(() => new ReplaySampler())
  const position = useRef(new Vector3())
  const rotation = useRef(new Quaternion())
  const angles = useRef(new Euler(0, 0, 0, 'YXZ'))

  useFrame(() => {
    if (!root.current || !torso.current || !head.current) return
    root.current.visible =
      !!run &&
      sampler.sample(run, time.current, position.current, rotation.current)
    if (!root.current.visible) return
    animator.current?.sample(run, time.current)
    root.current.position.copy(position.current)
    angles.current.setFromQuaternion(rotation.current, 'YXZ')
    torso.current.rotation.set(0, angles.current.y, 0)
    head.current.quaternion.copy(rotation.current)
  })

  // Visual only: deliberately no rigid body, collider or physics interaction.
  return (
    <group ref={root} visible={false}>
      <EchoVisual
        intensity={intensity}
        bodyRef={torso}
        headRef={head}
        animatorRef={animator}
      />
    </group>
  )
}
