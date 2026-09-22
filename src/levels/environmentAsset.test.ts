import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Mesh } from 'three'
import { validateEnvironmentAsset, preparePlateAsset } from './environmentAsset'
import { validateDoorAsset } from '../puzzle/doorAsset'

async function load(name: string) {
  const bytes = await readFile(`public/models/environment/${name}.glb`)
  return new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  )
}
describe('production environment GLBs', () => {
  for (const level of ['empty-room', 'split-signal', 'convergence']) {
    it(`${level} contains static geometry only, with bounded dimensions`, async () => {
      const gltf = await load(level)
      validateEnvironmentAsset(gltf.scene)
      expect(gltf.animations).toHaveLength(0)
      expect(gltf.scenes).toHaveLength(1)
      expect(gltf.scene.children).toHaveLength(1)
      gltf.scene.traverse((node) => {
        expect(node.type.endsWith('Light')).toBe(false)
        if (node instanceof Mesh)
          expect(node.geometry.attributes.position.count).toBeGreaterThan(0)
      })
      gltf.scene.getObjectByName('Environment_Static')!.scale.setScalar(100)
      expect(() => validateEnvironmentAsset(gltf.scene)).toThrow('bounds')
    })
  }
  it('loads the production door with the existing movement contract', async () => {
    const gltf = await load('door')
    validateDoorAsset(gltf.scene)
    expect(gltf.animations).toHaveLength(0)
    expect(gltf.scenes).toHaveLength(1)
  })
  it('loads a plate with separate actor indicators and no unrelated scenes', async () => {
    const gltf = await load('plate')
    preparePlateAsset(gltf.scene)
    expect(gltf.scenes).toHaveLength(1)
    const player = gltf.scene.getObjectByName('Plate_Player') as Mesh
    const echo = gltf.scene.getObjectByName('Plate_Echo') as Mesh
    expect(player.parent?.name).toBe('Plate_Panel')
    expect(echo.parent).toBe(player.parent)
    expect(player.material).not.toBe(echo.material)
  })
})
