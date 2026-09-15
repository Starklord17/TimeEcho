import { Box3, Mesh, Object3D, Quaternion, Vector3 } from 'three'

// Opt in only after exporting the manual Blender asset. No request in procedural mode.
export const DOOR_ASSET: { mode: 'procedural' | 'glb'; url: string } = {
  mode: 'procedural',
  url: `${import.meta.env.BASE_URL}models/environment/door.glb`,
}

export function validateDoorAsset(scene: Object3D) {
  const root = scene.getObjectByName('Door_Root')
  const panel = scene.getObjectByName('Door_Panel')
  const frame = scene.getObjectByName('Door_Frame')
  const light = scene.getObjectByName('Door_Light')
  if (
    !root ||
    !(panel instanceof Mesh) ||
    !frame ||
    !(light instanceof Mesh) ||
    panel.parent !== root ||
    frame.parent !== root ||
    light.parent !== frame
  )
    throw new Error(
      'Door GLB: expected Door_Root > Door_Panel, Door_Frame > Door_Light',
    )
  scene.updateMatrixWorld(true)
  const bounds = new Box3().setFromObject(panel)
  const size = bounds.getSize(new Vector3())
  if (
    Math.abs(size.x - 2.4) > 0.02 ||
    Math.abs(size.y - 3.6) > 0.02 ||
    Math.abs(size.z - 0.3) > 0.02
  )
    throw new Error('Door GLB: panel must measure 2.4 × 3.6 × 0.3 m')
  for (const node of [root, panel]) {
    if (
      node.scale.distanceTo(new Vector3(1, 1, 1)) > 0.001 ||
      node.quaternion.angleTo(new Quaternion()) > 0.001
    )
      throw new Error('Door GLB: apply rotation and scale before export')
  }
  if (
    Math.abs(bounds.min.y) > 0.02 ||
    Math.abs(bounds.min.x + 1.2) > 0.02 ||
    Math.abs(bounds.min.z + 0.15) > 0.02
  )
    throw new Error(
      'Door GLB: panel geometry must be centered over its floor origin',
    )
  if (panel.position.length() > 0.001 || root.position.length() > 0.001)
    throw new Error(
      'Door GLB: root and panel origins must be at the floor center',
    )
  return { root, panel, light }
}
