import { useEffect, useRef } from 'react'
import TrackMap from './TrackMap'

export default function StationMapModal({ open, onClose, segments, train }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        ref={dialogRef}
        className="modal-panel station-map-modal"
        role="dialog"
        aria-labelledby="station-map-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="station-map-title">Station Map — Corridor S1–S6</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <TrackMap segments={segments} train={train} />
      </div>
    </div>
  )
}
