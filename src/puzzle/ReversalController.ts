import type { RapierContext, RapierCollider } from '@react-three/rapier'
import { PHYSICS_STEP, PLAYER } from '../player/PlayerController'
import {
  REVERSAL_DOORS,
  REVERSAL_EXIT,
  REVERSAL_PLATES,
} from '../levels/reversalLayout'
import { DoorMotion } from './DoorMotion'
import { DOOR_DURATION, DOOR_TRAVEL } from './PuzzleController'
import type { Position, PuzzleDoor, PuzzleRuntime } from './PuzzleRuntime'

export const REVERSAL_CHARGE_TICKS = 120

/** Sensor state is authoritative; recorded Echo paths ignore current gate geometry. */
export class ReversalController implements PuzzleRuntime {
  private owned: RapierCollider[] = []
  private sensors: RapierCollider[]
  private panels: RapierCollider[]
  private exit: RapierCollider
  private capsule: InstanceType<RapierContext['rapier']['Capsule']>
  private upright = { x: 0, y: 0, z: 0, w: 1 }
  private motions = REVERSAL_DOORS.map(
    () => new DoorMotion(DOOR_TRAVEL, DOOR_DURATION),
  )
  private ticks = 0
  readonly plates = REVERSAL_PLATES.map(() => ({ player: false, echo: false }))
  readonly doors: PuzzleDoor[] = REVERSAL_DOORS.map(({ id }) => ({
    id,
    open: false,
    lift: 0,
  }))

  get platePlayer() {
    return this.plates.some((plate) => plate.player)
  }
  get plateEcho() {
    return this.plates.some((plate) => plate.echo)
  }
  get charge() {
    return this.ticks / REVERSAL_CHARGE_TICKS
  }
  get doorOpen() {
    return this.doors[2].open
  }
  get doorLift() {
    return this.doors[2].lift
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
      this.owned.push(collider)
      return collider
    }
    this.sensors = REVERSAL_PLATES.map((p) => box([1.8, 0.3, 1.8], p, true))
    this.panels = REVERSAL_DOORS.map((p) => box([2.4, 3.6, 0.3], p))
    this.exit = box([2, 1.2, 1.4], REVERSAL_EXIT, true)
    this.capsule = new rapier.Capsule(PLAYER.halfHeight, PLAYER.radius)
  }

  update(player: Position, echoes: readonly Position[], step = PHYSICS_STEP) {
    const actors = [player, ...echoes.slice(-2)]
    const occupancy = this.sensors.map((sensor, index) => {
      const occupied = actors.map((actor) =>
        sensor.intersectsShape(this.capsule, actor, this.upright),
      )
      this.plates[index].player = occupied[0]
      this.plates[index].echo = occupied.slice(1).some(Boolean)
      return occupied
    })
    // Reset may refresh sensors without accumulating charge or moving a door.
    if (step <= 0) return
    if (!this.doorOpen) {
      const simultaneous = occupancy[2].some(
        (on, actor) =>
          on &&
          occupancy[3].some(
            (other, otherActor) => other && actor !== otherActor,
          ),
      )
      this.ticks = simultaneous
        ? Math.min(REVERSAL_CHARGE_TICKS, this.ticks + 1)
        : 0
      this.doors[2].open = this.ticks === REVERSAL_CHARGE_TICKS
    }
    this.doors[0].open = occupancy[0].some(Boolean)
    this.doors[1].open = occupancy[1].some(Boolean)
    this.doors.forEach((door, index) => {
      const origin = REVERSAL_DOORS[index]
      // A conservative doorway envelope freezes closure before the panel can
      // touch the player. Echoes intentionally do not participate in this guard.
      const crossing =
        Math.abs(player.x - origin.x) < 1.2 + PLAYER.radius + 0.1 &&
        Math.abs(player.z - origin.z) < 0.15 + PLAYER.radius + 0.2 &&
        player.y - PLAYER.halfHeight - PLAYER.radius < 3.6 + door.lift &&
        player.y + PLAYER.halfHeight + PLAYER.radius > 0
      if (door.open || !crossing || door.lift === 0)
        door.lift = this.motions[index].step(door.open, PHYSICS_STEP)
      this.panels[index].setTranslation({ ...origin, y: origin.y + door.lift })
      this.panels[index].setEnabled(door.lift < DOOR_TRAVEL)
    })
  }

  reset() {
    this.ticks = 0
    this.plates.forEach((plate) => {
      plate.player = plate.echo = false
    })
    this.doors.forEach((door, index) => {
      door.open = false
      door.lift = 0
      this.motions[index].reset()
      this.panels[index].setTranslation(REVERSAL_DOORS[index])
      this.panels[index].setEnabled(true)
    })
  }
  reachedExit(player: Position) {
    return (
      this.doorOpen &&
      this.exit.intersectsShape(this.capsule, player, this.upright)
    )
  }
  dispose(world: RapierContext['world']) {
    this.owned.forEach((collider) => world.removeCollider(collider, false))
    this.owned = []
  }
}
