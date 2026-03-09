import { NEON_THEMES, THEME_LABELS } from './NeonSign'

export function NeonTextIntro({ theme = 'emerald', animate = false }) {
  const letters = THEME_LABELS[theme] || THEME_LABELS.emerald
  const themeClass = NEON_THEMES.includes(theme) ? `theme-${theme}` : 'theme-emerald'

  return (
    <div
      className={`neon-intro-card${animate ? ' neon-intro-card--animating' : ''}`}
      aria-hidden="true"
    >
      <div className="neon-intro-frame">
        <div className="neon-intro-panel theme-emerald">
          <div className="neon-intro-glass" aria-hidden="true" />
          <div className={`neon-sign-inline ${themeClass}`}>
            <div className="neon-sign-inline-text">
              {letters.map((letter, i) => (
                <span key={i} className="neon-sign-inline-char" style={{ '--i': i }}>
                  {letter}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
