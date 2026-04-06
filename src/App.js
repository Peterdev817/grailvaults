import { useRef, useEffect, useState, Suspense } from 'react'
import { SafeCanvas } from './SafeCanvas'
import { useGLTF } from '@react-three/drei'
import { LocalEnvironment } from './LocalEnvironment'
import './styles.css'
import { Box3D } from './Box3D'
import { Table3D } from './Table3D'
import { PrizeSunburstMesh } from './PrizeSunburstMesh'
import { NEON_THEMES } from './NeonSign'

const TABLE_SCENE_AT_VIDEO_SEC = 6
const TABLE_BOX_Z = -2.74
const TABLE_3D_POSITION = [0, -1.4, TABLE_BOX_Z]
const BOX_3D_POSITION = [0, 0, TABLE_BOX_Z]
const BOX_HERO_Z_OFFSET = 2.15
const BOX_OPEN_FORWARD_Z = 0.55
const OPENED_BOX_Z = TABLE_BOX_Z + BOX_HERO_Z_OFFSET + BOX_OPEN_FORWARD_Z
const PRIZE_SUNBURST_Z = OPENED_BOX_Z - 0.2
const SCENE_FADE_IN_MS = 600
const SCENE_APPROACH_Z_OFFSET = -2.35

const BOX_REST_SCALE = 0.8
const BOX_REST_OFFSET = [0, 0, 0]
const BOX_REST_ROTATION = [0, 0, 0]

export const App = () => {
  return (
    <div className="animation-container">
      <MainAnimation />
    </div>
  )
}

function MainAnimation() {
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [sceneRevealed, setSceneRevealed] = useState(false)
  const [tableSurfaceY, setTableSurfaceY] = useState(null)
  const [showPrizeSunburst, setShowPrizeSunburst] = useState(false)
  const [neonTheme, setNeonTheme] = useState('emerald')

  useEffect(() => {
    useGLTF.preload('/box.glb')
    useGLTF.preload('/table.glb')
  }, [])

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    if (video.currentTime >= TABLE_SCENE_AT_VIDEO_SEC) setSceneRevealed(true)
  }

  const handleVideoEnded = () => {
    setSceneRevealed(true)
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = true
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.playbackRate = 1.2

    const playVideo = () => {
      video.play()
        .catch((error) => {
          console.warn('Video autoplay failed:', error)
          const handleUserInteraction = () => {
            video.play().then(() => {
              document.removeEventListener('click', handleUserInteraction, true)
              document.removeEventListener('touchstart', handleUserInteraction, true)
              document.removeEventListener('mousedown', handleUserInteraction, true)
              window.removeEventListener('focus', handleUserInteraction)
            }).catch(() => {})
          }
          document.addEventListener('click', handleUserInteraction, true)
          document.addEventListener('touchstart', handleUserInteraction, true)
          document.addEventListener('mousedown', handleUserInteraction, true)
          window.addEventListener('focus', handleUserInteraction)
        })
    }

    if (video.readyState >= 2) {
      playVideo()
    } else {
      video.addEventListener('canplay', playVideo, { once: true })
      video.addEventListener('loadeddata', playVideo, { once: true })
    }
  }, [])

  useEffect(() => {
    const img = new Image()
    img.src = '/watch1.png'
    img.onload = () => {
      setImageLoaded(true)
    }
  }, [])

  if (!imageLoaded) {
    return (
      <>
        <div className="loading" />
      </>
    )
  }

  return (
    <>
      <video
        ref={videoRef}
        className="intro-video"
        src="/video_emerald.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        loop={false}
        onTimeUpdate={handleVideoTimeUpdate}
        onEnded={handleVideoEnded}
        onPlay={() => {
          const video = videoRef.current
          if (video) video.playbackRate = 1.2
          handleVideoTimeUpdate()
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: sceneRevealed ? 0 : 1,
          pointerEvents: sceneRevealed ? 'none' : 'auto',
        }}
      />

      <div
        ref={containerRef}
        className="scene-container canvas-fullscreen"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: sceneRevealed ? 2 : 0,
          pointerEvents: sceneRevealed ? 'auto' : 'none',
          isolation: sceneRevealed ? 'isolate' : 'auto',
        }}
      >
        <SafeCanvas
          camera={{
            position: [0, 0, 6.35],
            fov: 42,
            near: 0.1,
            far: 100,
          }}
          gl={{ alpha: true, antialias: true }}
          onCreated={({ gl, scene }) => {
            gl.setClearColor(0x000000, 0)
            scene.background = null
          }}
          style={{ width: '100%', height: '100%', background: 'transparent' }}
        >
          <ambientLight intensity={0.25} />
          <hemisphereLight
            args={['#e8e4dc', '#4a4a4a', 0.4]}
          />
          <directionalLight position={[8, 10, 6]} intensity={0.5} />
          <directionalLight position={[-8, 8, 4]} intensity={0.2} />
          <directionalLight position={[0, -3, 2]} intensity={0.15} />
          <pointLight position={[0, 2, 3]} intensity={0.2} distance={8} />
          <Suspense fallback={null}>
            <LocalEnvironment intensity={0.5} />
          </Suspense>

          {sceneRevealed && (
            <Suspense fallback={null}>
              <Table3D
                modelScale={2.38}
                position={TABLE_3D_POSITION}
                appearDurationMs={SCENE_FADE_IN_MS}
                approachZOffset={SCENE_APPROACH_Z_OFFSET}
                onSurfaceReady={setTableSurfaceY}
              />
            </Suspense>
          )}
          {sceneRevealed && showPrizeSunburst && (
            <PrizeSunburstMesh z={PRIZE_SUNBURST_Z} y={0.06} planeSize={20} />
          )}
          {sceneRevealed && (
            <Suspense fallback={null}>
              <Box3D
                scale={1.365}
                appearFadeMs={SCENE_FADE_IN_MS}
                approachZOffset={SCENE_APPROACH_Z_OFFSET}
                restScale={BOX_REST_SCALE}
                restOffset={BOX_REST_OFFSET}
                heroPositionY={-0.26}
                heroZOffset={BOX_HERO_Z_OFFSET}
                boxOpenDropY={0.58}
                boxOpenForwardZ={BOX_OPEN_FORWARD_Z}
                position={BOX_3D_POSITION}
                restRotation={BOX_REST_ROTATION}
                rotation={[0.36, 0, 0]}
                tableSurfaceY={tableSurfaceY}
                onAppear={() => {}}
                onCelebrationStart={() => setShowPrizeSunburst(true)}
                neonTheme={neonTheme}
              />
            </Suspense>
          )}
        </SafeCanvas>
        {sceneRevealed && (
          <>
            <div className="neon-theme-selector" aria-label="Neon sign theme">
              {NEON_THEMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`neon-theme-btn ${neonTheme === t ? 'active' : ''}`}
                  onClick={() => setNeonTheme(t)}
                  title={`${t.charAt(0).toUpperCase() + t.slice(1)} neon`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

    </>
  )
}
