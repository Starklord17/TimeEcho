import { AnimationMixer, type AnimationClip, type Object3D } from 'three'
import type { RecordedRun } from '../recording/Recorder'
import { EchoMotion } from './EchoMotion'

export class EchoAnimator {
  private motion = new EchoMotion()
  private mixer: AnimationMixer
  private idle
  private walk
  private root: Object3D

  constructor(root: Object3D, clips: AnimationClip[]) {
    this.root = root
    this.mixer = new AnimationMixer(root)
    this.idle = this.mixer
      .clipAction(clips.find((c) => c.name === 'Idle')!)
      .play()
    this.walk = this.mixer
      .clipAction(clips.find((c) => c.name === 'Walk')!)
      .play()
  }

  sample(run: RecordedRun, time: number) {
    const pose = this.motion.sample(run, time)
    this.idle.time = pose.idleTime % this.idle.getClip().duration
    this.walk.time = pose.walkTime % this.walk.getClip().duration
    this.idle.setEffectiveWeight(1 - pose.weight)
    this.walk.setEffectiveWeight(pose.weight)
    // Absolute sampling also restores the correct pose after a backwards seek.
    this.mixer.update(0)
  }

  dispose() {
    this.mixer.stopAllAction()
    this.mixer.uncacheRoot(this.root)
  }
}
