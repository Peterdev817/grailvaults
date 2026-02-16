import * as THREE from 'three'
import { useMemo } from 'react'

export const NEON_THEMES = ['emerald', 'platinum', 'diamond', 'supernova']

const THEME_LABELS = {
  emerald: ['E', 'M', 'E', 'R', 'A', 'L', 'D'],
  platinum: ['P', 'L', 'A', 'T', 'I', 'N', 'U', 'M'],
  diamond: ['D', 'I', 'A', 'M', 'O', 'N', 'D'],
  supernova: ['S', 'U', 'P', 'E', 'R', 'N', 'O', 'V', 'A'],
}

const THEME_COLORS = {
  emerald: {
    core: '#c8ffc8',
    tube: '#7fff7f',
    glow: '#4de84d',
    halo: '#2bc02b',
    fade: '#1a9f1a',
    shadow: 'rgba(45, 192, 45, 0.45)',
    ambient: 'rgba(127, 255, 127, 0.18)',
    extrude: ['#0d4d0d', '#0a3d0a', '#061f06', '#041504', '#030d03'],
  },
  platinum: {
    core: '#f0f4f8',
    tube: '#d0d8e0',
    glow: '#a8b8c8',
    halo: '#788898',
    fade: '#506070',
    shadow: 'rgba(150, 160, 180, 0.5)',
    ambient: 'rgba(200, 210, 220, 0.2)',
    extrude: ['#2a3038', '#1a2028', '#12181e', '#0c1014', '#080c0e'],
  },
  diamond: {
    core: '#88d0ff',
    tube: '#50a8ff',
    glow: '#2080f0',
    halo: '#1060d0',
    fade: '#0840a0',
    shadow: 'rgba(50, 130, 240, 0.5)',
    ambient: 'rgba(80, 160, 255, 0.22)',
    extrude: ['#082048', '#061838', '#041028', '#020818', '#010410'],
  },
  supernova: {
    core: '#ffc8f0',
    tube: '#f090e0',
    glow: '#d060c0',
    halo: '#a83098',
    fade: '#701870',
    shadow: 'rgba(180, 60, 160, 0.5)',
    ambient: 'rgba(220, 100, 200, 0.22)',
    extrude: ['#3d0a35', '#2d0825', '#1d0618', '#120410', '#0a0208'],
  },
}

const CANVAS_WIDTH = 1024
const CANVAS_HEIGHT = 256

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

  const offsets = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const extrudeColors = colors.extrude
  offsets.forEach((offset, i) => {
    const colorIndex = Math.min(Math.floor(i / 2), extrudeColors.length - 1)
    ctx.fillStyle = offset === 10 ? '#000' : extrudeColors[colorIndex]
    ctx.fillText(text, x + offset, y + offset)
  })

  ctx.shadowColor = colors.core
  ctx.shadowBlur = 4
  ctx.fillStyle = colors.core
  ctx.fillText(text, x, y)

  ctx.shadowColor = colors.tube
  ctx.shadowBlur = 10
  ctx.fillStyle = colors.tube
  ctx.fillText(text, x, y)

  ctx.shadowColor = colors.glow
  ctx.shadowBlur = 18
  ctx.fillStyle = colors.core
  ctx.fillText(text, x, y)

  ctx.shadowColor = colors.halo
  ctx.shadowBlur = 28
  ctx.fillStyle = colors.core
  ctx.fillText(text, x, y)

  ctx.shadowColor = colors.fade
  ctx.shadowBlur = 36
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
    <mesh position={position} rotation={rotation} renderOrder={-1}>
      <planeGeometry args={[2, 0.5]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={1}
        alphaTest={0.02}
        depthWrite={false}
        depthTest={true}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}
