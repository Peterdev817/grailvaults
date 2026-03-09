function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3)
}

const CARD_INITIAL_SCALE = 0.9
const EXPAND_START_BEFORE_END = 1.5
const EXPAND_DURATION = 1.5

export function GrailVaultsCard({
  visible = false,
  descentProgress = 1,
  appearanceDuration = 1,
}) {
  if (!visible) return null

  const expansionStartProgress = Math.max(
    0,
    1 - EXPAND_START_BEFORE_END / appearanceDuration
  )
  const expansionDurationProgress = EXPAND_DURATION / appearanceDuration

  let scale = CARD_INITIAL_SCALE
  if (descentProgress >= expansionStartProgress) {
    const expandT = Math.min(
      1,
      (descentProgress - expansionStartProgress) / expansionDurationProgress
    )
    scale = CARD_INITIAL_SCALE + (1 - CARD_INITIAL_SCALE) * easeOutCubic(expandT)
  }

  const eased = easeOutCubic(descentProgress)
  const translateY = (1 - eased) * -120

  return (
    <div
      className="grail-card-assembly theme-emerald grail-card-descent"
      style={{
        transform: `translateX(-50%) translateY(${translateY}%) scale(${scale})`,
      }}
      aria-hidden="true"
    >
      <div className="grail-card-frame">
        <div className="grail-card-panel">
          <div className="grail-card-glass" aria-hidden="true" />
          <div className="grail-card-neon grail-card-neon--image">
            <img
              src="/grail-vaults.png"
              alt="GRAIL VAULTS"
              className="grail-card-panel-image"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
