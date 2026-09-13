import { afterEach, expect, it, vi } from 'vitest'
import { downloadRun } from './downloadRun'
import { Recorder } from './Recorder'

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})
it('downloads the serialized run and releases its temporary URL', async () => {
  vi.useFakeTimers()
  const recorder = new Recorder()
  recorder.begin(4, { x: 0, y: 0.92, z: 4 }, { x: 0, y: 0, z: 0, w: 1 })
  const run = recorder.finish('restart')
  let savedBlob: Blob | undefined
  vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    savedBlob = blob as Blob
    return 'blob:test'
  })
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  const link = { href: '', download: '', click: vi.fn(), remove: vi.fn() }
  vi.stubGlobal('document', {
    createElement: () => link,
    body: { appendChild: vi.fn() },
  })
  downloadRun(run)
  expect(link.download).toBe('time-echo-cycle-4.json')
  expect(link.href).toBe('blob:test')
  expect(link.click).toHaveBeenCalledOnce()
  expect(link.remove).toHaveBeenCalledOnce()
  expect(JSON.parse(await savedBlob!.text())).toEqual(run)
  expect(revoke).not.toHaveBeenCalled()
  vi.advanceTimersByTime(1000)
  expect(revoke).toHaveBeenCalledWith('blob:test')
})
