import { Box3, Mesh, Vector3, type Object3D } from 'three'
import type { LevelId } from './levelMetadata'

const ROOM_BOUNDS: Record<
  LevelId,
  { width: number; depth: number; centerZ: number }
> = {
  'empty-room': { width: 12.6, depth: 14.6, centerZ: 0 },
  'split-signal': { width: 16.6, depth: 18.6, centerZ: 0 },
  convergence: { width: 16.6, depth: 18.6, centerZ: 0 },
  reversal: { width: 12.6, depth: 32.6, centerZ: -1 },
}

export function validateEnvironmentAsset(scene: Object3D, levelId?: LevelId) {
  const root = scene.getObjectByName('Environment_Static')
  if (!root) throw new Error('Environment GLB: missing static geometry')
  let triangles = 0
  root.traverse((node) => {
    if (node instanceof Mesh)
      triangles +=
        (node.geometry.index?.count ??
          node.geometry.attributes.position.count) / 3
    if (node.type === 'SkinnedMesh' || node.type.endsWith('Light'))
      throw new Error('Environment GLB: static meshes only')
  })
  const bounds = new Box3().setFromObject(root)
  const size = bounds.getSize(new Vector3())
  const expected = levelId ? ROOM_BOUNDS[levelId] : undefined
  const horizontalBoundsValid = expected
    ? Math.abs(size.x - expected.width) < 0.02 &&
      Math.abs(size.z - expected.depth) < 0.02 &&
      Math.abs((bounds.min.x + bounds.max.x) / 2) < 0.01 &&
      Math.abs((bounds.min.z + bounds.max.z) / 2 - expected.centerZ) < 0.01
    : size.x >= 12 && size.x <= 17 && size.z >= 14 && size.z <= 19
  if (
    triangles === 0 ||
    triangles > 14000 ||
    !horizontalBoundsValid ||
    (expected && Math.abs(bounds.min.y + 0.3) > 0.02) ||
    size.y < 7 ||
    size.y > 8
  )
    throw new Error('Environment GLB: invalid bounds or triangle budget')
}

export function validatePlateAsset(scene: Object3D) {
  const root = scene.getObjectByName('Plate_Root')
  for (const name of [
    'Plate_Base',
    'Plate_Panel',
    'Plate_Player',
    'Plate_Echo',
  ])
    if (!(root?.getObjectByName(name) instanceof Mesh))
      throw new Error('Plate GLB: missing ' + name)
  const size = new Box3().setFromObject(root!).getSize(new Vector3())
  if (
    Math.abs(size.x - 1.8) > 0.01 ||
    Math.abs(size.z - 1.8) > 0.01 ||
    size.y > 0.1
  )
    throw new Error('Plate GLB: invalid footprint')
}

export function preparePlateAsset(scene: Object3D) {
  validatePlateAsset(scene)
  // The GLB shares the cyan material; runtime actor indicators must be independent.
  for (const name of ['Plate_Player', 'Plate_Echo']) {
    const mesh = scene.getObjectByName(name) as Mesh
    mesh.material = Array.isArray(mesh.material)
      ? mesh.material.map((material) => material.clone())
      : mesh.material.clone()
  }
}
