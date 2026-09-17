import type { RecordedRun } from '../recording/Recorder'

const STEP = 1 / 120
export const ECHO_BLEND_SECONDS = 0.15
// One authored gait cycle covers approximately 0.8 metres.
const STRIDE = 0.8

/** A replay-time lookup, independent of rendering rate, player input or seeks. */
export class EchoMotion {
  private run: RecordedRun | null = null
  private weights = [0]
  private phases = [0]

  sample(run: RecordedRun, time: number) {
    if (run !== this.run) this.prepare(run)
    const t = Math.max(0, time)
    const index = Math.min(Math.floor(t / STEP), this.weights.length - 1)
    const next = Math.min(index + 1, this.weights.length - 1)
    const alpha = Math.min(1, t / STEP - index)
    return {
      idleTime: t,
      walkTime:
        this.phases[index] + (this.phases[next] - this.phases[index]) * alpha,
      weight:
        this.weights[index] +
        (this.weights[next] - this.weights[index]) * alpha,
    }
  }

  private prepare(run: RecordedRun) {
    this.run = run
    this.weights = [0]
    this.phases = [0]
    const frames = run.frames
    const end = frames.at(-1)?.time ?? 0
    let segment = 0
    let weight = 0
    let phase = 0
    for (
      let i = 1;
      i <= Math.ceil((end + ECHO_BLEND_SECONDS) / STEP) + 1;
      i++
    ) {
      const t = (i - 0.5) * STEP
      while (segment + 1 < frames.length && frames[segment + 1].time <= t)
        segment++
      const a = frames[segment]
      const b = frames[segment + 1]
      const speed =
        a && b && b.time > a.time && t >= a.time
          ? Math.hypot(
              b.position[0] - a.position[0],
              b.position[2] - a.position[2],
            ) /
            (b.time - a.time)
          : 0
      const target = speed > 0.04 ? 1 : 0
      weight += Math.max(
        -STEP / ECHO_BLEND_SECONDS,
        Math.min(STEP / ECHO_BLEND_SECONDS, target - weight),
      )
      phase += (speed / STRIDE) * STEP
      this.weights.push(weight)
      this.phases.push(phase)
    }
  }
}
