import { SPAWN } from '../levels/room'
import { TICKS_PER_SECOND } from '../time-loop/TimeLoop'
import type {
  RapierContext,
  RapierRigidBody,
  RapierCollider,
} from '@react-three/rapier'

export const PHYSICS_STEP = 1 / TICKS_PER_SECOND
export const PLAYER = {
  speed: 3.5,
  radius: 0.3,
  halfHeight: 0.6,
  eyeOffset: 0.75,
  gravity: 9.81,
} as const

// Imperative movement, independent of React and rendering. One unit = one meter.
export class PlayerController {
  private controller: ReturnType<
    RapierContext['world']['createCharacterController']
  >
  private excludeSensors: number
  private verticalSpeed = 0
  private desired = { x: 0, y: 0, z: 0 }
  private next = { x: 0, y: 0, z: 0 }

  constructor(privateWorld: RapierContext['world'], excludeSensors: number) {
    this.excludeSensors = excludeSensors
    this.controller = privateWorld.createCharacterController(0.01)
    this.controller.enableSnapToGround(0.2)
    this.controller.setApplyImpulsesToDynamicBodies(false)
  }

  step(
    body: RapierRigidBody,
    collider: RapierCollider,
    right: number,
    forward: number,
    yaw: number,
  ) {
    const length = Math.max(1, Math.hypot(right, forward))
    const distance = (PLAYER.speed * PHYSICS_STEP) / length
    const sin = Math.sin(yaw),
      cos = Math.cos(yaw)
    this.verticalSpeed = Math.max(
      this.verticalSpeed - PLAYER.gravity * PHYSICS_STEP,
      -20,
    )
    this.desired.x = (right * cos - forward * sin) * distance
    this.desired.y = this.verticalSpeed * PHYSICS_STEP
    this.desired.z = (-right * sin - forward * cos) * distance
    this.controller.computeColliderMovement(
      collider,
      this.desired,
      this.excludeSensors,
    )
    const movement = this.controller.computedMovement()
    const position = body.translation()
    this.next.x = position.x + movement.x
    this.next.y = position.y + movement.y
    this.next.z = position.z + movement.z
    body.setNextKinematicTranslation(this.next)
    if (this.controller.computedGrounded()) this.verticalSpeed = 0
  }

  reset(body: RapierRigidBody, spawn: readonly number[] = SPAWN) {
    this.verticalSpeed = 0
    this.next.x = spawn[0]
    this.next.y = spawn[1]
    this.next.z = spawn[2]
    body.setTranslation(this.next, true)
    body.setNextKinematicTranslation(this.next)
    body.setLinvel({ x: 0, y: 0, z: 0 }, true)
    body.setAngvel({ x: 0, y: 0, z: 0 }, true)
    body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true)
    body.setNextKinematicRotation({ x: 0, y: 0, z: 0, w: 1 })
  }

  dispose(world: RapierContext['world']) {
    world.removeCharacterController(this.controller)
  }
}
