// AI-GENERATED — not an architecture reference
import L from 'leaflet'
// The base stylesheet belongs to the engine, so it arrives wherever a map is built and
// nowhere else. It was owned by the settings map before, and the matching page, which
// embeds that component directly, once rendered with the tiles static and scattered
// because nobody had imported it.
import 'leaflet/dist/leaflet.css'
import { boundsOfRadius, latLngOf, ringPoints } from '@/utils/mapGeometry'

/**
 * The map seam, with Leaflet behind it.
 *
 * Everything the two map pages ask of a map goes through the handle `createMap` returns;
 * `import L from 'leaflet'` appears in this file and nowhere else. The pages speak in
 * `{ lat, lng }` and in Leaflet's zoom numbers — the numbers their stored views already
 * carry (`pref.gms.map.<id>.view`) — so a second engine converts, and nothing stored on
 * a member's device has to be rewritten.
 *
 * What stays with the pages: the looks (the page's own stylesheet filters the tile pane),
 * the sizes and tolerances of the markers (displayCore, F-10), and every decision about
 * what to draw. What lives here: how it is drawn.
 */

/**
 * The outer ring of the mask — a rectangle round the whole globe, wound the other way,
 * so the ring inside it is cut out (`fillRule: evenodd`). Three-and-a-half turns wide
 * because the map repeats east and west and the mask has to cover every copy in view.
 */
const WORLD_RING = [
  [-89.9, -359.9],
  [-89.9, 359.9],
  [89.9, 359.9],
  [89.9, -359.9],
]

/** What Leaflet wants: a pair. */
const pairOf = (point) => {
  const { lat, lng } = latLngOf(point)
  return [lat, lng]
}

/** What the seam hands back: two named numbers, never a Leaflet object. */
const pointOf = (latlng) => ({ lat: latlng.lat, lng: latlng.lng })

/**
 * One marker, hung on the map or on a group.
 *
 * `html` is the marker: every marker of both pages draws itself, so there is one kind
 * here and no image loading of any sort. `focusable` is whether the icon takes a tab
 * stop; `zIndex` lifts a marker above its neighbours.
 */
function makeMarker(target, options) {
  const {
    lat,
    lng,
    html,
    className,
    size,
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

  const icon = L.divIcon({ className, html, iconSize: size, iconAnchor: anchor })
  if (popupAnchor) icon.options.popupAnchor = popupAnchor

  const marker = L.marker([lat, lng], {
    icon,
    interactive,
    keyboard: focusable,
    draggable,
    zIndexOffset: zIndex,
  })

  // A label that belongs to the marker and stays with it: it is opened at once and no
  // click anywhere takes it away again, because it is what the pin says about itself.
  if (popup) {
    marker.bindPopup(popup, { autoClose: false, closeOnClick: false, closeButton: false })
  }
  if (onClick) marker.on('click', onClick)
  if (onDragEnd) marker.on('dragend', () => onDragEnd(pointOf(marker.getLatLng())))

  marker.addTo(target)
  if (popup) marker.openPopup()

  return {
    setPosition: (point) => marker.setLatLng(pairOf(point)),
    getPosition: () => pointOf(marker.getLatLng()),
    // Silently does nothing where no popup was bound — the matching tab's house has none.
    openPopup: () => marker.openPopup(),
    remove: () => marker.remove(),
  }
}

/**
 * Build a map in `container`.
 *
 * Returns the house result form (AGENTS.md): `{ success: true, value: handle }`, or
 * `{ success: false, error }` where the library refuses the container — Leaflet throws
 * for one it has already built a map in. The engine that comes after this one refuses
 * where the device has no WebGL 2, which is the case the pages have to answer for
 * (K-013), so the shape is the same for both.
 *
 * `look` and `locale` are taken and not used here: the three looks are CSS filters the
 * page puts on the tile pane (`.map-shell.look-dunkel :deep(.leaflet-tile-pane)`), and
 * the tiles carry whatever names their own file carries.
 */
export function createMap(container, options = {}) {
  const { center, zoom, maxZoom, keepPopupsOpen = false } = options

  let map
  try {
    map = L.map(container, {
      center: pairOf(center),
      zoom,
      zoomControl: false,
      closePopupOnClick: !keepPopupsOpen,
    })
  } catch (error) {
    return { success: false, error }
  }

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
    maxZoom,
  }).addTo(map)

  // Only the grey rings are drawn on a canvas, so its click tolerance is theirs alone;
  // the first setPresence brings the number and the renderer is kept from then on.
  let canvasRenderer = null
  let presenceLayer = null
  let circleLayer = null

  return {
    success: true,
    value: {
      remove: () => map.remove(),
      resize: () => map.invalidateSize(),

      getCenter: () => pointOf(map.getCenter()),
      getZoom: () => map.getZoom(),
      getMaxZoom: () => map.getMaxZoom(),

      setView: (centre, zoomTo, { animate, duration } = {}) =>
        map.setView(pairOf(centre), zoomTo, { animate, duration }),
      panTo: (centre, { animate, duration } = {}) =>
        map.panTo(pairOf(centre), { animate, duration }),

      /** Frame a circle of `metres` around `centre` — flying there, or landing at once. */
      fitRadius: (centre, metres, { fly = false, duration } = {}) => {
        const { south, west, north, east } = boundsOfRadius(centre, metres)
        const bounds = [
          [south, west],
          [north, east],
        ]
        if (!fly) {
          map.fitBounds(bounds)
          return
        }
        map.flyToBounds(bounds, duration ? { duration } : {})
      },

      /** Where a place sits on the screen, and how big the screen is. */
      project: (point) => {
        const { x, y } = map.latLngToContainerPoint(pairOf(point))
        return { x, y }
      },
      getSize: () => {
        const size = map.getSize()
        return { width: size.x, height: size.y }
      },

      /** 'move' and 'moveend' carry nothing; 'click' carries the place clicked. */
      on: (event, handler) => {
        if (event === 'click') {
          map.on('click', (e) => handler(pointOf(e.latlng)))
          return
        }
        map.on(event, () => handler())
      },

      addZoomControl: (position = 'topleft') => {
        L.control.zoom({ position }).addTo(map)
      },

      /**
       * Hang an element the page built into one of the map's corners.
       *
       * The engine takes the element as it is and does the rest: taps and wheel turns
       * inside it stay inside it (without that, opening the search field would drag the
       * map, scrolling its results would zoom, and a click into it would reach the
       * settings map's own click handler and move the member's pin). `bar` asks for the
       * engine's own button chrome — the rounded white block the zoom buttons ride.
       *
       * Two classes end up on the element: `leaflet-control`, which Leaflet writes, and
       * `gk-placed`, which says the same thing in the seam's own words — that is what a
       * page reads to know its element has been taken.
       */
      addControl: (element, position = 'topleft', { bar = false } = {}) => {
        const Placed = L.Control.extend({
          options: { position },
          onAdd() {
            L.DomEvent.disableClickPropagation(element)
            L.DomEvent.disableScrollPropagation(element)
            if (bar) L.DomUtil.addClass(element, 'leaflet-bar')
            L.DomUtil.addClass(element, 'gk-placed')
            return element
          },
        })
        map.addControl(new Placed())
      },

      marker: (markerOptions) => makeMarker(map, markerOptions),

      /** A handful of markers that come and go together. */
      group: () => {
        const layer = L.layerGroup().addTo(map)
        return {
          marker: (markerOptions) => makeMarker(layer, markerOptions),
          remove: () => layer.remove(),
        }
      },

      /**
       * The grey rings of everybody else — thousands of them, so they go on a canvas
       * rather than into the DOM. A ring with an `onClick` can be tapped, one without
       * cannot; `tolerance` is how far beside a ring still counts as on it.
       */
      setPresence: (points, { radius, weight, stroke, fill, tolerance }) => {
        if (presenceLayer) presenceLayer.remove()
        presenceLayer = L.layerGroup()
        if (!canvasRenderer) canvasRenderer = L.canvas({ padding: 0.5, tolerance })
        for (const point of points) {
          const ring = L.circleMarker(pairOf(point), {
            renderer: canvasRenderer,
            radius,
            weight,
            color: stroke,
            fillColor: fill,
            fillOpacity: point.filled ? 1 : 0,
            interactive: Boolean(point.onClick),
          })
          if (point.onClick) ring.on('click', point.onClick)
          ring.addTo(presenceLayer)
        }
        presenceLayer.addTo(map)
      },

      /**
       * The world with a hole in it: everything outside the circle veiled, the circle
       * itself left alone and drawn with a line of its own. `setCircle(null)` leaves the
       * map bare — the page asks for that where a circle would be wider than the globe.
       *
       * It is a shape on the ground, not a veil over the container: it belongs to the
       * map and moves with it.
       */
      setCircle: (centre, metres, look) => {
        if (circleLayer) circleLayer.remove()
        circleLayer = L.layerGroup().addTo(map)
        if (!centre) return
        const ring = ringPoints(latLngOf(centre), metres)
        L.polygon([WORLD_RING, ring], {
          stroke: false,
          fillColor: look.fill,
          fillOpacity: look.opacity,
          fillRule: 'evenodd',
          interactive: false,
        }).addTo(circleLayer)
        // A line, not a ring: a ring would read as one of the grey circles.
        L.polygon(ring, {
          fill: false,
          weight: 1,
          color: look.edge,
          interactive: false,
        }).addTo(circleLayer)
      },

      /**
       * Nothing to do here. The three looks of this engine are CSS filters the page lays
       * on the tile pane (`.map-shell.look-dunkel :deep(.leaflet-tile-pane)` and its two
       * neighbours), which follow the class on the shell by themselves. An engine that
       * paints its own tiles answers this by changing its style.
       */
      setLook: () => {},
    },
  }
}
