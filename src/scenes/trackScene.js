import * as THREE from 'three'
import { highestRiskSegment } from '../lib/segmentUtils.js'
import { attachOrbitZoom } from './sceneControls.js'

const SEGMENT_IDS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']

function segmentToX(id) {
  const idx = SEGMENT_IDS.indexOf(id)
  if (idx < 0) return 0
  return (idx - 2.5) * 2.8
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
  const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  const trackGroup = new THREE.Group()

  // Ballast bed (wider, solid grey concrete slab)
  const ballastGeom = new THREE.BoxGeometry(22, 0.2, 3.2)
  const ballastMat = new THREE.MeshPhongMaterial({
    color: 0x1c1e22,
    shininess: 10,
  })
  const ballast = new THREE.Mesh(ballastGeom, ballastMat)
  ballast.position.y = -0.1
  trackGroup.add(ballast)

  // Sleepers (concrete block sleepers across the track)
  const sleeperGeom = new THREE.BoxGeometry(0.4, 0.25, 2.6)
  const sleeperMat = new THREE.MeshPhongMaterial({
    color: 0x3a3c42,
    shininess: 5,
  })
  for (let i = -10.5; i <= 10.5; i += 0.8) {
    const sleeper = new THREE.Mesh(sleeperGeom, sleeperMat)
    sleeper.position.set(i, 0.05, 0)
    trackGroup.add(sleeper)
  }

  // Steel rails (two rails running along the track, shiny steel finish)
  const railGeom = new THREE.BoxGeometry(22, 0.3, 0.15)
  const railMat = new THREE.MeshPhongMaterial({
    color: 0x989ca6,
    specular: 0xffffff,
    shininess: 80,
  })
  const rail1 = new THREE.Mesh(railGeom, railMat)
  rail1.position.set(0, 0.25, -0.7)
  const rail2 = new THREE.Mesh(railGeom, railMat)
  rail2.position.set(0, 0.25, 0.7)
  trackGroup.add(rail1, rail2)

  // Segment markers (glassy indicator columns that pulse)
  const markerPickables = []
  const markerMeshes = {}
  
  SEGMENT_IDS.forEach((id) => {
    // Solid capsule indicating active segment risk
    const markerGeom = new THREE.CylinderGeometry(0.3, 0.3, 0.8, 16)
    const markerMat = new THREE.MeshPhongMaterial({
      color: 0x22c55e,
      shininess: 100,
    })
    const marker = new THREE.Mesh(markerGeom, markerMat)
    marker.position.set(segmentToX(id), 0.5, 0)
    marker.userData.segmentId = id
    
    trackGroup.add(marker)
    markerPickables.push(marker)
    markerMeshes[id] = marker
  })

  // Pulsating anomaly sphere indicating location of active risk
  const sphereGeom = new THREE.SphereGeometry(0.35, 32, 32)
  const sphereMat = new THREE.MeshPhongMaterial({
    color: 0xff5545,
    emissive: 0xff2200,
    emissiveIntensity: 0.8,
    shininess: 100,
  })
  const anomaly = new THREE.Mesh(sphereGeom, sphereMat)
  anomaly.position.set(2, 0.9, 0)
  trackGroup.add(anomaly)

  // Sleek train model (composed group: main chassis + cabin windows)
  const trainGroup = new THREE.Group()
  
  const chassisGeom = new THREE.BoxGeometry(1.6, 0.6, 0.9)
  const chassisMat = new THREE.MeshPhongMaterial({
    color: 0xeef1f6,
    specular: 0xaaaaaa,
    shininess: 50,
  })
  const chassis = new THREE.Mesh(chassisGeom, chassisMat)
  chassis.position.y = 0.4
  trainGroup.add(chassis)

  // Window strips on both sides
  const windowGeom = new THREE.BoxGeometry(1.4, 0.15, 0.92)
  const windowMat = new THREE.MeshPhongMaterial({
    color: 0x121317,
    shininess: 120,
  })
  const windowStrip = new THREE.Mesh(windowGeom, windowMat)
  windowStrip.position.y = 0.5
  trainGroup.add(windowStrip)

  trainGroup.position.y = 0.25
  trackGroup.add(trainGroup)

  scene.add(trackGroup)

  // Calibrated lighting setup
  scene.add(new THREE.HemisphereLight(0xe0f0ff, 0x303040, 0.8))
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.4)
  dirLight.position.set(6, 12, 4)
  dirLight.castShadow = true
  scene.add(dirLight)
  
  const fillLight = new THREE.DirectionalLight(0xffb4aa, 0.5)
  fillLight.position.set(-6, 4, -4)
  scene.add(fillLight)

  scene.add(new THREE.AmbientLight(0x404050, 0.3))

  camera.position.set(0, 5, 11)
  camera.lookAt(0, 0, 0)

  // Attach OrbitControls wrapper
  const controls = attachOrbitZoom(container, camera, new THREE.Vector3(0, 0.3, 0), {
    minZoom: 5,
    maxZoom: 15,
    initialZoom: 11,
    onPick: onSegmentSelect,
    pickables: markerPickables,
  })

  let frameId = 0
  let disposed = false

  const animate = () => {
    if (disposed) return
    frameId = requestAnimationFrame(animate)

    // Update OrbitControls
    controls.update()

    // Smoothly slide anomaly indicator to the worst segment
    const segs = segmentsRef.current || []
    const worst = highestRiskSegment(segs)
    const targetX = worst ? segmentToX(worst.id) : 0
    anomaly.position.x += (targetX - anomaly.position.x) * 0.05
    
    // Anomaly pulsation scale and intensity
    const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.15
    anomaly.scale.setScalar(pulse)
    anomaly.material.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.01) * 0.3

    // Update segment markers colors & glow states
    for (const seg of segs) {
      const mesh = markerMeshes[seg.id]
      if (!mesh) continue
      const color = hexToColor(seg.color || '#22c55e')
      
      mesh.material.color.setHex(color)
      // Marker is solid Phong mesh, color indicates active risk state
      
      const isWorst = worst && seg.id === worst.id
      mesh.scale.set(1, isWorst ? 1.1 + Math.sin(Date.now() * 0.006) * 0.05 : 1, 1)
    }

    // Smoothly slide the train carriage along the tracks
    const train = trainRef.current
    trainGroup.position.x += (trainToX(train) - trainGroup.position.x) * 0.08

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
