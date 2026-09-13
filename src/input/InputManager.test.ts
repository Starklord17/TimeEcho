import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { InputManager } from './InputManager'

let windowTarget: EventTarget
let documentTarget: EventTarget & { pointerLockElement: object | null }
let input: InputManager
let disconnect: () => void

function key(type: string, code: string) {
  const event = new Event(type, { cancelable: true })
  Object.defineProperty(event, 'code', { value: code })
  windowTarget.dispatchEvent(event)
  return event
}

beforeEach(() => {
  windowTarget = new EventTarget()
  documentTarget = Object.assign(new EventTarget(), {
    pointerLockElement: {} as object | null,
  })
  vi.stubGlobal('window', windowTarget)
  vi.stubGlobal('document', documentTarget)
  input = new InputManager()
  disconnect = input.connect()
})
afterEach(() => {
  disconnect()
  vi.unstubAllGlobals()
})

it('ignores movement when the mouse is not captured', () => {
  documentTarget.pointerLockElement = null
  expect(key('keydown', 'KeyW').defaultPrevented).toBe(false)
  expect(input.forward).toBe(0)
})
it('tracks physical WASD keys, releases and opposing inputs', () => {
  expect(key('keydown', 'KeyW').defaultPrevented).toBe(true)
  key('keydown', 'KeyD')
  expect([input.forward, input.right]).toEqual([1, 1])
  key('keydown', 'KeyS')
  expect(input.forward).toBe(0)
  key('keyup', 'KeyW')
  expect(input.forward).toBe(-1)
  key('keyup', 'KeyD')
  expect(input.right).toBe(0)
})
it.each(['blur', 'visibilitychange', 'pointerlockchange'])(
  'clears held keys on %s',
  (event) => {
    key('keydown', 'KeyW')
    ;(event === 'blur' ? windowTarget : documentTarget).dispatchEvent(
      new Event(event),
    )
    expect(input.forward).toBe(0)
  },
)
it('disconnects listeners and can reconnect after StrictMode cleanup', () => {
  key('keydown', 'KeyW')
  disconnect()
  key('keydown', 'KeyD')
  expect([input.forward, input.right]).toEqual([0, 0])
  disconnect = input.connect()
  key('keydown', 'KeyA')
  expect(input.right).toBe(-1)
})

it('tracks arrow look independently of WASD and cancels opposing arrows', () => {
  expect(key('keydown', 'ArrowRight').defaultPrevented).toBe(true)
  key('keydown', 'ArrowUp')
  key('keydown', 'KeyW')
  expect([input.lookRight, input.lookUp, input.forward]).toEqual([1, 1, 1])
  key('keydown', 'ArrowLeft')
  key('keydown', 'ArrowDown')
  expect([input.lookRight, input.lookUp]).toEqual([0, 0])
  key('keyup', 'ArrowRight')
  key('keyup', 'ArrowUp')
  expect([input.lookRight, input.lookUp]).toEqual([-1, -1])
  input.clear()
  expect([input.lookRight, input.lookUp]).toEqual([0, 0])
})
it('does not consume arrows while the game is inactive', () => {
  documentTarget.pointerLockElement = null
  expect(key('keydown', 'ArrowLeft').defaultPrevented).toBe(false)
  expect(input.lookRight).toBe(0)
})
