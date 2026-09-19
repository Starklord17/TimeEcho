export const CYCLE_SECONDS = 15
export const TICKS_PER_SECOND = 60

/** Integer simulation ticks avoid floating-point drift and wall-clock catch-up. */
export class TimeLoop {
  readonly duration: number
  constructor(duration = CYCLE_SECONDS) {
    this.duration = duration
  }

  cycle = 1
  private ticks = 0

  get nextSampleTime() {
    return (this.ticks + 1) / TICKS_PER_SECOND
  }

  get elapsedSeconds() {
    return this.ticks / TICKS_PER_SECOND
  }

  get remainingSeconds() {
    return Math.ceil(
      (this.duration * TICKS_PER_SECOND - this.ticks) / TICKS_PER_SECOND,
    )
  }

  advance(deferRestart = false) {
    this.ticks += 1
    if (this.ticks < this.duration * TICKS_PER_SECOND) return false
    if (!deferRestart) this.restart()
    return true
  }

  restart() {
    this.cycle += 1
    this.ticks = 0
  }
}
