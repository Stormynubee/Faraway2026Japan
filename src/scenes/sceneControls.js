import * as THREE from 'three'

/**
 * Shared Three.js pointer controls: drag-orbit, wheel zoom, reset.
 */
export function attachOrbitZoom(container, camera, target, opts = {}) {
  const {
    minZoom = 3,
    maxZoom = 14,
    zoomSpeed = 0.001,
    rotateSpeed = 0.005,
    onPick,
    pickables = [],
    initialZoom,
  } = opts

  let targetRotY = 0
  let targetRotX = 0
  let targetZoom = initialZoom ?? camera.position.z
  let dragging = false
  let lastX = 0
  let lastY = 0
  let moved = false

  const raycaster = new THREE.Raycaster()
  const pointer = new THREE.Vector2()

  const onPointerDown = (e) => {
    dragging = true
    moved = false
    lastX = e.clientX
    lastY = e.clientY
  }

  const onPointerUp = () => {
    dragging = false
  }

  const onPointerMove = (e) => {
    if (!dragging) return
    const dx = e.clientX - lastX
    const dy = e.clientY - lastY
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) moved = true
    lastX = e.clientX
    lastY = e.clientY
    targetRotY += dx * rotateSpeed
    targetRotX = Math.max(-0.4, Math.min(0.4, targetRotX + dy * rotateSpeed))
  }

  const onWheel = (e) => {
    e.preventDefault()
    targetZoom = Math.min(
      maxZoom,
      Math.max(minZoom, targetZoom + e.deltaY * zoomSpeed * 10),
    )
  }

  const onClick = (e) => {
    if (moved || !onPick || !pickables.length) return
    const rect = container.getBoundingClientRect()
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(pickables, false)
    if (hits.length > 0) {
      const id = hits[0].object.userData?.segmentId
      if (id) onPick(id)
    }
  }

  container.addEventListener('pointerdown', onPointerDown)
  container.addEventListener('pointerup', onPointerUp)
  container.addEventListener('pointerleave', onPointerUp)
  container.addEventListener('pointermove', onPointerMove)
  container.addEventListener('wheel', onWheel, { passive: false })
  container.addEventListener('click', onClick)

  const update = (group) => {
    group.rotation.y += (targetRotY - group.rotation.y) * 0.08
    group.rotation.x += (targetRotX - group.rotation.x) * 0.08
    camera.position.z += (targetZoom - camera.position.z) * 0.05
    camera.lookAt(target.x, target.y, target.z)
  }

  const setZoom = (delta) => {
    targetZoom = Math.min(maxZoom, Math.max(minZoom, targetZoom + delta))
  }

  const resetView = () => {
    targetRotY = 0
    targetRotX = 0
    targetZoom = initialZoom ?? camera.position.z
  }

  const dispose = () => {
    container.removeEventListener('pointerdown', onPointerDown)
    container.removeEventListener('pointerup', onPointerUp)
    container.removeEventListener('pointerleave', onPointerUp)
    container.removeEventListener('pointermove', onPointerMove)
    container.removeEventListener('wheel', onWheel)
    container.removeEventListener('click', onClick)
  }

  return { update, setZoom, resetView, dispose }
}
