import {
  Component,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  type ReactNode,
} from 'react'
import { useGLTF } from '@react-three/drei'
import { Material, Mesh, MeshStandardMaterial } from 'three'
import { ECHO_ASSET_URL, ECHO_VISUAL, validateEchoAsset } from './echoAsset'
import { ProceduralEcho, type EchoVisualRefs } from './ProceduralEcho'

class EchoBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(error: Error) {
    console.warn('Echo visual fallback:', error.message)
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}
function Model({ bodyRef, headRef }: EchoVisualRefs) {
  const { scene } = useGLTF(ECHO_ASSET_URL, false)
  const asset = useMemo(() => {
    validateEchoAsset(scene)
    const clone = scene.clone(true)
    const { body, head } = validateEchoAsset(clone)
    const materials = new Map<Material, Material>()
    clone.traverse((node) => {
      if (!(node instanceof Mesh)) return
      const assign = (original: Material) => {
        if (!materials.has(original)) {
          const material = original.clone()
          if (material instanceof MeshStandardMaterial) {
            const spectral = [
              'M_Echo_Shell',
              'M_Echo_Core',
              'M_Echo_Gaze',
            ].includes(material.name)
            material.transparent = spectral && material.name !== 'M_Echo_Core'
            material.depthTest = true
            material.depthWrite = !material.transparent
            material.opacity =
              material.name === 'M_Echo_Shell'
                ? 0.62
                : material.name === 'M_Echo_Core'
                  ? 1
                  : spectral
                    ? 0.95
                    : 1
            material.emissiveIntensity =
              material.name === 'M_Echo_Gaze'
                ? 1.1
                : material.name === 'M_Echo_Core'
                  ? 0.4
                  : spectral
                    ? 0.18
                    : 0
          }
          materials.set(original, material)
        }
        return materials.get(original)!
      }
      node.material = Array.isArray(node.material)
        ? node.material.map(assign)
        : assign(node.material)
    })
    return { clone, body, head, materials }
  }, [scene])
  useLayoutEffect(() => {
    bodyRef.current = asset.body
    headRef.current = asset.head
    return () => {
      bodyRef.current = null
      headRef.current = null
    }
  }, [asset, bodyRef, headRef])
  useEffect(
    () => () => asset.materials.forEach((material) => material.dispose()),
    [asset],
  )
  return <primitive object={asset.clone} dispose={null} />
}
export function EchoVisual(props: EchoVisualRefs) {
  useEffect(() => {
    if (ECHO_VISUAL.mode === 'glb') useGLTF.preload(ECHO_ASSET_URL, false)
  }, [])
  const fallback = <ProceduralEcho {...props} />
  return ECHO_VISUAL.mode === 'procedural' ? (
    fallback
  ) : (
    <EchoBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Model {...props} />
      </Suspense>
    </EchoBoundary>
  )
}
