import * as THREE from 'three'
import { useMemo } from 'react'

export const NEON_THEMES = ['emerald', 'platinum', 'diamond', 'supernova']

export const THEME_LABELS = {
  emerald: ['E', 'M', 'E', 'R', 'A', 'L', 'D'],
  platinum: ['P', 'L', 'A', 'T', 'I', 'N', 'U', 'M'],
  diamond: ['D', 'I', 'A', 'M', 'O', 'N', 'D'],
  supernova: ['S', 'U', 'P', 'E', 'R', 'N', 'O', 'V', 'A'],
}

const THEME_COLORS = {
  emerald: {
    core: '#70ff70',
    tube: '#30e030',
    glow: '#20c020',
    halo: '#18a018',
    fade: '#0d800d',
    shadow: 'rgba(45, 192, 45, 0.45)',
    ambient: 'rgba(127, 255, 127, 0.18)',
    extrude: ['#0d4d0d', '#0a3d0a', '#061f06', '#041504', '#030d03'],
  },
  platinum: {
    core: '#e8ecf0',
    tube: '#b0b8c8',
    glow: '#788898',
    halo: '#586878',
    fade: '#384858',
    shadow: 'rgba(150, 160, 180, 0.5)',
    ambient: 'rgba(200, 210, 220, 0.2)',
    extrude: ['#2a3038', '#1a2028', '#12181e', '#0c1014', '#080c0e'],
  },
  diamond: {
    core: '#60b8ff',
    tube: '#3090ff',
    glow: '#1870e0',
    halo: '#1050c0',
    fade: '#0838a0',
    shadow: 'rgba(50, 130, 240, 0.5)',
    ambient: 'rgba(80, 160, 255, 0.22)',
    extrude: ['#082048', '#061838', '#041028', '#020818', '#010410'],
  },
  supernova: {
    core: '#ff70e0',
    tube: '#e040b8',
    glow: '#c02098',
    halo: '#901870',
    fade: '#601050',
    shadow: 'rgba(180, 60, 160, 0.5)',
    ambient: 'rgba(220, 100, 200, 0.22)',
    extrude: ['#3d0a35', '#2d0825', '#1d0618', '#120410', '#0a0208'],
  },
}

const CANVAS_WIDTH = 1024
const CANVAS_HEIGHT = 256

function hexToRgba(hex, alpha) {
  const m = hex.match(/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
  if (!m) return hex
  return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`
}

function drawNeonToCanvas(canvas, text, theme) {
  const colors = THEME_COLORS[theme] || THEME_COLORS.emerald
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  const fontSize = 72
  const font = `${fontSize}px "Playfair Display", Georgia, serif`
  ctx.font = font
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const x = CANVAS_WIDTH / 2
  const y = CANVAS_HEIGHT / 2

  /* Softened shadow: translucent dark layers instead of hard black */
  const shadowOffsets = [1, 2, 3, 4, 5, 6, 7, 8]
  const extrudeColors = colors.extrude
  shadowOffsets.forEach((offset, i) => {
    const colorIndex = Math.min(Math.floor(i / 2), extrudeColors.length - 1)
    const base = extrudeColors[colorIndex]
    const alpha = 0.35 + (0.35 * (i / shadowOffsets.length))
    ctx.fillStyle = hexToRgba(base, alpha)
    ctx.fillText(text, x + offset, y + offset)
  })
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)'
  ctx.fillText(text, x + 9, y + 9)

  /* Sharp letters: one very tight glow then crisp core */
  ctx.shadowColor = colors.tube
  ctx.shadowBlur = 2
  ctx.fillStyle = colors.core
  ctx.fillText(text, x, y)

  ctx.shadowBlur = 0
  ctx.fillStyle = colors.core
  ctx.fillText(text, x, y)
}

export function NeonSign({ position = [0, 0, 0], rotation = [0, 0, 0], theme = 'emerald' }) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    const letters = THEME_LABELS[theme] || THEME_LABELS.emerald
    const text = letters.join('')
    drawNeonToCanvas(canvas, text, theme)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return tex
  }, [theme])

  return (
    <mesh position={position} rotation={rotation} renderOrder={3}>
      <planeGeometry args={[2, 0.5]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={1}
        alphaTest={0.02}
        depthWrite={false}
        depthTest={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
