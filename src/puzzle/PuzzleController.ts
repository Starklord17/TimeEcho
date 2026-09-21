import { DoorMotion } from './DoorMotion'
import type { RapierContext, RapierCollider } from '@react-three/rapier'
import { PHYSICS_STEP, PLAYER } from '../player/PlayerController'

export const PLATE = { x: -4, y: 0.15, z: 2 }
export const DOOR = { x: 0, y: 1.8, z: -3 }
export const DOOR_TRAVEL = 3.8
export const DOOR_DURATION = 0.4
export const EXIT = { x: 0, y: 0.6, z: -5.8 }
export const DIVIDER_BOXES = [
  { position: [-3.6, 1.8, -3] as const, size: [4.8, 3.6, 0.3] as const },
  { position: [3.6, 1.8, -3] as const, size: [4.8, 3.6, 0.3] as const },
]
type Position = { x: number; y: number; z: number }

/** Authoritative sensor queries; the visual echo never drives game rules. */
export class PuzzleController {
  private colliders: RapierCollider[] = []
  private plate: RapierCollider
  private door: RapierCollider
  private doorway: RapierCollider
  private exit: RapierCollider
  private capsule: InstanceType<RapierContext['rapier']['Capsule']>
  private upright = { x: 0, y: 0, z: 0, w: 1 }
  platePlayer = false
  plateEcho = false
  doorOpen = false
  private motion = new DoorMotion(DOOR_TRAVEL, DOOR_DURATION)
  get doorLift() {
    return this.motion.value
  }

  constructor(world: RapierContext['world'], rapier: RapierContext['rapier']) {
    const box = (
      size: readonly number[],
      position: Position,
      sensor = false,
    ) => {
      const collider = world.createCollider(
        rapier.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2)
          .setTranslation(position.x, position.y, position.z)
          .setSensor(sensor),
      )
      this.colliders.push(collider)
      return collider
    }
    for (const wall of DIVIDER_BOXES)
      box(wall.size, {
        x: wall.position[0],
        y: wall.position[1],
        z: wall.position[2],
      })
    this.plate = box([1.8, 0.3, 1.8], PLATE, true)
    this.door = box([2.4, 3.6, 0.3], DOOR)
    this.doorway = box([2.4, 3.6, 0.9], DOOR, true)
    this.exit = box([2, 1.2, 1.4], EXIT, true)
    this.capsule = new rapier.Capsule(PLAYER.halfHeight, PLAYER.radius)
  }

  update(player: Position, echoes: readonly Position[], step = PHYSICS_STEP) {
    this.platePlayer = this.plate.intersectsShape(
      this.capsule,
      player,
      this.upright,
    )
    this.plateEcho = echoes.some((position) =>
      this.plate.intersectsShape(this.capsule, position, this.upright),
    )
    // Never close through a player who is already crossing the doorway.
    const crossing =
      (this.doorOpen || this.doorLift > 0) &&
      this.doorway.intersectsShape(this.capsule, player, this.upright)
    this.doorOpen = this.platePlayer || this.plateEcho || crossing
    this.motion.step(this.doorOpen, step)
    this.door.setTranslation({
      x: DOOR.x,
      y: DOOR.y + this.doorLift,
      z: DOOR.z,
    })
    this.door.setEnabled(this.doorLift < DOOR_TRAVEL)
  }

  reset() {
    this.doorOpen = false
    this.motion.reset()
    this.platePlayer = false
    this.plateEcho = false
    this.door.setTranslation(DOOR)
    this.door.setEnabled(true)
  }

  reachedExit(player: Position) {
    return this.exit.intersectsShape(this.capsule, player, this.upright)
  }

  dispose(world: RapierContext['world']) {
    for (const collider of this.colliders) world.removeCollider(collider, false)
  }
}
