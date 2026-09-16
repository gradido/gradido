// AI-GENERATED — not an architecture reference
/**
 * A stand-in for `maplibre-gl` in jsdom, which has no WebGL.
 *
 *   vi.mock('maplibre-gl', () => import('@test/maplibreMock'))
 *   vi.mock('@/utils/mapEngine/maplibreWorkerUrl', () => ({ default: 'worker.js' }))
 *
 * It keeps what MapLibre 6.10 does where a caller can see it, measured in the library's source:
 * events of the map come from its canvas container (so a marker's click is also the map's, a
 * control's is not); the first style loads a moment after the map is built, a later `setStyle`
 * replaces the style at once, drops every source and layer the new style does not name and fires
 * `style.load` again; `addSource`/`addLayer` refuse before a style has loaded; a marker stands
 * at `project(lngLat) + offset`, rounded, written as a transform; a popup lives in the map's
 * container; a map that cannot get WebGL 2 throws from its constructor and leaves the container
 * as it was.
 *
 * Where it deliberately differs: moves happen at once (and fire `movestart`, `move`, `moveend`);
 * nothing is painted; a container jsdom lays out at no size stays at no size (MapLibre would
 * count it as 400 x 300), so the middle of the view is container point (0, 0) - the same as the
 * Leaflet map in jsdom, which the page tests count their pixels from.
 */

const TILE_SIZE = 512

/** Everything built in this module, for a test to look at. */
export const created = []
export const registry = { workerUrl: null, protocols: {} }

export function setWorkerUrl(url) {
  registry.workerUrl = url
}
export function getWorkerUrl() {
  return registry.workerUrl
}
export function addProtocol(name, load) {
  registry.protocols[name] = load
}
export function removeProtocol(name) {
  delete registry.protocols[name]
}

class Evented {
  constructor() {
    this.listeners = {}
  }

  on(type, listener) {
    if (!this.listeners[type]) this.listeners[type] = []
    this.listeners[type].push(listener)
    return this
  }

  once(type, listener) {
    const wrapped = (event) => {
      this.off(type, wrapped)
      listener(event)
    }
    return this.on(type, wrapped)
  }

  off(type, listener) {
    this.listeners[type] = (this.listeners[type] ?? []).filter((l) => l !== listener)
    return this
  }

  fire(type, data = {}) {
    const event = { type, target: this, ...data }
    for (const listener of [...(this.listeners[type] ?? [])]) listener(event)
    return this
  }
}

export class LngLat {
  constructor(lng, lat) {
    if (lat > 90 || lat < -90) {
      throw new Error('Invalid LngLat latitude value: must be between -90 and 90')
    }
    this.lng = lng
    this.lat = lat
  }

  toArray() {
    return [this.lng, this.lat]
  }

  static convert(input) {
    if (input instanceof LngLat) return input
    if (Array.isArray(input)) return new LngLat(input[0], input[1])
    return new LngLat(input.lng ?? input.lon, input.lat)
  }
}

export class LngLatBounds {
  constructor(sw, ne) {
    this.sw = LngLat.convert(sw)
    this.ne = LngLat.convert(ne)
  }

  getWest() {
    return this.sw.lng
  }

  getSouth() {
    return this.sw.lat
  }

  getEast() {
    return this.ne.lng
  }

  getNorth() {
    return this.ne.lat
  }

  static convert(input) {
    if (input instanceof LngLatBounds) return input
    if (input.length === 4) return new LngLatBounds([input[0], input[1]], [input[2], input[3]])
    return new LngLatBounds(input[0], input[1])
  }
}

// Web Mercator, as MapLibre counts it: 0..1 across the world, no clamp on the latitude.
const mercatorX = (lng) => (180 + lng) / 360
const mercatorY = (lat) =>
  (180 - (180 / Math.PI) * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))) / 360
const lngOf = (x) => x * 360 - 180
const latOf = (y) => (360 / Math.PI) * Math.atan(Math.exp(((180 - y * 360) * Math.PI) / 180)) - 90

const element = (tag, className, parent) => {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (parent) parent.appendChild(node)
  return node
}

/** A handler of the map that can be switched off, as `map.dragRotate` and its kind. */
class Handler {
  constructor(enabled = true) {
    this.enabled = enabled
    this.rotation = true
  }

  enable() {
    this.enabled = true
  }

  disable() {
    this.enabled = false
  }

  isEnabled() {
    return this.enabled
  }

  disableRotation() {
    this.rotation = false
  }

  enableRotation() {
    this.rotation = true
  }
}

export class Map extends Evented {
  constructor(options) {
    super()
    this.options = options
    this.container =
      typeof options.container === 'string'
        ? document.getElementById(options.container)
        : options.container

    this.container.classList.add('maplibregl-map')
    this.canvasContainer = element(
      'div',
      'maplibregl-canvas-container maplibregl-interactive',
      this.container,
    )
    this.canvas = element('canvas', 'maplibregl-canvas', this.canvasContainer)
    this.controlContainer = element('div', 'maplibregl-control-container', this.container)
    this.corners = {}
    for (const corner of ['top-left', 'top-right', 'bottom-left', 'bottom-right']) {
      this.corners[corner] = element('div', `maplibregl-ctrl-${corner}`, this.controlContainer)
    }

    // MapLibre asks for this context and nothing else, and throws without it (Map._setupPainter).
    if (!this.canvas.getContext('webgl2')) {
      this.canvasContainer.remove()
      this.controlContainer.remove()
      this.container.classList.remove('maplibregl-map')
      throw new Error('Failed to initialize WebGL2')
    }

    this.minZoom = options.minZoom ?? 0
    this.maxZoom = options.maxZoom ?? 22
    this.centre = LngLat.convert(options.center ?? [0, 0])
    this.zoom = this.clampZoom(options.zoom ?? 0)
    this.camera = []

    this.dragRotate = new Handler(options.dragRotate !== false)
    this.dragPan = new Handler(options.dragPan !== false)
    this.touchPitch = new Handler(options.touchPitch !== false)
    this.touchZoomRotate = new Handler(options.touchZoomRotate !== false)
    this.keyboard = new Handler(options.keyboard !== false)
    this.scrollZoom = new Handler(options.scrollZoom !== false)

    this.sources = {}
    this.layers = []
    this.style = null
    this.styleLoaded = false
    this.resized = 0
    this.removed = false

    for (const type of ['click', 'mousedown', 'mousemove', 'mouseup']) {
      this.canvasContainer.addEventListener(type, (originalEvent) => {
        const point = this.pointOf(originalEvent)
        this.fire(type, { point, lngLat: this.unproject(point), originalEvent })
      })
    }

    this.syncCanvasSize()
    if (options.style) this.setStyle(options.style)
    created.push(this)
  }

  pointOf(event) {
    const box = this.canvasContainer.getBoundingClientRect()
    return { x: event.clientX - box.left, y: event.clientY - box.top }
  }

  size() {
    return { width: this.container.clientWidth, height: this.container.clientHeight }
  }

  // MapLibre writes the size it draws at onto the canvas (Map._resizeCanvas).
  syncCanvasSize() {
    const { width, height } = this.size()
    this.canvas.style.width = `${width}px`
    this.canvas.style.height = `${height}px`
  }

  clampZoom(zoom) {
    return Math.min(Math.max(zoom, this.minZoom), this.maxZoom)
  }

  // ---- the camera, moved at once

  getCenter() {
    return new LngLat(this.centre.lng, this.centre.lat)
  }

  getZoom() {
    return this.zoom
  }

  getMaxZoom() {
    return this.maxZoom
  }

  getMinZoom() {
    return this.minZoom
  }

  getBearing() {
    return 0
  }

  getPitch() {
    return 0
  }

  moveTo(how, { center, zoom }, options = {}) {
    this.camera.push({ how, center, zoom, options })
    this.fire('movestart')
    if (center !== undefined) this.centre = LngLat.convert(center)
    if (zoom !== undefined) this.zoom = this.clampZoom(zoom)
    this.fire('move')
    this.fire('moveend')
    return this
  }

  jumpTo(camera) {
    return this.moveTo('jumpTo', camera)
  }

  easeTo(camera) {
    return this.moveTo('easeTo', camera, camera)
  }

  flyTo(camera) {
    return this.moveTo('flyTo', camera, camera)
  }

  panTo(center, options) {
    return this.moveTo('panTo', { center }, options)
  }

  setCenter(center) {
    return this.jumpTo({ center })
  }

  setZoom(zoom) {
    return this.jumpTo({ zoom })
  }

  zoomIn() {
    return this.easeTo({ zoom: this.zoom + 1 })
  }

  zoomOut() {
    return this.easeTo({ zoom: this.zoom - 1 })
  }

  /** As MapLibre's cameraForBounds: the zoom that fits the box, not rounded, no padding. */
  fitBounds(bounds, options = {}) {
    const box = LngLatBounds.convert(bounds)
    const { width, height } = this.size()
    const spanX = mercatorX(box.getEast()) - mercatorX(box.getWest())
    const spanY = mercatorY(box.getSouth()) - mercatorY(box.getNorth())
    const zoom = Math.min(
      Math.log2(Math.min(width / (spanX * TILE_SIZE), height / (spanY * TILE_SIZE))),
      options.maxZoom ?? this.maxZoom,
    )
    const center = [
      lngOf((mercatorX(box.getEast()) + mercatorX(box.getWest())) / 2),
      latOf((mercatorY(box.getSouth()) + mercatorY(box.getNorth())) / 2),
    ]
    return this.moveTo('fitBounds', { center, zoom }, options)
  }

  project(lngLatLike) {
    const lngLat = LngLat.convert(lngLatLike)
    const world = TILE_SIZE * 2 ** this.zoom
    const { width, height } = this.size()
    return {
      x: (mercatorX(lngLat.lng) - mercatorX(this.centre.lng)) * world + width / 2,
      y: (mercatorY(lngLat.lat) - mercatorY(this.centre.lat)) * world + height / 2,
    }
  }

  unproject(point) {
    const world = TILE_SIZE * 2 ** this.zoom
    const { width, height } = this.size()
    const x = mercatorX(this.centre.lng) + (point.x - width / 2) / world
    const y = mercatorY(this.centre.lat) + (point.y - height / 2) / world
    return new LngLat(lngOf(x), latOf(y))
  }

  // ---- the style, its sources and layers

  /**
   * The first style loads a moment after the map is built (Style.loadJSON waits a frame). A later
   * one is a diff (Style.setState): what the new style does not name goes, and `style.load` fires
   * at once - unless nothing changed, which fires nothing.
   */
  setStyle(style) {
    if (!this.styleLoaded) {
      this.style = style
      const loading = (this.loading = {})
      Promise.resolve().then(() => {
        if (this.loading !== loading || this.removed) return
        this.applyStyle(style)
      })
      return this
    }
    if (JSON.stringify(style) === JSON.stringify(this.style)) return this
    this.applyStyle(style)
    return this
  }

  applyStyle(style) {
    this.style = style
    this.sources = {}
    for (const [id, spec] of Object.entries(style.sources ?? {})) this.sources[id] = { ...spec }
    this.layers = (style.layers ?? []).map((layer) => ({ ...layer }))
    this.styleLoaded = true
    this.fire('style.load')
  }

  getStyle() {
    return { ...this.style, sources: this.sources, layers: this.layers }
  }

  checkLoaded() {
    if (!this.styleLoaded) throw new Error('Style is not done loading.')
  }

  addSource(id, spec) {
    this.checkLoaded()
    if (this.sources[id]) throw new Error(`Source "${id}" already exists.`)
    const source = { ...spec, setData: (data) => (source.data = data) }
    this.sources[id] = source
    return this
  }

  getSource(id) {
    return this.sources[id]
  }

  removeSource(id) {
    this.checkLoaded()
    if (this.layers.some((layer) => layer.source === id)) {
      throw new Error(`Source "${id}" cannot be removed while a layer is using it.`)
    }
    delete this.sources[id]
    return this
  }

  addLayer(layer, beforeId) {
    this.checkLoaded()
    if (this.getLayer(layer.id)) throw new Error(`Layer "${layer.id}" already exists.`)
    if (!this.sources[layer.source]) throw new Error(`Source "${layer.source}" not found.`)
    const index = beforeId ? this.layers.findIndex((l) => l.id === beforeId) : -1
    if (index < 0) this.layers.push({ ...layer })
    else this.layers.splice(index, 0, { ...layer })
    return this
  }

  getLayer(id) {
    return this.layers.find((layer) => layer.id === id)
  }

  removeLayer(id) {
    this.checkLoaded()
    this.layers = this.layers.filter((layer) => layer.id !== id)
    return this
  }

  isStyleLoaded() {
    return this.styleLoaded
  }

  // ---- the page around the map

  addControl(control, position = 'top-right') {
    const node = control.onAdd(this)
    const corner = this.corners[position]
    if (position.includes('bottom')) corner.insertBefore(node, corner.firstChild)
    else corner.appendChild(node)
    return this
  }

  getContainer() {
    return this.container
  }

  getCanvas() {
    return this.canvas
  }

  getCanvasContainer() {
    return this.canvasContainer
  }

  resize() {
    this.resized++
    this.syncCanvasSize()
    this.fire('resize')
    return this
  }

  remove() {
    this.removed = true
    this.fire('remove')
    this.canvasContainer.remove()
    this.controlContainer.remove()
    this.container.classList.remove('maplibregl-map')
  }
}

const ANCHOR_TRANSLATE = {
  center: 'translate(-50%,-50%)',
  top: 'translate(-50%,0)',
  'top-left': 'translate(0,0)',
  'top-right': 'translate(-100%,0)',
  bottom: 'translate(-50%,-100%)',
  'bottom-left': 'translate(0,-100%)',
  'bottom-right': 'translate(-100%,-100%)',
  left: 'translate(0,-50%)',
  right: 'translate(-100%,-50%)',
}

export class Marker extends Evented {
  constructor(options = {}) {
    super()
    this.anchor = options.anchor ?? 'center'
    this.offset = options.offset ?? [0, 0]
    this.draggable = false
    this.element = options.element ?? element('div')
    this.element.classList.add('maplibregl-marker', `maplibregl-marker-anchor-${this.anchor}`)
    for (const name of (options.className ?? '').split(' ').filter(Boolean)) {
      this.element.classList.add(name)
    }
    this.popup = null
    this.map = null
    this.setDraggable(options.draggable)

    this.update = () => this.place()
    this.onElementClick = (originalEvent) => this.fire('click', { originalEvent })
    // A popup opens and closes with a click on the marker, heard through the map
    // (Marker._onMapClick).
    this.onMapClick = (event) => {
      if (this.popup && this.element.contains(event.originalEvent.target)) this.togglePopup()
    }
    this.onMapDown = (event) => {
      if (!this.element.contains(event.originalEvent.target)) return
      this.drag = { from: event.point, at: this.map.project(this.lngLat), state: 'pending' }
      this.map.on('mousemove', this.onMapMove)
      this.map.once('mouseup', this.onMapUp)
    }
    this.onMapMove = (event) => {
      const at = {
        x: this.drag.at.x + event.point.x - this.drag.from.x,
        y: this.drag.at.y + event.point.y - this.drag.from.y,
      }
      this.setLngLat(this.map.unproject(at))
      if (this.drag.state === 'pending') {
        this.drag.state = 'active'
        this.fire('dragstart')
      }
      this.fire('drag')
    }
    this.onMapUp = () => {
      this.map.off('mousemove', this.onMapMove)
      if (this.drag?.state === 'active') this.fire('dragend')
      this.drag = null
    }
  }

  setLngLat(lngLatLike) {
    this.lngLat = LngLat.convert(lngLatLike)
    if (this.popup) this.popup.setLngLat(this.lngLat)
    if (this.map) this.place()
    return this
  }

  getLngLat() {
    return this.lngLat
  }

  getElement() {
    return this.element
  }

  getOffset() {
    return { x: this.offset[0], y: this.offset[1] }
  }

  place() {
    const { x, y } = this.map.project(this.lngLat)
    const at = { x: Math.round(x + this.offset[0]), y: Math.round(y + this.offset[1]) }
    this.element.style.transform = [
      ANCHOR_TRANSLATE[this.anchor],
      `translate(${at.x}px, ${at.y}px)`,
      'rotateX(0deg)',
      'rotateZ(0deg)',
    ].join(' ')
  }

  addTo(map) {
    this.remove()
    this.map = map
    map.getCanvasContainer().appendChild(this.element)
    map.on('move', this.update)
    map.on('moveend', this.update)
    map.on('click', this.onMapClick)
    this.element.addEventListener('click', this.onElementClick)
    this.setDraggable(this.draggable)
    this.place()
    return this
  }

  remove() {
    if (this.map) {
      this.map.off('move', this.update)
      this.map.off('moveend', this.update)
      this.map.off('click', this.onMapClick)
      this.map.off('mousedown', this.onMapDown)
      this.element.removeEventListener('click', this.onElementClick)
      this.map = null
    }
    this.element.remove()
    if (this.popup) this.popup.remove()
    return this
  }

  setDraggable(draggable) {
    this.draggable = Boolean(draggable)
    this.element.classList.toggle('maplibregl-marker-draggable', this.draggable)
    if (this.map) {
      if (this.draggable) this.map.on('mousedown', this.onMapDown)
      else this.map.off('mousedown', this.onMapDown)
    }
    return this
  }

  isDraggable() {
    return this.draggable
  }

  setPopup(popup) {
    if (this.popup) this.popup.remove()
    this.popup = popup ?? null
    return this
  }

  getPopup() {
    return this.popup
  }

  togglePopup() {
    if (!this.popup) return this
    if (this.popup.isOpen()) this.popup.remove()
    else this.popup.setLngLat(this.lngLat).addTo(this.map)
    return this
  }
}

export class Popup extends Evented {
  constructor(options = {}) {
    super()
    this.options = { closeButton: true, closeOnClick: true, ...options }
    this.map = null
    this.content = null
    this.close = () => this.remove()
  }

  setLngLat(lngLatLike) {
    this.lngLat = LngLat.convert(lngLatLike)
    return this
  }

  getLngLat() {
    return this.lngLat
  }

  setText(text) {
    this.content = element('div', 'maplibregl-popup-content')
    this.content.textContent = text
    return this
  }

  setHTML(html) {
    this.content = element('div', 'maplibregl-popup-content')
    this.content.innerHTML = html
    return this
  }

  addTo(map) {
    if (this.map) this.remove()
    this.map = map
    this.container = element('div', 'maplibregl-popup', map.getContainer())
    element('div', 'maplibregl-popup-tip', this.container)
    if (this.content) this.container.appendChild(this.content)
    if (this.options.closeButton) {
      const button = element('button', 'maplibregl-popup-close-button', this.content)
      button.addEventListener('click', this.close)
    }
    if (this.options.closeOnClick) map.on('click', this.close)
    map.on('remove', this.close)
    this.fire('open')
    return this
  }

  isOpen() {
    return Boolean(this.map)
  }

  remove() {
    if (!this.map) return this
    this.map.off('click', this.close)
    this.map.off('remove', this.close)
    this.container.remove()
    this.map = null
    this.fire('close')
    return this
  }
}

export class NavigationControl {
  constructor(options = {}) {
    this.options = { showCompass: true, showZoom: true, ...options }
  }

  onAdd(map) {
    this.container = element('div', 'maplibregl-ctrl maplibregl-ctrl-group')
    if (this.options.showZoom) {
      element('button', 'maplibregl-ctrl-zoom-in', this.container).addEventListener('click', () =>
        map.zoomIn(),
      )
      element('button', 'maplibregl-ctrl-zoom-out', this.container).addEventListener('click', () =>
        map.zoomOut(),
      )
    }
    if (this.options.showCompass) element('button', 'maplibregl-ctrl-compass', this.container)
    return this.container
  }

  onRemove() {
    this.container.remove()
  }
}
