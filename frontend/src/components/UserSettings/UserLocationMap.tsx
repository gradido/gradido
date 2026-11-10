// AI-GENERATED — not an architecture reference
import { defineComponent, onMounted, onUnmounted, type PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { type GeoPlace, GeoSearchField } from '@/components/Matching/GeoSearchField'
import { useGmsBase } from '@/composables/useGmsBase'
import { makeGeoProvider } from '@/utils/geoSearchProvider'
import { loadMapEngine } from '@/utils/mapEngine'
import classes from './UserLocationMap.module.scss'

type Point = { lat: number; lng: number }
type Engine = typeof import('@/utils/mapEngine/maplibre')
/** The map the engine built, and the member's house on it (utils/mapEngine/maplibre). */
type MapHandle = NonNullable<ReturnType<Engine['createMap']>['value']>
type MarkerHandle = ReturnType<MapHandle['marker']>

/**
 * The map of the matching's home tab. It once served the old GMS settings dialog as well, with
 * a coordinates readout, a classic pin and the community's own point as a second, labelled pin;
 * that dialog went with the old member search, and so did all three. The community's point
 * still decides where the map opens for a member without a home - the page hands it over as
 * `userMarkerCoords` then (Matching.tsx).
 */
export const UserLocationMap = defineComponent({
  name: 'UserLocationMap',
  props: {
    userMarkerCoords: { type: Object as PropType<Point> },
    height: { type: String, default: '400px' },
  },
  emits: ['update:userPosition'],
  setup(props, { emit, expose }) {
    const mapContainer = ref<HTMLDivElement | null>(null)
    const searchHost = ref<HTMLDivElement | null>(null)
    const map = ref<MapHandle | null>(null)
    const userMarker = ref<MarkerHandle | null>(null)
    const userPosition = ref<Point>({ lat: 0, lng: 0 })
    const defaultZoom = 13
    // Held so unmounting can call it off; initMap runs a quarter second after mount.
    let initTimer: ReturnType<typeof setTimeout> | null = null

    const { t, locale } = useI18n()
    // For the address search: the GMS address needs the Apollo client, which only setup can
    // reach - the map itself is built a quarter second after mounting. The address is read at
    // each search rather than now (utils/geoSearchProvider).
    const { gmsBase } = useGmsBase()
    const provider = makeGeoProvider({
      gmsBase,
      viewpoint: () => map.value?.getCenter() ?? null,
      language: () => locale.value,
    })

    onMounted(async () => {
      if (props.userMarkerCoords) {
        userPosition.value = props.userMarkerCoords
      }
      initTimer = setTimeout(() => initMap(), 250)
      window.addEventListener('resize', handleResize)
    })

    onUnmounted(() => {
      // Tidiness, not a fix: initMap already returns when mapContainer.value is empty,
      // and Vue empties it on unmount, so a timer left running finds nothing to do.
      // This just spares the wakeup and lets the closure go a quarter second earlier.
      if (initTimer) {
        clearTimeout(initTimer)
      }
      if (map.value) {
        map.value.remove()
      }
      window.removeEventListener('resize', handleResize)
    })

    /**
     * Build the map once its engine has arrived - loaded here rather than imported, so the pages
     * that hold this map on one tab do not download it with themselves (utils/mapEngine).
     */
    function initMap() {
      if (!mapContainer.value || map.value) {
        return
      }
      loadMapEngine().then(
        (engine) => buildMap(engine.createMap),
        () => {
          // The engine did not arrive - a dropped connection, or a deploy since the page was
          // loaded renamed its file. There is no map then; the rest of the page keeps working.
        },
      )
    }

    function buildMap(createMap: Engine['createMap']) {
      // The component may be gone by the time the engine has arrived.
      if (mapContainer.value) {
        // MapLibre draws a style and labels it; this map has one look, and its place names are
        // in the wallet's language - without one the style would name them in English.
        const options = {
          center: userPosition.value,
          zoom: defaultZoom,
          maxZoom: 19,
          look: 'normal',
          locale: locale.value,
        }
        const built = createMap(mapContainer.value, options)
        // A device without WebGL 2 gets no map (K-013). What is left stands as it is:
        // everything below asks for `map.value` first, and the readout and the address search
        // wait for one.
        if (!built.success) {
          return
        }
        // The engine's answer is written in JavaScript, so `success` does not narrow it here.
        const handle = built.value as MapHandle
        map.value = handle

        handle.addZoomControl('topleft')

        // The member's home (movable): the same gold heart-house as the big map, so home reads
        // the same everywhere. It needs no label.
        //
        // Interactive (the engine's default), because draggable alone is not enough: a marker
        // that takes no tap lets it through to the map, so it cannot be picked up either, and
        // the dragend handler below would never run. Setting the position by clicking the map
        // would still work, which is why such a marker once read as a working map.
        userMarker.value = handle.marker({
          lat: userPosition.value.lat,
          lng: userPosition.value.lng,
          className: 'own-home',
          html: `<div style="width:34px;height:34px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.5))">
          <svg viewBox="0 0 16 16" width="34" height="34" style="display:block" aria-hidden="true">
            <g fill="#c69130"><path d="M7.293 1.5a1 1 0 0 1 1.414 0L11 3.793V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v3.293l2.354 2.353a.5.5 0 0 1-.708.707L8 2.207L1.354 8.853a.5.5 0 1 1-.708-.707z"/><path d="m14 9.293l-6-6l-6 6V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5zm-6-.811c1.664-1.673 5.825 1.254 0 5.018c-5.825-3.764-1.664-6.691 0-5.018"/></g>
          </svg>
        </div>`,
          size: [34, 34],
          anchor: [17, 32],
          draggable: true,
          onDragEnd: onMarkerDragEnd,
        })

        handle.on('click', updateUserPosition)

        // The search field this component built, hung on the map as a control of its own.
        // The engine keeps taps and wheel turns inside it: without that, a click into the
        // field would reach the map click above and move the member's pin to wherever the
        // field happens to lie, and scrolling its results would zoom the map.
        handle.addControl(searchHost.value, 'topleft')

        // Center map on user position
        centerMapOnUser()
      }
    }

    function handleResize() {
      if (map.value) {
        map.value.resize()
        centerMapOnUser()
      }
    }

    function onPick(place: GeoPlace) {
      const position = { lat: place.lat, lng: place.lng }
      updateUserPosition(position)
      // Somebody who searched an address wants to see the house, and updateUserPosition only
      // recentres at whatever zoom the map already had - on a map still showing the whole
      // country the pin would land somewhere in the middle of it. Closer stays closer (K-010).
      if (map.value) {
        map.value.setView(position, Math.max(map.value.getZoom(), 15), { animate: true })
      }
    }

    function onMarkerDragEnd(position: Point) {
      updateUserPosition(position)
    }

    function updateUserPosition(latlng: Point) {
      userPosition.value = { lat: latlng.lat, lng: latlng.lng }
      if (userMarker.value) {
        userMarker.value.setPosition(latlng)
      }
      centerMapOnUser()
      emit('update:userPosition', userPosition.value)
    }

    function centerMapOnUser() {
      if (map.value && userPosition.value) {
        map.value.setView(userPosition.value, map.value.getZoom(), {
          animate: true,
          duration: 0.5,
        })
      }
    }

    watch(userPosition, (newPosition) => {
      emit('update:userPosition', newPosition)
    })

    // The map, for its spec: it steers the view and reads the zoom off the handle.
    expose({ map })

    return () => (
      <div>
        <div
          ref={mapContainer}
          class={['map-container', classes['map-container']]}
          style={{ height: props.height }}
        />

        {/* The address search. It is this component's own element, and initMap hangs it on
            the map as a control. Until the map takes it, it is still standing in the page
            flow here and the stylesheet keeps it out of sight. */}
        <div ref={searchHost} class={['gk-search', classes['gk-search']]}>
          <GeoSearchField
            id='user-location-search'
            collapsible
            provider={provider}
            label={t('settings.GMS.map.search')}
            onPick={onPick}
          />
        </div>
      </div>
    )
  },
})
