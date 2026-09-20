import { Quaternion, Vector3 } from 'three'
import type { RecordedRun } from '../recording/Recorder'
import { ReplaySampler } from './ReplaySampler'

/** Reusable authoritative sensor positions, in FIFO order; no visual or collider state. */
export class ReplayCollection {
  private sampler = new ReplaySampler()
  private positions = [new Vector3(), new Vector3()]
  private rotation = new Quaternion()
  private active: Vector3[] = []

  sample(runs: readonly RecordedRun[], time: number): readonly Vector3[] {
    this.active.length = 0
    const first = Math.max(0, runs.length - 2)
    for (let index = first; index < runs.length; index++) {
      const position = this.positions[index - first]
      if (this.sampler.sample(runs[index], time, position, this.rotation))
        this.active.push(position)
    }
    return this.active
  }
}
