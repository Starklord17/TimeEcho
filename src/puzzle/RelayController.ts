import type { RapierContext, RapierCollider } from '@react-three/rapier'
import { PHYSICS_STEP, PLAYER } from '../player/PlayerController'
import { RELAY_PLATES, RELAY_DOOR, RELAY_EXIT } from '../levels/relayLayout'
import { DoorMotion } from './DoorMotion'
import { DOOR_DURATION, DOOR_TRAVEL } from './PuzzleController'
import type { Position, PuzzleRuntime } from './PuzzleRuntime'

export const RELAY_CHARGE_TICKS = 120
export class RelayController implements PuzzleRuntime {
  private colliders: RapierCollider[] = []
  private sensors: RapierCollider[]
  private door: RapierCollider
  private exit: RapierCollider
  private capsule: InstanceType<RapierContext['rapier']['Capsule']>
  private upright = { x: 0, y: 0, z: 0, w: 1 }
  private motion = new DoorMotion(DOOR_TRAVEL, DOOR_DURATION)
  private ticks = 0
  phase: 'PHASE_A' | 'PHASE_B' | 'EXIT_OPEN' = 'PHASE_A'
  plates = RELAY_PLATES.map(() => ({ player: false, echo: false }))
  doorOpen = false
  get platePlayer() {
    return this.plates.some((p) => p.player)
  }
  get plateEcho() {
    return this.plates.some((p) => p.echo)
  }
  get charge() {
    return this.phase === 'EXIT_OPEN'
      ? 1
      : this.ticks / (this.phase === 'PHASE_A' ? 120 : 180)
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
    this.sensors = RELAY_PLATES.map((p) => box([1.8, 0.3, 1.8], p, true))
    this.door = box([2.4, 3.6, 0.3], RELAY_DOOR)
    this.exit = box([2, 1.2, 1.4], RELAY_EXIT, true)
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
    const actors = [player, ...echoes.slice(-3)]
    const offset = this.phase === 'PHASE_A' ? 0 : 4
    const occupies = this.sensors
      .slice(offset, offset + 4)
      .map((sensor) =>
        actors.map((actor) =>
          sensor.intersectsShape(this.capsule, actor, this.upright),
        ),
      )
    const assign = (station: number, used: number): boolean =>
      station === 4 ||
      actors.some(
        (_, actor) =>
          !(used & (1 << actor)) &&
          occupies[station][actor] &&
          assign(station + 1, used | (1 << actor)),
      )
    if (!this.doorOpen) {
      const target = this.phase === 'PHASE_A' ? 120 : 180
      this.ticks = actors.length === 4 && assign(0, 0) ? this.ticks + 1 : 0
      if (this.ticks >= target) {
        if (this.phase === 'PHASE_A') {
          this.phase = 'PHASE_B'
          this.ticks = 0
        } else {
          this.phase = 'EXIT_OPEN'
          this.doorOpen = true
        }
      }
    }
    this.motion.step(this.doorOpen, PHYSICS_STEP)
    this.door.setTranslation({
      ...RELAY_DOOR,
      y: RELAY_DOOR.y + this.doorLift,
    })
    this.door.setEnabled(this.doorLift < DOOR_TRAVEL)
  }
  reset() {
    this.phase = 'PHASE_A'
    this.ticks = 0
    this.doorOpen = false
    this.motion.reset()
    this.plates.forEach((p) => {
      p.player = false
      p.echo = false
    })
    this.door.setTranslation(RELAY_DOOR)
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
    this.colliders = []
  }
}
