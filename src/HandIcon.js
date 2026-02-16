const TapToOpenIcon = () => (
  <div className="tap-icon-composition">
    <div className="tap-icon-glow" aria-hidden />
    <div className="tap-icon-ripple" aria-hidden />
    <svg
      className="tap-icon-svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 72 72"
      width="56"
      height="56"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="badgeFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fffbf5" />
          <stop offset="40%" stopColor="#fff4e0" />
          <stop offset="100%" stopColor="#f5e6c8" />
        </linearGradient>
        <linearGradient id="badgeEdge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8d4b8" />
          <stop offset="50%" stopColor="#d4b896" />
          <stop offset="100%" stopColor="#c4a876" />
        </linearGradient>
        <linearGradient id="arrowStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a08060" />
          <stop offset="100%" stopColor="#806040" />
        </linearGradient>
        <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="3" stdDeviation="5" floodColor="rgba(0,0,0,0.12)" />
        </filter>
      </defs>
      <g filter="url(#softShadow)">
        <circle
          className="tap-icon-ring"
          cx="36"
          cy="36"
          r="32"
          fill="none"
          stroke="url(#badgeEdge)"
          strokeWidth="2.5"
          opacity="0.9"
        />
        <circle
          className="tap-icon-badge"
          cx="36"
          cy="36"
          r="28"
          fill="url(#badgeFill)"
          stroke="rgba(200,170,130,0.4)"
          strokeWidth="1"
        />
        <g className="tap-icon-arrow" stroke="url(#arrowStroke)" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeWidth="2.8">
          <path d="M36 22v28" />
          <path d="M26 38l10 10 10-10" />
        </g>
      </g>
    </svg>
    <div className="tap-icon-label">Tap to open</div>
  </div>
)

export function FingerIcon({ onClick, visible }) {
  if (!visible) return null

  return (
    <div
      className="finger-icon-overlay"
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onClick?.()
      }}
      onPointerDown={(e) => e.stopPropagation()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
    >
      <div className="finger-icon-wrapper">
        <TapToOpenIcon />
      </div>
    </div>
  )
}
