/// <reference types="node" />
import { expect, it } from 'vitest'
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three'
import { validateDoorAsset } from './doorAsset'
function fixture() {
  const root = new Group()
  root.name = 'Door_Root'
  const panel = new Mesh(
    new BoxGeometry(2.4, 3.6, 0.3).translate(0, 1.8, 0),
    new MeshStandardMaterial(),
  )
  panel.name = 'Door_Panel'
  const frame = new Group()
  frame.name = 'Door_Frame'
  const light = new Mesh()
  light.name = 'Door_Light'
  root.add(panel, frame)
  frame.add(light)
  return { root, panel, frame, light }
}
it('accepts the floor-origin contract and rejects missing nodes and wrong scale', () => {
  const { root, panel, frame, light } = fixture()
  expect(validateDoorAsset(root).panel).toBe(panel)
  panel.scale.setScalar(100)
  expect(() => validateDoorAsset(root)).toThrow('measure')
  panel.scale.setScalar(1)
  frame.remove(light)
  expect(() => validateDoorAsset(root)).toThrow('expected')
})

it('loads the binary GLB fixture through the actual Three loader', async () => {
  const { readFile } = await import('node:fs/promises')
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js')
  const bytes = await readFile('assets/test-fixtures/door-contract.glb')
  const data = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  )
  const gltf = await new GLTFLoader().parseAsync(data, '')
  expect(validateDoorAsset(gltf.scene).panel.name).toBe('Door_Panel')
  await expect(
    new GLTFLoader().parseAsync(new ArrayBuffer(4), ''),
  ).rejects.toThrow()
})
