import { afterEach, expect, it, vi } from 'vitest'
import { PerspectiveCamera } from 'three'
import { MouseLook } from './MouseLook'
import { useGameStore } from '../state/gameStore'

let disconnect: (() => void) | undefined
afterEach(() => {
  disconnect?.()
  vi.unstubAllGlobals()
  useGameStore.setState({ fallback: false, locked: false })
})

function setup(request: () => Promise<void>) {
  const documentTarget = Object.assign(new EventTarget(), {
    pointerLockElement: null,
  })
  const windowTarget = new EventTarget()
  vi.stubGlobal('document', documentTarget)
  vi.stubGlobal('window', windowTarget)
  const canvas = Object.assign(new EventTarget(), {
    requestPointerLock: request,
  })
  const button = new EventTarget()
  const camera = new PerspectiveCamera()
  disconnect = new MouseLook(
    canvas as unknown as HTMLCanvasElement,
    camera,
  ).connect(button as HTMLElement)
  return { button, canvas, camera, documentTarget, windowTarget }
}

it('handles a rejected request and enables playable drag mode', async () => {
  const request = vi.fn().mockRejectedValue(new Error('Unavailable'))
  const { button, windowTarget } = setup(request)
  button.dispatchEvent(new Event('click'))
  expect(request).toHaveBeenCalledOnce()
  await Promise.resolve()
  expect(useGameStore.getState().fallback).toBe(true)
  windowTarget.dispatchEvent(
    Object.assign(new Event('keydown'), { code: 'Escape' }),
  )
  expect(useGameStore.getState().fallback).toBe(false)
})

it('ignores a late rejection after cleanup', async () => {
  let reject!: (reason: Error) => void
  const { button } = setup(
    () =>
      new Promise((_resolve, fail) => {
        reject = fail
      }),
  )
  button.dispatchEvent(new Event('click'))
  disconnect?.()
  reject(new Error('Unavailable'))
  await Promise.resolve()
  expect(useGameStore.getState().fallback).toBe(false)
})

it('rotates only while dragging in fallback mode', () => {
  const { canvas, camera, documentTarget } = setup(() => Promise.resolve())
  useGameStore.getState().setFallback(true)
  const move = () =>
    documentTarget.dispatchEvent(
      Object.assign(new Event('mousemove'), { clientX: 50, clientY: 30 }),
    )
  move()
  expect(camera.quaternion.y).toBe(0)
  canvas.dispatchEvent(
    Object.assign(new Event('mousedown'), {
      button: 0,
      clientX: 0,
      clientY: 0,
    }),
  )
  move()
  expect(camera.quaternion.y).not.toBe(0)
  documentTarget.dispatchEvent(new Event('mouseup'))
  const rotation = camera.quaternion.clone()
  move()
  expect(camera.quaternion.equals(rotation)).toBe(true)
})
