import { Recorder } from '../recording/Recorder'
import type { TimeLoop } from '../time-loop/TimeLoop'
import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { MouseLook } from '../input/MouseLook'
import {
  CapsuleCollider,
  RigidBody,
  useBeforePhysicsStep,
  useAfterPhysicsStep,
  useRapier,
  type RapierRigidBody,
  type RapierCollider,
} from '@react-three/rapier'
import { Euler, Object3D, Vector3 } from 'three'
import { InputManager } from '../input/InputManager'
import { SPAWN } from '../levels/room'
import { useGameStore } from '../state/gameStore'
import { PHYSICS_STEP, PLAYER, PlayerController } from './PlayerController'

export function Player({ loop }: { loop: TimeLoop }) {
  const [recorder] = useState(() => new Recorder())
  const sampledStep = useRef(false)
  const recordingStarted = useRef(false)
  const teleported = useRef(false)
  const body = useRef<RapierRigidBody>(null)
  const collider = useRef<RapierCollider>(null)
  const visual = useRef<Object3D>(null)
  const controller = useRef<PlayerController | null>(null)
  const [input] = useState(() => new InputManager())
  const rotation = useRef(new Euler(0, 0, 0, 'YXZ'))
  const position = useRef(new Vector3())
  const { world } = useRapier()
  const { camera, gl } = useThree()

  useEffect(() => {
    const movement = new PlayerController(world)
    controller.current = movement
    const disconnect = input.connect()
    const button = document.getElementById('enter-game')!
    const mouse = new MouseLook(gl.domElement, camera)
    const disconnectMouse = mouse.connect(button)
    useGameStore.getState().publishCycle(loop.cycle, loop.remainingSeconds)
    useGameStore.getState().setReady(true)
    return () => {
      disconnect()
      disconnectMouse()
      movement.dispose(world)
      controller.current = null
      useGameStore.getState().setReady(false)
      useGameStore.getState().setLocked(false)
    }
  }, [world, input, gl, camera, loop])

  const resetPlayer = () => {
    if (!body.current || !controller.current) return
    controller.current.reset(body.current)
    camera.quaternion.identity()
    input.clear()
    teleported.current = true
    recorder.begin(loop.cycle, body.current.translation(), camera.quaternion)
    recordingStarted.current = true
  }

  useBeforePhysicsStep(() => {
    sampledStep.current = false
    if (!body.current || !collider.current || !controller.current) return
    const active =
      document.pointerLockElement === gl.domElement ||
      useGameStore.getState().fallback
    if (!active) return
    if (!recordingStarted.current) {
      recorder.begin(loop.cycle, body.current.translation(), camera.quaternion)
      recordingStarted.current = true
    }
    teleported.current = false
    if (useGameStore.getState().restartRequested) {
      useGameStore.getState().saveRun(recorder.finish('restart'))
      loop.restart()
      resetPlayer()
      useGameStore.getState().publishCycle(loop.cycle, loop.remainingSeconds)
      return
    }
    rotation.current.setFromQuaternion(camera.quaternion, 'YXZ')
    // 90 degrees/second, synchronized with physics and recording (not key repeat).
    rotation.current.y -= input.lookRight * (Math.PI / 2) * PHYSICS_STEP
    rotation.current.x = Math.max(
      -Math.PI / 2 + 0.01,
      Math.min(
        Math.PI / 2 - 0.01,
        rotation.current.x + input.lookUp * (Math.PI / 2) * PHYSICS_STEP,
      ),
    )
    camera.quaternion.setFromEuler(rotation.current)
    controller.current.step(
      body.current,
      collider.current,
      input.right,
      input.forward,
      rotation.current.y,
    )
    sampledStep.current = true
  })

  useAfterPhysicsStep(() => {
    if (!sampledStep.current || !body.current) return
    // Record the resolved final transform BEFORE resetting the world.
    recorder.capture(
      loop.nextSampleTime,
      body.current.translation(),
      camera.quaternion,
    )
    if (loop.advance()) {
      useGameStore.getState().saveRun(recorder.finish('timeout'))
      resetPlayer()
    }
    useGameStore.getState().publishCycle(loop.cycle, loop.remainingSeconds)
  })

  // Follow the interpolated Three object, not raw fixed-step physics coordinates.
  useFrame(({ camera: renderCamera }) => {
    if (!visual.current) return
    if (teleported.current) position.current.set(...SPAWN)
    else visual.current.getWorldPosition(position.current)
    position.current.y += PLAYER.eyeOffset
    renderCamera.position.copy(position.current)
  })

  return (
    <>
      <RigidBody
        ref={body}
        type="kinematicPosition"
        colliders={false}
        position={SPAWN}
        enabledRotations={[false, false, false]}
      >
        <CapsuleCollider
          ref={collider}
          args={[PLAYER.halfHeight, PLAYER.radius]}
        />
        <object3D ref={visual} />
      </RigidBody>
    </>
  )
}
