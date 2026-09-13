import { TICKS_PER_SECOND } from '../time-loop/TimeLoop'

/** Smooth between physics ticks, bounded by authoritative simulation time. */
export class PlaybackClock {
  private cycle = -1
  private time = 0

  update(cycle: number, elapsed: number, delta: number, active: boolean) {
    if (cycle !== this.cycle) {
      this.cycle = cycle
      this.time = 0
    } else if (active) {
      this.time = Math.min(
        elapsed,
        Math.max(
          elapsed - 1 / TICKS_PER_SECOND,
          this.time + Math.max(0, delta),
        ),
      )
    }
    return this.time
  }
}
