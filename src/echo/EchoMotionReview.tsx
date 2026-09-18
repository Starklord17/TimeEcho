// Development-only side-by-side inspection using the production asset/animator.
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Object3D } from 'three'
import { EchoVisual } from './EchoVisual'
import type { EchoAnimator } from './EchoAnimator'
import { Recorder } from '../recording/Recorder'

export function EchoMotionReview({
  moving,
  running,
  time,
  yaw,
  pitch,
  side,
  speed,
}: {
  moving: boolean
  running: boolean
  time: number
  yaw: number
  pitch: number
  side: number
  speed: number
}) {
  const body = useRef<Object3D>(null)
  const head = useRef<Object3D>(null)
  const animator = useRef<EchoAnimator>(null)
  const elapsed = useRef(time)
  const previous = useRef(time)
  const [run] = useState(() => {
    const r = new Recorder()
    r.begin(1, { x: 0, y: 0.91, z: 0 }, { x: 0, y: 0, z: 0, w: 1 })
    r.capture(
      15,
      { x: 0, y: 0.91, z: moving ? -15 * speed : 0 },
      { x: 0, y: 0, z: 0, w: 1 },
    )
    return r.finish('timeout')
  })
  useFrame((_, delta) => {
    if (previous.current !== time) {
      elapsed.current = time
      previous.current = time
    } else if (running) elapsed.current = (elapsed.current + delta) % 15
    animator.current?.sample(run, elapsed.current)
    if (body.current) body.current.rotation.y = yaw
    if (head.current) head.current.rotation.set(pitch, yaw, 0, 'YXZ')
  })
  return (
    <group position={[side * 0.6, 0.91, 0]}>
      <EchoVisual bodyRef={body} headRef={head} animatorRef={animator} />
      <Html position={[0, 1, 0]} center>
        <span
          style={{
            color: '#fff',
            background: '#171d22',
            padding: '4px 12px',
            whiteSpace: 'nowrap',
          }}
        >
          {moving ? `Walk · ${speed} m/s` : 'Idle'}
        </span>
      </Html>
    </group>
  )
}
