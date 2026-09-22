import { useSyncExternalStore } from 'react'

export type AudioSettings = {
  music: number
  effects: number
  muted: boolean
}

const KEY = 'timeecho.audio.v1'
const defaults: AudioSettings = { music: 0.5, effects: 0.65, muted: false }
const listeners = new Set<() => void>()

function restore(): AudioSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null')
    if (!saved || typeof saved !== 'object') return defaults
    return {
      music: validVolume(saved.music, defaults.music),
      effects: validVolume(saved.effects, defaults.effects),
      muted: typeof saved.muted === 'boolean' ? saved.muted : false,
    }
  } catch {
    return defaults
  }
}

function validVolume(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(0, Math.min(1, value))
    : fallback
}

let settings = restore()

export function getAudioSettings() {
  return settings
}

export function setAudioSettings(patch: Partial<AudioSettings>) {
  settings = {
    music: validVolume(patch.music ?? settings.music, settings.music),
    effects: validVolume(patch.effects ?? settings.effects, settings.effects),
    muted: patch.muted ?? settings.muted,
  }
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // Storage can be disabled. In-memory controls still work.
  }
  listeners.forEach((listener) => listener())
}

export function subscribeAudioSettings(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useAudioSettings() {
  return useSyncExternalStore(subscribeAudioSettings, getAudioSettings)
}
