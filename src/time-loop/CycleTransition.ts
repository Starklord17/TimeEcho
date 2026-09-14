/** 18 simulation steps; pause is simply not calling step(). */
export class CycleTransition {
  private tick = 18
  get phase(): 'PLAYING' | 'CYCLE_ENDING' | 'RESETTING' {
    return this.tick >= 18
      ? 'PLAYING'
      : this.tick < 9
        ? 'CYCLE_ENDING'
        : 'RESETTING'
  }
  get opacity() {
    return this.tick >= 18 ? 0 : Math.min(this.tick / 9, (18 - this.tick) / 9)
  }
  begin() {
    if (this.phase !== 'PLAYING') return false
    this.tick = 0
    return true
  }
  step() {
    if (this.phase === 'PLAYING') return false
    this.tick++
    return this.tick === 9
  }
}
