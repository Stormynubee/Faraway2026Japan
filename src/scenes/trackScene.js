import * as THREE from 'three'
import { highestRiskSegment } from '../lib/segmentUtils.js'
import { attachOrbitZoom } from './sceneControls.js'

const SEGMENT_IDS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']

function segmentToX(id) {
  const idx = SEGMENT_IDS.indexOf(id)
  if (idx < 0) return 0
  return (idx - 2.5) * 1.6
}

function trainToX(train) {
  const idx = SEGMENT_IDS.indexOf(train?.segment_id ?? 'S1')
  const progress = train?.progress ?? 0
  const base = segmentToX(SEGMENT_IDS[idx] ?? 'S1')
  const nextIdx = Math.min(idx + 1, SEGMENT_IDS.length - 1)
  const nextX = segmentToX(SEGMENT_IDS[nextIdx])
  return base + (nextX - base) * progress
}

function hexToColor(hex) {
  return parseInt(hex.replace('#', ''), 16)
}

export function createTrackScene(container, { segmentsRef, trainRef, onSegmentSelect }) {
  const width = container.clientWidth
  const height = container.clientHeight

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  const trackGroup = new THREE.Group()

  const ballastGeom = new THREE.BoxGeometry(20, 0.15, 2.4)
  const ballastMat = new THREE.MeshPhongMaterial({ color: 0x2a2a2e })
  trackGroup.add(new THREE.Mesh(ballastGeom, ballastMat))

  const railGeom = new THREE.BoxGeometry(20, 0.5, 0.2)
  const railMat = new THREE.MeshPhongMaterial({ color: 0x555560 })
  const rail1 = new THREE.Mesh(railGeom, railMat)
  rail1.position.z = -0.5
  rail1.position.y = 0.15
  const rail2 = new THREE.Mesh(railGeom, railMat)
  rail2.position.z = 0.5
  rail2.position.y = 0.15
  trackGroup.add(rail1, rail2)

  for (let i = -10; i <= 10; i += 2) {
    const sleeperGeom = new THREE.BoxGeometry(0.5, 0.3, 2)
    const sleeper = new THREE.Mesh(sleeperGeom, railMat)
    sleeper.position.x = i
    sleeper.position.y = -0.05
    trackGroup.add(sleeper)
  }

  const markerPickables = []
  const markerMeshes = {}
  SEGMENT_IDS.forEach((id) => {
    const markerGeom = new THREE.CylinderGeometry(0.25, 0.25, 0.6, 16)
    const markerMat = new THREE.MeshPhongMaterial({
      color: 0x22c55e,
      emissive: 0x112211,
    })
    const marker = new THREE.Mesh(markerGeom, markerMat)
    marker.position.set(segmentToX(id), 0.35, 0)
    marker.userData.segmentId = id
    trackGroup.add(marker)
    markerPickables.push(marker)
    markerMeshes[id] = marker
  })

  const sphereGeom = new THREE.SphereGeometry(0.35, 32, 32)
  const sphereMat = new THREE.MeshPhongMaterial({
    color: 0xff3b30,
    emissive: 0xff2200,
    emissiveIntensity: 0.6,
  })
  const anomaly = new THREE.Mesh(sphereGeom, sphereMat)
  anomaly.position.set(2, 0.6, 0)
  trackGroup.add(anomaly)

  const trainGeom = new THREE.BoxGeometry(0.8, 0.5, 0.6)
  const trainMat = new THREE.MeshPhongMaterial({
    color: 0xffb4aa,
    emissive: 0x331111,
  })
  const trainMesh = new THREE.Mesh(trainGeom, trainMat)
  trainMesh.position.y = 0.5
  trackGroup.add(trainMesh)

  scene.add(trackGroup)

  scene.add(new THREE.HemisphereLight(0xffffff, 0x333344, 0.8))
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.2)
  dirLight.position.set(5, 8, 5)
  scene.add(dirLight)
  scene.add(new THREE.AmbientLight(0x606070, 0.5))

  camera.position.z = 8
  camera.position.y = 3
  camera.lookAt(0, 0, 0)

  const controls = attachOrbitZoom(container, camera, new THREE.Vector3(0, 0, 0), {
    minZoom: 5,
    maxZoom: 14,
    initialZoom: 8,
    onPick: onSegmentSelect,
    pickables: markerPickables,
  })

  let frameId = 0
  let disposed = false

  const animate = () => {
    if (disposed) return
    frameId = requestAnimationFrame(animate)

    trackGroup.rotation.y += 0.002
    controls.update(trackGroup)

    const segs = segmentsRef.current || []
    const worst = highestRiskSegment(segs)
    const targetX = worst ? segmentToX(worst.id) : 2
    anomaly.position.x += (targetX - anomaly.position.x) * 0.05
    anomaly.scale.setScalar(1 + Math.sin(Date.now() * 0.01) * 0.2)

    for (const seg of segs) {
      const mesh = markerMeshes[seg.id]
      if (!mesh) continue
      const color = hexToColor(seg.color || '#22c55e')
      mesh.material.color.setHex(color)
      mesh.material.emissive.setHex(color >> 4)
      const isWorst = worst && seg.id === worst.id
      mesh.scale.setScalar(isWorst ? 1.2 + Math.sin(Date.now() * 0.008) * 0.1 : 1)
    }

    const train = trainRef.current
    trainMesh.position.x += (trainToX(train) - trainMesh.position.x) * 0.08

    renderer.render(scene, camera)
  }
  animate()

  const onResize = () => {
    const w = container.clientWidth
    const h = container.clientHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  window.addEventListener('resize', onResize)

  const dispose = () => {
    disposed = true
    cancelAnimationFrame(frameId)
    controls.dispose()
    window.removeEventListener('resize', onResize)
    renderer.dispose()
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement)
    }
  }

  return {
    dispose,
    setZoom: controls.setZoom,
    resetView: controls.resetView,
  }
}
