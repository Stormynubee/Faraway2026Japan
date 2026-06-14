import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { createTrackScene } from '../scenes/trackScene.js'

const TrackScene = forwardRef(function TrackScene(
  { segments, train, onSegmentClick },
  ref,
) {
  const mountRef = useRef(null)
  const segmentsRef = useRef(segments)
  const trainRef = useRef(train)
  const sceneRef = useRef(null)

  segmentsRef.current = segments
  trainRef.current = train

  useImperativeHandle(ref, () => ({
    setZoom: (delta) => sceneRef.current?.setZoom(delta),
    resetView: () => sceneRef.current?.resetView(),
  }))

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const scene = createTrackScene(container, {
      segmentsRef,
      trainRef,
      onSegmentSelect: onSegmentClick,
    })
    sceneRef.current = scene

    return () => {
      scene.dispose()
      sceneRef.current = null
    }
  }, [onSegmentClick])

  return (
    <div ref={mountRef} className="track-scene" aria-label="3D track corridor view" />
  )
})

export default TrackScene
