<template>
  <div>
    <coordinates-display
      v-if="map && showCoordinates"
      :community-position="communityPosition"
      :user-position="userPosition"
      @centerMap="handleMapCenter"
    />
    <div ref="mapContainer" class="map-container" :style="{ height }" />

    <!-- The address search. It is this component's own element, and initMap hangs it on
         the map as a control. Until the map takes it, it is still standing in the page
         flow here and the style block below keeps it out of sight. -->
    <div ref="searchHost" class="gk-search">
      <GeoSearchField
        id="user-location-search"
        collapsible
        :provider="provider"
        :label="t('settings.GMS.map.search')"
        @pick="onPick"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { loadMapEngine } from '@/utils/mapEngine'
// Imported here rather than loaded like the other engine: a map drawn with Leaflet is built in
// the same tick as before, and it is also the one that stands in where MapLibre cannot draw.
import { createMap as createLeafletMap } from '@/utils/mapEngine/leaflet'
import CoordinatesDisplay from '@/components/UserSettings/CoordinatesDisplay.vue'
import GeoSearchField from '@/components/Matching/GeoSearchField.vue'
import { useI18n } from 'vue-i18n'
import { useGmsBase } from '@/composables/useGmsBase'
import { MAP_ENGINE, useMapSwitches } from '@/composables/useMapSwitches'
import { makeGeoProvider } from '@/utils/geoSearchProvider'

const mapContainer = ref(null)
const searchHost = ref(null)
const map = ref(null)
const userMarker = ref(null)
const communityMarker = ref(null)
const userPosition = ref({ lat: 0, lng: 0 })
const communityPosition = ref({ lat: 0, lng: 0 })
const defaultZoom = 13
// Held so unmounting can call it off; initMap runs a quarter second after mount.
let initTimer = null

/**
 * The classic map pin, drawn here rather than fetched.
 *
 * Until now the two pins were PNGs from raw.githubusercontent.com and cdnjs, so opening
 * the settings page told two foreign servers about it; and the map seam takes a marker as
 * markup, which is what every other marker of both maps already is. Same size and same
 * point as the images they replace (25 x 41, the tip at 12/41), so nothing moves.
 */
function pinHtml(colour) {
  return `<div style="width:25px;height:41px;filter:drop-shadow(1px 2px 2px rgba(0,0,0,.4))">
      <svg viewBox="0 0 25 41" width="25" height="41" style="display:block" aria-hidden="true">
        <path d="M12.5 0.5a12 12 0 0 0-12 12c0 9.3 12 27.9 12 27.9s12-18.6 12-27.9a12 12 0 0 0-12-12z" fill="${colour}" stroke="#fff" stroke-width="1"/>
        <circle cx="12.5" cy="12.5" r="4.2" fill="#fff"/>
      </svg>
    </div>`
}

// The colours of the images they replace: the member's own place red, the community's blue.
const USER_PIN = '#cb2b3e'
const COMMUNITY_PIN = '#2a81cb'

const emit = defineEmits(['update:userPosition'])

const props = defineProps({
  userMarkerCoords: Object,
  // The community's own point, as a pin with its label - the settings page shows it.
  // Left out, there is no such pin at all: the matching tab dropped it (Bernd,
  // 11.09.2026: nobody needs the community's centre there, and it only confused
  // wherever a home stood right on it).
  communityMarkerCoords: Object,
  // optional map height; default keeps the settings-page usage unchanged
  height: { type: String, default: '400px' },
  // the settings page shows the coordinates readout; the matching tab hides it
  showCoordinates: { type: Boolean, default: true },
  // 'pin' (default, the settings page) or 'home' — the matching tab shows the
  // same gold heart-house as the big map, so home reads the same everywhere.
  userIcon: { type: String, default: 'pin' },
})

const { t, locale } = useI18n()
// For the address search: the admin switch and the GMS address need the Apollo client,
// which only setup can reach - the map itself is built a quarter second after mounting.
// The switch is read at each search rather than now (utils/geoSearchProvider).
const { mapSwitches } = useMapSwitches()
const { gmsBase } = useGmsBase()
const provider = makeGeoProvider({
  mapSwitches,
  gmsBase,
  viewpoint: () => map.value?.getCenter() ?? null,
  language: () => locale.value,
})
// Which engine draws the map, by the same switch (K-008) - asked at once, so the answer is
// usually in by the time initMap runs. Null until it is.
const engineName = ref(null)
const engineAnswered = mapSwitches().then(({ mapEngine }) => {
  engineName.value = mapEngine
})

onMounted(async () => {
  if (props.userMarkerCoords) {
    userPosition.value = props.userMarkerCoords
  }
  if (props.communityMarkerCoords) {
    communityPosition.value = props.communityMarkerCoords
  }
  initTimer = setTimeout(() => initMap(), 250)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  // Tidiness, not a fix: initMap already returns when mapContainer.value is empty,
  // and Vue empties it on unmount, so a timer left running finds nothing to do.
  // This just spares the wakeup and lets the closure go a quarter second earlier.
  clearTimeout(initTimer)
  if (map.value) {
    map.value.remove()
  }
  window.removeEventListener('resize', handleResize)
})

/**
 * Build the map with the engine the admin switch names, as the matching map does: Leaflet at
 * once, MapLibre once its file has arrived. A switch that has not answered yet is waited for
 * rather than guessed, and a question that fails is answered with the old map (useMapSwitches).
 */
function initMap() {
  if (!mapContainer.value || map.value) return
  if (engineName.value === null) {
    engineAnswered.then(initMap)
    return
  }
  if (engineName.value !== MAP_ENGINE.MAPLIBRE) {
    buildMap(createLeafletMap)
    return
  }
  loadMapEngine(MAP_ENGINE.MAPLIBRE).then(
    (engine) => buildMap(engine.createMap),
    // The engine did not arrive: the map this component already holds is better than none.
    () => buildMap(createLeafletMap),
  )
}

function buildMap(createMap) {
  // Left while the engine was on its way, or built by a call that came first.
  if (mapContainer.value && !map.value) {
    // MapLibre draws a style and labels it; this map has one look, and its place names are in
    // the wallet's language - without one the style would name them in English.
    const options = {
      center: userPosition.value,
      zoom: defaultZoom,
      maxZoom: 19,
      look: 'normal',
      locale: locale.value,
    }
    let built = createMap(mapContainer.value, options)
    // Only MapLibre turns a device away (no WebGL 2, K-013); until the old engine is removed
    // that device keeps the old map.
    if (!built.success && createMap !== createLeafletMap) {
      built = createLeafletMap(mapContainer.value, options)
    }
    // A map that could not be built leaves the readout and the address search standing;
    // everything below asks for `map.value` first.
    if (!built.success) return
    map.value = built.value

    map.value.addZoomControl('topleft')

    // User marker (movable). The matching tab asks for the home house — the same
    // "you" as the big map; the settings page keeps the classic pin.
    const homeIcon = props.userIcon === 'home'

    const userIconDef = homeIcon
      ? {
          className: 'own-home',
          html: `<div style="width:34px;height:34px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.5))">
              <svg viewBox="0 0 16 16" width="34" height="34" style="display:block" aria-hidden="true">
                <g fill="#c69130"><path d="M7.293 1.5a1 1 0 0 1 1.414 0L11 3.793V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v3.293l2.354 2.353a.5.5 0 0 1-.708.707L8 2.207L1.354 8.853a.5.5 0 1 1-.708-.707z"/><path d="m14 9.293l-6-6l-6 6V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5zm-6-.811c1.664-1.673 5.825 1.254 0 5.018c-5.825-3.764-1.664-6.691 0-5.018"/></g>
              </svg>
            </div>`,
          size: [34, 34],
          anchor: [17, 32],
        }
      : {
          className: 'gk-pin',
          html: pinHtml(USER_PIN),
          size: [25, 41],
          anchor: [12, 41],
          popupAnchor: [1, -34],
        }

    // Interactive, because draggable alone is not enough: Marker._initInteraction
    // returns before it builds MarkerDrag when interactive is false, so the marker
    // had `draggable: true` and no way to be dragged, and the dragend handler below
    // could never run. Setting the position by clicking the map still worked, which
    // is why it read as a working map. The community marker stays non-interactive -
    // it is a label, not a control.
    //
    // The home house needs no label; the pin explains itself with a popup.
    userMarker.value = map.value.marker({
      lat: userPosition.value.lat,
      lng: userPosition.value.lng,
      ...userIconDef,
      draggable: true,
      popup: homeIcon ? null : t('settings.GMS.map.userLocationLabel'),
      onDragEnd: onMarkerDragEnd,
    })

    // Community marker (fixed), only where one was given: the settings page shows
    // the community's pin with its label; the matching tab gives none. Without the
    // guard it would stand at the 0/0 this component starts from.
    if (props.communityMarkerCoords) {
      communityMarker.value = map.value.marker({
        lat: communityPosition.value.lat,
        lng: communityPosition.value.lng,
        className: 'gk-pin',
        html: pinHtml(COMMUNITY_PIN),
        size: [25, 41],
        anchor: [12, 41],
        popupAnchor: [1, -34],
        interactive: false,
        popup: t('settings.GMS.map.communityLocationLabel'),
      })
    }

    map.value.on('click', updateUserPosition)

    // The search field this component built, hung on the map as a control of its own.
    // The engine keeps taps and wheel turns inside it: without that, a click into the
    // field would reach the map click above and move the member's pin to wherever the
    // field happens to lie, and scrolling its results would zoom the map.
    map.value.addControl(searchHost.value, 'topleft')

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

function onPick(place) {
  const position = { lat: place.lat, lng: place.lng }
  updateUserPosition(position)
  // Somebody who searched an address wants to see the house, and updateUserPosition only
  // recentres at whatever zoom the map already had - on a map still showing the whole
  // country the pin would land somewhere in the middle of it. Closer stays closer (K-010).
  if (map.value) {
    map.value.setView(position, Math.max(map.value.getZoom(), 15), { animate: true })
  }
}

function onMarkerDragEnd(position) {
  updateUserPosition(position)
}

function updateUserPosition(latlng) {
  userPosition.value = { lat: latlng.lat, lng: latlng.lng }
  if (userMarker.value) {
    userMarker.value.setPosition(latlng)
    userMarker.value.openPopup()
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

function centerMapOnCommunity() {
  if (map.value && communityPosition.value) {
    map.value.setView(communityPosition.value, map.value.getZoom(), {
      animate: true,
      duration: 0.5,
    })
  }
}

function handleMapCenter(centerMode) {
  if (centerMode === 'USER') centerMapOnUser()
  else centerMapOnCommunity()
}

watch(userPosition, (newPosition) => {
  emit('update:userPosition', newPosition)
})
</script>

<style scoped>
.map-container {
  height: 400px;
  width: 100%;
}

/* Leaflet paints div-icons on a white bordered box by default; the home house
   rides transparent, the way the big map's markers do. */
:deep(.own-home) {
  background: transparent;
  border: 0;
}

/* The field rides the map, so it wears the map's chrome and not the wallet's theme: white
   with a translucent rim and black marks, like the zoom buttons beside it, whichever theme
   the wallet is in. It paints itself out of --surface and --border (GeoSearchField), and
   both are inherited, so the lens, the field and its result list all follow. */
.gk-search {
  --surface: #fff;
  --border: rgb(0 0 0 / 20%);

  color: #212529;
}

/* The search field belongs in the map's control corner, and initMap moves it there —
   both engines mark what they have taken with `gk-placed`. Until then the element is
   still standing in the page flow under the map; and where no map is ever built, it
   stays away. */
.gk-search:not(.gk-placed) {
  display: none;
}

:deep(.leaflet-control-zoom > a) {
  color: #555 !important;
}

/* MapLibre's zoom buttons, held to the measure of Leaflet's on a touch screen - 30 px buttons
   in a 2 px rim, 34 px in all - which is the measure the lens under them is built to
   (GeoSearchField). The big map does the same. Behind `.map-container`, because MapLibre's
   own stylesheet arrives with the engine, after this one, and would win a tie. */
.map-container :deep(.maplibregl-ctrl-group) {
  border: 2px solid rgb(0 0 0 / 20%);
  background-clip: padding-box;
  box-shadow: none;
}

.map-container :deep(.maplibregl-ctrl-group button) {
  width: 30px;
  height: 30px;
}
</style>
