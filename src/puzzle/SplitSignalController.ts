import type { RapierContext, RapierCollider } from '@react-three/rapier'
import { PHYSICS_STEP, PLAYER } from '../player/PlayerController'
import {
  SPLIT_PLATES,
  SPLIT_DOOR,
  SPLIT_EXIT,
} from '../levels/splitSignalLayout'
import { DoorMotion } from './DoorMotion'
import { DOOR_DURATION, DOOR_TRAVEL } from './PuzzleController'
import type { Position, PuzzleRuntime } from './PuzzleRuntime'

export const CHARGE_TICKS = 120
export class SplitSignalController implements PuzzleRuntime {
  private colliders: RapierCollider[] = []
  private sensors: RapierCollider[]
  private door: RapierCollider
  private exit: RapierCollider
  private capsule: InstanceType<RapierContext['rapier']['Capsule']>
  private upright = { x: 0, y: 0, z: 0, w: 1 }
  private motion = new DoorMotion(DOOR_TRAVEL, DOOR_DURATION)
  private ticks = 0
  plates = [
    { player: false, echo: false },
    { player: false, echo: false },
  ]
  doorOpen = false
  get platePlayer() {
    return this.plates.some((p) => p.player)
  }
  get plateEcho() {
    return this.plates.some((p) => p.echo)
  }
  get charge() {
    return this.ticks / CHARGE_TICKS
  }
  get doorLift() {
    return this.motion.value
  }

  constructor(world: RapierContext['world'], rapier: RapierContext['rapier']) {
    const box = (size: readonly number[], p: Position, sensor = false) => {
      const collider = world.createCollider(
        rapier.ColliderDesc.cuboid(size[0] / 2, size[1] / 2, size[2] / 2)
          .setTranslation(p.x, p.y, p.z)
          .setSensor(sensor),
      )
      this.colliders.push(collider)
      return collider
    }
    this.sensors = SPLIT_PLATES.map((p) => box([1.8, 0.3, 1.8], p, true))
    this.door = box([2.4, 3.6, 0.3], SPLIT_DOOR)
    this.exit = box([2, 1.2, 1.4], SPLIT_EXIT, true)
    this.capsule = new rapier.Capsule(PLAYER.halfHeight, PLAYER.radius)
  }
  update(player: Position, echoes: readonly Position[], step = PHYSICS_STEP) {
    this.sensors.forEach((sensor, i) => {
      this.plates[i].player = sensor.intersectsShape(
        this.capsule,
        player,
        this.upright,
      )
      this.plates[i].echo = echoes.some((position) =>
        sensor.intersectsShape(this.capsule, position, this.upright),
      )
    })
    if (step <= 0) return
    const simultaneous =
      (this.plates[0].player && this.plates[1].echo) ||
      (this.plates[1].player && this.plates[0].echo)
    if (!this.doorOpen) {
      this.ticks = simultaneous ? Math.min(CHARGE_TICKS, this.ticks + 1) : 0
      this.doorOpen = this.ticks === CHARGE_TICKS
    }
    this.motion.step(this.doorOpen, PHYSICS_STEP)
    this.door.setTranslation({ ...SPLIT_DOOR, y: SPLIT_DOOR.y + this.doorLift })
    this.door.setEnabled(this.doorLift < DOOR_TRAVEL)
  }
  reset() {
    this.ticks = 0
    this.doorOpen = false
    this.motion.reset()
    this.plates.forEach((p) => {
      p.player = false
      p.echo = false
    })
    this.door.setTranslation(SPLIT_DOOR)
    this.door.setEnabled(true)
  }
  reachedExit(player: Position) {
    return (
      this.doorOpen &&
      this.exit.intersectsShape(this.capsule, player, this.upright)
    )
  }
  dispose(world: RapierContext['world']) {
    this.colliders.forEach((collider) => world.removeCollider(collider, false))
  }
}
