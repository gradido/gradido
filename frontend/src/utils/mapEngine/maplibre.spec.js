// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { flushPromises } from '@vue/test-utils'
import CONFIG from '@/config'
import { ringPoints } from '@/utils/mapGeometry'
import { archiveFor } from '@/utils/mapTiles'
import { created, registry } from '@test/maplibreMock'
import { createMap } from './maplibre'

// Never the real MapLibre in jsdom: it needs WebGL 2, and with a stubbed context it would die
// deep in drawing rather than cleanly in its constructor. The stand-in keeps what MapLibre does
// where the engine can see it (test/maplibreMock.js says what that is).
vi.mock('maplibre-gl', () => import('@test/maplibreMock'))
vi.mock('@/utils/mapEngine/maplibreWorkerUrl', () => ({ default: 'worker.js' }))

const CENTRE = { lat: 49.2816, lng: 9.7406 }
const ZOOM = 12

// These build into document.body, so the teardown has to run even when an assertion throws -
// otherwise a failing case leaves its map behind and the next one reads it.
let container = null
let map = null

/** The MapLibre map behind the handle. */
const library = () => created.at(-1)

const makeContainer = (size) => {
  container = document.createElement('div')
  document.body.appendChild(container)
  // jsdom lays nothing out, so a test that needs a real view says how big it is.
  if (size) {
    Object.defineProperty(container, 'clientWidth', { value: size[0] })
    Object.defineProperty(container, 'clientHeight', { value: size[1] })
  }
  return container
}

/** A map with its first style loaded - which happens a moment after it is built. */
const build = async ({ size, ...options } = {}) => {
  const built = createMap(makeContainer(size), {
    center: CENTRE,
    zoom: ZOOM,
    maxZoom: 19,
    ...options,
  })
  expect(built.success, 'the map was not built').toBe(true)
  map = built.value
  await flushPromises()
  return map
}

const canvas = () => container.querySelector('.maplibregl-canvas')
// The middle of a view jsdom lays out at no size is container point (0, 0), so the distance of
// a tap from something standing in the middle is its clientX.
const tapAt = (x, type = 'click') =>
  canvas().dispatchEvent(new MouseEvent(type, { bubbles: true, clientX: x, clientY: 0 }))
const tap = (element, x = 0) =>
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: 0 }))
const press = (element, x = 0) =>
  element.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: x, clientY: 0 }))

/**
 * Where Leaflet puts a place: Web Mercator on a world 256 · 2^zoom pixels wide
 * (L.CRS.EPSG3857). Counting zoom in Leaflet's numbers means a place lands on the same pixel
 * on either engine.
 */
const leafletPixels = ({ lat, lng }, zoom) => {
  const world = 256 * 2 ** zoom
  const sin = Math.sin((lat * Math.PI) / 180)
  return {
    x: ((lng + 180) / 360) * world,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * world,
  }
}

describe('the MapLibre map engine', () => {
  beforeEach(() => {
    container = null
    map = null
    // MapLibre asks the canvas for a WebGL 2 context and for nothing else.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation((kind) =>
      kind === 'webgl2' ? {} : null,
    )
  })

  afterEach(() => {
    map?.remove()
    map = null
    created.length = 0
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  describe('building one', () => {
    it('opens where it was told, in the seam form and in Leaflet zoom', async () => {
      await build()

      expect(map.getCenter().lat).toBeCloseTo(CENTRE.lat, 6)
      expect(map.getCenter().lng).toBeCloseTo(CENTRE.lng, 6)
      expect(map.getZoom()).toBe(ZOOM)
      expect(map.getMaxZoom()).toBe(19)
      // MapLibre counts one less: its tiles are twice as wide as Leaflet's.
      expect(library().getZoom()).toBe(ZOOM - 1)
      expect(library().getMaxZoom()).toBe(18)
      expect(library().getCenter().toArray()).toEqual([CENTRE.lng, CENTRE.lat])
    })

    // K-013: MapLibre needs WebGL 2 and throws from its constructor without it. The pages step
    // out on `!built.success`.
    it('says so instead of throwing where the device has no WebGL 2', () => {
      HTMLCanvasElement.prototype.getContext.mockImplementation(() => null)

      const built = createMap(makeContainer(), { center: CENTRE, zoom: ZOOM, maxZoom: 19 })

      expect(built.success).toBe(false)
      expect(built.error).toBeInstanceOf(Error)
    })

    // K-012: a finger can zoom and move the map and nothing else - Leaflet could not do more.
    it('turns rotating and tilting off', async () => {
      await build()

      expect(library().options).toMatchObject({
        dragRotate: false,
        pitchWithRotate: false,
        touchPitch: false,
        maxPitch: 0,
        renderWorldCopies: false,
      })
      expect(library().touchZoomRotate.rotation).toBe(false)
      expect(library().keyboard.rotation).toBe(false)
    })

    // The built worker is not where MapLibre looks for it by itself. And the tile file is read
    // through the archive the crosshair's place name reads through (GMS-206), so they share it.
    it('hands MapLibre its built worker, and the tiles of the archive the place names read', async () => {
      await build()
      const url = `pmtiles://${CONFIG.MAP_TILES_URL}`
      const header = vi.spyOn(archiveFor(CONFIG.MAP_TILES_URL), 'getHeader').mockResolvedValue({
        minZoom: 0,
        maxZoom: 15,
        minLon: -180,
        minLat: -85,
        maxLon: 180,
        maxLat: 85,
      })

      // What MapLibre asks first of a vector source: its TileJSON.
      const answer = await registry.protocols.pmtiles({ url, type: 'json' }, new AbortController())

      expect(registry.workerUrl).toBe('worker.js')
      expect(library().options.style.sources.protomaps.url).toBe(url)
      expect(header).toHaveBeenCalledTimes(1)
      expect(answer.data.tiles).toEqual([`${url}/{z}/{x}/{y}`])
    })
  })

  describe('moving the view', () => {
    it('takes a place and a zoom and goes there', async () => {
      await build()

      map.setView({ lat: 50.0874654, lng: 14.4212535 }, 9)

      expect(map.getCenter().lat).toBeCloseTo(50.0874654, 6)
      expect(map.getZoom()).toBe(9)
      expect(library().getZoom()).toBe(8)
    })

    // The settings map's spec hands the handle a pair, as every map library hands one out.
    it('takes a place as a pair too, latitude first', async () => {
      await build()

      map.setView([50.0874654, 14.4212535], 9)

      expect(map.getCenter().lat).toBeCloseTo(50.0874654, 6)
      expect(map.getCenter().lng).toBeCloseTo(14.4212535, 6)
    })

    // What the view frames is the circle `setCircle` draws, whatever its radius. MapLibre fits
    // a box exactly, without rounding the zoom - so a box narrower than the ring (F-11) would
    // cut it off at once.
    it('holds the whole drawn ring', async () => {
      const [width, height] = [600, 1200]
      await build({ size: [width, height] })

      map.fitRadius(CENTRE, 2000000)

      for (const [lat, lng] of ringPoints(CENTRE, 2000000)) {
        const { x, y } = map.project({ lat, lng })
        expect(x).toBeGreaterThanOrEqual(-1e-6)
        expect(x).toBeLessThanOrEqual(width + 1e-6)
        expect(y).toBeGreaterThanOrEqual(-1e-6)
        expect(y).toBeLessThanOrEqual(height + 1e-6)
      }
    })

    it('moves the view onto that box, however far away it was looking', async () => {
      await build({ size: [800, 600] })
      map.setView({ lat: 0, lng: 0 }, 3)

      map.fitRadius(CENTRE, 25000)

      // The box is fitted in Web Mercator, so its middle is a hair off the circle's centre.
      expect(map.getCenter().lat).toBeCloseTo(CENTRE.lat, 2)
      expect(map.getCenter().lng).toBeCloseTo(CENTRE.lng, 6)
      expect(map.getZoom()).toBeGreaterThan(3)
    })

    // A circle round a pole is framed up to the pole, and Web Mercator draws only to 85 degrees.
    // MapLibre does not clamp the latitude as Leaflet does: the pole would count as an endless
    // height, and the map would drop to its widest zoom.
    it('frames a circle round a pole within the latitudes the map draws', async () => {
      await build({ size: [800, 800] })

      map.fitRadius(CENTRE, 5000000)

      // Every longitude across 800 px: 512 · 2^(z - 1) = 800.
      expect(map.getZoom()).toBeCloseTo(Math.log2(800 / 512) + 1, 6)
      expect(map.getCenter().lng).toBeCloseTo(CENTRE.lng, 6)
    })

    // The seam counts seconds, as Leaflet does; MapLibre counts milliseconds.
    it('moves at once unless it is told to animate, and takes the seconds it is given', async () => {
      await build({ size: [800, 600] })
      const last = () => library().camera.at(-1)

      map.fitRadius(CENTRE, 25000)
      expect(last().options).toEqual({ animate: false })

      map.fitRadius(CENTRE, 25000, { fly: true, duration: 1.5 })
      expect([last().how, last().options]).toEqual(['fitBounds', { duration: 1500 }])

      map.fitRadius(CENTRE, 25000, { fly: true })
      expect(last().options).toEqual({})

      map.setView(CENTRE, 10)
      expect(last().how).toBe('jumpTo')

      map.setView(CENTRE, 11, { animate: true, duration: 0.5 })
      expect([last().how, last().options.duration]).toEqual(['easeTo', 500])

      map.panTo(CENTRE, { animate: true, duration: 0.25 })
      expect([last().how, last().options]).toEqual(['panTo', { animate: true, duration: 250 }])
    })
  })

  it('puts a place on the screen where Leaflet would put it', async () => {
    await build()
    const elsewhere = { lat: 49.3, lng: 9.8 }

    const here = map.project(elsewhere)

    const place = leafletPixels(elsewhere, ZOOM)
    const middle = leafletPixels(CENTRE, ZOOM)
    expect(here.x).toBeCloseTo(place.x - middle.x, 6)
    expect(here.y).toBeCloseTo(place.y - middle.y, 6)
    expect(map.getSize()).toEqual({ width: 0, height: 0 })
  })

  // MapLibre counts a container laid out at no size as 400 x 300 and projects with that
  // (Map._containerDimensions), writing it onto its canvas. The middle of the screen the page
  // measures from has to be the middle MapLibre projects from.
  it('counts the screen as MapLibre projects onto it, from its canvas', async () => {
    await build()

    canvas().style.width = '400px'
    canvas().style.height = '300px'

    expect(map.getSize()).toEqual({ width: 400, height: 300 })
  })

  // The settings map sets the member's place from this, so what arrives has to be a place and
  // not the event that carried it.
  it('hands a click on the map the place that was clicked, in the seam form', async () => {
    await build()
    const onMapClick = vi.fn()
    map.on('click', onMapClick)

    tapAt(0)

    expect(onMapClick).toHaveBeenCalledTimes(1)
    const [place] = onMapClick.mock.calls[0]
    expect(Object.keys(place).sort()).toEqual(['lat', 'lng'])
    expect(place.lat).toBeCloseTo(CENTRE.lat, 6)
    expect(place.lng).toBeCloseTo(CENTRE.lng, 6)
  })

  // MapLibre hears a marker's click as the map's too. On Leaflet it never reached the map, and
  // on the settings map it would move the member's pin to wherever the marker was tapped.
  it('gives a tap on a marker to the marker, not to the map', async () => {
    await build()
    const onMapClick = vi.fn()
    const onClick = vi.fn()
    map.on('click', onMapClick)
    map.marker({ ...CENTRE, html: '<i></i>', className: 'gk-probe', size: [34, 34], onClick })

    tap(container.querySelector('.gk-probe'))

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onMapClick).not.toHaveBeenCalled()
  })

  describe('the elements a page hands over', () => {
    it("marks what it has taken, in MapLibre words and in the seam's own", async () => {
      await build()
      const field = document.createElement('div')
      field.className = 'gk-search'

      map.addControl(field, 'topleft')

      expect(field.classList.contains('maplibregl-ctrl')).toBe(true)
      expect(field.classList.contains('gk-placed')).toBe(true)
      expect(container.querySelector('.maplibregl-ctrl-top-left').contains(field)).toBe(true)
    })

    // Without this a tap meant for the field would reach the map underneath it - on the
    // settings map that is what moves the member's pin.
    it('keeps a tap inside the element it took', async () => {
      await build()
      const field = document.createElement('div')
      const onMapClick = vi.fn()
      map.on('click', onMapClick)
      map.addControl(field, 'topleft')

      press(field)
      tap(field)

      expect(onMapClick).not.toHaveBeenCalled()
    })

    // The corners take no taps themselves (`pointer-events: none` in MapLibre's stylesheet); an
    // element does as a `maplibregl-ctrl`, so every element is one, and only `bar` adds the chrome.
    it('gives the button chrome only where it was asked for', async () => {
      await build()
      const plain = document.createElement('div')
      const button = document.createElement('div')

      map.addControl(plain, 'topleft')
      map.addControl(button, 'topleft', { bar: true })

      expect(plain.classList.contains('maplibregl-ctrl')).toBe(true)
      expect(plain.classList.contains('maplibregl-ctrl-group')).toBe(false)
      expect(button.classList.contains('maplibregl-ctrl-group')).toBe(true)
    })

    it('adds the zoom buttons where it was told, without a compass', async () => {
      await build()

      map.addZoomControl('topleft')

      const group = container.querySelectorAll('.maplibregl-ctrl-top-left .maplibregl-ctrl-group')
      expect(group).toHaveLength(1)
      expect(group[0].querySelector('.maplibregl-ctrl-zoom-in')).not.toBeNull()
      expect(group[0].querySelector('.maplibregl-ctrl-zoom-out')).not.toBeNull()
      expect(group[0].querySelector('.maplibregl-ctrl-compass')).toBeNull()
    })
  })

  describe('a marker', () => {
    const HTML = '<div class="probe"></div>'

    it('draws the markup it was given and can be moved afterwards', async () => {
      await build()

      const marker = map.marker({ ...CENTRE, html: HTML, className: 'gk-probe', size: [34, 34] })
      marker.setPosition({ lat: 50.0874654, lng: 14.4212535 })

      expect(marker.getPosition().lat).toBeCloseTo(50.0874654, 6)
      expect(marker.getPosition().lng).toBeCloseTo(14.4212535, 6)
      expect(container.querySelectorAll('.gk-probe .probe')).toHaveLength(1)
    })

    // The page measures its tap areas with `project`, and the marker has to stand on the same
    // pixels: its anchor point on its place, the way a Leaflet div icon stands.
    it('stands with its anchor on its place, where the projection puts it', async () => {
      await build()
      const elsewhere = { lat: 49.3, lng: 9.8 }

      map.marker({
        ...elsewhere,
        html: HTML,
        className: 'gk-probe',
        size: [44, 40],
        anchor: [22, 20],
      })

      const element = container.querySelector('.gk-probe')
      const { x, y } = map.project(elsewhere)
      expect([element.style.width, element.style.height]).toEqual(['44px', '40px'])
      expect(element.style.transform).toContain(
        `translate(0,0) translate(${Math.round(x - 22)}px, ${Math.round(y - 20)}px)`,
      )
    })

    it('goes away when it is told to', async () => {
      await build()
      const marker = map.marker({ ...CENTRE, html: HTML, className: 'gk-probe', size: [34, 34] })

      marker.remove()

      expect(container.querySelectorAll('.gk-probe')).toHaveLength(0)
    })

    it('hands a tap on to whoever asked for it', async () => {
      await build()
      const onClick = vi.fn()
      map.marker({ ...CENTRE, html: HTML, className: 'gk-probe', size: [34, 34], onClick })

      tap(container.querySelector('.gk-probe'))

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    // A drag of the map that starts on a marker ends with a click on it. Leaflet did not count
    // that as a tap; a wobble of a pixel or two still is one.
    it('takes no tap from a drag of the map that ended on it', async () => {
      await build()
      const onClick = vi.fn()
      map.marker({ ...CENTRE, html: HTML, className: 'gk-probe', size: [34, 34], onClick })
      const marker = container.querySelector('.gk-probe')

      press(marker, 0)
      tap(marker, 10)
      expect(onClick).not.toHaveBeenCalled()

      press(marker, 0)
      tap(marker, 2)
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    // Both pins of the settings map carry a label that belongs to them: it is opened at once,
    // and neither the other pin's label nor a click on the map - which is how a place is set
    // there - takes it away again.
    it('opens a label that belongs to it', async () => {
      await build()

      map.marker({ ...CENTRE, html: HTML, size: [25, 41], popup: 'Dein Standort' })

      expect(document.body.textContent).toContain('Dein Standort')
      expect(container.querySelector('.maplibregl-popup-close-button')).toBeNull()
    })

    it('keeps that label when a second one opens', async () => {
      await build()
      map.marker({ ...CENTRE, html: HTML, size: [25, 41], popup: 'Dein Standort' })

      map.marker({ lat: 49.3, lng: 9.8, html: HTML, size: [25, 41], popup: 'Die Gemeinschaft' })

      expect(document.body.textContent).toContain('Dein Standort')
      expect(document.body.textContent).toContain('Die Gemeinschaft')
    })

    it('keeps that label when the map is clicked', async () => {
      await build()
      map.marker({ ...CENTRE, html: HTML, size: [25, 41], popup: 'Dein Standort' })

      tapAt(0)

      expect(document.body.textContent).toContain('Dein Standort')
    })

    it('takes no tab stop where it was told not to', async () => {
      await build()

      map.marker({ ...CENTRE, html: HTML, className: 'a', size: [10, 10], focusable: false })
      map.marker({ lat: 49.3, lng: 9.8, html: HTML, className: 'b', size: [10, 10] })

      expect(container.querySelector('.a').hasAttribute('tabindex')).toBe(false)
      expect(container.querySelector('.b').getAttribute('tabindex')).toBe('0')
    })

    // The house and the centre disc take no tap: a tap there reaches the map, as on Leaflet.
    it('lets a tap through where it takes none', async () => {
      await build()

      map.marker({ ...CENTRE, html: HTML, className: 'a', size: [10, 10], interactive: false })
      map.marker({ lat: 49.3, lng: 9.8, html: HTML, className: 'b', size: [10, 10] })

      expect(container.querySelector('.a').style.pointerEvents).toBe('none')
      expect(container.querySelector('.b').style.pointerEvents).toBe('')
    })

    it('puts a group of them up and takes them all down again', async () => {
      await build()
      const group = map.group()
      group.marker({ ...CENTRE, html: HTML, className: 'gk-probe', size: [10, 10] })
      group.marker({ lat: 49.3, lng: 9.8, html: HTML, className: 'gk-probe', size: [10, 10] })

      expect(container.querySelectorAll('.gk-probe')).toHaveLength(2)

      group.remove()

      expect(container.querySelectorAll('.gk-probe')).toHaveLength(0)
    })

    // The settings map's pin: dragged, it hands on where it was left, as a place.
    it('hands on the place it was dragged to', async () => {
      await build()
      const onDragEnd = vi.fn()
      const marker = map.marker({
        ...CENTRE,
        html: HTML,
        className: 'gk-probe',
        size: [25, 41],
        anchor: [12, 41],
        draggable: true,
        onDragEnd,
      })

      press(container.querySelector('.gk-probe'), 0)
      tapAt(30, 'mousemove')
      tapAt(30, 'mouseup')

      expect(onDragEnd).toHaveBeenCalledTimes(1)
      const [place] = onDragEnd.mock.calls[0]
      expect(Object.keys(place).sort()).toEqual(['lat', 'lng'])
      expect(place.lng).toBeGreaterThan(CENTRE.lng)
      expect(place.lat).toBeCloseTo(CENTRE.lat, 6)
      expect(marker.getPosition()).toEqual(place)
    })
  })

  describe('the grey rings', () => {
    const ringOptions = {
      radius: 5,
      weight: 2,
      stroke: 'rgb(95, 99, 107)',
      fill: 'rgb(150, 154, 162)',
      tolerance: 15,
    }

    it('draws them in a source of their own and opens the one that was tapped', async () => {
      await build()
      const onClick = vi.fn()

      map.setPresence([{ ...CENTRE, filled: true, onClick }], ringOptions)
      tapAt(15)

      expect(library().getSource('gk-presence').data.features).toEqual([
        {
          type: 'Feature',
          properties: { filled: 1 },
          geometry: { type: 'Point', coordinates: [CENTRE.lng, CENTRE.lat] },
        },
      ])
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    // A ring that opens nothing must not offer itself either: the hand is for a ring that a tap
    // would open.
    const hoverTheRing = () => {
      tapAt(0, 'mousemove')
      return canvas().style.cursor
    }

    it('shows a hand over a ring that opens something', async () => {
      await build()

      map.setPresence([{ ...CENTRE, filled: true, onClick: vi.fn() }], ringOptions)

      expect(hoverTheRing()).toBe('pointer')
    })

    it('shows none over a ring that opens nothing', async () => {
      await build()

      map.setPresence([{ ...CENTRE, filled: true, onClick: null }], ringOptions)

      expect(hoverTheRing()).toBe('')
    })

    // How far beside a ring still counts as on it comes with each call, not with the first one.
    it('takes the tap tolerance of the call it was given', async () => {
      await build()
      const tight = vi.fn()
      map.setPresence([{ ...CENTRE, filled: true, onClick: tight }], {
        ...ringOptions,
        tolerance: 0,
      })

      tapAt(15)

      // 15 px out is far beyond the ring's own 5 px and half its 2 px line.
      expect(tight).not.toHaveBeenCalled()

      const wide = vi.fn()
      map.setPresence([{ ...CENTRE, filled: true, onClick: wide }], {
        ...ringOptions,
        tolerance: 15,
      })

      tapAt(15)

      expect(wide).toHaveBeenCalledTimes(1)
    })

    // The page gives the rings the markers' tap area by this sum (RING_TOLERANCE in the page):
    // radius 5, half the line 1, tolerance 15 - a tap 21 px out is on the ring, 22 px is not.
    it('counts a tap as on a ring up to its radius, half its line and the tolerance', async () => {
      await build()
      const onClick = vi.fn()
      map.setPresence([{ ...CENTRE, filled: true, onClick }], ringOptions)

      tapAt(22)
      expect(onClick).not.toHaveBeenCalled()

      tapAt(21)
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    // A coloured marker stands above the rings; a tap on it is the marker's alone.
    it('leaves a tap on a marker standing on a ring to the marker', async () => {
      await build()
      const onRing = vi.fn()
      const onMarker = vi.fn()
      map.setPresence([{ ...CENTRE, filled: true, onClick: onRing }], ringOptions)
      map.marker({
        ...CENTRE,
        html: '<i></i>',
        className: 'gk-probe',
        size: [44, 44],
        onClick: onMarker,
      })

      tap(container.querySelector('.gk-probe'))

      expect(onMarker).toHaveBeenCalledTimes(1)
      expect(onRing).not.toHaveBeenCalled()
    })

    it('replaces the whole set on the next call', async () => {
      await build()
      const first = vi.fn()
      map.setPresence([{ ...CENTRE, filled: true, onClick: first }], ringOptions)

      map.setPresence([], ringOptions)
      tapAt(15)

      expect(first).not.toHaveBeenCalled()
      expect(library().getSource('gk-presence').data.features).toEqual([])
    })

    // Leaflet strokes a ring across its radius, half the line inside and half outside; MapLibre
    // strokes outside the radius. The same ring there is a radius half a line smaller.
    it('draws a ring as Leaflet did, its line across the radius', async () => {
      await build()

      map.setPresence(
        [
          { ...CENTRE, filled: true, onClick: null },
          { lat: 49.3, lng: 9.8, filled: false, onClick: null },
        ],
        ringOptions,
      )

      expect(library().getLayer('gk-presence').paint).toEqual({
        'circle-radius': 4,
        'circle-stroke-width': 2,
        'circle-stroke-color': 'rgb(95, 99, 107)',
        'circle-color': 'rgb(150, 154, 162)',
        'circle-opacity': ['get', 'filled'],
      })
      const filled = library()
        .getSource('gk-presence')
        .data.features.map((feature) => feature.properties.filled)
      expect(filled).toEqual([1, 0])
    })
  })

  describe('the circle', () => {
    const look = { fill: '#000000', opacity: 0.08, edge: 'rgb(0 0 0 / 35%)' }

    /** Twice the signed area of a ring of [lng, lat]: its sign is the way it is wound. */
    const winding = (ring) =>
      Math.sign(
        ring.slice(1).reduce((sum, [x, y], i) => sum + (ring[i][0] - x) * (ring[i][1] + y), 0),
      )

    it('veils the world outside it and draws its own edge', async () => {
      await build()

      map.setCircle(CENTRE, 25000, look)

      const [veil, edge] = library().getSource('gk-circle').data.features
      const [world, hole] = veil.geometry.coordinates
      const ring = ringPoints(CENTRE, 25000).map(([lat, lng]) => [lng, lat])
      expect(hole.slice(0, -1)).toEqual(ring.slice(0, -1))
      expect(hole.at(-1)).toEqual(hole[0])
      expect(winding(world)).toBe(-winding(hole))
      expect(edge.geometry).toEqual({ type: 'LineString', coordinates: hole })

      expect(library().getLayer('gk-circle-veil').paint).toEqual({
        'fill-color': '#000000',
        'fill-opacity': 0.08,
      })
      expect(library().getLayer('gk-circle-edge').paint).toEqual({
        'line-color': 'rgb(0 0 0 / 35%)',
        'line-width': 1,
      })
    })

    // GeoJSON wants a ring to end where it starts, to the last digit; the ring of points ends a
    // rounding error away from its start for many circles - this one included.
    it('closes the ring exactly', async () => {
      await build()
      const points = ringPoints(CENTRE, 500000)
      expect(points.at(-1)).not.toEqual(points[0])

      map.setCircle(CENTRE, 500000, look)

      const [, hole] = library().getSource('gk-circle').data.features[0].geometry.coordinates
      expect(hole.at(-1)).toEqual(hole[0])
    })

    // The circle changes with the radius while the rings stay; the veil must not cover them.
    it('keeps the veil under the rings that are already there', async () => {
      await build()
      map.setPresence([{ ...CENTRE, filled: true, onClick: null }], {
        radius: 5,
        weight: 2,
        stroke: 'grey',
        fill: 'grey',
        tolerance: 15,
      })

      map.setCircle(CENTRE, 25000, look)

      const order = library().layers.map((layer) => layer.id)
      expect(order.indexOf('gk-circle-veil')).toBeLessThan(order.indexOf('gk-presence'))
      expect(order.indexOf('gk-circle-edge')).toBeLessThan(order.indexOf('gk-presence'))
    })

    // The page asks for this where a circle would be wider than the globe: there is no outside
    // left to dim, and a ring that wraps the world instead of closing draws nonsense.
    it('leaves the map bare when asked for no circle at all', async () => {
      await build()
      map.setCircle(CENTRE, 25000, look)

      map.setCircle(null)

      expect(library().getSource('gk-circle')).toBeUndefined()
      expect(library().getLayer('gk-circle-veil')).toBeUndefined()
      expect(library().getLayer('gk-circle-edge')).toBeUndefined()
    })
  })

  describe('the style', () => {
    const look = { fill: '#000000', opacity: 0.08, edge: 'rgb(0 0 0 / 35%)' }
    const ringOptions = { radius: 5, weight: 2, stroke: 'grey', fill: 'grey', tolerance: 15 }

    // The page draws right after building the map, and MapLibre takes no source before its first
    // style has loaded.
    it('draws what the page asked for before the style had loaded, once it has', async () => {
      const built = createMap(makeContainer(), { center: CENTRE, zoom: ZOOM, maxZoom: 19 })
      map = built.value

      map.setCircle(CENTRE, 25000, look)
      map.setPresence([{ ...CENTRE, filled: true, onClick: null }], ringOptions)
      expect(library().getSource('gk-circle')).toBeUndefined()

      await flushPromises()

      expect(library().getSource('gk-circle')).toBeDefined()
      expect(library().getSource('gk-presence').data.features).toHaveLength(1)
    })

    // Every change of style drops the sources the new style does not name.
    it('changes the look and draws the rings and the circle again', async () => {
      await build({ look: 'normal' })
      map.setCircle(CENTRE, 25000, look)
      map.setPresence([{ ...CENTRE, filled: true, onClick: null }], ringOptions)

      map.setLook('dunkel')

      expect(library().style.sprite).toBe(`${CONFIG.MAP_ASSETS_URL}/sprites/v4/black`)
      expect(library().getSource('gk-circle')).toBeDefined()
      expect(library().getSource('gk-presence').data.features).toHaveLength(1)
      // The veil stays under the rings.
      const order = library().layers.map((layer) => layer.id)
      expect(order.indexOf('gk-circle-veil')).toBeLessThan(order.indexOf('gk-presence'))
    })

    // A style that does not change loads nothing, so there is no moment to draw again in.
    it('keeps drawing when it is asked for the look it already has', async () => {
      await build({ look: 'normal' })

      map.setLook('normal')
      map.setPresence([{ ...CENTRE, filled: true, onClick: null }], ringOptions)

      expect(library().getSource('gk-presence').data.features).toHaveLength(1)
    })
  })
})
