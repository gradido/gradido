// AI-GENERATED — not an architecture reference
import * as maplibregl from 'maplibre-gl'
// The stylesheet belongs to the engine: it arrives wherever this map is built and nowhere else.
import 'maplibre-gl/dist/maplibre-gl.css'
import { Protocol } from 'pmtiles'
import CONFIG from '@/config'
import { boundsOfRadius, latLngOf, ringPoints } from '@/utils/mapGeometry'
import { styleFor } from '@/utils/mapStyle'
import { archiveFor } from '@/utils/mapTiles'
import workerUrl from '@/utils/mapEngine/maplibreWorkerUrl'

/**
 * The map seam, with MapLibre behind it.
 *
 * Everything the two map pages ask of a map goes through the handle `createMap` returns. What
 * stays with the pages: the sizes and tolerances of the markers (displayCore, F-10) and every
 * decision about what to draw. What lives here: how it is drawn.
 *
 * The pages speak in `{ lat, lng }` and in Leaflet's zoom numbers, the numbers their stored
 * views carry. MapLibre counts zoom with tiles of 512 px, Leaflet with tiles of 256 px, so the
 * same number shows twice the scale: this engine takes one off when it sets a zoom and adds one
 * when it reads one (derived from the tile sizes; B1b-2 measures it on a device, C-9). It takes
 * `[lng, lat]` where the seam says `{ lat, lng }`, and turns it round at every call.
 *
 * Rotating and tilting are off (K-012), as they were on Leaflet, which has neither.
 */

/** Leaflet zoom = MapLibre zoom + 1. */
const ZOOM_OFFSET = 1

/** The furthest north and south Web Mercator draws; MapLibre does not clamp a latitude itself. */
const MAX_LATITUDE = 85.051129

/** Leaflet names the corners one way, MapLibre another. */
const CORNER = {
  topleft: 'top-left',
  topright: 'top-right',
  bottomleft: 'bottom-left',
  bottomright: 'bottom-right',
}

/** How far a pointer may move between press and release and still be a tap (MapLibre's own). */
const CLICK_TOLERANCE = 3

const PRESENCE = 'gk-presence'
const CIRCLE = 'gk-circle'
const VEIL = 'gk-circle-veil'
const EDGE = 'gk-circle-edge'

/**
 * The outer ring of the mask: the whole world as Web Mercator draws it, wound the other way from
 * the circle (`ringPoints` runs clockwise), so the circle is a hole in it. The map is not
 * repeated east and west (`renderWorldCopies: false`), so one world is enough.
 */
const WORLD_RING = [
  [-180, -MAX_LATITUDE],
  [180, -MAX_LATITUDE],
  [180, MAX_LATITUDE],
  [-180, MAX_LATITUDE],
  [-180, -MAX_LATITUDE],
]

// Once for the page, not once per map: where the built worker is, and the tile file read
// through the archive the crosshair's place name reads through too - pmtiles finds it by its
// URL, which is the source address in the style (`pmtiles://<MAP_TILES_URL>`).
maplibregl.setWorkerUrl(workerUrl)
const protocol = new Protocol()
protocol.add(archiveFor(CONFIG.MAP_TILES_URL))
maplibregl.addProtocol('pmtiles', protocol.tile)

/** What MapLibre wants: longitude first. */
const lngLatOf = (point) => {
  const { lat, lng } = latLngOf(point)
  return [lng, lat]
}

/** What the seam hands back: two named numbers, never a MapLibre object. */
const pointOf = (lngLat) => ({ lat: lngLat.lat, lng: lngLat.lng })

const clampLatitude = (lat) => Math.max(-MAX_LATITUDE, Math.min(MAX_LATITUDE, lat))

/** MapLibre counts durations in milliseconds, the seam in seconds as Leaflet does. */
const withDuration = (options, duration) =>
  duration === undefined ? options : { ...options, duration: duration * 1000 }

/** A tap that landed on a marker is the marker's: on Leaflet it never reached the map. */
const onMarker = (event) => Boolean(event.originalEvent?.target?.closest?.('.maplibregl-marker'))

/**
 * One marker, on the map.
 *
 * `html` is the marker, drawn in an element the size of `size`, with the point `anchor` (in
 * pixels from its top left corner) on its place - the way a Leaflet div icon stands. Without a
 * size it is 12 px across and its middle is on the place, as a Leaflet div icon is.
 */
function makeMarker(map, options) {
  const {
    lat,
    lng,
    html,
    className,
    size = [12, 12],
    anchor,
    popupAnchor,
    interactive = true,
    focusable = true,
    draggable = false,
    zIndex = 0,
    popup = null,
    onClick = null,
    onDragEnd = null,
  } = options

  const element = document.createElement('div')
  if (className) element.className = className
  element.innerHTML = html ?? ''
  element.style.width = `${size[0]}px`
  element.style.height = `${size[1]}px`
  // A marker that takes no tap lets it through to the map underneath, as Leaflet's does.
  if (!interactive) element.style.pointerEvents = 'none'
  if (focusable) {
    element.tabIndex = 0
    element.setAttribute('role', 'button')
  }
  if (zIndex) element.style.zIndex = String(zIndex)

  const [anchorX, anchorY] = anchor ?? [size[0] / 2, size[1] / 2]
  const marker = new maplibregl.Marker({
    element,
    anchor: 'top-left',
    offset: [-anchorX, -anchorY],
    draggable,
  }).setLngLat([lng, lat])

  // The label of a pin, as on Leaflet: opened at once, closed neither by another label nor by a
  // click on the map (on the settings map a click is how a place is set), no close button. Its tip
  // points `popupAnchor` away from the place, as Leaflet counts it; Leaflet sets its own popup
  // 7 px lower still (Popup offset [0, 7]), which B1b-2 looks at on the device.
  if (popup) {
    marker.setPopup(
      new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        focusAfterOpen: false,
        offset: popupAnchor ?? [0, 0],
      }).setText(popup),
    )
  }

  if (onClick) {
    // A drag of the map that starts on a marker ends with a click on it; Leaflet does not count
    // that as a tap, and neither does this.
    let pressedAt = null
    element.addEventListener('mousedown', (event) => {
      pressedAt = { x: event.clientX, y: event.clientY }
    })
    element.addEventListener('click', (event) => {
      const moved = pressedAt
        ? Math.hypot(event.clientX - pressedAt.x, event.clientY - pressedAt.y)
        : 0
      pressedAt = null
      if (moved > CLICK_TOLERANCE) return
      onClick(event)
    })
  }
  if (onDragEnd) marker.on('dragend', () => onDragEnd(pointOf(marker.getLngLat())))

  marker.addTo(map)
  if (popup) marker.togglePopup()

  return {
    setPosition: (point) => marker.setLngLat(lngLatOf(point)),
    getPosition: () => pointOf(marker.getLngLat()),
    // Silently does nothing where no popup was bound - the matching tab's house has none.
    openPopup: () => {
      if (marker.getPopup() && !marker.getPopup().isOpen()) marker.togglePopup()
    },
    remove: () => marker.remove(),
  }
}

/**
 * Build a map in `container`.
 *
 * Returns the house result form (AGENTS.md): `{ success: true, value: handle }`, or
 * `{ success: false, error }` where MapLibre refuses - it needs WebGL 2 and throws from its
 * constructor where the device has none (K-013).
 *
 * `look` picks the style (utils/mapStyle), `locale` the language of its place names.
 */
export function createMap(container, options = {}) {
  const { center, zoom, maxZoom, look = 'normal', locale } = options

  let map
  try {
    map = new maplibregl.Map({
      container,
      style: styleFor(look, locale),
      center: lngLatOf(center),
      ...(zoom === undefined ? {} : { zoom: zoom - ZOOM_OFFSET }),
      ...(maxZoom === undefined ? {} : { maxZoom: maxZoom - ZOOM_OFFSET }),
      attributionControl: { compact: true },
      renderWorldCopies: false,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      maxPitch: 0,
    })
  } catch (error) {
    return { success: false, error }
  }
  map.touchZoomRotate.disableRotation()
  map.keyboard.disableRotation()

  let currentLook = look

  // What the page last asked to be drawn on the map itself. A style has to have loaded before a
  // source can be added - the first one loads a moment after the map is built - and every change
  // of style drops the sources it does not name. So this is kept and drawn again each time a
  // style has loaded.
  let presence = null
  let circle = null
  let styleReady = false

  const drop = (layers, source) => {
    for (const id of layers) if (map.getLayer(id)) map.removeLayer(id)
    if (map.getSource(source)) map.removeSource(source)
  }

  const paintCircle = () => {
    if (!styleReady) return
    if (!circle) {
      drop([EDGE, VEIL], CIRCLE)
      return
    }
    const ring = ringPoints(latLngOf(circle.centre), circle.metres).map(([lat, lng]) => [lng, lat])
    ring[ring.length - 1] = ring[0]
    const data = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { part: 'veil' },
          geometry: { type: 'Polygon', coordinates: [WORLD_RING, ring] },
        },
        // A line, not a ring: a ring would read as one of the grey circles.
        {
          type: 'Feature',
          properties: { part: 'edge' },
          geometry: { type: 'LineString', coordinates: ring },
        },
      ],
    }
    drop([EDGE, VEIL], CIRCLE)
    map.addSource(CIRCLE, { type: 'geojson', data })
    // Under the grey rings, if they are there already.
    const under = map.getLayer(PRESENCE) ? PRESENCE : undefined
    map.addLayer(
      {
        id: VEIL,
        type: 'fill',
        source: CIRCLE,
        filter: ['==', ['get', 'part'], 'veil'],
        paint: { 'fill-color': circle.look.fill, 'fill-opacity': circle.look.opacity },
      },
      under,
    )
    map.addLayer(
      {
        id: EDGE,
        type: 'line',
        source: CIRCLE,
        filter: ['==', ['get', 'part'], 'edge'],
        paint: { 'line-color': circle.look.edge, 'line-width': 1 },
      },
      under,
    )
  }

  const paintPresence = () => {
    if (!styleReady) return
    drop([PRESENCE], PRESENCE)
    if (!presence) return
    const { points, options: ringOptions } = presence
    map.addSource(PRESENCE, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: points.map((point) => ({
          type: 'Feature',
          properties: { filled: point.filled ? 1 : 0 },
          geometry: { type: 'Point', coordinates: lngLatOf(point) },
        })),
      },
    })
    map.addLayer({
      id: PRESENCE,
      type: 'circle',
      source: PRESENCE,
      paint: {
        // Leaflet draws a ring's line across its radius, half inside and half out; MapLibre draws
        // the stroke outside the radius. The same ring is a radius half a line smaller.
        'circle-radius': ringOptions.radius - ringOptions.weight / 2,
        'circle-stroke-width': ringOptions.weight,
        'circle-stroke-color': ringOptions.stroke,
        'circle-color': ringOptions.fill,
        'circle-opacity': ['get', 'filled'],
      },
    })
  }

  map.on('style.load', () => {
    styleReady = true
    paintCircle()
    paintPresence()
  })

  /**
   * The ring a tap at `point` lands on, if any - by Leaflet's rule for a ring on its canvas: within
   * the radius, half the line and the tolerance of its middle (CircleMarker._containsPoint). Where
   * rings overlap, the one drawn last is on top and takes it. Only rings that open something count.
   */
  const ringAt = (point) => {
    if (!presence || !styleReady) return null
    const { points, options: ringOptions } = presence
    const reach = ringOptions.radius + ringOptions.weight / 2 + ringOptions.tolerance
    for (let i = points.length - 1; i >= 0; i--) {
      if (!points[i].onClick) continue
      const { x, y } = map.project(lngLatOf(points[i]))
      if (Math.hypot(x - point.x, y - point.y) <= reach) return points[i]
    }
    return null
  }

  map.on('click', (event) => {
    if (onMarker(event)) return
    const ring = ringAt(event.point)
    if (ring) ring.onClick()
  })
  // The hand over a ring that opens something, as Leaflet shows it on its canvas.
  map.on('mousemove', (event) => {
    map.getCanvas().style.cursor = !onMarker(event) && ringAt(event.point) ? 'pointer' : ''
  })

  return {
    success: true,
    value: {
      remove: () => map.remove(),
      resize: () => map.resize(),

      getCenter: () => pointOf(map.getCenter()),
      getZoom: () => map.getZoom() + ZOOM_OFFSET,
      getMaxZoom: () => map.getMaxZoom() + ZOOM_OFFSET,

      setView: (centre, zoomTo, { animate, duration } = {}) => {
        const camera = { center: lngLatOf(centre), zoom: zoomTo - ZOOM_OFFSET }
        if (animate) map.easeTo(withDuration(camera, duration))
        else map.jumpTo(camera)
      },
      panTo: (centre, { animate, duration } = {}) =>
        map.panTo(
          lngLatOf(centre),
          withDuration(animate === undefined ? {} : { animate }, duration),
        ),

      /**
       * Frame a circle of `metres` around `centre` - flying there, or landing at once. The box
       * holds the drawn ring (utils/mapGeometry); its latitudes are held to what Web Mercator
       * draws, which Leaflet does inside its projection and MapLibre does not.
       */
      fitRadius: (centre, metres, { fly = false, duration } = {}) => {
        const { south, west, north, east } = boundsOfRadius(centre, metres)
        const bounds = [
          [west, clampLatitude(south)],
          [east, clampLatitude(north)],
        ]
        if (!fly) {
          map.fitBounds(bounds, { animate: false })
          return
        }
        map.fitBounds(bounds, withDuration({}, duration))
      },

      /** Where a place sits on the screen, and how big the screen is. */
      project: (point) => {
        const { x, y } = map.project(lngLatOf(point))
        return { x, y }
      },
      // The size MapLibre projects with, which it writes onto its canvas; for a container laid
      // out at no size that is not the container's own.
      getSize: () => {
        const { style } = map.getCanvas()
        return { width: parseFloat(style.width) || 0, height: parseFloat(style.height) || 0 }
      },

      /** 'move' and 'moveend' carry nothing; 'click' carries the place clicked. */
      on: (event, handler) => {
        if (event === 'click') {
          map.on('click', (e) => {
            if (!onMarker(e)) handler(pointOf(e.lngLat))
          })
          return
        }
        map.on(event, () => handler())
      },

      addZoomControl: (position = 'topleft') => {
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), CORNER[position])
      },

      /**
       * Hang an element the page built into one of the map's corners.
       *
       * Taps and wheel turns inside it stay inside it by themselves: MapLibre hears the map's
       * events on its canvas container, and the corners are not in it. The corners let no tap
       * through (`pointer-events: none`) - an element takes taps only as a `maplibregl-ctrl`, so
       * every element gets that class, and `bar` adds the engine's button chrome. `gk-placed`
       * says in the seam's own words that the element has been taken.
       */
      addControl: (element, position = 'topleft', { bar = false } = {}) => {
        element.classList.add('maplibregl-ctrl', 'gk-placed')
        if (bar) element.classList.add('maplibregl-ctrl-group')
        map.addControl({ onAdd: () => element, onRemove: () => element.remove() }, CORNER[position])
      },

      marker: (markerOptions) => makeMarker(map, markerOptions),

      /** A handful of markers that come and go together. */
      group: () => {
        const markers = []
        return {
          marker: (markerOptions) => {
            const made = makeMarker(map, markerOptions)
            markers.push(made)
            return made
          },
          remove: () => {
            for (const made of markers.splice(0)) made.remove()
          },
        }
      },

      /**
       * The grey rings of everybody else - in a GeoJSON source MapLibre draws on the map. A ring
       * with an `onClick` can be tapped, one without cannot; `tolerance` is how far beside a
       * ring still counts as on it (`ringAt`).
       */
      setPresence: (points, { radius, weight, stroke, fill, tolerance }) => {
        presence = { points, options: { radius, weight, stroke, fill, tolerance } }
        paintPresence()
      },

      /**
       * The world with a hole in it: everything outside the circle veiled, the circle itself
       * left alone and drawn with a line of its own. `setCircle(null)` leaves the map bare.
       */
      setCircle: (centre, metres, look) => {
        circle = centre ? { centre, metres, look } : null
        paintCircle()
      },

      /** The look is a style of its own; changing it draws the rings and the circle again. */
      setLook: (look) => {
        if (look === currentLook) return
        currentLook = look
        styleReady = false
        map.setStyle(styleFor(look, locale))
      },
    },
  }
}
