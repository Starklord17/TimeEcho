import type { RapierContext, RapierCollider } from '@react-three/rapier'
import { PHYSICS_STEP, PLAYER } from '../player/PlayerController'
import {
  CONVERGENCE_PLATES,
  CONVERGENCE_DOOR,
  CONVERGENCE_EXIT,
} from '../levels/convergenceLayout'
import { DoorMotion } from './DoorMotion'
import { DOOR_DURATION, DOOR_TRAVEL } from './PuzzleController'
import type { Position, PuzzleRuntime } from './PuzzleRuntime'

export const CONVERGENCE_CHARGE_TICKS = 120
export class ConvergenceController implements PuzzleRuntime {
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
    return this.ticks / CONVERGENCE_CHARGE_TICKS
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
    this.sensors = CONVERGENCE_PLATES.map((p) => box([1.8, 0.3, 1.8], p, true))
    this.door = box([2.4, 3.6, 0.3], CONVERGENCE_DOOR)
    this.exit = box([2, 1.2, 1.4], CONVERGENCE_EXIT, true)
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
    // Assign each station a different actor. Aggregate occupancy alone could
    // incorrectly count one actor twice if station volumes ever overlap.
    const actors = [player, ...echoes.slice(-2)]
    const occupies = this.sensors.map((sensor) =>
      actors.map((actor) =>
        sensor.intersectsShape(this.capsule, actor, this.upright),
      ),
    )
    const simultaneous =
      actors.length === 3 &&
      [0, 1, 2].some((a) =>
        [0, 1, 2].some(
          (b) =>
            a !== b &&
            occupies[0][a] &&
            occupies[1][b] &&
            occupies[2][3 - a - b],
        ),
      )
    if (!this.doorOpen) {
      this.ticks = simultaneous
        ? Math.min(CONVERGENCE_CHARGE_TICKS, this.ticks + 1)
        : 0
      this.doorOpen = this.ticks === CONVERGENCE_CHARGE_TICKS
    }
    this.motion.step(this.doorOpen, PHYSICS_STEP)
    this.door.setTranslation({
      ...CONVERGENCE_DOOR,
      y: CONVERGENCE_DOOR.y + this.doorLift,
    })
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
    this.door.setTranslation(CONVERGENCE_DOOR)
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
