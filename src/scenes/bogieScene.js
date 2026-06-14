import * as THREE from 'three'
import { attachOrbitZoom } from './sceneControls.js'

function hexToColor(hex) {
  if (!hex) return 0xff3b30
  return parseInt(hex.replace('#', ''), 16)
}

export function createBogieScene(container, { focusSegmentRef }) {
  const width = container.clientWidth
  const height = container.clientHeight

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  container.appendChild(renderer.domElement)

  const group = new THREE.Group()
  const axleGeom = new THREE.CylinderGeometry(0.2, 0.2, 4, 32)
  const axleMat = new THREE.MeshPhongMaterial({ color: 0x666670 })
  const axle = new THREE.Mesh(axleGeom, axleMat)
  axle.rotation.z = Math.PI / 2
  group.add(axle)

  const wheelGeom = new THREE.TorusGeometry(1, 0.2, 16, 100)
  const wheelMat = new THREE.MeshPhongMaterial({
    color: 0xff3b30,
    emissive: 0x551111,
    emissiveIntensity: 0.4,
  })
  const wheel1 = new THREE.Mesh(wheelGeom, wheelMat)
  wheel1.position.x = -1.5
  const wheel2 = new THREE.Mesh(wheelGeom, wheelMat)
  wheel2.position.x = 1.5
  group.add(wheel1, wheel2)

  scene.add(group)

  scene.add(new THREE.HemisphereLight(0xffffff, 0x222233, 0.9))
  const rim = new THREE.DirectionalLight(0xffb4aa, 0.6)
  rim.position.set(-3, 5, 2)
  scene.add(rim)
  const key = new THREE.DirectionalLight(0xffffff, 1.0)
  key.position.set(0, 10, 10)
  scene.add(key)
  scene.add(new THREE.AmbientLight(0x404050, 0.4))

  let targetZoom = 5
  camera.position.z = targetZoom

  const controls = attachOrbitZoom(container, camera, new THREE.Vector3(0, 0, 0), {
    minZoom: 3,
    maxZoom: 10,
    initialZoom: 5,
  })

  let frameId = 0
  let disposed = false

  const animate = () => {
    if (disposed) return
    frameId = requestAnimationFrame(animate)

    group.rotation.y += 0.004
    group.rotation.x += 0.002
    controls.update(group)

    const focus = focusSegmentRef?.current
    if (focus) {
      const risk = focus.risk_index ?? 0
      const color = hexToColor(focus.color)
      wheelMat.color.setHex(color)
      wheelMat.emissive.setHex(color >> 3)
      wheelMat.emissiveIntensity = 0.3 + risk * 0.5
    }

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

  const setZoom = (delta) => {
    controls.setZoom(delta)
  }

  const resetView = () => {
    controls.resetView()
    group.rotation.set(0, 0, 0)
  }

  return { dispose, setZoom, resetView }
}
