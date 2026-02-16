import { useRef, useEffect } from 'react'

const COLORS = [
  '#FFD700',
  '#FF4500',
  '#FF1493',
  '#00FFFF',
  '#00FF00',
  '#FF00FF',
  '#9400D3',
  '#FFFF00',
  '#FF1744',
  '#00E5FF',
  '#76FF03',
  '#E040FB',
]

function createBurst(cw, ch) {
  const x = cw * (0.15 + Math.random() * 0.7)
  const y = ch * (0.08 + Math.random() * 0.35)
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  const particleCount = 120 + Math.floor(Math.random() * 80)
  const particles = []
  const angleStep = (Math.PI * 2) / particleCount
  const spread = 2.2 + Math.random() * 1.8

  for (let i = 0; i < particleCount; i++) {
    const angle = angleStep * i + Math.random() * 0.5
    const speed = 0.9 + Math.random() * 2.2
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed * spread,
      vy: Math.sin(angle) * speed * spread - 0.8,
      gravity: 0.06 + Math.random() * 0.03,
      life: 1,
      decay: 0.006 + Math.random() * 0.005,
      color,
      radius: 2.2 + Math.random() * 2,
    })
  }
  return { x, y, particles, color }
}

function updateBurst(burst, cw, ch) {
  let active = 0
  for (const p of burst.particles) {
    p.x += p.vx
    p.y += p.vy
    p.vy += p.gravity
    p.vx *= 0.98
    p.vy *= 0.98
    p.life -= p.decay
    if (p.life > 0) active++
  }
  return active > 0
}

function drawBurst(ctx, burst) {
  for (const p of burst.particles) {
    if (p.life <= 0) continue
    const alpha = p.life
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

export function Fireworks() {
  const canvasRef = useRef(null)
  const burstsRef = useRef([])
  const nextBurstRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    let rafId

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    const tick = (time) => {
      const cw = window.innerWidth
      const ch = window.innerHeight

      if (time >= nextBurstRef.current) {
        burstsRef.current.push(createBurst(cw, ch))
        nextBurstRef.current = time + 400 + Math.random() * 500
      }

      ctx.clearRect(0, 0, cw, ch)

      burstsRef.current = burstsRef.current.filter((b) => updateBurst(b, cw, ch))
      burstsRef.current.forEach((b) => drawBurst(ctx, b))

      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fireworks-canvas"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  )
}
