import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'

const SUNBURST_VS = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const SUNBURST_FS = `
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uFade;
uniform float uRadiusScale;

const float PI = 3.14159265359;
const vec3 GOLD = vec3(1.0, 0.88, 0.35);
const vec3 GOLD_HOT = vec3(1.0, 0.96, 0.65);
const vec3 AMBER = vec3(1.0, 0.75, 0.2);

float rayLayer(float angle, float nRays, float speed, float sharp) {
  float rayAngle = 2.0 * PI / nRays;
  float ray = fract(angle / rayAngle + uTime * speed);
  float peak = exp(-ray * ray * sharp) + exp(-(1.0 - ray) * (1.0 - ray) * sharp);
  return peak;
}

void main() {
  vec2 p = vUv - 0.5;
  float r = length(p) * 2.0;
  float angle = atan(p.y, p.x);

  float rays = 0.0;
  rays += 0.55 * rayLayer(angle, 24.0, 0.54, 90.0);
  rays += 0.65 * rayLayer(angle, 36.0, -0.38, 70.0);
  rays += 0.45 * rayLayer(angle, 48.0, 0.47, 110.0);
  rays += 0.4 * rayLayer(angle, 16.0, -0.24, 55.0);

  float rScaled = r / max(uRadiusScale, 0.5);
  float falloff = 1.0 - smoothstep(0.12, 1.15, rScaled);
  falloff *= 1.0 + 0.25 * sin(uTime * 2.2);
  float centerGlow = exp(-r * r * 2.2) * (0.5 + 0.2 * sin(uTime * 1.8));

  float intensity = (rays * falloff + centerGlow) * uFade;
  vec3 color = mix(GOLD, GOLD_HOT, rays) + AMBER * centerGlow * 0.6;
  gl_FragColor = vec4(color, intensity * 0.94);
}
`

export function PrizeSunburstMesh({ z, y = 0.1, planeSize = 19 }) {
  const meshRef = useRef()
  const t0Ref = useRef(null)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFade: { value: 0 },
      uRadiusScale: { value: 1 },
    }),
    []
  )

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms,
        vertexShader: SUNBURST_VS,
        fragmentShader: SUNBURST_FS,
        transparent: true,
        depthWrite: false,
        depthTest: true,
        blending: THREE.NormalBlending,
        side: THREE.DoubleSide,
      }),
    [uniforms]
  )

  useEffect(
    () => () => {
      material.dispose()
    },
    [material]
  )

  useFrame((state) => {
    if (t0Ref.current === null) t0Ref.current = state.clock.elapsedTime
    const elapsed = state.clock.elapsedTime - t0Ref.current
    uniforms.uTime.value = elapsed
    const fadeIn = Math.min(1, elapsed / 0.5)
    uniforms.uFade.value = fadeIn * (0.92 + 0.08 * Math.sin(elapsed * 1.2))
    uniforms.uRadiusScale.value =
      typeof window !== 'undefined' && window.innerWidth <= 600 ? 1.38 : 1
  })

  return (
    <mesh
      ref={meshRef}
      position={[0, y, z]}
      renderOrder={1}
      material={material}
    >
      <planeGeometry args={[planeSize, planeSize]} />
    </mesh>
  )
}
