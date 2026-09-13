import { useGameStore } from '../state/gameStore'
const controlKeys = new Set([
  'KeyW',
  'KeyA',
  'KeyS',
  'KeyD',
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
])

// One instance per mounted player; no global listeners or React updates per key.
export class InputManager {
  private keys = new Set<string>()
  private onKeyDown = (event: KeyboardEvent) => {
    if (
      event.code === 'KeyR' &&
      !event.repeat &&
      (document.pointerLockElement || useGameStore.getState().fallback)
    ) {
      event.preventDefault()
      useGameStore.getState().requestRestart()
      return
    }
    if (
      (!document.pointerLockElement && !useGameStore.getState().fallback) ||
      !controlKeys.has(event.code)
    )
      return
    event.preventDefault()
    this.keys.add(event.code)
  }
  private onKeyUp = (event: KeyboardEvent) => {
    this.keys.delete(event.code)
  }
  clear = () => {
    this.keys.clear()
  }
  connect() {
    const unsubscribe = useGameStore.subscribe((state, previous) => {
      if (state.fallback !== previous.fallback) this.clear()
    })
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.clear)
    document.addEventListener('visibilitychange', this.clear)
    document.addEventListener('pointerlockchange', this.clear)
    return () => {
      unsubscribe()
      window.removeEventListener('keydown', this.onKeyDown)
      window.removeEventListener('keyup', this.onKeyUp)
      window.removeEventListener('blur', this.clear)
      document.removeEventListener('visibilitychange', this.clear)
      document.removeEventListener('pointerlockchange', this.clear)
      this.clear()
    }
  }
  get lookRight() {
    return (
      Number(this.keys.has('ArrowRight')) - Number(this.keys.has('ArrowLeft'))
    )
  }
  get lookUp() {
    return Number(this.keys.has('ArrowUp')) - Number(this.keys.has('ArrowDown'))
  }
  get right() {
    return Number(this.keys.has('KeyD')) - Number(this.keys.has('KeyA'))
  }
  get forward() {
    return Number(this.keys.has('KeyW')) - Number(this.keys.has('KeyS'))
  }
}
