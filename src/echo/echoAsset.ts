import {
  Box3,
  Mesh,
  Object3D,
  Quaternion,
  Vector3,
  SkinnedMesh,
  type AnimationClip,
} from 'three'

export const ECHO_ASSET_URL = `${import.meta.env.BASE_URL}models/characters/echo.glb`
export const ECHO_VISUAL: { mode: 'glb' | 'procedural' } = { mode: 'glb' }

export const ECHO_BONES = [
  'Echo_Hips',
  'Echo_SpineBone',
  ...['Left', 'Right'].flatMap((side) =>
    ['UpperArm', 'Forearm', 'Thigh', 'Shin', 'Foot', 'Tail'].map(
      (part) => `Echo_${part}_${side}`,
    ),
  ),
]

export function validateEchoAsset(scene: Object3D, clips: AnimationClip[]) {
  const names = new Set<string>()
  let triangles = 0
  const materials = new Set<string>()
  scene.traverse((node) => {
    if (node.name && (names.has(node.name) || /\.\d{3}$/.test(node.name)))
      throw new Error(`Echo: duplicate/suffixed name ${node.name}`)
    if (node.name) names.add(node.name)
    if (node instanceof Mesh) {
      if (
        node instanceof SkinnedMesh &&
        (node.skeleton.bones.length !== ECHO_BONES.length ||
          node.skeleton.bones.some((b) => !ECHO_BONES.includes(b.name)))
      )
        throw new Error('Echo: unexpected skeleton')
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
  const gaze = scene.getObjectByName('Echo_GlassesBridge')
  const rig = scene.getObjectByName('Echo_Rig')
  const neck = scene.getObjectByName('Echo_NeckGuard')
  if (
    !root ||
    !body ||
    !head ||
    !torso ||
    !headMesh ||
    !gaze ||
    body.parent !== root ||
    head.parent !== root ||
    !rig ||
    rig.parent !== body ||
    torso.parent !== rig ||
    headMesh.parent !== head ||
    gaze.parent !== head
  )
    throw new Error('Echo: missing required hierarchy')
  if (
    !(neck instanceof Mesh) ||
    !(neck instanceof SkinnedMesh) ||
    neck.parent !== rig ||
    Array.isArray(neck.material) ||
    neck.material.name !== 'M_Echo_Fabric' ||
    neck.material.opacity !== 1 ||
    neck.material.transparent
  )
    throw new Error('Echo: missing opaque neck guard')
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
  for (const name of [
    'M_Echo_Shell',
    'M_Echo_Core',
    'M_Echo_Chin',
    'M_Echo_GlassesFrame',
    'M_Echo_GlassesLens',
  ])
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
  rig.traverse((node) => {
    if ('isBone' in node && !ECHO_BONES.includes(node.name))
      throw new Error('Echo: unexpected bone')
    if (node instanceof Mesh && !(node instanceof SkinnedMesh))
      throw new Error('Echo: unbound body mesh')
  })
  for (const name of ECHO_BONES) {
    const bone = scene.getObjectByName(name)
    if (!bone || !('isBone' in bone) || !rig.getObjectByName(name))
      throw new Error('Echo: missing bone')
    const side = name.endsWith('Left') ? 'Left' : 'Right'
    const parent =
      name === 'Echo_Hips'
        ? 'Echo_Rig'
        : name === 'Echo_SpineBone' || name.startsWith('Echo_Thigh_')
          ? 'Echo_Hips'
          : name.startsWith('Echo_Forearm_')
            ? `Echo_UpperArm_${side}`
            : name.startsWith('Echo_Shin_')
              ? `Echo_Thigh_${side}`
              : name.startsWith('Echo_Foot_')
                ? `Echo_Shin_${side}`
                : 'Echo_SpineBone'
    if (bone.parent?.name !== parent)
      throw new Error('Echo: unexpected bone hierarchy')
  }
  for (const side of ['Left', 'Right']) {
    for (const part of ['Frame', 'Lens', 'Temple', 'Accent']) {
      if (scene.getObjectByName(`Echo_Glasses${part}_${side}`)?.parent !== head)
        throw new Error('Echo: missing glasses hierarchy')
    }
  }
  if (
    clips.length !== 2 ||
    new Set(clips.map((c) => c.name)).size !== 2 ||
    !clips.some((c) => c.name === 'Idle') ||
    !clips.some((c) => c.name === 'Walk')
  )
    throw new Error('Echo: expected only Idle and Walk clips')
  for (const clip of clips) {
    if (
      !Number.isFinite(clip.duration) ||
      clip.duration <= 0 ||
      !clip.tracks.length
    )
      throw new Error('Echo: empty animation')
    for (const track of clip.tracks) {
      const [target, property] = track.name.split('.')
      if (
        !ECHO_BONES.includes(target) ||
        !['position', 'quaternion', 'scale'].includes(property)
      )
        throw new Error('Echo: forbidden animation target/root motion')
      if (![...track.values, ...track.times].every(Number.isFinite))
        throw new Error('Echo: invalid animation values')
      const stride = track.getValueSize()
      if (property === 'position') {
        for (let j = 0; j < track.values.length; j++) {
          const limit = target === 'Echo_Hips' ? 0.04 : 0.001
          if (Math.abs(track.values[j] - track.values[j % stride]) > limit)
            throw new Error('Echo: body displacement/root motion')
        }
      }
      if (
        property === 'scale' &&
        [...track.values].some((v) => Math.abs(v - 1) > 0.001)
      )
        throw new Error('Echo: animated scale')
      for (let j = 0; j < stride; j++)
        if (
          Math.abs(
            track.values[j] - track.values[track.values.length - stride + j],
          ) > 0.001
        )
          throw new Error('Echo: non-looping animation/root motion')
    }
  }
  return { root, body, head, triangles, size, bounds }
}
