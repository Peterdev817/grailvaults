import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { useMemo, useLayoutEffect, useRef, useEffect } from 'react'

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

function setObjectMeshesOpacity(root, value) {
  const o = Math.min(Math.max(value, 0), 1)
  const opaque = o >= 1
  root.traverse((child) => {
    if (child.isMesh && child.material) {
      const mats = Array.isArray(child.material) ? child.material : [child.material]
      for (const m of mats) {
        m.opacity = o
        if (opaque) {
          m.transparent = false
          m.depthWrite = true
        } else {
          m.transparent = true
          m.depthWrite = false
        }
        m.needsUpdate = true
      }
    }
  })
}

export function Table3D({
  modelScale = 1.25,
  position = [0, -1.35, 0],
  appearDurationMs = 380,
  approachZOffset = 0,
  onSurfaceReady,
}) {
  const posX = position[0] ?? 0
  const posY = position[1] ?? 0
  const posZ = position[2] ?? 0

  const gltf = useGLTF('/table.glb')
  const rootRef = useRef()
  const approachRef = useRef()
  const fadeSceneRef = useRef(null)

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
    setObjectMeshesOpacity(scene, 0)
  }, [scene])

  useLayoutEffect(() => {
    if (!onSurfaceReady) return

    const reportSurface = () => {
      if (!rootRef.current) return
      rootRef.current.updateMatrixWorld(true)
      const b = new THREE.Box3().setFromObject(rootRef.current)
      onSurfaceReady(b.max.y)
    }

    if (appearDurationMs <= 0) {
      setObjectMeshesOpacity(scene, 1)
      if (approachRef.current) approachRef.current.position.z = 0
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(reportSurface)
      })
      return () => cancelAnimationFrame(id)
    }

    if (fadeSceneRef.current === scene) {
      setObjectMeshesOpacity(scene, 1)
      if (approachRef.current) approachRef.current.position.z = 0
      const id = requestAnimationFrame(() => requestAnimationFrame(reportSurface))
      return () => cancelAnimationFrame(id)
    }
    fadeSceneRef.current = scene

    let cancelled = false
    let rafId = 0
    const schedule = (fn) => {
      rafId = requestAnimationFrame(fn)
    }

    const runFade = () => {
      if (cancelled) return
      if (!rootRef.current || (approachZOffset !== 0 && !approachRef.current)) {
        schedule(runFade)
        return
      }
      setObjectMeshesOpacity(scene, 0)
      if (approachZOffset !== 0 && approachRef.current) {
        approachRef.current.position.z = 0
        rootRef.current.updateMatrixWorld(true)
        reportSurface()
        approachRef.current.position.z = approachZOffset
      } else {
        rootRef.current.updateMatrixWorld(true)
        reportSurface()
      }

      const start = performance.now()
      const tick = (now) => {
        if (cancelled) return
        const t = Math.min(1, (now - start) / appearDurationMs)
        const e = easeOutCubic(t)
        setObjectMeshesOpacity(scene, e)
        if (approachRef.current && approachZOffset !== 0) {
          approachRef.current.position.z = approachZOffset * (1 - e)
        }
        if (t < 1) schedule(tick)
        else {
          setObjectMeshesOpacity(scene, 1)
          if (approachRef.current) approachRef.current.position.z = 0
        }
      }
      schedule(tick)
    }

    schedule(runFade)
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
    }
  }, [
    appearDurationMs,
    approachZOffset,
    scene,
    onSurfaceReady,
    modelScale,
    posX,
    posY,
    posZ,
  ])

  return (
    <group ref={rootRef} position={[posX, posY, posZ]}>
      <group ref={approachRef} position={[0, 0, approachZOffset]}>
        <primitive object={scene} scale={modelScale} />
      </group>
    </group>
  )
}
