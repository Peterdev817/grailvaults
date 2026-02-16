import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useAnimations, useTexture, useGLTF } from '@react-three/drei'
import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react'
import { NeonSign } from './NeonSign'

export const Box3D = forwardRef(function Box3D({
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  onAppear,
  onBoxComplete,
  onCelebrationStart,
  onWaitingForClick,
  neonTheme = 'emerald',
}, ref) {
  const groupRef = useRef()
  const sceneRef = useRef(null)
  const animationStartedRef = useRef(false)
  const [phase, setPhase] = useState('appear')
  const [showWatchPlane, setShowWatchPlane] = useState(false)
  const watchMeshRef = useRef()
  const watchGroupRef = useRef()
  const boxGroupRef = useRef()
  const boxBoundsRef = useRef({ minY: -0.5, centerY: 0, height: 1 })
  const watchAnimStartTimeRef = useRef(null)
  const boxLowerTargetY = -1.5
  const boxOpenStartYRef = useRef(0)
  const afterClickStartTimeRef = useRef(null)
  const boxOffScreenY = -15
  const afterClickDuration = 2
  const watchStraightenDuration = 1
  const watchTiltRad = 0.2
  const watchOriginalScale = 1 / 0.7
  const bounceAmplitude = 0.04
  const bouncePeriod = 1
  const BOX_SCALE = 20
  const CARD_INSIDE_BOX_SCALE = 0.6

  const gltf = useGLTF('/box.glb', true)
  sceneRef.current = gltf.scene
  const { actions, names } = useAnimations(gltf.animations, sceneRef)
  const watchTexture = useTexture('/watch1.png')

  useEffect(() => {
    if (watchTexture) {
      watchTexture.colorSpace = THREE.SRGBColorSpace
    }
  }, [watchTexture])

  useEffect(() => {
    if (!gltf?.scene) return
    const bbox = new THREE.Box3().setFromObject(gltf.scene)
    if (!bbox || !bbox.min || !bbox.max) return
    const center = new THREE.Vector3()
    bbox.getCenter(center)
    const height = bbox.max.y - bbox.min.y || 1
    boxBoundsRef.current = {
      minY: bbox.min.y,
      centerY: center.y,
      height,
    }
  }, [gltf])

  useEffect(() => {
    if (!groupRef.current || animationStartedRef.current) return
    animationStartedRef.current = true

    groupRef.current.scale.set(0, 0, 0)
    groupRef.current.rotation.y = 0

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const duration = 1500
        const startTime = Date.now()

        const animate = () => {
          if (!groupRef.current) return

          const elapsed = Date.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)

          groupRef.current.scale.setScalar(eased * scale)
          groupRef.current.rotation.y = eased * Math.PI * 2

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
  }, [onAppear, scale, names, actions])

  useFrame((state) => {
    if (phase === 'boxOpen' && groupRef.current && names.length > 0 && actions[names[0]]) {
      const action = actions[names[0]]
      const clip = action.getClip()
      if (clip && clip.duration > 0) {
        const progress = Math.min(action.time / clip.duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const startY = boxOpenStartYRef.current
        groupRef.current.position.y = startY + (boxLowerTargetY - startY) * eased
        if (watchMeshRef.current) {
          const { minY, centerY, height } = boxBoundsRef.current
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

    if (phase === 'done' && watchGroupRef.current) {
      const y = bounceAmplitude * Math.sin(state.clock.elapsedTime * (2 * Math.PI / bouncePeriod))
      watchGroupRef.current.position.y = y
    }

    if (phase === 'afterClick') {
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

      if (tBox >= 1) {
        setPhase('interactive')
        onCelebrationStart?.()
      }
    }
  })

  const startBoxOpen = () => {
    if (phase !== 'waitingForClick') return
    if (names.length > 0 && actions[names[0]]) {
      const action = actions[names[0]]
      action.reset()
      action.setLoop(THREE.LoopOnce)
      action.clampWhenFinished = true
      action.play()
      if (groupRef.current) boxOpenStartYRef.current = groupRef.current.position.y
      setPhase('boxOpen')
      setShowWatchPlane(true)
    } else {
      setPhase('done')
      onBoxComplete?.()
    }
  }

  useImperativeHandle(ref, () => ({ startBoxOpen }), [phase, names, actions])

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

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={0}
    >
      <group ref={boxGroupRef} scale={[BOX_SCALE, BOX_SCALE, BOX_SCALE]}>
        <primitive object={gltf.scene} />
      </group>
      {showWatchPlane && phase !== 'afterClick' && phase !== 'interactive' && (
        <NeonSign
          position={[0, (boxBoundsRef.current.minY + boxBoundsRef.current.height * 0.06) * BOX_SCALE, 0]}
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
})
