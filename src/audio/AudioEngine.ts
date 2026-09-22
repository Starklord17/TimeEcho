import { useGameStore } from '../state/gameStore'
import type { LevelId } from '../levels/levelMetadata'
import { AudioEvents, type AudioCue, type AudioFrame } from './AudioEvents'
import { getAudioSettings, subscribeAudioSettings } from './audioSettings'

const EFFECTS = [
  'plate-on',
  'plate-off',
  'charge',
  'door-open',
  'door-close',
  'cycle',
  'echo',
  'victory',
  'step-player',
  'step-echo',
] as const
type Effect = (typeof EFFECTS)[number]

export class AudioEngine {
  private context: AudioContext
  private musicBus: GainNode
  private effectsBus: GainNode
  private baseGain: GainNode
  private tensionGain: GainNode
  private buffers = new Map<string, Promise<AudioBuffer | null>>()
  private music: AudioBufferSourceNode[] = []
  private effects = new Set<AudioBufferSourceNode>()
  private events = new AudioEvents()
  private lastCue = new Map<Effect, number>()
  private level: LevelId | null = null
  private loadToken = 0
  private loadedMusic: [AudioBuffer, AudioBuffer] | null = null
  private previous = useGameStore.getState()
  private active = false
  private cueEpoch = 0
  private effectsSuppressed = false

  constructor(context: AudioContext) {
    this.context = context
    this.musicBus = context.createGain()
    this.effectsBus = context.createGain()
    this.baseGain = context.createGain()
    this.tensionGain = context.createGain()
    this.baseGain.gain.value = 0.34
    this.tensionGain.gain.value = 0
    this.baseGain.connect(this.musicBus)
    this.tensionGain.connect(this.musicBus)
    this.musicBus.connect(context.destination)
    this.effectsBus.connect(context.destination)
    this.applySettings()
    subscribeAudioSettings(() => this.applySettings())
    useGameStore.subscribe((state, previous) => this.sync(state, previous))
    document.addEventListener('visibilitychange', () =>
      this.sync(useGameStore.getState(), this.previous),
    )
    window.addEventListener('pagehide', () => {
      this.stopAll()
      this.active = false
      this.events.reset()
      const state = useGameStore.getState()
      if (state.fallback) state.setFallback(false)
      if (state.locked) state.setLocked(false)
    })
    for (const name of EFFECTS) void this.load(name)
    this.sync(this.previous, this.previous)
  }

  private load(name: string): Promise<AudioBuffer | null> {
    const existing = this.buffers.get(name)
    if (existing) return existing
    const result = fetch(`${import.meta.env.BASE_URL}audio/${name}.wav`)
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status} ${name}`)
        return response.arrayBuffer()
      })
      .then((bytes) => this.context.decodeAudioData(bytes))
      .catch((error) => {
        console.warn('Audio asset unavailable; skipping cue.', name, error)
        return null
      })
    this.buffers.set(name, result)
    return result
  }

  private async loadMusic(level: LevelId) {
    const token = ++this.loadToken
    this.loadedMusic = null
    this.stopMusic()
    const buffers = await Promise.all([this.load(level), this.load('tension')])
    if (token !== this.loadToken || !buffers[0] || !buffers[1]) return
    this.loadedMusic = [buffers[0], buffers[1]]
    this.syncPlayback()
  }

  private applySettings() {
    const settings = getAudioSettings()
    const at = this.context.currentTime
    this.musicBus.gain.setTargetAtTime(
      settings.muted ? 0 : settings.music,
      at,
      0.08,
    )
    this.effectsBus.gain.setTargetAtTime(
      settings.muted ? 0 : settings.effects,
      at,
      0.08,
    )
  }

  private sync(
    state: ReturnType<typeof useGameStore.getState>,
    previous: ReturnType<typeof useGameStore.getState>,
  ) {
    this.previous = state
    if (state.currentLevel !== this.level) {
      this.level = state.currentLevel
      this.events.reset()
      this.stopEffects()
      void this.loadMusic(state.currentLevel)
    }
    if (state.sessionId !== previous.sessionId) {
      this.events.reset()
      this.stopEffects()
    }
    if (state.cycle !== previous.cycle) {
      this.events.reset()
    }
    this.syncPlayback()
    if (state.cycle !== previous.cycle && state.runs.length) this.play('echo')
    if (
      state.cyclePhase === 'CYCLE_ENDING' &&
      previous.cyclePhase === 'PLAYING'
    )
      this.play('cycle')
    if (state.completed && !previous.completed) this.play('victory')
  }

  private syncPlayback() {
    const state = useGameStore.getState()
    const engaged = state.locked || state.fallback
    const shouldPlay =
      engaged &&
      !document.hidden &&
      !state.completed &&
      state.cyclePhase === 'PLAYING'
    const suppress = !engaged || document.hidden || state.completed
    if (suppress && !this.effectsSuppressed) this.stopEffects()
    this.effectsSuppressed = suppress
    if (shouldPlay !== this.active) {
      this.active = shouldPlay
      this.events.reset()
      if (!shouldPlay) this.stopMusic()
    }
    if (shouldPlay && this.loadedMusic && !this.music.length) {
      const start = this.context.currentTime + 0.025
      this.baseGain.gain.cancelScheduledValues(start)
      this.baseGain.gain.setValueAtTime(0, start)
      this.baseGain.gain.linearRampToValueAtTime(0.34, start + 0.18)
      this.music = this.loadedMusic.map((buffer, index) => {
        const source = this.context.createBufferSource()
        source.buffer = buffer
        source.loop = true
        source.connect(index === 0 ? this.baseGain : this.tensionGain)
        source.start(start)
        return source
      })
    }
  }

  update(frame: AudioFrame) {
    if (!this.active) return
    for (const cue of this.events.update(frame)) this.play(cue)
    const tension = frame.doorOpen
      ? 0.06
      : Math.min(0.22, frame.plateCount * 0.045 + frame.charge * 0.13)
    this.tensionGain.gain.setTargetAtTime(
      tension,
      this.context.currentTime,
      0.12,
    )
  }

  private async play(name: AudioCue | Exclude<Effect, AudioCue>) {
    if (document.hidden || getAudioSettings().muted) return
    const epoch = this.cueEpoch
    const now = this.context.currentTime
    if (now - (this.lastCue.get(name) ?? -10) < 0.12) return
    this.lastCue.set(name, now)
    const buffer = await this.load(name)
    if (
      !buffer ||
      epoch !== this.cueEpoch ||
      document.hidden ||
      getAudioSettings().muted
    )
      return
    const source = this.context.createBufferSource()
    const gain = this.context.createGain()
    gain.gain.value =
      name === 'step-echo' ? 0.28 : name === 'step-player' ? 0.42 : 0.72
    source.buffer = buffer
    source.connect(gain).connect(this.effectsBus)
    source.onended = () => {
      this.effects.delete(source)
      source.disconnect()
      gain.disconnect()
    }
    this.effects.add(source)
    source.start()
  }

  private stopMusic() {
    const now = this.context.currentTime
    this.baseGain.gain.cancelScheduledValues(now)
    this.baseGain.gain.setValueAtTime(this.baseGain.gain.value, now)
    this.baseGain.gain.linearRampToValueAtTime(0, now + 0.12)
    this.tensionGain.gain.cancelScheduledValues(now)
    this.tensionGain.gain.setValueAtTime(this.tensionGain.gain.value, now)
    this.tensionGain.gain.linearRampToValueAtTime(0, now + 0.12)
    for (const source of this.music) {
      source.stop(now + 0.14)
      source.onended = () => source.disconnect()
    }
    this.music = []
  }

  private stopEffects() {
    this.cueEpoch++
    for (const source of this.effects) source.stop()
    this.effects.clear()
  }

  private stopAll() {
    this.stopMusic()
    this.stopEffects()
  }
}
