import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useTexture, useGLTF, Html } from '@react-three/drei'
import { useRef, useEffect, useState, useCallback } from 'react'
import { NeonSign } from './NeonSign'

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

export function Box3D({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0.36, 0, 0],
  restRotation = [0, 0, 0],
  tableSurfaceY = 0,
  restScale = 0.36,
  restOffset = [0, 0, 0],
  heroPositionY = 0.12,
  heroZOffset = 0.95,
  boxOpenDropY = 0.52,
  boxOpenForwardZ = 0,
  onAppear,
  onBoxComplete,
  onCelebrationStart,
  onWaitingForClick,
  neonTheme = 'emerald',
  appearFadeMs = 1200,
  approachZOffset = 0,
}) {
  const groupRef = useRef()
  const sceneRef = useRef(null)
  const animationStartedRef = useRef(false)
  const boxFadeGltfRef = useRef(null)
  const [phase, setPhase] = useState('appear')
  const [showTapPrompt, setShowTapPrompt] = useState(false)
  const [showWatchPlane, setShowWatchPlane] = useState(false)
  const watchMeshRef = useRef()
  const watchGroupRef = useRef()
  const boxGroupRef = useRef()
  const boxBoundsRef = useRef({ minY: -0.5, centerY: 0, height: 1 })
  const watchAnimStartTimeRef = useRef(null)
  const boxOpenStartYRef = useRef(0)
  const boxOpenEndYRef = useRef(0)
  const boxOpenStartZRef = useRef(0)
  const boxOpenEndZRef = useRef(0)
  const boxOpenFallbackT0Ref = useRef(null)
  const afterClickStartTimeRef = useRef(null)
  const celebrationScheduledRef = useRef(false)
  const celebrationTimeoutRef = useRef(null)
  const boxOffScreenY = -15
  const afterClickDuration = 2
  const celebrationDelayMs = 0
  const watchStraightenDuration = 1
  const watchTiltRad = 0.2
  const watchOriginalScale = 1 / 0.7
  const autoAdvanceDelayMs = 200
  const BOX_SCALE = 20
  const CARD_INSIDE_BOX_SCALE = 0.6
  const approachDuration = 0.88
  const TAP_PROMPT_DELAY_MS = 1000

  const approachStartRef = useRef(null)
  const restYRef = useRef(0)
  const restZRef = useRef(0)
  const heroZTargetRef = useRef(0)
  const restScaleRef = useRef(restScale)
  const heroScaleRef = useRef(scale)
  const heroYRef = useRef(heroPositionY)
  const phaseRef = useRef(phase)
  const tableSurfaceYRef = useRef(tableSurfaceY)
  tableSurfaceYRef.current = tableSurfaceY
  const onAppearRef = useRef(onAppear)
  const onWaitingForClickRef = useRef(onWaitingForClick)
  onAppearRef.current = onAppear
  onWaitingForClickRef.current = onWaitingForClick

  const posX = (position[0] ?? 0) + (restOffset[0] ?? 0)
  const posZ = (position[2] ?? 0) + (restOffset[2] ?? 0)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    if (phase !== 'waitingForClick') {
      setShowTapPrompt(false)
      return
    }
    setShowTapPrompt(false)
    const id = window.setTimeout(() => setShowTapPrompt(true), TAP_PROMPT_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [phase])

  const gltf = useGLTF('/box.glb', true)
  sceneRef.current = gltf.scene
  const { actions, names } = useAnimations(gltf.animations, sceneRef)
  const watchTexture = useTexture('/watch1.png')

  const beginGltfOpen = useCallback(() => {
    if (names.length > 0 && actions[names[0]]) {
      const action = actions[names[0]]
      action.reset()
      action.setLoop(THREE.LoopOnce)
      action.clampWhenFinished = true
      action.play()
      if (groupRef.current) {
        const y0 = groupRef.current.position.y
        boxOpenStartYRef.current = y0
        boxOpenEndYRef.current = y0 - boxOpenDropY
        const z0 = groupRef.current.position.z
        boxOpenStartZRef.current = z0
        boxOpenEndZRef.current = z0 + boxOpenForwardZ
      }
      boxOpenFallbackT0Ref.current = null
      setPhase('boxOpen')
      setShowWatchPlane(true)
    } else {
      setPhase('done')
      onBoxComplete?.()
    }
  }, [actions, names, onBoxComplete, boxOpenDropY, boxOpenForwardZ])

  const beginGltfOpenRef = useRef(beginGltfOpen)
  beginGltfOpenRef.current = beginGltfOpen

  useEffect(() => {
    if (watchTexture) {
      watchTexture.colorSpace = THREE.SRGBColorSpace
    }
  }, [watchTexture])

  useEffect(() => {
    if (!gltf?.scene) return
    gltf.scene.traverse((o) => {
      if (o.isMesh) o.renderOrder = 2
    })
  }, [gltf])

  useEffect(() => {
    if (!gltf?.scene) return
    const bbox = new THREE.Box3().setFromObject(gltf.scene)
    if (!bbox || !bbox.min || !bbox.max) return
    const center = new THREE.Vector3()
    bbox.getCenter(center)
    const height = bbox.max.y - bbox.min.y || 1
    const minY = bbox.min.y
    boxBoundsRef.current = {
      minY,
      centerY: center.y,
      height,
    }
    if (tableSurfaceY != null) {
      restYRef.current =
        tableSurfaceY - restScale * minY * BOX_SCALE + (restOffset[1] ?? 0)
    }
  }, [gltf, tableSurfaceY, restScale, restOffset[0], restOffset[1], restOffset[2]])

  useEffect(() => {
    if (tableSurfaceY == null) return
    if (!groupRef.current || !gltf?.scene) return

    if (
      boxFadeGltfRef.current === gltf.scene &&
      !animationStartedRef.current
    ) {
      setObjectMeshesOpacity(gltf.scene, 1)
      const sy = tableSurfaceYRef.current
      const bot = boxBoundsRef.current.minY
      if (sy != null) {
        const yNow = sy - restScale * bot * BOX_SCALE + (restOffset[1] ?? 0)
        groupRef.current.scale.setScalar(restScale)
        groupRef.current.position.set(posX, yNow, posZ)
        groupRef.current.rotation.set(restRotation[0], restRotation[1], restRotation[2])
        restYRef.current = yNow
      }
      setPhase('waitingForClick')
      onAppearRef.current?.()
      onWaitingForClickRef.current?.()
      animationStartedRef.current = true
      return
    }

    if (animationStartedRef.current) return
    animationStartedRef.current = true
    boxFadeGltfRef.current = gltf.scene

    const minY = boxBoundsRef.current.minY
    const surface = tableSurfaceYRef.current
    const restY =
      surface - restScale * minY * BOX_SCALE + (restOffset[1] ?? 0)
    restYRef.current = restY

    setObjectMeshesOpacity(gltf.scene, 0)
    groupRef.current.scale.setScalar(restScale)
    groupRef.current.position.set(posX, restY, posZ + approachZOffset)
    groupRef.current.rotation.set(restRotation[0], restRotation[1], restRotation[2])

    let fadeCancelled = false
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (fadeCancelled) return
        const duration = appearFadeMs
        const startTime = Date.now()

        const animate = () => {
          if (fadeCancelled || !groupRef.current) return

          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = easeOutCubic(progress)

          const sy = tableSurfaceYRef.current
          const bot = boxBoundsRef.current.minY
          if (sy == null) return
          const yNow = sy - restScale * bot * BOX_SCALE + (restOffset[1] ?? 0)
          const zNow = posZ + approachZOffset * (1 - eased)

          setObjectMeshesOpacity(gltf.scene, eased)
          groupRef.current.scale.setScalar(restScale)
          groupRef.current.position.set(posX, yNow, zNow)
          groupRef.current.rotation.set(restRotation[0], restRotation[1], restRotation[2])

          if (progress < 1) requestAnimationFrame(animate)
          else {
            setObjectMeshesOpacity(gltf.scene, 1)
            restYRef.current = yNow
            onAppearRef.current?.()
            setPhase('waitingForClick')
            onWaitingForClickRef.current?.()
          }
        }

        requestAnimationFrame(animate)
      })
    })

    return () => {
      fadeCancelled = true
    }
  }, [
    gltf,
    posX,
    posZ,
    restRotation,
    restScale,
    tableSurfaceY,
    restOffset[0],
    restOffset[1],
    restOffset[2],
    appearFadeMs,
    approachZOffset,
  ])

  useEffect(() => {
    if (tableSurfaceY == null || !groupRef.current) return
    if (phase !== 'waitingForClick') return
    const { minY } = boxBoundsRef.current
    const restY =
      tableSurfaceY - restScale * minY * BOX_SCALE + (restOffset[1] ?? 0)
    groupRef.current.position.set(posX, restY, posZ)
    restYRef.current = restY
  }, [
    phase,
    tableSurfaceY,
    restScale,
    posX,
    posZ,
    restOffset[0],
    restOffset[1],
    restOffset[2],
  ])

  const startBoxOpen = useCallback(() => {
    if (phaseRef.current !== 'waitingForClick' || !groupRef.current) return
    restScaleRef.current = groupRef.current.scale.x
    restYRef.current = groupRef.current.position.y
    restZRef.current = groupRef.current.position.z
    heroScaleRef.current = scale
    heroYRef.current = heroPositionY
    heroZTargetRef.current = posZ + heroZOffset
    approachStartRef.current = null
    setPhase('approachHero')
  }, [scale, heroPositionY, heroZOffset, posZ])

  useFrame((state) => {
    if (
      (phase === 'waitingForClick' || phase === 'appear') &&
      groupRef.current
    ) {
      groupRef.current.rotation.set(restRotation[0], restRotation[1], restRotation[2])
    }

    if (phase === 'approachHero' && groupRef.current) {
      if (approachStartRef.current == null) approachStartRef.current = state.clock.elapsedTime

      const t = Math.min(
        1,
        (state.clock.elapsedTime - approachStartRef.current) / approachDuration
      )
      const eased = 1 - Math.pow(1 - t, 3)
      const sc =
        restScaleRef.current + (heroScaleRef.current - restScaleRef.current) * eased
      const y = restYRef.current + (heroYRef.current - restYRef.current) * eased

      groupRef.current.scale.setScalar(sc)
      const z =
        restZRef.current + (heroZTargetRef.current - restZRef.current) * eased
      groupRef.current.position.set(posX, y, z)
      groupRef.current.rotation.set(restRotation[0], restRotation[1], restRotation[2])

      if (t >= 1) {
        approachStartRef.current = null
        beginGltfOpenRef.current()
      }
      return
    }

    if (phase === 'boxOpen' && groupRef.current && names.length > 0 && actions[names[0]]) {
      const action = actions[names[0]]
      const clip = action.getClip()
      const clipDur = clip && clip.duration > 0 ? clip.duration : 0
      let progress =
        clipDur > 0
          ? Math.min(action.time / clipDur, 1)
          : 0
      if (clipDur <= 0) {
        if (boxOpenFallbackT0Ref.current == null) {
          boxOpenFallbackT0Ref.current = performance.now()
        }
        progress = Math.min((performance.now() - boxOpenFallbackT0Ref.current) / 2000, 1)
      }
      const eased = 1 - Math.pow(1 - progress, 3)
      const startY = boxOpenStartYRef.current
      const py = startY + (boxOpenEndYRef.current - startY) * eased
      const startZ = boxOpenStartZRef.current
      const pz = startZ + (boxOpenEndZRef.current - startZ) * eased
      groupRef.current.position.set(posX, py, pz)
      const rx = restRotation[0] + (rotation[0] - restRotation[0]) * eased
      const ry = restRotation[1] + (rotation[1] - restRotation[1]) * eased
      const rz = restRotation[2] + (rotation[2] - restRotation[2]) * eased
      groupRef.current.rotation.set(rx, ry, rz)
      if (watchMeshRef.current) {
        const { minY, height } = boxBoundsRef.current
        const cardY = (minY + height * 0.18) * BOX_SCALE
        watchMeshRef.current.position.set(0, cardY, 0)
        watchMeshRef.current.scale.setScalar(CARD_INSIDE_BOX_SCALE)
        watchMeshRef.current.rotation.x = -Math.PI / 2
        watchMeshRef.current.rotation.y = 0
        const mat = watchMeshRef.current.material
        if (mat) {
          mat.opacity = 1
          mat.depthTest = false
        }
      }
      const openDone =
        clipDur > 0 ? action.time >= clipDur - 0.016 : progress >= 1
      if (openDone) {
        setPhase('watchRise')
        watchAnimStartTimeRef.current = state.clock.getElapsedTime()
      }
    }

    if (phase === 'watchRise' && watchMeshRef.current) {
      const startTime = watchAnimStartTimeRef.current
      if (startTime == null) {
        watchAnimStartTimeRef.current = state.clock.getElapsedTime()
        return
      }

      if (groupRef.current)
        groupRef.current.rotation.set(rotation[0], rotation[1], rotation[2])

      const duration = 1.5
      const elapsed = state.clock.getElapsedTime() - startTime
      const t = Math.min(Math.max(elapsed / duration, 0), 1)
      const eased = 1 - Math.pow(1 - t, 3)

      const { minY, centerY, height } = boxBoundsRef.current
      const startY = (minY + height * 0.18) * BOX_SCALE
      const endY = (centerY + height * 0.7) * BOX_SCALE

      watchMeshRef.current.position.set(0, startY + (endY - startY) * eased, 0)
      const s = CARD_INSIDE_BOX_SCALE + (1 - CARD_INSIDE_BOX_SCALE) * eased
      watchMeshRef.current.scale.setScalar(s)
      const mat = watchMeshRef.current.material
      if (mat) mat.opacity = 1
      watchMeshRef.current.rotation.x = -Math.PI / 2 + (Math.PI / 2) * eased
      watchMeshRef.current.rotation.y = 0

      if (t >= 1) {
        setPhase('done')
        onBoxComplete?.()
      }
    }

    if (phase === 'done' || phase === 'interactive') {
      if (groupRef.current)
        groupRef.current.rotation.set(rotation[0], rotation[1], rotation[2])
    }

    if (phase === 'afterClick') {
      if (groupRef.current)
        groupRef.current.rotation.set(rotation[0], rotation[1], rotation[2])
      if (afterClickStartTimeRef.current == null) afterClickStartTimeRef.current = state.clock.getElapsedTime()
      const elapsed = state.clock.getElapsedTime() - afterClickStartTimeRef.current

      const tBox = Math.min(elapsed / afterClickDuration, 1)
      const easedBox = 1 - Math.pow(1 - tBox, 3)
      if (boxGroupRef.current) boxGroupRef.current.position.y = (boxOffScreenY - 0) * easedBox

      const tWatch = Math.min(elapsed / watchStraightenDuration, 1)
      const easedWatch = 1 - Math.pow(1 - tWatch, 3)
      if (watchGroupRef.current) {
        watchGroupRef.current.rotation.x = -watchTiltRad * easedWatch
        const s = 1 + (watchOriginalScale - 1) * easedWatch
        watchGroupRef.current.scale.setScalar(s)
      }

      if (tBox >= 1 && !celebrationScheduledRef.current) {
        celebrationScheduledRef.current = true
        setPhase('interactive')
        celebrationTimeoutRef.current = setTimeout(() => {
          onCelebrationStart?.()
        }, celebrationDelayMs)
      }
    }
  })

  useEffect(() => {
    return () => {
      if (celebrationTimeoutRef.current) clearTimeout(celebrationTimeoutRef.current)
      animationStartedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (phase !== 'done') return
    const t = setTimeout(() => setPhase('afterClick'), autoAdvanceDelayMs)
    return () => clearTimeout(t)
  }, [phase])

  const handleWatchClick = (e) => {
    e.stopPropagation()
    if (phase === 'done') {
      setDefaultCursor()
      setPhase('afterClick')
    }
  }

  const setPointerCursor = () => {
    if (document.body) document.body.style.cursor = 'pointer'
  }
  const setDefaultCursor = () => {
    if (document.body) document.body.style.cursor = 'auto'
  }

  const { minY, height: bHeight } = boxBoundsRef.current
  const tapHtmlY = (minY + bHeight) * BOX_SCALE + 0.22

  if (tableSurfaceY == null) return null

  return (
    <group ref={groupRef}>
      <group ref={boxGroupRef} scale={[BOX_SCALE, BOX_SCALE, BOX_SCALE]}>
        <primitive object={gltf.scene} />
      </group>
      {phase === 'waitingForClick' && showTapPrompt && (
        <Html
          transform
          center
          position={[0, tapHtmlY, 0]}
          distanceFactor={6.5}
          style={{ pointerEvents: 'auto' }}
          zIndexRange={[16777271, 0]}
        >
          <div
            className="tap-prompt-html"
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation()
              e.preventDefault()
              startBoxOpen()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                startBoxOpen()
              }
            }}
          >
            <div className="tap-prompt-glow" aria-hidden />
            <svg
              className="tap-prompt-chevron"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              width="28"
              height="28"
              aria-hidden
            >
              <path
                d="M16 8v14M10 18l6 6 6-6"
                fill="none"
                stroke="rgba(240,248,230,0.92)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="tap-prompt-label">Tap to open</span>
          </div>
        </Html>
      )}
      {showWatchPlane && phase !== 'afterClick' && phase !== 'interactive' && (
        <NeonSign
          position={[0, (boxBoundsRef.current.minY + boxBoundsRef.current.height * 0.11) * BOX_SCALE, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          theme={neonTheme}
        />
      )}
      {showWatchPlane && (
        <>
          <group ref={watchGroupRef}>
            <mesh
              ref={watchMeshRef}
              position={[0, 0, 0]}
              scale={CARD_INSIDE_BOX_SCALE}
              rotation={[-Math.PI / 2, 0, 0]}
              renderOrder={4}
              onClick={handleWatchClick}
              onPointerOver={phase === 'done' ? setPointerCursor : undefined}
              onPointerOut={phase === 'done' ? setDefaultCursor : undefined}
            >
              <planeGeometry args={[1.2, 1.2]} />
              <meshBasicMaterial
                map={watchTexture}
                transparent={true}
                opacity={1}
                alphaTest={0.01}
                depthWrite={false}
                depthTest={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </>
      )}
    </group>
  )
}
