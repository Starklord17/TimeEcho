export class DoorMotion {
  value = 0
  private from = 0
  private target = 0
  private elapsed = 0
  private readonly travel: number
  private readonly duration: number
  constructor(travel: number, duration: number) {
    this.travel = travel
    this.duration = duration
  }
  step(open: boolean, dt: number) {
    const target = open ? this.travel : 0
    if (target !== this.target) {
      this.from = this.value
      this.target = target
      this.elapsed = 0
    }
    this.elapsed = Math.min(this.duration, this.elapsed + dt)
    const t = this.elapsed / this.duration
    this.value = this.from + (this.target - this.from) * t * t * (3 - 2 * t)
    return this.value
  }
  reset() {
    this.value = this.from = this.target = this.elapsed = 0
  }
}
