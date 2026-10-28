// Generate the shared Relay art specification; --spec-only leaves the GLB intact.
import { Buffer } from 'node:buffer'
import { log } from 'node:console'
import process from 'node:process'
import { readFile, writeFile } from 'node:fs/promises'
import { Scene, Group, Mesh, BoxGeometry, MeshStandardMaterial } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
const manifest = JSON.parse(
  await readFile('assets/blender/environment-layout.json', 'utf8'),
)
const level = manifest.levels.find((l) => l.id === 'relay')
const palette = {
  structure: { color: '#4d5b65', roughness: 0.65, metalness: 0.2 },
  ceramic: { color: '#9aa4aa', roughness: 0.65, metalness: 0.1 },
  recess: { color: '#212a30', roughness: 0.8, metalness: 0 },
  floor: { color: '#6f7c84', roughness: 0.7, metalness: 0.1 },
  cyan: { color: '#61a8b1', roughness: 0.55, metalness: 0.1 },
  amber: { color: '#caa570', roughness: 0.55, metalness: 0.1 },
  diffuser: { color: '#d9e7eb', roughness: 0.4, metalness: 0, emission: 1 },
}
const parts = []
const box = (name, position, size, material) =>
  parts.push({ name, position, size, material, ...palette[material] })
// Structure exactly follows gameplay. Floor faces finish at y=0.
level.boxes.forEach((b, i) =>
  box(
    `Structure_${i}`,
    i === 0 ? [0, -0.1625, 0] : b.position,
    i === 0 ? [20.6, 0.275, 32.6] : b.size,
    i === 0 ? 'recess' : 'structure',
  ),
)
for (let x = -9; x < 10; x += 2)
  for (let z = -15; z < 16; z += 2)
    box('FloorTile', [x, -0.012, z], [1.975, 0.024, 1.975], 'floor')
for (const side of [-1, 1])
  for (let z = -15; z < 16; z += 2) {
    box('WallPanel', [side * 9.974, 1.9, z], [0.05, 2.78, 1.88], 'ceramic')
    box('WallFoot', [side * 9.94, 0.32, z], [0.06, 0.18, 1.88], 'recess')
    box('WallCrown', [side * 9.92, 3.37, z], [0.1, 0.16, 1.94], 'structure')
    if (z % 4 === 1)
      box('WallVent', [side * 9.94, 2.95, z], [0.055, 0.14, 1.2], 'recess')
  }
for (const z of [-15.974, 15.974])
  for (let x = -9; x < 10; x += 2)
    box('EndPanel', [x, 1.9, z], [1.88, 2.78, 0.05], 'ceramic')
// Ceiling tiles leave the entire sliding-door pocket clear.
for (let x = -9; x < 10; x += 2)
  for (let z = -15; z < 16; z += 2) {
    if (Math.abs(x) < 2 && (z === -13 || z === -11)) continue
    box('CeilingTile', [x, 3.7, z], [1.98, 0.18, 1.98], 'ceramic')
  }
for (const z of [10, 2, -6])
  box('CeilingRib', [0, 3.5, z], [19.8, 0.18, 0.16], 'structure')
for (const side of [-1, 1]) {
  box('ExitFacing', [side * 5.6, 1.9, -11.82], [8.65, 2.78, 0.04], 'ceramic')
  box('ExitReveal', [side * 1.26, 1.8, -11.78], [0.12, 3.6, 0.1], 'structure')
  box('Pocket', [side * 1.28, 5.55, -12], [0.12, 3.9, 0.5], 'structure')
}
box('PocketCap', [0, 7.45, -12], [2.68, 0.1, 0.5], 'structure')
for (const [z, material] of [
  [6, 'cyan'],
  [-6, 'amber'],
]) {
  for (const side of [-1, 1]) {
    box('SectorBand', [side * 9.93, 1.15, z], [0.04, 0.22, 5.9], material)
    // Flush wall-mounted service panels stay outside the walkable routes.
    box('ServicePanel', [side * 9.88, 1.75, z], [0.12, 1.2, 1.2], 'structure')
    for (let n = 0; n < 3; n++)
      box(
        'ServiceIndicator',
        [side * 9.81, 1.9 - n * 0.17, z],
        [0.025, 0.04, 0.75],
        material,
      )
  }
  for (const x of [-6, -2, 2, 6]) {
    for (const dx of [-1.04, 1.04])
      box('StationBorder', [x + dx, 0.006, z], [0.04, 0.01, 2.12], material)
    for (const dz of [-1.04, 1.04])
      box('StationBorder', [x, 0.006, z + dz], [2.12, 0.01, 0.04], material)
  }
}
for (const x of [-6, -2, 2, 6])
  box('RelayRoute', [x, 0.006, 0], [0.035, 0.01, 9.8], 'structure')
for (const f of level.fixtures) {
  const [x, , z] = f.position
  box('FixtureHousing', [x, 3.48, z], [2.65, 0.16, 0.5], 'structure')
  box('FixtureDiffuser', [x, 3.388, z], [2.4, 0.025, 0.32], 'diffuser')
  for (const dx of [-1, 1])
    box('FixtureSupport', [x + dx, 3.6, z], [0.065, 0.2, 0.065], 'structure')
}
box('ExitThreshold', [0, 0.006, -14], [2, 0.01, 1.4], 'amber')
await writeFile(
  'assets/blender/relay-art.json',
  JSON.stringify(parts, null, 2) + '\n',
)
if (!process.argv.includes('--spec-only')) {
  class Reader {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then((value) => {
        this.result = value
        this.onloadend?.()
      })
    }
  }
  globalThis.FileReader = Reader
  const scene = new Scene(),
    root = new Group()
  root.name = 'Environment_Static'
  scene.add(root)
  for (const [name, p] of Object.entries(palette)) {
    const geometries = parts
      .filter((part) => part.material === name)
      .map((part) => new BoxGeometry(...part.size).translate(...part.position))
    const material = new MeshStandardMaterial({
      color: p.color,
      roughness: p.roughness,
      metalness: p.metalness,
      emissive: p.emission ? p.color : '#000000',
      emissiveIntensity: p.emission ?? 0,
    })
    const mesh = new Mesh(mergeGeometries(geometries), material)
    mesh.name = `Relay_${name}`
    root.add(mesh)
  }
  const result = await new GLTFExporter().parseAsync(scene, { binary: true })
  await writeFile('public/models/environment/relay.glb', Buffer.from(result))
}
log(
  `Relay: ${parts.length} authored parts, ${parts.length * 12} triangles, ${Object.keys(palette).length} material groups`,
)
