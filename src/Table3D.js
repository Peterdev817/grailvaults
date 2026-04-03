import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { useMemo, useLayoutEffect, useRef, useEffect } from 'react'

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

export function Table3D({
  modelScale = 1.25,
  position = [0, -1.35, 0],
  appearDurationMs = 380,
  onSurfaceReady,
}) {
  const gltf = useGLTF('/table.glb')
  const rootRef = useRef()
  const popRef = useRef()

  const scene = useMemo(() => {
    const s = gltf.scene.clone(true)
    s.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    const box = new THREE.Box3().setFromObject(s)
    const c = new THREE.Vector3()
    box.getCenter(c)
    s.position.sub(c)
    return s
  }, [gltf])

  useEffect(() => {
    scene.traverse((o) => {
      if (o.isMesh) o.renderOrder = 0
    })
  }, [scene])

  useLayoutEffect(() => {
    if (!onSurfaceReady || !rootRef.current) return
    let cancelled = false
    const measure = () => {
      if (cancelled || !rootRef.current) return
      rootRef.current.updateMatrixWorld(true)
      const b = new THREE.Box3().setFromObject(rootRef.current)
      onSurfaceReady(b.max.y)
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(measure)
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(id)
    }
  }, [scene, modelScale, position, onSurfaceReady, appearDurationMs])

  useLayoutEffect(() => {
    if (appearDurationMs <= 0) return
    const wrap = popRef.current
    if (!wrap) return
    const start = performance.now()
    let id
    const tick = (now) => {
      if (!popRef.current) return
      const t = Math.min(1, (now - start) / appearDurationMs)
      const e = easeOutCubic(t)
      popRef.current.scale.setScalar(0.88 + 0.12 * e)
      if (t < 1) id = requestAnimationFrame(tick)
      else {
        popRef.current.scale.setScalar(1)
        if (onSurfaceReady && rootRef.current) {
          requestAnimationFrame(() => {
            if (!rootRef.current) return
            rootRef.current.updateMatrixWorld(true)
            const b = new THREE.Box3().setFromObject(rootRef.current)
            onSurfaceReady(b.max.y)
          })
        }
      }
    }
    wrap.scale.setScalar(0.88)
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [appearDurationMs, scene, onSurfaceReady])

  return (
    <group ref={rootRef} position={position}>
      <group ref={popRef}>
        <primitive object={scene} scale={modelScale} />
      </group>
    </group>
  )
}
