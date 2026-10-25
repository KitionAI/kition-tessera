/**
 * The home page's mosaic galaxy, in the visual language of Kition Universe: every Tessera icon is a
 * glowing tile (a tessera) orbiting the Kit Grid core in one arm per kit; "assemble" flies them into
 * one flat mosaic wall. One instanced mesh draws all tiles from a texture atlas; positions are
 * computed on the CPU each frame (a few hundred tiles), which also serves hover picking.
 */
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

export type Theme = 'light' | 'dark'

export type MosaicTile = {
  id: string
  label: string
  /** Kit hue, or the brand purple for shared icons. */
  color: string
  /** Arm index (one per kit), or -1 for the shared ring around the core. */
  arm: number
  kind: 'icon' | 'kit'
  /** Icon: path data on a 24 grid. Kit: an image URL. */
  paths?: readonly string[]
  fills?: readonly string[]
  image?: string
}

export type MosaicHandle = {
  setTheme: (theme: Theme) => void
  setAssembled: (assembled: boolean) => void
  dispose: () => void
}

type Options = {
  theme: Theme
  reducedMotion: boolean
  onHover: (tile: MosaicTile | null, x: number, y: number) => void
  onPick: (tile: MosaicTile) => void
}

const CELL = 64
const ATLAS_COLS = 32
const ARMS = 15
const GRID_COLS = 26
const GRID_GAP = 1.22

const LOOK = {
  // Only the white glyphs pass the bloom threshold, so tiles glow without washing out.
  dark: { bloom: 0.55, radius: 0.35, threshold: 0.86, sky: ['#14163a', '#090a1e', '#03040b'], star: 0.9, glyph: 1.12, tile: 0.62 },
  light: { bloom: 0.18, radius: 0.3, threshold: 0.95, sky: ['#efeaff', '#ddd5fb', '#cbd6f8'], star: 0.35, glyph: 1.0, tile: 0.8 },
}

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

async function buildAtlas(tiles: MosaicTile[]): Promise<THREE.CanvasTexture> {
  const rows = Math.ceil(tiles.length / ATLAS_COLS)
  const canvas = document.createElement('canvas')
  canvas.width = ATLAS_COLS * CELL
  canvas.height = THREE.MathUtils.ceilPowerOfTwo(rows * CELL)
  const ctx = canvas.getContext('2d')!
  await Promise.all(
    tiles.map(async (tile, i) => {
      const x = (i % ATLAS_COLS) * CELL
      const y = Math.floor(i / ATLAS_COLS) * CELL
      if (tile.kind === 'kit' && tile.image) {
        const image = new Image()
        image.src = tile.image
        await image.decode().catch(() => undefined)
        ctx.drawImage(image, x + 2, y + 2, CELL - 4, CELL - 4)
        return
      }
      // White glyph on transparent: the shader puts the tile color under it.
      const pad = 13
      const scale = (CELL - pad * 2) / 24
      ctx.save()
      ctx.translate(x + pad, y + pad)
      ctx.scale(scale, scale)
      ctx.strokeStyle = '#ffffff'
      ctx.fillStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (const d of tile.paths ?? []) ctx.stroke(new Path2D(d))
      for (const d of tile.fills ?? []) {
        const path = new Path2D(d)
        ctx.fill(path)
        ctx.stroke(path)
      }
      ctx.restore()
    }),
  )
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function skyTexture(theme: Theme) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const [a, b, c] = LOOK[theme].sky
  const gradient = ctx.createRadialGradient(256, 210, 10, 256, 256, 380)
  gradient.addColorStop(0, a)
  gradient.addColorStop(0.5, b)
  gradient.addColorStop(1, c)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 512, 512)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function glowTexture(rgb: [number, number, number]) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128)
  gradient.addColorStop(0, `rgba(${rgb.join(',')},0.9)`)
  gradient.addColorStop(0.35, `rgba(${rgb.join(',')},0.28)`)
  gradient.addColorStop(1, `rgba(${rgb.join(',')},0)`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  return new THREE.CanvasTexture(canvas)
}

function starfield(count: number) {
  const random = rng(7)
  const positions = new Float32Array(count * 3)
  const colors = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = 220 + random() * 380
    const theta = random() * Math.PI * 2
    const phi = Math.acos(2 * random() - 1)
    positions.set([r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta)], i * 3)
    const warm = random()
    colors.set(warm > 0.8 ? [1, 0.85, 0.7] : warm < 0.2 ? [0.7, 0.8, 1] : [1, 1, 1], i * 3)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  const material = new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: true, vertexColors: true, transparent: true, depthWrite: false })
  return new THREE.Points(geometry, material)
}

const VERTEX = /* glsl */ `
  attribute vec3 aPos;
  attribute float aScale;
  attribute vec2 aCell;
  attribute vec3 aColor;
  attribute float aKit;
  attribute float aLift;
  varying vec2 vUv;
  varying vec2 vAtlas;
  varying vec3 vColor;
  varying float vKit;
  varying float vLift;
  uniform vec2 uAtlas;
  void main() {
    vUv = uv;
    vAtlas = (aCell + vec2(uv.x, 1.0 - uv.y)) / uAtlas;
    vAtlas.y = 1.0 - vAtlas.y;
    vColor = aColor;
    vKit = aKit;
    vLift = aLift;
    vec4 mv = modelViewMatrix * vec4(aPos, 1.0);
    mv.xy += position.xy * aScale;
    gl_Position = projectionMatrix * mv;
  }
`

const FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uGlyph;
  uniform float uTile;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec2 vAtlas;
  varying vec3 vColor;
  varying float vKit;
  varying float vLift;
  float box(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  void main() {
    vec4 tex = texture2D(uMap, vAtlas);
    if (vKit > 0.5) {
      if (tex.a < 0.02) discard;
      gl_FragColor = vec4(tex.rgb * (uTile + 0.15 + vLift * 0.3), tex.a * uOpacity);
      #include <colorspace_fragment>
      return;
    }
    vec2 p = vUv - 0.5;
    float d = box(p, vec2(0.46), 0.13);
    float aa = fwidth(d);
    float shape = 1.0 - smoothstep(-aa, aa, d);
    if (shape < 0.01) discard;
    // A glass tile: light at the top, the kit hue below, a bright rim.
    vec3 top = mix(vColor, vec3(1.0), 0.22) * uTile;
    vec3 base = mix(vColor * 0.7 * uTile, top, smoothstep(-0.5, 0.5, -p.y));
    float rim = smoothstep(-0.04, 0.0, d) * 0.35;
    vec3 color = base + rim * vec3(0.8);
    color *= 1.0 + vLift * 0.4;
    color = mix(color, vec3(uGlyph + vLift * 0.2), tex.a);
    gl_FragColor = vec4(color, shape * uOpacity);
    #include <colorspace_fragment>
  }
`

export async function mountMosaic(host: HTMLElement, tiles: MosaicTile[], options: Options): Promise<MosaicHandle> {
  let theme = options.theme
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.domElement.className = 'mosaic-canvas'
  host.prepend(renderer.domElement)

  const scene = new THREE.Scene()
  scene.background = skyTexture(theme)
  const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 2000)
  const GALAXY_VIEW = new THREE.Vector3(0, 34, 66)
  const MOSAIC_VIEW = new THREE.Vector3(0, 0, 40)
  camera.position.copy(GALAXY_VIEW)

  let assembled = false
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.07
  controls.rotateSpeed = 0.5
  controls.minDistance = 14
  controls.maxDistance = 160
  controls.autoRotate = !options.reducedMotion
  controls.autoRotateSpeed = 0.25
  controls.enablePan = false

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), LOOK[theme].bloom, LOOK[theme].radius, LOOK[theme].threshold)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())

  const stars = starfield(innerWidth < 700 ? 1200 : 2400)
  ;(stars.material as THREE.PointsMaterial).opacity = LOOK[theme].star
  scene.add(stars)

  const nebulae = (
    [
      [[-160, 40, -220], [140, 90, 255], 420],
      [[180, -20, -240], [255, 90, 170], 380],
      [[40, 110, -300], [70, 170, 255], 460],
    ] as const
  ).map(([position, rgb, size]) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([...rgb] as [number, number, number]), transparent: true, depthWrite: false, opacity: theme === 'dark' ? 0.35 : 0.22 }))
    sprite.position.set(position[0], position[1], position[2])
    sprite.scale.setScalar(size)
    scene.add(sprite)
    return sprite
  })

  // The core: the Kit Grid, a 3 × 3 grid whose stem and three keys glow.
  const core = new THREE.Group()
  const keys = new Set([0, 3, 6, 2, 4, 8])
  for (let cell = 0; cell < 9; cell++) {
    const lit = keys.has(cell)
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.8, 0.6),
      new THREE.MeshBasicMaterial({ color: lit ? new THREE.Color('#c9c1ff').multiplyScalar(1.15) : new THREE.Color('#3f2fb8'), transparent: true, opacity: lit ? 1 : 0.55 }),
    )
    mesh.position.set(((cell % 3) - 1) * 2.3, (1 - Math.floor(cell / 3)) * 2.3, 0)
    core.add(mesh)
  }
  // The stem spans the full height.
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture([139, 125, 255]), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.9 }))
  halo.scale.setScalar(18)
  halo.material.opacity = 0.55
  core.add(halo)
  scene.add(core)

  // Galaxy and mosaic positions for every tile.
  const random = rng(42)
  const count = tiles.length
  const galaxy: { radius: number; angle: number; y: number; speed: number; scale: number }[] = []
  const armSlots = new Map<number, number>()
  const iconTiles = tiles.filter((tile) => tile.kind === 'icon')
  const kitTiles = tiles.filter((tile) => tile.kind === 'kit')
  for (const tile of tiles) {
    if (tile.kind === 'kit') {
      const angle = (tile.arm / ARMS) * Math.PI * 2 + 2.6
      galaxy.push({ radius: 34, angle, y: 0, speed: 0.012, scale: 2.3 })
      continue
    }
    if (tile.arm < 0) {
      const radius = 6.5 + random() * 4
      galaxy.push({ radius, angle: random() * Math.PI * 2, y: (random() - 0.5) * 2.2, speed: 0.09, scale: 1.25 })
      continue
    }
    const slot = armSlots.get(tile.arm) ?? 0
    armSlots.set(tile.arm, slot + 1)
    const radius = 12 + slot * 0.95 + random() * 1.2
    const angle = (tile.arm / ARMS) * Math.PI * 2 + radius * 0.075 + (random() - 0.5) * 0.18
    galaxy.push({ radius, angle, y: (random() - 0.5) * 2.4 * (1 - radius / 70), speed: 0.55 / Math.sqrt(radius), scale: 1.15 })
  }
  // The mosaic: kit tiles in a row on top, then the icons in a grid, banded by kit.
  const mosaic: THREE.Vector3[] = new Array(count)
  const rows = Math.ceil(iconTiles.length / GRID_COLS)
  const top = ((rows - 1) * GRID_GAP) / 2 + 1.2
  const order = [...iconTiles].sort((a, b) => a.arm - b.arm || a.id.localeCompare(b.id))
  order.forEach((tile, i) => {
    const col = i % GRID_COLS
    const row = Math.floor(i / GRID_COLS)
    mosaic[tiles.indexOf(tile)] = new THREE.Vector3((col - (GRID_COLS - 1) / 2) * GRID_GAP, top - 2.6 - row * GRID_GAP, 0)
  })
  kitTiles.forEach((tile, i) => {
    mosaic[tiles.indexOf(tile)] = new THREE.Vector3((i - (kitTiles.length - 1) / 2) * 2.3, top + 1.2, 0)
  })
  const delays = tiles.map((_, i) => {
    const target = mosaic[i]
    return 0.35 * random() + (Math.abs(target.x) / 30) * 0.4
  })

  const geometry = new THREE.InstancedBufferGeometry()
  const plane = new THREE.PlaneGeometry(1, 1)
  geometry.index = plane.index
  geometry.setAttribute('position', plane.getAttribute('position'))
  geometry.setAttribute('uv', plane.getAttribute('uv'))
  geometry.instanceCount = count
  const aPos = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3).setUsage(THREE.DynamicDrawUsage)
  const aScale = new THREE.InstancedBufferAttribute(new Float32Array(count), 1).setUsage(THREE.DynamicDrawUsage)
  const aLift = new THREE.InstancedBufferAttribute(new Float32Array(count), 1).setUsage(THREE.DynamicDrawUsage)
  const aCell = new THREE.InstancedBufferAttribute(new Float32Array(tiles.flatMap((_, i) => [i % ATLAS_COLS, Math.floor(i / ATLAS_COLS)])), 2)
  const aColor = new THREE.InstancedBufferAttribute(new Float32Array(tiles.flatMap((tile) => new THREE.Color(tile.color).toArray())), 3)
  const aKit = new THREE.InstancedBufferAttribute(new Float32Array(tiles.map((tile) => (tile.kind === 'kit' ? 1 : 0))), 1)
  geometry.setAttribute('aPos', aPos)
  geometry.setAttribute('aScale', aScale)
  geometry.setAttribute('aLift', aLift)
  geometry.setAttribute('aCell', aCell)
  geometry.setAttribute('aColor', aColor)
  geometry.setAttribute('aKit', aKit)

  const atlas = await buildAtlas(tiles)
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: true,
    uniforms: {
      uMap: { value: atlas },
      uAtlas: { value: new THREE.Vector2(ATLAS_COLS, atlas.image.height / CELL) },
      uGlyph: { value: LOOK[theme].glyph },
      uTile: { value: LOOK[theme].tile },
      uOpacity: { value: 1 },
    },
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.frustumCulled = false
  scene.add(mesh)

  let progress = 0
  let hovered = -1
  const lift = new Float32Array(count)
  const positions = aPos.array as Float32Array
  const scales = aScale.array as Float32Array
  const screen = new THREE.Vector3()
  const pointer = { x: -1, y: -1, inside: false }

  const clock = new THREE.Clock()
  let time = 0
  let frame = 0
  let cameraFrom = camera.position.clone()
  let cameraT = 1
  const cameraTarget = new THREE.Vector3()

  let viewShift = 0
  let viewShiftY = 0
  let shiftT = 0
  /** Shifts the picture sideways (not the orbit), so the galaxy clears the hero text; the mosaic is centered. */
  function applyShift() {
    const width = host.clientWidth
    const height = host.clientHeight
    const shift = viewShift * (1 - shiftT)
    const shiftY = viewShiftY * (1 - shiftT)
    if (shift === 0 && shiftY === 0) camera.clearViewOffset()
    else camera.setViewOffset(width, height, shift, shiftY, width, height)
  }
  function resize() {
    const width = host.clientWidth
    const height = host.clientHeight
    renderer.setSize(width, height, false)
    composer.setSize(width, height)
    bloom.resolution.set(width / 2, height / 2)
    camera.aspect = width / Math.max(1, height)
    // Wide: the galaxy right of the hero text. Narrow: below it, seen from farther away.
    viewShift = width > 1000 ? -width * 0.21 : 0
    viewShiftY = width <= 760 ? -height * 0.22 : 0
    GALAXY_VIEW.set(0, 34, 66).multiplyScalar(width <= 760 ? 1.45 : 1)
    if (!assembled && cameraT >= 1) {
      camera.position.copy(GALAXY_VIEW)
      camera.lookAt(0, 0, 0)
    }
    applyShift()
    // Fit the mosaic wall's width on narrow screens.
    MOSAIC_VIEW.z = Math.max(46, (GRID_COLS * GRID_GAP * 0.62) / camera.aspect / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
    camera.updateProjectionMatrix()
    if (assembled && cameraT >= 1) {
      camera.position.copy(MOSAIC_VIEW)
      camera.lookAt(0, 0, 0)
    }
  }
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  resize()

  function pick() {
    if (!pointer.inside) return -1
    const rect = renderer.domElement.getBoundingClientRect()
    let best = -1
    let bestDistance = Infinity
    const unitsToPixels = rect.height / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
    for (let i = 0; i < count; i++) {
      screen.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
      const depth = screen.distanceTo(camera.position)
      screen.project(camera)
      if (screen.z > 1) continue
      const x = (screen.x * 0.5 + 0.5) * rect.width
      const y = (-screen.y * 0.5 + 0.5) * rect.height
      const radius = ((scales[i] * unitsToPixels) / depth) * 0.6
      const distance = Math.hypot(x - pointer.x, y - pointer.y)
      if (distance < radius && depth < bestDistance) {
        best = i
        bestDistance = depth
      }
    }
    return best
  }

  const onMove = (event: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect()
    pointer.x = event.clientX - rect.left
    pointer.y = event.clientY - rect.top
    pointer.inside = true
  }
  const onLeave = () => {
    pointer.inside = false
    options.onHover(null, 0, 0)
  }
  let down = { x: 0, y: 0 }
  const onDown = (event: PointerEvent) => (down = { x: event.clientX, y: event.clientY })
  const onClick = (event: MouseEvent) => {
    if (Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) return
    onMove(event as PointerEvent)
    const hit = pick()
    if (hit >= 0) options.onPick(tiles[hit])
  }
  renderer.domElement.addEventListener('pointermove', onMove)
  renderer.domElement.addEventListener('pointerleave', onLeave)
  renderer.domElement.addEventListener('pointerdown', onDown)
  renderer.domElement.addEventListener('click', onClick)


  function update(dt: number) {
    if (!options.reducedMotion) time += dt
    const goal = assembled ? 1 : 0
    const step = options.reducedMotion ? 1 : dt / 2.4
    progress = goal > progress ? Math.min(goal, progress + step) : Math.max(goal, progress - step)

    if (cameraT < 1) {
      cameraT = options.reducedMotion ? 1 : Math.min(1, cameraT + dt / 2.2)
      camera.position.lerpVectors(cameraFrom, cameraTarget, easeInOut(cameraT))
      camera.lookAt(0, 0, 0)
    }
    const shiftGoal = assembled ? 1 : 0
    if (shiftT !== shiftGoal) {
      shiftT = options.reducedMotion ? shiftGoal : THREE.MathUtils.clamp(shiftT + (shiftGoal - shiftT > 0 ? dt : -dt) / 1.6, 0, 1)
      applyShift()
    }

    for (let i = 0; i < count; i++) {
      const g = galaxy[i]
      const angle = g.angle + time * g.speed * 0.6
      const gx = Math.cos(angle) * g.radius
      const gz = Math.sin(angle) * g.radius
      const gy = g.y + Math.sin(time * 0.8 + i) * 0.15
      const local = THREE.MathUtils.clamp((progress - delays[i] * 0.6) / 0.6, 0, 1)
      const t = easeInOut(local)
      const m = mosaic[i]
      const arc = Math.sin(t * Math.PI) * 6
      positions[i * 3] = gx + (m.x - gx) * t
      positions[i * 3 + 1] = gy + (m.y - gy) * t + arc
      positions[i * 3 + 2] = gz + (m.z - gz) * t
      const target = i === hovered ? 1 : 0
      lift[i] += (target - lift[i]) * Math.min(1, dt * 12)
      const base = tiles[i].kind === 'kit' ? g.scale + (2.0 - g.scale) * t : g.scale + (1.0 - g.scale) * t
      scales[i] = base * (1 + lift[i] * 0.45)
    }
    ;(aLift.array as Float32Array).set(lift)
    aPos.needsUpdate = true
    aScale.needsUpdate = true
    aLift.needsUpdate = true

    core.rotation.y = time * 0.3
    core.scale.setScalar(Math.max(0.001, 1 - progress))
    core.visible = progress < 0.999
    stars.rotation.y = time * 0.004

    const next = pick()
    if (next !== hovered) {
      hovered = next
      renderer.domElement.style.cursor = hovered >= 0 ? 'pointer' : 'grab'
    }
    if (hovered >= 0) {
      screen.set(positions[hovered * 3], positions[hovered * 3 + 1], positions[hovered * 3 + 2]).project(camera)
      const rect = renderer.domElement.getBoundingClientRect()
      options.onHover(tiles[hovered], (screen.x * 0.5 + 0.5) * rect.width, (-screen.y * 0.5 + 0.5) * rect.height)
    } else if (pointer.inside) options.onHover(null, 0, 0)
  }

  function loop() {
    frame = requestAnimationFrame(loop)
    if (document.hidden) return
    const dt = Math.min(clock.getDelta(), 0.05)
    if (cameraT >= 1) controls.update()
    update(dt)
    composer.render()
  }
  loop()

  function applyTheme(next: Theme) {
    theme = next
    const look = LOOK[theme]
    ;(scene.background as THREE.Texture).dispose()
    scene.background = skyTexture(theme)
    bloom.strength = look.bloom
    bloom.radius = look.radius
    bloom.threshold = look.threshold
    material.uniforms.uGlyph.value = look.glyph
    material.uniforms.uTile.value = look.tile
    ;(stars.material as THREE.PointsMaterial).opacity = look.star
    for (const sprite of nebulae) sprite.material.opacity = theme === 'dark' ? 0.35 : 0.22
  }

  return {
    setTheme: applyTheme,
    setAssembled(next) {
      if (next === assembled) return
      assembled = next
      cameraFrom = camera.position.clone()
      cameraTarget.copy(next ? MOSAIC_VIEW : GALAXY_VIEW)
      cameraT = 0
      controls.target.set(0, 0, 0)
      controls.autoRotate = !next && !options.reducedMotion
      controls.minPolarAngle = next ? Math.PI / 2 - 0.35 : 0
      controls.maxPolarAngle = next ? Math.PI / 2 + 0.35 : Math.PI
      controls.minAzimuthAngle = next ? -0.45 : -Infinity
      controls.maxAzimuthAngle = next ? 0.45 : Infinity
    },
    dispose() {
      cancelAnimationFrame(frame)
      observer.disconnect()
      controls.dispose()
      renderer.domElement.removeEventListener('pointermove', onMove)
      renderer.domElement.removeEventListener('pointerleave', onLeave)
      renderer.domElement.removeEventListener('pointerdown', onDown)
      renderer.domElement.removeEventListener('click', onClick)
      atlas.dispose()
      geometry.dispose()
      material.dispose()
      composer.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}

export function hasWebGL() {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}
