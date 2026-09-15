/// <reference types="node" />
import { beforeAll, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { Group, Object3D, Mesh, MeshStandardMaterial } from 'three'
import { validateEchoAsset } from './echoAsset'
let scene: Object3D
beforeAll(async () => {
  const bytes = await readFile('public/models/characters/echo.glb')
  const gltf = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  )
  expect(gltf.animations).toHaveLength(0)
  scene = gltf.scene
})
it('loads the authored GLB with identity root, correct feet/front and web budget', () => {
  const { size, triangles, body, head } = validateEchoAsset(scene)
  expect(size.y).toBeCloseTo(1.7)
  expect(triangles).toBeGreaterThanOrEqual(3000)
  expect(triangles).toBeLessThanOrEqual(6000)
  expect(body).not.toBe(head)
})
it('rejects missing hierarchy, duplicates, scale and excess triangles', () => {
  let clone = scene.clone(true)
  clone.getObjectByName('Echo_Head')!.name = 'Missing'
  expect(() => validateEchoAsset(clone)).toThrow('hierarchy')
  clone = scene.clone(true)
  const duplicate = new Group()
  duplicate.name = 'Echo_Gaze'
  clone.add(duplicate)
  expect(() => validateEchoAsset(clone)).toThrow('duplicate')
  clone = scene.clone(true)
  clone.getObjectByName('Echo_Root')!.scale.setScalar(2)
  expect(() => validateEchoAsset(clone)).toThrow('identity')
  clone = scene.clone(true)
  for (let i = 0; i < 4; i++) {
    const extra = scene.getObjectByName('Echo_Torso')!.clone()
    extra.name = 'Extra' + i
    clone.add(extra)
  }
  // Add enough geometry to exceed the absolute budget.
  for (let i = 4; i < 12; i++) {
    const extra = scene.getObjectByName('Echo_Torso')!.clone()
    extra.name = 'Extra' + i
    clone.add(extra)
  }
  expect(() => validateEchoAsset(clone)).toThrow('budget')
})
it('rejects reversed gaze and keeps body/head transforms independent', () => {
  const clone = scene.clone(true)
  const { body, head } = validateEchoAsset(clone)
  const original = head.quaternion.clone()
  body.rotation.y = 0.8
  expect(head.quaternion.equals(original)).toBe(true)
  body.rotation.y = 0
  head.rotation.y = Math.PI
  expect(() => validateEchoAsset(clone)).toThrow('gaze')
})

it('keeps clothing opaque and attached to body with spectral head separate', () => {
  const { body, head } = validateEchoAsset(scene)
  for (const name of [
    'Echo_Coat_Left',
    'Echo_Coat_Right',
    'Echo_Collar_Left',
    'Echo_Collar_Right',
  ]) {
    const mesh = scene.getObjectByName(name) as Mesh
    expect(mesh.parent).toBe(body)
    const material = mesh.material as MeshStandardMaterial
    expect(material.name).toBe('M_Echo_Coat')
    expect(material.opacity).toBe(1)
    expect(material.transparent).toBe(false)
    expect(material.emissive.getHex()).toBe(0)
  }
  expect(scene.getObjectByName('Echo_Head')!.parent).toBe(head)
})
