import { useEffect, useState } from 'react'
import { Mesh, type Material, type Object3D } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

function disposeVisual(scene: Object3D) {
  const geometries = new Set<Mesh['geometry']>()
  const materials = new Set<Material>()
  scene.traverse((node) => {
    if (node instanceof Mesh) {
      geometries.add(node.geometry)
      for (const material of Array.isArray(node.material)
        ? node.material
        : [node.material])
        materials.add(material)
    }
  })
  geometries.forEach((geometry) => geometry.dispose())
  materials.forEach((material) => material.dispose())
}

/** Loading never mounts or replaces physical bodies. Each load owns its GPU resources. */
export function useVisualAsset(
  url: string,
  validate: (scene: Object3D) => void,
) {
  const [loaded, setLoaded] = useState<{ url: string; scene: Object3D } | null>(
    null,
  )
  useEffect(() => {
    let disposed = false
    let owned: Object3D | null = null
    new GLTFLoader().load(
      url,
      (gltf) => {
        if (disposed) {
          disposeVisual(gltf.scene)
          return
        }
        try {
          validate(gltf.scene)
          owned = gltf.scene
          setLoaded({ url, scene: owned })
        } catch (error) {
          disposeVisual(gltf.scene)
          console.warn(
            'Visual asset rejected; preserving procedural fallback.',
            url,
            error,
          )
        }
      },
      undefined,
      () => {
        if (!disposed)
          console.warn(
            'Visual asset unavailable; preserving procedural fallback.',
            url,
          )
      },
    )
    return () => {
      disposed = true
      if (owned) disposeVisual(owned)
    }
  }, [url, validate])
  return loaded?.url === url ? loaded.scene : null
}
