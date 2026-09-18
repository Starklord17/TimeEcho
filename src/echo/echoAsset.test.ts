/// <reference types="node" />
import { beforeAll, expect, it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import {
  Group,
  Object3D,
  Mesh,
  MeshStandardMaterial,
  AnimationClip,
  VectorKeyframeTrack,
  Vector3,
  SkinnedMesh,
  Box3,
} from 'three'
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js'
import { EchoAnimator } from './EchoAnimator'
import { Recorder } from '../recording/Recorder'
import { validateEchoAsset } from './echoAsset'
let scene: Object3D
let clips: AnimationClip[]
beforeAll(async () => {
  const bytes = await readFile('public/models/characters/echo.glb')
  const gltf = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  )
  expect(gltf.animations).toHaveLength(2)
  clips = gltf.animations
  scene = gltf.scene
})

it('keeps an opaque neck overlap through Walk and the full supported look range', () => {
  const instance = cloneSkeleton(scene)
  const { head, body } = validateEchoAsset(instance, clips)
  const neck = instance.getObjectByName('Echo_NeckGuard') as SkinnedMesh
  expect(neck.parent).toBe(instance.getObjectByName('Echo_Rig'))
  expect(neck instanceof SkinnedMesh).toBe(true)
  let shellFound = false
  let chinFound = false
  instance.getObjectByName('Echo_Head')!.traverse((node) => {
    if (!(node instanceof Mesh)) return
    const material = node.material as MeshStandardMaterial
    if (material.name === 'M_Echo_Shell') {
      shellFound = true
      expect(material.opacity).toBeCloseTo(0.62)
    } else if (material.name === 'M_Echo_Chin') {
      chinFound = true
      expect(material.opacity).toBe(1)
      expect(material.transparent).toBe(false)
      // Only the bottom 12.5 cm is sealed; the rest of the head stays spectral.
      node.geometry.computeBoundingBox()
      expect(node.geometry.boundingBox!.max.y).toBeLessThanOrEqual(-0.079)
    }
  })
  expect(shellFound && chinFound).toBe(true)
  const animator = new EchoAnimator(instance, clips)
  const r = new Recorder()
  r.begin(1, { x: 0, y: 0.91, z: 0 }, { x: 0, y: 0, z: 0, w: 1 })
  r.capture(3, { x: 0, y: 0.91, z: -3 }, { x: 0, y: 0, z: 0, w: 1 })
  const run = r.finish('restart')
  for (const time of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
    animator.sample(run, time)
    for (const pitch of [
      -Math.PI / 2 + 0.01,
      -0.65,
      0,
      0.65,
      Math.PI / 2 - 0.01,
    ]) {
      for (const yaw of [0, 0.7, Math.PI / 2, Math.PI]) {
        head.rotation.set(pitch, yaw, 0, 'YXZ')
        body.rotation.y = yaw
        instance.updateMatrixWorld(true)
        neck.computeBoundingBox()
        const neckBounds = new Box3().setFromObject(neck)
        const headBounds = new Box3().setFromObject(head)
        expect(neckBounds.max.y - headBounds.min.y).toBeGreaterThan(0.01)
        // Neck base stays buried in the animated torso, even at maximum dip.
        const torso = instance.getObjectByName('Echo_Torso') as SkinnedMesh
        torso.computeBoundingBox()
        expect(
          new Box3().setFromObject(torso).max.y - neckBounds.min.y,
        ).toBeGreaterThan(0.06)
      }
    }
  }
  animator.dispose()
  neck.material = new MeshStandardMaterial({ transparent: true, opacity: 0.5 })
  expect(() => validateEchoAsset(instance, clips)).toThrow('opaque neck')
})
it('loads the authored GLB with identity root, correct feet/front and web budget', () => {
  const { size, triangles, body, head } = validateEchoAsset(scene, clips)
  expect(size.y).toBeCloseTo(1.7)
  expect(triangles).toBeGreaterThanOrEqual(3000)
  expect(triangles).toBeLessThanOrEqual(6000)
  expect(body).not.toBe(head)
})
it('rejects missing hierarchy, duplicates, scale and excess triangles', () => {
  let clone = scene.clone(true)
  clone.getObjectByName('Echo_Head')!.name = 'Missing'
  expect(() => validateEchoAsset(clone, clips)).toThrow('hierarchy')
  clone = scene.clone(true)
  const duplicate = new Group()
  duplicate.name = 'Echo_GlassesBridge'
  clone.add(duplicate)
  expect(() => validateEchoAsset(clone, clips)).toThrow('duplicate')
  clone = scene.clone(true)
  clone.getObjectByName('Echo_Root')!.scale.setScalar(2)
  expect(() => validateEchoAsset(clone, clips)).toThrow('identity')
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
  expect(() => validateEchoAsset(clone, clips)).toThrow('budget')
})
it('rejects reversed gaze and keeps body/head transforms independent', () => {
  const clone = scene.clone(true)
  const { body, head } = validateEchoAsset(clone, clips)
  const original = head.quaternion.clone()
  body.rotation.y = 0.8
  expect(head.quaternion.equals(original)).toBe(true)
  body.rotation.y = 0
  head.rotation.y = Math.PI
  expect(() => validateEchoAsset(clone, clips)).toThrow('gaze')
})

it('keeps clothing opaque and attached to body with spectral head separate', () => {
  const { head } = validateEchoAsset(scene, clips)
  for (const name of [
    'Echo_Coat_Left',
    'Echo_Coat_Right',
    'Echo_Collar_Left',
    'Echo_Collar_Right',
  ]) {
    const mesh = scene.getObjectByName(name) as Mesh
    expect(mesh.parent).toBe(scene.getObjectByName('Echo_Rig'))
    const material = mesh.material as MeshStandardMaterial
    expect(material.name).toBe('M_Echo_Coat')
    expect(material.opacity).toBe(1)
    expect(material.transparent).toBe(false)
    expect(material.emissive.getHex()).toBe(0)
  }
  expect(scene.getObjectByName('Echo_Head')!.parent).toBe(head)
})

it('rejects missing/extra clips, root/head tracks and non-looping motion', () => {
  expect(() => validateEchoAsset(scene, [])).toThrow('Idle and Walk')
  expect(() => validateEchoAsset(scene, [...clips, clips[0]])).toThrow(
    'Idle and Walk',
  )
  for (const target of ['Echo_Root', 'Echo_Body', 'Echo_HeadPivot']) {
    const invalid = clips.map((c) => c.clone())
    invalid[0].tracks.push(
      new VectorKeyframeTrack(`${target}.position`, [0, 3], [0, 0, 0, 0, 0, 1]),
    )
    expect(() => validateEchoAsset(scene, invalid)).toThrow('root motion')
  }
  const invalid = clips.map((c) => c.clone())
  invalid[0].tracks.find((t) => t.name.endsWith('.quaternion'))!.values[0] +=
    0.1
  expect(() => validateEchoAsset(scene, invalid)).toThrow('non-looping')
})

it('samples the real skinned GLB without moving root/head, floor penetration or shared skeletons', () => {
  const instance = cloneSkeleton(scene)
  const other = cloneSkeleton(scene)
  const { root, head } = validateEchoAsset(instance, clips)
  const animator = new EchoAnimator(instance, clips)
  const r = new Recorder()
  r.begin(1, { x: 0, y: 0.91, z: 0 }, { x: 0, y: 0, z: 0, w: 1 })
  r.capture(3, { x: 0, y: 0.91, z: -3 }, { x: 0, y: 0, z: 0, w: 1 })
  const run = r.finish('restart')
  head.rotation.set(0.3, 0.7, 0.1)
  const look = head.quaternion.clone()
  const v = new Vector3()
  let minY = Infinity
  let maxSupportY = -Infinity
  for (let frame = 0; frame <= 180; frame++) {
    animator.sample(run, frame / 60)
    instance.updateMatrixWorld(true)
    let supportY = Infinity
    instance.traverse((node) => {
      if (!(node instanceof SkinnedMesh)) return
      node.skeleton.update()
      for (let i = 0; i < node.geometry.attributes.position.count; i++) {
        node.getVertexPosition(i, v).applyMatrix4(node.matrixWorld)
        minY = Math.min(minY, v.y)
        if (node.name.startsWith('Echo_Leg')) supportY = Math.min(supportY, v.y)
      }
    })
    maxSupportY = Math.max(maxSupportY, supportY)
    expect(root.position.length()).toBe(0)
    expect(root.quaternion.w).toBe(1)
    expect(head.quaternion.equals(look)).toBe(true)
  }
  expect(minY).toBeGreaterThanOrEqual(-0.915)
  expect(maxSupportY).toBeLessThanOrEqual(-0.9)
  expect(instance.getObjectByName('Echo_Thigh_Left')).not.toBe(
    other.getObjectByName('Echo_Thigh_Left'),
  )
  animator.sample(run, 0.5)
  const pose = instance.getObjectByName('Echo_Thigh_Left')!.quaternion.clone()
  animator.sample(run, 2)
  animator.sample(run, 0.5)
  expect(
    instance.getObjectByName('Echo_Thigh_Left')!.quaternion.equals(pose),
  ).toBe(true)
  animator.dispose()
})
