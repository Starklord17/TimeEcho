import { readFile, stat } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'
import assert from 'node:assert/strict'
import { log } from 'node:console'

// Check the actual production graph, not filenames from a particular build.
const manifest = JSON.parse(await readFile('dist/.vite/manifest.json', 'utf8'))
const entry = manifest['index.html']
assert(entry?.isEntry, 'Missing application entry in the Vite manifest')
const initial = new Set()
function collect(key) {
  if (initial.has(key)) return
  initial.add(key)
  for (const imported of manifest[key].imports ?? []) collect(imported)
}
collect('index.html')
assert(
  entry.dynamicImports?.includes('src/game/Game.tsx'),
  'The game must load asynchronously',
)
let initialBytes = 0
let totalGzip = 0
for (const [key, chunk] of Object.entries(manifest)) {
  if (!chunk.file.endsWith('.js')) continue
  const bytes = (await stat(`dist/${chunk.file}`)).size
  const gzip = gzipSync(await readFile(`dist/${chunk.file}`)).length
  totalGzip += gzip
  if (initial.has(key)) initialBytes += bytes
  log(
    `${chunk.file}: ${(bytes / 1000).toFixed(2)} kB / ${(gzip / 1000).toFixed(2)} kB gzip`,
  )
  if (/\/(physics|three)-/.test(chunk.file))
    assert(!initial.has(key), '3D vendors must not block the UI entry')
}
assert(
  initialBytes <= 230_000,
  `Initial JavaScript exceeds 230 kB: ${initialBytes}`,
)
assert(
  totalGzip <= 1_300_000,
  `Total JavaScript exceeds 1.3 MB gzip: ${totalGzip}`,
)
log(
  `PASS: initial ${(initialBytes / 1000).toFixed(2)} kB; total ${(totalGzip / 1000).toFixed(2)} kB gzip`,
)
