import { useEffect, useRef } from 'react'
import * as THREE from 'three'

const SEGMENT_IDS = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6']

function stateColor(state, fallback) {
  if (state === 'CRITICAL_MUD_PUMPING') return 0xef4444
  if (state === 'WARNING_WATERLOGGING') return 0xeab308
  if (fallback) return parseInt(fallback.replace('#', ''), 16)
  return 0x474746
}

export default function BogieScene({ segments, trainSegmentId }) {
  const mountRef = useRef(null)
  const segmentsRef = useRef(segments)
  const trainRef = useRef(trainSegmentId)

  segmentsRef.current = segments
  trainRef.current = trainSegmentId

  useEffect(() => {
    const container = mountRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    const group = new THREE.Group()
    scene.add(group)

    const segmentMeshes = []

    SEGMENT_IDS.forEach((id, i) => {
      const geometry = new THREE.BoxGeometry(1.4, 1, 0.9)
      const material = new THREE.MeshPhongMaterial({
        color: 0x474746,
        specular: 0x333333,
        shininess: 40,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set((i - 2.5) * 1.6, 0.3, 0)
      mesh.userData.baseHeight = 1
      group.add(mesh)
      segmentMeshes.push({ id, mesh })
    })

    const bogieGroup = new THREE.Group()
    const frameMat = new THREE.MeshPhongMaterial({
      color: 0x888888,
      specular: 0x444444,
      shininess: 60,
    })
    const wheelMat = new THREE.MeshPhongMaterial({ color: 0x2a2a2a, shininess: 80 })

    bogieGroup.add(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 1.2), frameMat))
    bogieGroup.children[0].position.y = 0.5

    ;[
      [-0.7, 0.25, 0.45],
      [0.7, 0.25, 0.45],
      [-0.7, 0.25, -0.45],
      [0.7, 0.25, -0.45],
    ].forEach(([x, y, z]) => {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.22, 0.12, 24),
        wheelMat,
      )
      wheel.rotation.x = Math.PI / 2
      wheel.position.set(x, y, z)
      bogieGroup.add(wheel)
    })

    const railMat = new THREE.MeshPhongMaterial({ color: 0x555555 })
    const railGeom = new THREE.BoxGeometry(10, 0.08, 0.12)
    const railL = new THREE.Mesh(railGeom, railMat)
    railL.position.set(0, 0.12, 0.55)
    const railR = new THREE.Mesh(railGeom, railMat)
    railR.position.set(0, 0.12, -0.55)
    bogieGroup.add(railL, railR)
    group.add(bogieGroup)

    const keyLight = new THREE.DirectionalLight(0xffb4aa, 1.2)
    keyLight.position.set(4, 8, 6)
    scene.add(keyLight)
    scene.add(new THREE.AmbientLight(0x404040, 0.9))

    camera.position.set(0, 4, 9)
    camera.lookAt(0, 0.5, 0)

    let targetRotY = 0
    let targetRotX = 0

    const onMove = (e) => {
      const rect = container.getBoundingClientRect()
      const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const my = ((e.clientY - rect.top) / rect.height) * 2 - 1
      targetRotY = mx * 0.25
      targetRotX = my * 0.15
    }
    container.addEventListener('mousemove', onMove)

    let frameId = 0
    let disposed = false

    const animate = () => {
      if (disposed) return
      frameId = requestAnimationFrame(animate)

      group.rotation.y += 0.00025
      group.rotation.x += 0.0001
      group.rotation.y += (targetRotY - group.rotation.y) * 0.04
      group.rotation.x += (targetRotX - group.rotation.x) * 0.04

      const segs = segmentsRef.current
      const trainId = trainRef.current || 'S1'
      const trainIdx = SEGMENT_IDS.indexOf(trainId)
      bogieGroup.position.x += ((trainIdx - 2.5) * 1.6 - bogieGroup.position.x) * 0.05

      segmentMeshes.forEach(({ id, mesh }) => {
        const seg = segs.find((s) => s.id === id)
        const mat = mesh.material
        mat.color.setHex(stateColor(seg?.state, seg?.color))
        const h = 0.4 + (seg?.risk_index ?? 0) * 1.2
        mesh.scale.y = h / mesh.userData.baseHeight
        mesh.position.y = (h * mesh.userData.baseHeight) / 2 - 0.2
      })

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

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      container.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div ref={mountRef} className="bogie-scene" aria-label="3D corridor view" />
  )
}
