import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useTexture, useGLTF, Html } from '@react-three/drei'
import { useRef, useEffect, useState, useCallback } from 'react'
import { NeonSign } from './NeonSign'

const BELL_WOBBLE_RAD = 0.13

export function Box3D({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0.36, 0, 0],
  restRotation = [0, 0, 0],
  tableSurfaceY = 0,
  restScale = 0.36,
  heroPositionY = 0.12,
  heroZOffset = 0.95,
  boxOpenDropY = 0.52,
  onAppear,
  onBoxComplete,
  onCelebrationStart,
  onWaitingForClick,
  neonTheme = 'emerald',
}) {
  const groupRef = useRef()
  const bellSwingRef = useRef()
  const sceneRef = useRef(null)
  const appearRunIdRef = useRef(0)
  const [phase, setPhase] = useState('appear')
  const [showWatchPlane, setShowWatchPlane] = useState(false)
  const watchMeshRef = useRef()
  const watchGroupRef = useRef()
  const boxGroupRef = useRef()
  const boxBoundsRef = useRef({ minY: -0.5, centerY: 0, height: 1 })
  const watchAnimStartTimeRef = useRef(null)
  const boxOpenStartYRef = useRef(0)
  const boxOpenEndYRef = useRef(0)
  const boxOpenStartZRef = useRef(0)
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

  const approachStartRef = useRef(null)
  const restYRef = useRef(0)
  const restZRef = useRef(0)
  const heroZTargetRef = useRef(0)
  const restScaleRef = useRef(restScale)
  const heroScaleRef = useRef(scale)
  const heroYRef = useRef(heroPositionY)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

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
        boxOpenStartZRef.current = groupRef.current.position.z
      }
      setPhase('boxOpen')
      setShowWatchPlane(true)
    } else {
      setPhase('done')
      onBoxComplete?.()
    }
  }, [actions, names, onBoxComplete, boxOpenDropY])

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
    restYRef.current = tableSurfaceY - restScale * minY * BOX_SCALE
  }, [gltf, tableSurfaceY, restScale])

  useEffect(() => {
    if (!gltf?.scene) return
    if (phase !== 'appear') return

    const runId = ++appearRunIdRef.current
    let cancelled = false

    const startAppear = () => {
      if (cancelled || runId !== appearRunIdRef.current) return
      if (!groupRef.current) {
        requestAnimationFrame(startAppear)
        return
      }

      const { minY } = boxBoundsRef.current
      const restY = tableSurfaceY - restScale * minY * BOX_SCALE
      restYRef.current = restY

      groupRef.current.scale.set(0, 0, 0)
      groupRef.current.position.set(position[0], restY, position[2] ?? 0)
      if (bellSwingRef.current) bellSwingRef.current.rotation.z = 0

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled || runId !== appearRunIdRef.current || !groupRef.current) return
          const duration = 1200
          const startTime = Date.now()

          const animate = () => {
            if (cancelled || runId !== appearRunIdRef.current || !groupRef.current) return

            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)

            groupRef.current.scale.setScalar(eased * restScale)
            groupRef.current.position.set(position[0], restY, position[2] ?? 0)
            groupRef.current.rotation.set(restRotation[0], restRotation[1], restRotation[2])

            if (progress < 1) requestAnimationFrame(animate)
            else {
              onAppear?.()
              setPhase('waitingForClick')
              onWaitingForClick?.()
            }
          }

          requestAnimationFrame(animate)
        })
      })
    }

    startAppear()
    return () => {
      cancelled = true
    }
  }, [gltf, onAppear, onWaitingForClick, phase, position, restRotation, restScale, tableSurfaceY])

  const startBoxOpen = useCallback(() => {
    if (phaseRef.current !== 'waitingForClick' || !groupRef.current) return
    if (bellSwingRef.current) bellSwingRef.current.rotation.z = 0
    restScaleRef.current = groupRef.current.scale.x
    restYRef.current = groupRef.current.position.y
    restZRef.current = groupRef.current.position.z
    heroScaleRef.current = scale
    heroYRef.current = heroPositionY
    heroZTargetRef.current = (position[2] ?? 0) + heroZOffset
    approachStartRef.current = null
    setPhase('approachHero')
  }, [scale, heroPositionY, heroZOffset, position])

  useFrame((state) => {
    if (bellSwingRef.current) {
      if (phase === 'waitingForClick') {
        bellSwingRef.current.rotation.z =
          Math.sin(state.clock.elapsedTime * Math.PI) * BELL_WOBBLE_RAD
      } else {
        bellSwingRef.current.rotation.z = 0
      }
    }

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
      groupRef.current.position.set(position[0], y, z)
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
      if (clip && clip.duration > 0) {
        const progress = Math.min(action.time / clip.duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const startY = boxOpenStartYRef.current
        const py = startY + (boxOpenEndYRef.current - startY) * eased
        groupRef.current.position.set(position[0], py, boxOpenStartZRef.current)
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
          if (mat) mat.opacity = 1
        }
        if (action.time >= clip.duration - 0.016) {
          setPhase('watchRise')
          watchAnimStartTimeRef.current = state.clock.getElapsedTime()
        }
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

  return (
    <group ref={groupRef}>
      <group ref={bellSwingRef}>
        <group ref={boxGroupRef} scale={[BOX_SCALE, BOX_SCALE, BOX_SCALE]}>
          <primitive object={gltf.scene} />
        </group>
        {phase === 'waitingForClick' && (
          <Html
            key="tap-to-open"
            transform
            center
            occlude={false}
            position={[0, tapHtmlY, 0]}
            distanceFactor={6.5}
            style={{ pointerEvents: 'auto', zIndex: 2147483646 }}
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
      </group>
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
              renderOrder={2}
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
