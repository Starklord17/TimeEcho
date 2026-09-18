import { CYCLE_SECONDS, TICKS_PER_SECOND } from '../time-loop/TimeLoop'

export type ReplayFrame = Readonly<{
  time: number
  position: readonly [number, number, number]
  rotation: readonly [number, number, number, number]
}>
export type RecordedRun = Readonly<{
  version: 1
  cycle: number
  duration: number
  sampleRate: number
  endReason: 'timeout' | 'restart'
  frames: readonly ReplayFrame[]
}>

type Position = { x: number; y: number; z: number }
type Rotation = Position & { w: number }

/** Owns copied immutable samples; never retains mutable Three/Rapier objects. */
export class Recorder {
  private readonly cycleSeconds: number
  constructor(cycleSeconds = CYCLE_SECONDS) {
    this.cycleSeconds = cycleSeconds
  }

  private frames: ReplayFrame[] = []
  private cycle = 1

  begin(cycle: number, position: Position, rotation: Rotation) {
    this.cycle = cycle
    this.frames = []
    this.capture(0, position, rotation)
  }

  capture(time: number, position: Position, rotation: Rotation) {
    const previous = this.frames.at(-1)
    if (
      !Number.isFinite(time) ||
      time < 0 ||
      time > this.cycleSeconds ||
      (previous && time <= previous.time)
    )
      throw new Error('Recording timestamps must increase within the cycle.')
    if (this.frames.length >= this.cycleSeconds * TICKS_PER_SECOND + 1)
      throw new Error('Recording sample limit exceeded.')
    this.frames.push(
      Object.freeze({
        time,
        position: Object.freeze([position.x, position.y, position.z] as const),
        rotation: Object.freeze([
          rotation.x,
          rotation.y,
          rotation.z,
          rotation.w,
        ] as const),
      }),
    )
  }

  finish(endReason: RecordedRun['endReason']): RecordedRun {
    if (!this.frames.length)
      throw new Error('Cannot finish an empty recording.')
    const frames = Object.freeze(this.frames)
    this.frames = []
    return Object.freeze({
      version: 1,
      cycle: this.cycle,
      duration: frames[frames.length - 1].time,
      sampleRate: TICKS_PER_SECOND,
      endReason,
      frames,
    })
  }
}
