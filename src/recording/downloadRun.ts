import type { RecordedRun } from './Recorder'

export function downloadRun(run: RecordedRun) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = `time-echo-cycle-${run.cycle}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Let the browser consume the download before releasing the temporary URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
