import { Box3, Mesh, Object3D, Quaternion, Vector3 } from 'three'

export const ECHO_ASSET_URL = `${import.meta.env.BASE_URL}models/characters/echo.glb`
export const ECHO_VISUAL: { mode: 'glb' | 'procedural' } = { mode: 'glb' }

export function validateEchoAsset(scene: Object3D) {
  const names = new Set<string>()
  let triangles = 0
  const materials = new Set<string>()
  scene.traverse((node) => {
    if (node.name && (names.has(node.name) || /\.\d{3}$/.test(node.name)))
      throw new Error(`Echo: duplicate/suffixed name ${node.name}`)
    if (node.name) names.add(node.name)
    if (node instanceof Mesh) {
      if ('isSkinnedMesh' in node && node.isSkinnedMesh)
        throw new Error('Echo: rigs are not supported')
      triangles +=
        (node.geometry.index?.count ??
          node.geometry.attributes.position.count) / 3
      for (const material of Array.isArray(node.material)
        ? node.material
        : [node.material])
        materials.add(material.name)
    }
  })
  const root = scene.getObjectByName('Echo_Root')
  const body = scene.getObjectByName('Echo_Body')
  const head = scene.getObjectByName('Echo_HeadPivot')
  const torso = scene.getObjectByName('Echo_Torso')
  const headMesh = scene.getObjectByName('Echo_Head')
  const gaze = scene.getObjectByName('Echo_Gaze')
  if (
    !root ||
    !body ||
    !head ||
    !torso ||
    !headMesh ||
    !gaze ||
    body.parent !== root ||
    head.parent !== root ||
    torso.parent !== body ||
    headMesh.parent !== head ||
    gaze.parent !== head
  )
    throw new Error('Echo: missing required hierarchy')
  if (
    ![...names].some((n) => n.startsWith('Echo_Arm')) ||
    ![...names].some((n) => n.startsWith('Echo_Leg'))
  )
    throw new Error('Echo: incomplete silhouette')
  if (
    root.position.length() > 0.001 ||
    root.quaternion.angleTo(new Quaternion()) > 0.001 ||
    root.scale.distanceTo(new Vector3(1, 1, 1)) > 0.001
  )
    throw new Error('Echo: root must have identity transform')
  if (triangles > 8000 || triangles <= 0)
    throw new Error('Echo: triangle budget exceeded or empty')
  for (const name of ['M_Echo_Shell', 'M_Echo_Core', 'M_Echo_Gaze'])
    if (!materials.has(name)) throw new Error(`Echo: missing material ${name}`)
  scene.updateMatrixWorld(true)
  const bounds = new Box3().setFromObject(root)
  const size = bounds.getSize(new Vector3())
  if (size.y < 1.63 || size.y > 1.77 || size.x > 0.62 || size.z > 0.47)
    throw new Error('Echo: dimensions outside envelope')
  if (Math.abs(bounds.min.y + 0.91) > 0.025)
    throw new Error('Echo: feet must match player floor offset')
  const gazePosition = new Box3().setFromObject(gaze).getCenter(new Vector3())
  if (gazePosition.z >= -0.07)
    throw new Error('Echo: gaze must face runtime -Z')
  return { root, body, head, triangles, size, bounds }
}
