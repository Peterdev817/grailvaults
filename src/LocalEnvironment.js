import { useLayoutEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

/** Offline IBL — no CDN fetch (unlike drei's preset Environment). */
export function LocalEnvironment({ intensity = 1 }) {
  const { gl, scene } = useThree()

  useLayoutEffect(() => {
    const prevEnv = scene.environment
    const prevIntensity = scene.environmentIntensity

    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const rt = pmrem.fromScene(room)

    scene.environment = rt.texture
    scene.environmentIntensity = intensity

    return () => {
      scene.environment = prevEnv
      scene.environmentIntensity = prevIntensity
      pmrem.dispose()
      rt.dispose()
    }
  }, [gl, scene, intensity])

  return null
}
