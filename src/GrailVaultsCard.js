export function GrailVaultsCard({ visible = false }) {
  if (!visible) return null

  return (
    <div className="grail-card-assembly theme-emerald" aria-hidden="true">
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
