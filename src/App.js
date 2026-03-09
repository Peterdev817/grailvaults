import { useRef, useEffect, useState, Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment } from '@react-three/drei'
import './styles.css'
import { Box3D } from './Box3D'
import { FingerIcon } from './HandIcon'
import { PrizeSunburst } from './PrizeSunburst'
import { GrailVaultsCard } from './GrailVaultsCard'
import { NEON_THEMES } from './NeonSign'

export const App = () => {
  return (
    <div className="animation-container">
      <MainAnimation />
    </div>
  )
}

const CARD_APPEARANCE_START_BEFORE_END = 1.4
const CARD_APPEARANCE_DURATION = 1.4

function MainAnimation() {
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 })
  const [showContent, setShowContent] = useState(false)
  const [videoStarted, setVideoStarted] = useState(false)
  const [videoDuration, setVideoDuration] = useState(0)
  const [videoCurrentTime, setVideoCurrentTime] = useState(0)
  const [showPrizeSunburst, setShowPrizeSunburst] = useState(false)
  const [showFingerOverlay, setShowFingerOverlay] = useState(false)
  const [showGrailCard, setShowGrailCard] = useState(false)
  const [neonTheme, setNeonTheme] = useState('emerald')
  const box3DRef = useRef(null)

  const cardVisible =
    videoDuration > 0 &&
    videoCurrentTime >= videoDuration - CARD_APPEARANCE_START_BEFORE_END
  const cardProgress = !cardVisible
    ? 0
    : Math.min(
        1,
        (videoCurrentTime -
          (videoDuration - CARD_APPEARANCE_START_BEFORE_END)) /
          CARD_APPEARANCE_DURATION
      )

  const handleVideoTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    setVideoCurrentTime(video.currentTime)
    if (video.currentTime > 0 && !videoStarted) {
      setVideoStarted(true)
      setTimeout(() => setShowContent(true), 1000)
    }
  }

  const handleVideoEnded = () => {
    if (!showContent) setShowContent(true)
  }

  const handleVideoLoadedMetadata = () => {
    const video = videoRef.current
    if (video && Number.isFinite(video.duration))
      setVideoDuration(video.duration)
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
    if (Number.isFinite(video.duration)) setVideoDuration(video.duration)
    const onMeta = () => {
      if (Number.isFinite(video.duration)) setVideoDuration(video.duration)
    }
    video.addEventListener('loadedmetadata', onMeta)
    return () => video.removeEventListener('loadedmetadata', onMeta)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !videoDuration) return
    let rafId
    const tick = () => {
      const t = video.currentTime
      const inCardWindow =
        t >= videoDuration - CARD_APPEARANCE_START_BEFORE_END
      if (inCardWindow) setVideoCurrentTime(t)
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [videoDuration])

  useEffect(() => {
    const img = new Image()
    img.src = '/watch1.png'
    img.onload = () => {
      setImageSize({ width: img.width, height: img.height })
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

  const aspectRatio = imageSize.width / imageSize.height
  const contentHeight = 400
  const contentWidth = contentHeight * aspectRatio

  return (
    <>
      <video
        ref={videoRef}
        className="intro-video"
        src="/video.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        loop={false}
        onTimeUpdate={handleVideoTimeUpdate}
        onEnded={handleVideoEnded}
        onLoadedMetadata={handleVideoLoadedMetadata}
        onPlay={() => {
          const video = videoRef.current
          if (video) video.playbackRate = 1.2
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: showContent ? 0 : 10,
        }}
      />

      {cardVisible && (
        <div
          className="grail-card-fixed-layer"
          style={{ pointerEvents: 'none' }}
          aria-hidden="true"
        >
          <GrailVaultsCard
            visible
            descentProgress={cardProgress}
            appearanceDuration={CARD_APPEARANCE_DURATION}
          />
        </div>
      )}

      {showContent && (
        <div
          ref={containerRef}
          className="scene-container canvas-fullscreen"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 2,
            pointerEvents: 'auto',
          }}
        >
          <Canvas
            camera={{
              position: [0, 0, 5],
              fov: 50,
              near: 0.1,
              far: 100,
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
            <Environment preset="sunset" environmentIntensity={0.5} />
            
            <Suspense fallback={null}>
              <Box3D
                ref={box3DRef}
                scale={1.365}
                position={[0, 0, 0]}
                rotation={[0.2, 0, 0]}
                onAppear={() => {}}
                onWaitingForClick={() => {
                  setShowFingerOverlay(true)
                  setShowGrailCard(true)
                }}
                onCelebrationStart={() => setShowPrizeSunburst(true)}
                neonTheme={neonTheme}
              />
            </Suspense>
          </Canvas>
          <FingerIcon
            visible={showFingerOverlay}
            onClick={() => {
              setShowFingerOverlay(false)
              box3DRef.current?.startBoxOpen?.()
            }}
          />
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
        </div>
      )}

      {showPrizeSunburst && <PrizeSunburst />}
    </>
  )
}
