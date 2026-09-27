import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Mesh, Raycaster, Vector3, DoubleSide } from 'three'
import { LEVELS } from './levelMetadata'
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
  for (const { id: level } of LEVELS) {
    it(`${level} contains static geometry only, with bounded dimensions`, async () => {
      const gltf = await load(level)
      validateEnvironmentAsset(gltf.scene, level)
      expect(gltf.animations).toHaveLength(0)
      expect(gltf.scenes).toHaveLength(1)
      expect(gltf.scene.children).toHaveLength(1)
      gltf.scene.traverse((node) => {
        expect(node.type.endsWith('Light')).toBe(false)
        if (node instanceof Mesh)
          expect(node.geometry.attributes.position.count).toBeGreaterThan(0)
      })
      gltf.scene.getObjectByName('Environment_Static')!.scale.setScalar(100)
      expect(() => validateEnvironmentAsset(gltf.scene, level)).toThrow(
        'bounds',
      )
    })
  }
  it('rejects a displaced Reversal and a room validated for the wrong level', async () => {
    const { scene } = await load('reversal')
    expect(() => validateEnvironmentAsset(scene, 'convergence')).toThrow(
      'bounds',
    )
    const root = scene.getObjectByName('Environment_Static')!
    root.position.z += 1
    expect(() => validateEnvironmentAsset(scene, 'reversal')).toThrow('bounds')
  })
  it('preserves Reversal gate and window apertures in the exported geometry', async () => {
    const { scene } = await load('reversal')
    scene.traverse((node) => {
      if (node instanceof Mesh) {
        for (const material of Array.isArray(node.material)
          ? node.material
          : [node.material])
          material.side = DoubleSide
      }
    })
    scene.updateMatrixWorld(true)
    const ray = new Raycaster()
    for (const z of [6, -2, -10]) {
      ray.set(new Vector3(0, 1.8, z + 0.5), new Vector3(0, 0, -1))
      ray.far = 1
      expect(ray.intersectObject(scene, true)).toHaveLength(0)
    }
    for (const z of [6, -2])
      for (const x of [-3.2, 3.2]) {
        ray.set(new Vector3(x, 1.9, z + 0.5), new Vector3(0, 0, -1))
        expect(ray.intersectObject(scene, true)).toHaveLength(0)
        ray.set(new Vector3(x, 0.8, z + 0.5), new Vector3(0, 0, -1))
        expect(ray.intersectObject(scene, true).length).toBeGreaterThan(0)
      }
  })
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
