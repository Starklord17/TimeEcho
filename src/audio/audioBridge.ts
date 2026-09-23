import type { AudioFrame } from './AudioEvents'
import type { AudioEngine } from './AudioEngine'

let context: AudioContext | null = null
let engine: AudioEngine | null = null
let loading: Promise<void> | null = null

/** Must be called synchronously from the Enter button's user gesture. */
export function activateAudio() {
  try {
    context ??= new AudioContext()
    void context.resume().catch(() => {})
    loading ??= import('./AudioEngine')
      .then(({ AudioEngine }) => {
        engine = new AudioEngine(context!)
      })
      .catch((error) => {
        console.warn('Audio unavailable; gameplay continues.', error)
        loading = null
      })
  } catch (error) {
    console.warn('Audio unavailable; gameplay continues.', error)
  }
}

export function publishAudioFrame(frame: AudioFrame) {
  engine?.update(frame)
}

export function isAudioActive() {
  return engine !== null
}
