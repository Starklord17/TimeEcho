import { Euler, type Camera } from 'three'
import { useGameStore } from '../state/gameStore'

/** Native pointer lock with a playable drag-to-look fallback for embedded browsers. */
export class MouseLook {
  private rotation = new Euler(0, 0, 0, 'YXZ')
  private dragging = false
  private disposed = false
  private pending = false
  private lastX = 0
  private lastY = 0
  private canvas: HTMLCanvasElement
  private camera: Camera

  constructor(canvas: HTMLCanvasElement, camera: Camera) {
    this.canvas = canvas
    this.camera = camera
  }

  private fallback = () => {
    if (this.disposed) return
    this.pending = false
    useGameStore.getState().setFallback(true)
  }

  private enter = () => {
    if (this.pending || this.disposed) return
    this.pending = true
    try {
      // Keep the request synchronous with the user gesture, without a React effect.
      if (!this.canvas.requestPointerLock) return this.fallback()
      const request = this.canvas.requestPointerLock()
      request?.catch(this.fallback)
    } catch {
      this.fallback()
    }
  }

  private change = () => {
    this.pending = false
    this.dragging = false
    const locked = document.pointerLockElement === this.canvas
    useGameStore.getState().setFallback(false)
    useGameStore.getState().setLocked(locked)
  }

  private move = (event: MouseEvent) => {
    const locked = document.pointerLockElement === this.canvas
    if (!locked && !this.dragging) return
    const dx = locked ? event.movementX : event.clientX - this.lastX
    const dy = locked ? event.movementY : event.clientY - this.lastY
    this.lastX = event.clientX
    this.lastY = event.clientY
    this.rotation.setFromQuaternion(this.camera.quaternion, 'YXZ')
    this.rotation.y -= dx * 0.002
    this.rotation.x = Math.max(
      -Math.PI / 2 + 0.01,
      Math.min(Math.PI / 2 - 0.01, this.rotation.x - dy * 0.002),
    )
    this.camera.quaternion.setFromEuler(this.rotation)
  }

  private down = (event: MouseEvent) => {
    if (event.button !== 0 || !useGameStore.getState().fallback) return
    event.preventDefault()
    this.dragging = true
    this.lastX = event.clientX
    this.lastY = event.clientY
  }
  private up = () => {
    this.dragging = false
  }
  private exit = () => {
    this.dragging = false
    useGameStore.getState().setFallback(false)
    if (document.pointerLockElement === this.canvas) document.exitPointerLock()
  }
  private key = (event: KeyboardEvent) => {
    if (event.code === 'Escape') this.exit()
  }
  private visibility = () => {
    if (document.hidden) this.exit()
  }

  connect(button: HTMLElement) {
    button.addEventListener('click', this.enter)
    this.canvas.addEventListener('mousedown', this.down)
    document.addEventListener('mousemove', this.move)
    document.addEventListener('mouseup', this.up)
    document.addEventListener('pointerlockchange', this.change)
    document.addEventListener('pointerlockerror', this.fallback)
    document.addEventListener('visibilitychange', this.visibility)
    window.addEventListener('keydown', this.key)
    window.addEventListener('blur', this.exit)
    return () => {
      this.disposed = true
      button.removeEventListener('click', this.enter)
      this.canvas.removeEventListener('mousedown', this.down)
      document.removeEventListener('mousemove', this.move)
      document.removeEventListener('mouseup', this.up)
      document.removeEventListener('pointerlockchange', this.change)
      document.removeEventListener('pointerlockerror', this.fallback)
      document.removeEventListener('visibilitychange', this.visibility)
      window.removeEventListener('keydown', this.key)
      window.removeEventListener('blur', this.exit)
      this.exit()
    }
  }
}
