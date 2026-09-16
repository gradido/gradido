// AI-GENERATED — not an architecture reference
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import L from 'leaflet'
import { boundsOfRadius } from '@/utils/mapGeometry'
import { createMap } from './leaflet'

// jsdom has no SVG geometry, and Leaflet decides once, when it is imported, whether it
// may draw SVG at all - by looking for createSVGRect. Without it Leaflet finds no
// renderer and the map dies at its first circle. The grey rings go on a canvas, which
// jsdom does not paint either; Leaflet only needs a 2D context that takes every call,
// and its own hit test is plain arithmetic that runs as it does in a browser. Hoisted,
// so it runs before Leaflet is imported however this block is placed.
vi.hoisted(() => {
  window.SVGSVGElement.prototype.createSVGRect = () => ({})
  window.HTMLCanvasElement.prototype.getContext = () =>
    new Proxy({}, { get: (target, name) => (name in target ? target[name] : () => {}) })
})

// A pending canvas redraw that arrives after its renderer is gone: Leaflet cancels the
// frame, jsdom runs it anyway, and `_clear` then reads `save` off a deleted context.
// Guarded exactly as Leaflet guards it and no wider - a redraw WITH a context still runs.
const redrawCanvas = L.Canvas.prototype._redraw
L.Canvas.prototype._redraw = function guardedRedraw() {
  if (this._ctx) redrawCanvas.call(this)
}

const CENTRE = { lat: 49.2816, lng: 9.7406 }
const ZOOM = 12

// These build into document.body, so the teardown has to run even when an assertion
// throws - otherwise a failing case leaves its map behind and the next one reads it.
let container = null
let map = null

const build = ({ size, ...options } = {}) => {
  container = document.createElement('div')
  document.body.appendChild(container)
  // jsdom lays nothing out, so a test that needs a real view says how big it is.
  if (size) {
    Object.defineProperty(container, 'clientWidth', { value: size[0] })
    Object.defineProperty(container, 'clientHeight', { value: size[1] })
  }
  const built = createMap(container, { center: CENTRE, zoom: ZOOM, maxZoom: 19, ...options })
  expect(built.success, 'the map was not built').toBe(true)
  map = built.value
  return map
}

describe('the Leaflet map engine', () => {
  beforeEach(() => {
    container = null
    map = null
  })

  afterEach(() => {
    map?.remove()
    map = null
    document.body.innerHTML = ''
  })

  describe('building one', () => {
    it('opens where it was told, in the seam form and in Leaflet zoom', () => {
      build()

      expect(map.getCenter().lat).toBeCloseTo(CENTRE.lat, 6)
      expect(map.getCenter().lng).toBeCloseTo(CENTRE.lng, 6)
      expect(map.getZoom()).toBe(ZOOM)
      // From the tile layer, which is the only thing that caps it.
      expect(map.getMaxZoom()).toBe(19)
    })

    // The engine that comes after this one refuses where the device has no WebGL 2, and
    // the pages have to answer for that (K-013). Leaflet refuses a container it has
    // already built a map in, which is the same shape of answer.
    it('says so instead of throwing where the library refuses the container', () => {
      build()

      const second = createMap(container, { center: CENTRE, zoom: ZOOM, maxZoom: 19 })

      expect(second.success).toBe(false)
      expect(second.error).toBeInstanceOf(Error)
    })
  })

  describe('moving the view', () => {
    it('takes a place and a zoom and goes there', () => {
      build()

      map.setView({ lat: 50.0874654, lng: 14.4212535 }, 9)

      expect(map.getCenter().lat).toBeCloseTo(50.0874654, 4)
      expect(map.getZoom()).toBe(9)
    })

    // What the view frames is the circle, whatever its radius. The box is the arithmetic
    // both engines have to share, so it is held against Leaflet's own - a box wide enough
    // to hold a circle of `metres` is the one Leaflet builds for a size of two of them.
    it('builds exactly the box Leaflet builds', () => {
      const metres = 25000

      const mine = boundsOfRadius(CENTRE, metres)

      const theirs = L.latLng(CENTRE.lat, CENTRE.lng).toBounds(metres * 2)
      expect(mine.south).toBeCloseTo(theirs.getSouth(), 10)
      expect(mine.north).toBeCloseTo(theirs.getNorth(), 10)
      expect(mine.west).toBeCloseTo(theirs.getWest(), 10)
      expect(mine.east).toBeCloseTo(theirs.getEast(), 10)
    })

    it('moves the view onto that box, however far away it was looking', () => {
      build({ size: [800, 600] })
      map.setView({ lat: 0, lng: 0 }, 3)

      map.fitRadius(CENTRE, 25000)

      // Within half a kilometre, which at this zoom is a couple of pixels: the view lands
      // on whole pixels, the box is exact - and the box is what the test above measures.
      expect(map.getCenter().lat).toBeCloseTo(CENTRE.lat, 2)
      expect(map.getCenter().lng).toBeCloseTo(CENTRE.lng, 2)
      // A 25 km circle on an 800 px view is a good deal closer than three.
      expect(map.getZoom()).toBeGreaterThan(3)
    })
  })

  // jsdom lays the container out at no size, so the middle of the view is container
  // point (0, 0) and a projected point is its offset from the centre in pixels.
  it('puts a place on the screen where the projection says it is', () => {
    build()
    const elsewhere = { lat: 49.3, lng: 9.8 }

    const here = map.project(elsewhere)

    // Leaflet counts the screen in whole pixels, so the projection is rounded the way
    // it rounds it.
    const crs = L.CRS.EPSG3857
    const expected = crs
      .latLngToPoint(L.latLng(elsewhere.lat, elsewhere.lng), ZOOM)
      ._round()
      .subtract(crs.latLngToPoint(L.latLng(CENTRE.lat, CENTRE.lng), ZOOM)._round())
    expect(here.x).toBe(expected.x)
    expect(here.y).toBe(expected.y)
    expect(map.getSize()).toEqual({ width: 0, height: 0 })
  })

  describe('the elements a page hands over', () => {
    it("marks what it has taken, in Leaflet words and in the seam's own", () => {
      build()
      const field = document.createElement('div')
      field.className = 'gk-search'

      map.addControl(field, 'topleft')

      expect(field.classList.contains('leaflet-control')).toBe(true)
      expect(field.classList.contains('gk-placed')).toBe(true)
      expect(document.querySelector('.leaflet-top.leaflet-left').contains(field)).toBe(true)
    })

    // Without this a tap meant for the field would reach the map underneath it - on the
    // settings map that is what moves the member's pin.
    it('keeps a tap inside the element it took', () => {
      build()
      const field = document.createElement('div')
      const onMapClick = vi.fn()
      map.on('click', onMapClick)
      map.addControl(field, 'topleft')

      field.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      field.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      expect(onMapClick).not.toHaveBeenCalled()
    })

    it('gives the button chrome only where it was asked for', () => {
      build()
      const plain = document.createElement('div')
      const button = document.createElement('div')

      map.addControl(plain, 'topleft')
      map.addControl(button, 'topleft', { bar: true })

      expect(plain.classList.contains('leaflet-bar')).toBe(false)
      expect(button.classList.contains('leaflet-bar')).toBe(true)
    })

    it('adds the zoom buttons where it was told', () => {
      build()

      map.addZoomControl('topleft')

      expect(
        document.querySelectorAll('.leaflet-top.leaflet-left .leaflet-control-zoom'),
      ).toHaveLength(1)
    })
  })

  describe('a marker', () => {
    const HTML = '<div class="probe"></div>'

    it('draws the markup it was given and can be moved afterwards', () => {
      build()

      const marker = map.marker({ ...CENTRE, html: HTML, className: 'gk-probe', size: [34, 34] })
      marker.setPosition({ lat: 50.0874654, lng: 14.4212535 })

      expect(marker.getPosition().lat).toBeCloseTo(50.0874654, 6)
      expect(marker.getPosition().lng).toBeCloseTo(14.4212535, 6)
      expect(document.querySelectorAll('.gk-probe .probe')).toHaveLength(1)
    })

    it('goes away when it is told to', () => {
      build()
      const marker = map.marker({ ...CENTRE, html: HTML, className: 'gk-probe', size: [34, 34] })

      marker.remove()

      expect(document.querySelectorAll('.gk-probe')).toHaveLength(0)
    })

    it('hands a tap on to whoever asked for it', () => {
      build()
      const onClick = vi.fn()
      map.marker({ ...CENTRE, html: HTML, className: 'gk-probe', size: [34, 34], onClick })

      document.querySelector('.gk-probe').dispatchEvent(new MouseEvent('click', { bubbles: true }))

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    // Both pins of the settings map carry a label that belongs to them: it is opened at
    // once, and a click on the map - which is how a place is set there - leaves it alone.
    it('opens a label that belongs to it and keeps it through a click on the map', () => {
      build({ keepPopupsOpen: true })
      map.marker({ ...CENTRE, html: HTML, size: [25, 41], popup: 'Dein Standort' })

      expect(document.body.textContent).toContain('Dein Standort')

      map.marker({ lat: 49.3, lng: 9.8, html: HTML, size: [25, 41] }).openPopup()

      expect(document.body.textContent).toContain('Dein Standort')
    })

    it('takes no tab stop where it was told not to', () => {
      build()

      map.marker({ ...CENTRE, html: HTML, className: 'a', size: [10, 10], focusable: false })
      map.marker({ lat: 49.3, lng: 9.8, html: HTML, className: 'b', size: [10, 10] })

      expect(document.querySelector('.a').hasAttribute('tabindex')).toBe(false)
      expect(document.querySelector('.b').getAttribute('tabindex')).toBe('0')
    })

    it('puts a group of them up and takes them all down again', () => {
      build()
      const group = map.group()
      group.marker({ ...CENTRE, html: HTML, className: 'gk-probe', size: [10, 10] })
      group.marker({ lat: 49.3, lng: 9.8, html: HTML, className: 'gk-probe', size: [10, 10] })

      expect(document.querySelectorAll('.gk-probe')).toHaveLength(2)

      group.remove()

      expect(document.querySelectorAll('.gk-probe')).toHaveLength(0)
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
    // The ring stands in the middle of the view, which jsdom lays out at no size -
    // container point (0, 0) - so the distance of a tap to it is its clientX.
    const tapCanvas = (x) =>
      document
        .querySelector('.leaflet-overlay-pane canvas')
        .dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: x, clientY: 0 }))

    it('draws them on a canvas and opens the one that was tapped', () => {
      build()
      const onClick = vi.fn()

      map.setPresence([{ ...CENTRE, filled: true, onClick }], ringOptions)
      tapCanvas(15)

      expect(document.querySelectorAll('.leaflet-overlay-pane canvas')).toHaveLength(1)
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    // A ring that opens nothing must not offer itself either: Leaflet marks the canvas
    // as interactive while the pointer is over a ring it would hand a click to, and that
    // is the hand cursor. One hover per test, because Leaflet lets only one through every
    // 32 ms and a second in the same tick would measure the throttle.
    const hoverTheRing = () => {
      document
        .querySelector('.leaflet-overlay-pane canvas')
        .dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 0, clientY: 0 }))
      return document
        .querySelector('.leaflet-overlay-pane canvas')
        .classList.contains('leaflet-interactive')
    }

    it('shows a hand over a ring that opens something', () => {
      build()

      map.setPresence([{ ...CENTRE, filled: true, onClick: vi.fn() }], ringOptions)

      expect(hoverTheRing()).toBe(true)
    })

    it('shows none over a ring that opens nothing', () => {
      build()

      map.setPresence([{ ...CENTRE, filled: true, onClick: null }], ringOptions)

      expect(hoverTheRing()).toBe(false)
    })

    // An older GMS names nobody, and a ring with nothing to open takes no tap either.
    it('lets a tap through where the ring has nothing to open', () => {
      build()
      const onClick = vi.fn()
      map.setPresence([{ ...CENTRE, filled: true, onClick: null }], ringOptions)

      tapCanvas(15)

      expect(onClick).not.toHaveBeenCalled()
    })

    it('replaces the whole set on the next call', () => {
      build()
      const first = vi.fn()
      map.setPresence([{ ...CENTRE, filled: true, onClick: first }], ringOptions)

      map.setPresence([], ringOptions)
      tapCanvas(15)

      expect(first).not.toHaveBeenCalled()
    })
  })

  describe('the circle', () => {
    const look = { fill: '#000000', opacity: 0.08, edge: 'rgb(0 0 0 / 35%)' }
    const shapes = () => document.querySelectorAll('.leaflet-overlay-pane path')

    it('veils the world outside it and draws its own edge', () => {
      build()

      map.setCircle(CENTRE, 25000, look)

      // The mask and the line around the hole in it.
      expect(shapes()).toHaveLength(2)
      expect(shapes()[0].getAttribute('fill-rule')).toBe('evenodd')
      expect(shapes()[0].getAttribute('fill')).toBe('#000000')
      expect(shapes()[1].getAttribute('stroke')).toBe('rgb(0 0 0 / 35%)')
    })

    // The page asks for this where a circle would be wider than the globe: there is no
    // outside left to dim, and a ring that wraps the world instead of closing draws nonsense.
    it('leaves the map bare when asked for no circle at all', () => {
      build()
      map.setCircle(CENTRE, 25000, look)

      map.setCircle(null)

      expect(shapes()).toHaveLength(0)
    })
  })
})
