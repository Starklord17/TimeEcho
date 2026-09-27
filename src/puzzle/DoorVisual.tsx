import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Group, MeshStandardMaterial } from 'three'
import { DOOR } from './PuzzleController'
import type { PuzzleRuntime, Position } from './PuzzleRuntime'
import { DOOR_ASSET, validateDoorAsset } from './doorAsset'

type Props = {
  runtimeRef: RefObject<PuzzleRuntime | null>
  open: boolean
  doorId?: string
  position?: Position
}

function readLift(runtime: PuzzleRuntime | null, id?: string) {
  return id
    ? (runtime?.doors?.find((door) => door.id === id)?.lift ?? 0)
    : (runtime?.doorLift ?? 0)
}

class AssetBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error) {
    console.warn(
      'Door GLB unavailable; using procedural visual.',
      error.message,
    )
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

function ProceduralDoor({ runtimeRef, open, position = DOOR, doorId }: Props) {
  const panel = useRef<Group>(null)
  useFrame(() => {
    if (panel.current)
      panel.current.position.y = readLift(runtimeRef.current, doorId)
  })
  return (
    <group position={[position.x, 0, position.z]}>
      <group ref={panel}>
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[2.4, 3.6, 0.3]} />
          <meshStandardMaterial
            color="#454b50"
            roughness={0.65}
            metalness={0.2}
          />
        </mesh>
        {[-0.9, 0.9].map((x) => (
          <mesh key={x} position={[x, 1.8, 0.155]}>
            <boxGeometry args={[0.035, 2.8, 0.012]} />
            <meshStandardMaterial color="#bcb6a8" />
          </mesh>
        ))}
      </group>
      {[-1.26, 1.26].map((x) => (
        <mesh key={x} position={[x, 1.8, 0]}>
          <boxGeometry args={[0.12, 3.6, 0.4]} />
          <meshStandardMaterial color="#262c30" />
        </mesh>
      ))}
      <mesh position={[0, 3.66, 0]}>
        <boxGeometry args={[2.64, 0.12, 0.4]} />
        <meshStandardMaterial color="#262c30" />
      </mesh>
      <mesh position={[0, 3.45, 0.22]}>
        <boxGeometry args={[2.2, 0.06, 0.04]} />
        <meshStandardMaterial
          color={open ? '#8be1ed' : '#efb462'}
          emissive={open ? '#52b2c3' : '#805219'}
          emissiveIntensity={0.7}
        />
      </mesh>
    </group>
  )
}

function GltfDoor({ runtimeRef, open, position = DOOR, doorId }: Props) {
  const { scene } = useGLTF(DOOR_ASSET.url, false)
  const asset = useMemo(() => {
    const clone = scene.clone(true)
    const { panel, light } = validateDoorAsset(clone)
    const materials = (
      Array.isArray(light.material) ? light.material : [light.material]
    ).map((m) => m.clone())
    light.material = Array.isArray(light.material) ? materials : materials[0]
    return { clone, panel, materials }
  }, [scene])
  const instance = useRef<typeof asset | null>(null)
  useEffect(() => {
    instance.current = asset
    return () => {
      instance.current = null
      asset.materials.forEach((m) => m.dispose())
    }
  }, [asset])
  useFrame(() => {
    const current = instance.current
    if (!current) return
    current.panel.position.y = readLift(runtimeRef.current, doorId)
    for (const material of current.materials)
      if (material instanceof MeshStandardMaterial) {
        material.emissive.set(open ? '#52b2c3' : '#805219')
        material.setValues({ emissiveIntensity: 0.7 })
      }
  })
  return (
    <primitive
      object={asset.clone}
      position={[position.x, 0, position.z]}
      dispose={null}
    />
  )
}

export function DoorVisual(props: Props) {
  useEffect(() => {
    if (DOOR_ASSET.mode === 'glb') useGLTF.preload(DOOR_ASSET.url, false)
  }, [])
  const fallback = <ProceduralDoor {...props} />
  return DOOR_ASSET.mode === 'procedural' ? (
    fallback
  ) : (
    <AssetBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GltfDoor {...props} />
      </Suspense>
    </AssetBoundary>
  )
}
