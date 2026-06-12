import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'

// Helper to generate glowing billboard canvas
function makeBillboardCanvas(text = 'NEXO PAY', subtitle = 'FAST & SECURE', w = 512, h = 256, isLight = false) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')

  // Background
  ctx.fillStyle = isLight ? '#f8fafc' : '#05040d'
  ctx.fillRect(0, 0, w, h)

  // Grid pattern
  ctx.strokeStyle = isLight ? 'rgba(99, 102, 241, 0.06)' : 'rgba(0, 240, 255, 0.1)'
  ctx.lineWidth = 1
  const gridSize = 20
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, h)
    ctx.stroke()
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(w, y)
    ctx.stroke()
  }

  // Text details
  ctx.shadowColor = isLight ? 'rgba(79, 70, 229, 0.3)' : '#ff00f7'
  ctx.shadowBlur = 10

  const grad = ctx.createLinearGradient(0, 0, w, 0)
  if (isLight) {
    grad.addColorStop(0, '#4f46e5')
    grad.addColorStop(1, '#0284c7')
  } else {
    grad.addColorStop(0, '#00f0ff')
    grad.addColorStop(0.5, '#ff00f7')
    grad.addColorStop(1, '#ffd700')
  }

  ctx.font = 'bold 64px "Orbitron", Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = grad
  ctx.fillText(text, w / 2, h / 2 - 15)

  // Subtitle
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.font = 'bold 20px "Inter", Arial'
  ctx.fillStyle = isLight ? '#475569' : '#e6f7ff'
  ctx.fillText(subtitle, w / 2, h / 2 + 45)

  // Border
  ctx.strokeStyle = isLight ? '#4f46e5' : '#00f0ff'
  ctx.lineWidth = 4
  ctx.strokeRect(10, 10, w - 20, h - 20)

  return canvas
}

export default function CityBackground({ theme = 'dark' }) {
  const mountRef = useRef(null)

  // Refs to dynamically modify Three.js scene elements on theme toggle
  const sceneRef = useRef(null)
  const ambientLightRef = useRef(null)
  const dirLightRef = useRef(null)
  const neonLightsRef = useRef([])
  const vehicleLightsRef = useRef([])
  const billboardsRef = useRef([])

  // Watch for theme changes and update Three.js scene dynamically
  useEffect(() => {
    if (!sceneRef.current) return
    const isLight = theme === 'light'
    const skyHexColor = isLight ? 0xe2e8f0 : 0x070514 // Slate 200 vs deep night purple

    // Update scene background and fog
    sceneRef.current.background.setHex(skyHexColor)
    if (sceneRef.current.fog) {
      sceneRef.current.fog.color.setHex(skyHexColor)
      sceneRef.current.fog.density = isLight ? 0.0035 : 0.0025
    }

    // Update main lights
    if (ambientLightRef.current) {
      ambientLightRef.current.intensity = isLight ? 1.6 : 0.6
      ambientLightRef.current.color.setHex(isLight ? 0xf1f5f9 : 0x1a1236)
    }
    if (dirLightRef.current) {
      dirLightRef.current.intensity = isLight ? 1.2 : 0.4
      dirLightRef.current.color.setHex(isLight ? 0xfffaf0 : 0x3e185e) // sun light vs night twilight
    }

    // Update neon city lights (make them subtle during day)
    neonLightsRef.current.forEach((l) => {
      l.intensity = isLight ? 0.2 : 1.5
    })

    // Update vehicle light projections (turn down headlight strength in day)
    vehicleLightsRef.current.forEach((l) => {
      l.intensity = isLight ? 0.05 : l.userData.originalIntensity
    })

    // Re-draw billboards to match day/night style
    billboardsRef.current.forEach((bb) => {
      const bCanvas = makeBillboardCanvas(bb.userData.text, bb.userData.sub, 512, 256, isLight)
      const newTex = new THREE.CanvasTexture(bCanvas)
      if (THREE.SRGBColorSpace) {
        newTex.colorSpace = THREE.SRGBColorSpace
      }
      const oldMap = bb.material.map
      bb.material.map = newTex
      if (oldMap) oldMap.dispose()
    })

  }, [theme])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let width = mount.clientWidth
    let height = mount.clientHeight
    const isLight = theme === 'light'

    // 1. Scene & Render Setup
    const scene = new THREE.Scene()
    sceneRef.current = scene

    const skyHexColor = isLight ? 0xe2e8f0 : 0x070514
    scene.background = new THREE.Color(skyHexColor)
    scene.fog = new THREE.FogExp2(skyHexColor, isLight ? 0.0035 : 0.0025)

    const camera = new THREE.PerspectiveCamera(55, width / height, 1, 1500)
    camera.position.set(0, 85, 240)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(width, height)
    if (THREE.SRGBColorSpace) {
      renderer.outputColorSpace = THREE.SRGBColorSpace
    }
    mount.appendChild(renderer.domElement)

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(isLight ? 0xf1f5f9 : 0x1a1236, isLight ? 1.6 : 0.6)
    scene.add(ambientLight)
    ambientLightRef.current = ambientLight

    const dirLight = new THREE.DirectionalLight(isLight ? 0xfffaf0 : 0x3e185e, isLight ? 1.2 : 0.4)
    dirLight.position.set(0, 200, 100)
    scene.add(dirLight)
    dirLightRef.current = dirLight

    // Neon lights
    const neonColors = [0x6366f1, 0x0ea5e9, 0x10b981, 0xf43f5e] // Refined palette: indigo, sky, emerald, rose
    const neonLights = []
    for (let i = 0; i < 4; i++) {
      const color = neonColors[i]
      const light = new THREE.PointLight(color, isLight ? 0.2 : 1.5, 300, 1.8)
      light.position.set((i - 1.5) * 150, 45, (Math.random() - 0.5) * 200)
      scene.add(light)
      neonLights.push(light)
    }
    neonLightsRef.current = neonLights

    // 3. Ground & Roads
    const groundGeo = new THREE.PlaneGeometry(3000, 3000)
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0b0f19,
      metalness: 0.7,
      roughness: 0.8,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -1
    scene.add(ground)

    // Highway
    const hwyGeo = new THREE.PlaneGeometry(1000, 48)
    const hwyMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.8,
      roughness: 0.6,
    })
    const highway = new THREE.Mesh(hwyGeo, hwyMat)
    highway.rotation.x = -Math.PI / 2
    highway.position.set(0, -0.9, 50)
    scene.add(highway)

    // Center road line
    const lineGeo = new THREE.PlaneGeometry(1000, 1.2)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0x6366f1 })
    const centerLine = new THREE.Mesh(lineGeo, lineMat)
    centerLine.rotation.x = -Math.PI / 2
    centerLine.position.set(0, -0.85, 50)
    scene.add(centerLine)

    // Intersecting road
    const crossRoadGeo = new THREE.PlaneGeometry(48, 1000)
    const crossRoad = new THREE.Mesh(crossRoadGeo, hwyMat)
    crossRoad.rotation.x = -Math.PI / 2
    crossRoad.position.set(0, -0.89, 50)
    scene.add(crossRoad)

    const crossLineGeo = new THREE.PlaneGeometry(1.2, 1000)
    const crossLineMat = new THREE.MeshBasicMaterial({ color: 0x0ea5e9 })
    const crossLine = new THREE.Mesh(crossLineGeo, crossLineMat)
    crossLine.rotation.x = -Math.PI / 2
    crossLine.position.set(0, -0.84, 50)
    scene.add(crossLine)

    // 4. Sequential Traffic Lights (Semáforos)
    const trafficLights = []
    const tlPositions = [
      { x: -26, z: 24, rotationY: 0 },
      { x: 26, z: 76, rotationY: Math.PI },
      { x: -26, z: 76, rotationY: Math.PI / 2 },
      { x: 26, z: 24, rotationY: -Math.PI / 2 },
    ]

    const tlPoleGeo = new THREE.CylinderGeometry(0.8, 1, 30, 8)
    const tlPoleMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.6 })

    const tlBoxGeo = new THREE.BoxGeometry(4, 8, 3)
    const tlBoxMat = new THREE.MeshStandardMaterial({ color: 0x111827 })

    const lightLensGeo = new THREE.SphereGeometry(1.0, 16, 16)

    tlPositions.forEach((pos, idx) => {
      const group = new THREE.Group()

      // Pole
      const pole = new THREE.Mesh(tlPoleGeo, tlPoleMat)
      pole.position.y = 15
      group.add(pole)

      // Light Box
      const box = new THREE.Mesh(tlBoxGeo, tlBoxMat)
      box.position.y = 30
      group.add(box)

      // Lenses
      const redLens = new THREE.Mesh(lightLensGeo, new THREE.MeshBasicMaterial({ color: 0x220000 }))
      redLens.position.set(0, 32.5, 1.6)
      group.add(redLens)

      const yellowLens = new THREE.Mesh(lightLensGeo, new THREE.MeshBasicMaterial({ color: 0x222200 }))
      yellowLens.position.set(0, 30, 1.6)
      group.add(yellowLens)

      const greenLens = new THREE.Mesh(lightLensGeo, new THREE.MeshBasicMaterial({ color: 0x002200 }))
      greenLens.position.set(0, 27.5, 1.6)
      group.add(greenLens)

      // Dynamic light projection
      const ptLight = new THREE.PointLight(0x00ff00, 0, 80, 2.0)
      ptLight.position.set(0, 27.5, 5)
      group.add(ptLight)

      group.position.set(pos.x, 0, pos.z)
      group.rotation.y = pos.rotationY

      scene.add(group)

      trafficLights.push({
        group,
        redLens,
        yellowLens,
        greenLens,
        ptLight,
        isNS: idx >= 2,
      })
    })

    // 5. Buildings
    const buildingGroup = new THREE.Group()
    const boxGeo = new THREE.BoxGeometry(1, 1, 1)

    const isMobile = width < 700
    const xGrid = isMobile ? 12 : 24
    const zGrid = isMobile ? 8 : 16

    for (let x = -xGrid; x <= xGrid; x += 3) {
      for (let z = -zGrid; z <= zGrid; z += 3) {
        const worldX = x * 22
        const worldZ = z * 22 + 50
        if (Math.abs(worldX) < 32 || Math.abs(worldZ - 50) < 32) continue
        if (Math.random() < 0.15) continue

        const bHeight = 40 + Math.random() * 120
        const bWidth = 14 + Math.random() * 12
        const bDepth = 14 + Math.random() * 12

        const buildingMat = new THREE.MeshStandardMaterial({
          color: 0x1f2937,
          emissive: 0x030712,
          metalness: 0.5,
          roughness: 0.6,
        })
        const building = new THREE.Mesh(boxGeo, buildingMat)
        building.scale.set(bWidth, bHeight, bDepth)
        building.position.set(worldX, bHeight / 2 - 1, worldZ)
        buildingGroup.add(building)

        // Windows panels
        const faceCount = Math.random() > 0.5 ? 2 : 1
        for (let f = 0; f < faceCount; f++) {
          const winColor = neonColors[Math.floor(Math.random() * neonColors.length)]
          const winMat = new THREE.MeshBasicMaterial({
            color: winColor,
            transparent: true,
            opacity: 0.5,
          })
          const winWidth = bWidth * 0.7
          const winHeight = bHeight * 0.8
          const winGeo = new THREE.PlaneGeometry(winWidth, winHeight)
          const winMesh = new THREE.Mesh(winGeo, winMat)

          if (f === 0) {
            winMesh.position.set(worldX, bHeight / 2, worldZ + bDepth / 2 + 0.1)
          } else {
            winMesh.position.set(worldX + bWidth / 2 + 0.1, bHeight / 2, worldZ)
            winMesh.rotation.y = Math.PI / 2
          }
          buildingGroup.add(winMesh)
        }
      }
    }
    scene.add(buildingGroup)

    // 6. Billboards (Neon/Daylight Advertisements)
    const billboards = new THREE.Group()
    const billboardPositions = [
      { x: -55, y: 75, z: 20, rotY: Math.PI / 6, text: 'NEXO PAY', sub: 'CAMBIA AL INSTANTE' },
      { x: 55, y: 65, z: 80, rotY: -Math.PI / 4, text: 'NEXO PAY', sub: 'TASA PREFERENCIAL' },
      { x: -65, y: 90, z: 120, rotY: Math.PI / 4, text: 'EUR / USD', sub: 'EN VIVO · $1.0854' },
      { x: 65, y: 80, z: -10, rotY: -Math.PI / 6, text: 'USD / ARS', sub: 'EN VIVO · $904.50' },
    ]

    const tempBillboards = []
    billboardPositions.forEach((pos) => {
      const bCanvas = makeBillboardCanvas(pos.text, pos.sub, 512, 256, isLight)
      const bTex = new THREE.CanvasTexture(bCanvas)
      if (THREE.SRGBColorSpace) {
        bTex.colorSpace = THREE.SRGBColorSpace
      }

      const bMat = new THREE.MeshBasicMaterial({ map: bTex, side: THREE.DoubleSide })
      const bGeo = new THREE.PlaneGeometry(45, 25)
      const bMesh = new THREE.Mesh(bGeo, bMat)

      bMesh.userData = { text: pos.text, sub: pos.sub }

      // Pole
      const poleGeo = new THREE.CylinderGeometry(0.6, 0.6, pos.y, 8)
      const poleMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.5 })
      const pole = new THREE.Mesh(poleGeo, poleMat)
      pole.position.set(pos.x, pos.y / 2, pos.z)
      billboards.add(pole)

      bMesh.position.set(pos.x, pos.y, pos.z)
      bMesh.rotation.y = pos.rotY
      billboards.add(bMesh)
      tempBillboards.push(bMesh)
    })
    scene.add(billboards)
    billboardsRef.current = tempBillboards

    // 7. Vehicles
    const vehicleTypes = {
      CAR: {
        geo: new THREE.BoxGeometry(5.0, 1.8, 2.4),
        speed: 1.8,
        headlightColor: 0xffffff,
        taillightColor: 0xff3b30,
        lightIntensity: 1.2,
      },
      MOTO: {
        geo: new THREE.BoxGeometry(2.4, 1.4, 0.8),
        speed: 2.8,
        headlightColor: 0x0ea5e9,
        taillightColor: 0xff3b30,
        lightIntensity: 1.4,
      },
      BUS: {
        geo: new THREE.BoxGeometry(11.0, 3.5, 3.0),
        speed: 1.0,
        headlightColor: 0xffd400,
        taillightColor: 0xff3b30,
        lightIntensity: 1.0,
      },
    }

    const vehicles = []
    const tempVehicleLights = []

    const count = isMobile ? 8 : 16
    for (let i = 0; i < count; i++) {
      const randTypeVal = Math.random()
      let vType = vehicleTypes.CAR
      if (randTypeVal < 0.2) vType = vehicleTypes.MOTO
      else if (randTypeVal < 0.35) vType = vehicleTypes.BUS

      const bodyColor = new THREE.Color().setHSL(Math.random(), 0.5, 0.5)
      const bodyMat = new THREE.MeshStandardMaterial({
        color: bodyColor,
        metalness: 0.5,
        roughness: 0.4,
      })

      const mesh = new THREE.Mesh(vType.geo, bodyMat)

      const isNS = Math.random() > 0.5
      let dir = Math.random() > 0.5 ? 1 : -1

      let spawnX = 0, spawnY = vType.geo.parameters.height / 2, spawnZ = 50

      if (isNS) {
        spawnX = dir > 0 ? 8 : -8
        spawnZ = -450 + Math.random() * 900
        mesh.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2
      } else {
        spawnX = -450 + Math.random() * 900
        spawnZ = dir > 0 ? 58 : 42
        mesh.rotation.y = dir > 0 ? 0 : Math.PI
      }

      mesh.position.set(spawnX, spawnY, spawnZ)
      scene.add(mesh)

      // Add Headlights / Taillights
      const hLights = new THREE.Group()

      const hlLeftGeo = new THREE.SphereGeometry(0.3, 8, 8)
      const hlMat = new THREE.MeshBasicMaterial({ color: vType.headlightColor })
      const hlLeft = new THREE.Mesh(hlLeftGeo, hlMat)
      const hlRight = hlLeft.clone()

      const length = vType.geo.parameters.width
      const widthVeh = vType.geo.parameters.depth

      hlLeft.position.set(length / 2, 0.2, -widthVeh / 3)
      hlRight.position.set(length / 2, 0.2, widthVeh / 3)
      hLights.add(hlLeft)
      hLights.add(hlRight)

      // Projection light
      const projLight = new THREE.PointLight(vType.headlightColor, isLight ? 0.05 : vType.lightIntensity, 50, 1.5)
      projLight.position.set(length / 2 + 2, 0.2, 0)
      projLight.userData = { originalIntensity: vType.lightIntensity }
      hLights.add(projLight)
      tempVehicleLights.push(projLight)

      // Taillights
      const tlLeftGeo = new THREE.SphereGeometry(0.25, 8, 8)
      const tlMat = new THREE.MeshBasicMaterial({ color: vType.taillightColor })
      const tlLeft = new THREE.Mesh(tlLeftGeo, tlMat)
      const tlRight = tlLeft.clone()

      tlLeft.position.set(-length / 2, 0.2, -widthVeh / 3)
      tlRight.position.set(-length / 2, 0.2, widthVeh / 3)
      hLights.add(tlLeft)
      hLights.add(tlRight)

      mesh.add(hLights)

      vehicles.push({
        mesh,
        type: vType,
        isNS,
        dir,
        speed: vType.speed * (0.85 + Math.random() * 0.3),
        initialOffset: Math.random() * 100,
      })
    }
    vehicleLightsRef.current = tempVehicleLights

    // 8. Animation Loop
    let clock = new THREE.Clock()
    let animationFrameId = null

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate)

      const elapsed = clock.getElapsedTime()

      // 8.1. Traffic Lights Cycle
      const cycleTime = elapsed % 10.0
      let ewColor, nsColor

      if (cycleTime < 4.0) {
        ewColor = 'G'
        nsColor = 'R'
      } else if (cycleTime < 5.5) {
        ewColor = 'Y'
        nsColor = 'R'
      } else if (cycleTime < 9.5) {
        ewColor = 'R'
        nsColor = 'G'
      } else {
        ewColor = 'R'
        nsColor = 'Y'
      }

      trafficLights.forEach((tl) => {
        const activeColor = tl.isNS ? nsColor : ewColor

        tl.redLens.material.color.setHex(0x220000)
        tl.yellowLens.material.color.setHex(0x222200)
        tl.greenLens.material.color.setHex(0x002200)
        tl.ptLight.intensity = 0

        if (activeColor === 'R') {
          tl.redLens.material.color.setHex(0xff0000)
          tl.ptLight.color.setHex(0xff0000)
          tl.ptLight.intensity = sceneRef.current.background.r > 0.5 ? 0.3 : 1.2
        } else if (activeColor === 'Y') {
          tl.yellowLens.material.color.setHex(0xffaa00)
          tl.ptLight.color.setHex(0xffaa00)
          tl.ptLight.intensity = sceneRef.current.background.r > 0.5 ? 0.2 : 1.0
        } else if (activeColor === 'G') {
          tl.greenLens.material.color.setHex(0x00ff00)
          tl.ptLight.color.setHex(0x00ff00)
          tl.ptLight.intensity = sceneRef.current.background.r > 0.5 ? 0.4 : 1.5
        }
      })

      // 8.2. Move Vehicles
      vehicles.forEach((veh) => {
        const pos = veh.mesh.position
        let currentSpeed = veh.speed

        const distToIntersection = veh.isNS ? pos.z - 50 : pos.x - 0
        const isApproaching = distToIntersection * veh.dir < 0 && Math.abs(distToIntersection) < 80

        if (isApproaching) {
          const activeLightColor = veh.isNS ? nsColor : ewColor
          if (activeLightColor === 'R') {
            currentSpeed = Math.max(0, veh.speed * (Math.abs(distToIntersection) - 20) / 60)
          } else if (activeLightColor === 'Y') {
            currentSpeed = veh.speed * 0.4
          }
        }

        if (veh.isNS) {
          pos.z += currentSpeed * veh.dir
          if (veh.type === vehicleTypes.MOTO) {
            pos.x = (veh.dir > 0 ? 8 : -8) + Math.sin(elapsed * 4 + veh.initialOffset) * 1.5
          }
          if (pos.z > 450) pos.z = -450
          if (pos.z < -450) pos.z = 450
        } else {
          pos.x += currentSpeed * veh.dir
          if (veh.type === vehicleTypes.MOTO) {
            pos.z = (veh.dir > 0 ? 58 : 42) + Math.sin(elapsed * 4 + veh.initialOffset) * 1.5
          }
          if (pos.x > 450) pos.x = -450
          if (pos.x < -450) pos.x = 450
        }
      })

      // 8.3. Neon Lights Sway
      neonLights.forEach((light, i) => {
        light.position.x = Math.sin(elapsed * 0.3 + i) * 250
        light.position.z = Math.cos(elapsed * 0.2 + i) * 200
        const isL = sceneRef.current.background.r > 0.5
        light.intensity = (isL ? 0.2 : 1.2) + Math.sin(elapsed * 2 + i) * (isL ? 0.05 : 0.4)
      })

      // 8.4. Building Windows Flickering
      buildingGroup.children.forEach((mesh, idx) => {
        if (mesh.material && mesh.material.opacity) {
          const wave = Math.sin(elapsed * (1 + (idx % 3)) + idx)
          const isL = sceneRef.current.background.r > 0.5
          mesh.material.opacity = (isL ? 0.15 : 0.4) + Math.abs(wave) * (isL ? 0.15 : 0.4)
        }
      })

      // 8.5. Subtle camera orbits
      const angle = elapsed * 0.02
      camera.position.x = Math.sin(angle) * 35
      camera.position.y = 80 + Math.sin(elapsed * 0.05) * 8
      camera.lookAt(0, 20, 50)

      renderer.render(scene, camera)
    }

    animate()

    // 9. Resize Handling
    const handleResize = () => {
      if (!mount) return
      width = mount.clientWidth
      height = mount.clientHeight

      camera.aspect = width / height
      camera.updateProjectionMatrix()

      renderer.setSize(width, height)
    }
    window.addEventListener('resize', handleResize)

    // 10. Cleanups
    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationFrameId)

      groundGeo.dispose()
      groundMat.dispose()
      hwyGeo.dispose()
      hwyMat.dispose()
      lineGeo.dispose()
      lineMat.dispose()
      crossRoadGeo.dispose()
      crossLineGeo.dispose()
      crossLineMat.dispose()

      tlPoleGeo.dispose()
      tlPoleMat.dispose()
      tlBoxGeo.dispose()
      tlBoxMat.dispose()
      lightLensGeo.dispose()

      boxGeo.dispose()
      buildingGroup.children.forEach((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) child.material.dispose()
      })

      billboards.children.forEach((child) => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (child.material.map) child.material.map.dispose()
          child.material.dispose()
        }
      })

      vehicles.forEach((veh) => {
        if (veh.mesh.geometry) veh.mesh.geometry.dispose()
        if (veh.mesh.material) veh.mesh.material.dispose()
        veh.mesh.children.forEach((c) => {
          c.children.forEach((gc) => {
            if (gc.geometry) gc.geometry.dispose()
            if (gc.material) gc.material.dispose()
          })
        })
      })

      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement)
      }
      renderer.dispose()
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -2,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        overflow: 'hidden',
      }}
    />
  )
}
