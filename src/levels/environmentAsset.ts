import { Box3, Mesh, Vector3, type Object3D } from 'three'

export function validateEnvironmentAsset(scene: Object3D) {
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
  const size = new Box3().setFromObject(root).getSize(new Vector3())
  if (
    triangles === 0 ||
    triangles > 14000 ||
    size.x < 12 ||
    size.x > 17 ||
    size.z < 14 ||
    size.z > 19 ||
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
