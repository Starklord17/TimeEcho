import { Quaternion, Vector3 } from 'three'
import type { RecordedRun } from '../recording/Recorder'

/** Timestamp-based sampling supports irregular samples and seeking backwards. */
export class ReplaySampler {
  private endPosition = new Vector3()
  private endRotation = new Quaternion()

  sample(
    run: RecordedRun,
    time: number,
    position: Vector3,
    rotation: Quaternion,
  ) {
    const frames = run.frames
    if (!frames.length) return false
    let low = 0
    let high = frames.length - 1
    while (low < high) {
      const mid = Math.ceil((low + high) / 2)
      if (frames[mid].time <= time) low = mid
      else high = mid - 1
    }
    const start = frames[low]
    const end = frames[Math.min(low + 1, frames.length - 1)]
    const alpha =
      end.time > start.time
        ? Math.max(
            0,
            Math.min(1, (time - start.time) / (end.time - start.time)),
          )
        : 0
    position.fromArray(start.position)
    this.endPosition.fromArray(end.position)
    position.lerp(this.endPosition, alpha)
    rotation.fromArray(start.rotation)
    this.endRotation.fromArray(end.rotation)
    rotation.slerp(this.endRotation, alpha).normalize()
    return true
  }
}
