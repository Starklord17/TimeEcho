import { Quaternion, Vector3 } from 'three'
import type { RecordedRun } from '../recording/Recorder'
import { ReplaySampler } from './ReplaySampler'

/** Reusable authoritative sensor positions, in FIFO order; no visual or collider state. */
export class ReplayCollection {
  private sampler = new ReplaySampler()
  private positions: Vector3[] = []
  private rotation = new Quaternion()
  private active: Vector3[] = []

  sample(runs: readonly RecordedRun[], time: number): readonly Vector3[] {
    this.active.length = 0
    while (this.positions.length < runs.length)
      this.positions.push(new Vector3())
    for (let index = 0; index < runs.length; index++) {
      const position = this.positions[index]
      if (this.sampler.sample(runs[index], time, position, this.rotation))
        this.active.push(position)
    }
    return this.active
  }
}
