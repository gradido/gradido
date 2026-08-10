<template>
  <div>
    <coordinates-display
      v-if="map && showCoordinates"
      :community-position="communityPosition"
      :user-position="userPosition"
      @centerMap="handleMapCenter"
    />
    <div ref="mapContainer" class="map-container" :style="{ height }" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
// Own the Leaflet base stylesheet here so the map renders correctly wherever it
// is embedded (the settings page imported it in a wrapper; the matching page
// embeds this component directly, where the missing CSS left the tiles static
// and scattered).
import 'leaflet/dist/leaflet.css'
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch'
import 'leaflet-geosearch/dist/geosearch.css'
import CoordinatesDisplay from '@/components/UserSettings/CoordinatesDisplay.vue'
import { useI18n } from 'vue-i18n'

const mapContainer = ref(null)
const map = ref(null)
const userMarker = ref(null)
const communityMarker = ref(null)
const userPosition = ref({ lat: 0, lng: 0 })
const communityPosition = ref({ lat: 0, lng: 0 })
const defaultZoom = 13
// Held so unmounting can call it off; initMap runs a quarter second after mount.
let initTimer = null

const emit = defineEmits(['update:userPosition'])

const props = defineProps({
  userMarkerCoords: Object,
  communityMarkerCoords: Object,
  // optional map height; default keeps the settings-page usage unchanged
  height: { type: String, default: '400px' },
  // the settings page shows the coordinates readout; the matching tab hides it
  showCoordinates: { type: Boolean, default: true },
  // 'pin' (default, the settings page) or 'home' — the matching tab shows the
  // same gold heart-house as the big map, so home reads the same everywhere.
  userIcon: { type: String, default: 'pin' },
})

const { t } = useI18n()

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

function initMap() {
  if (mapContainer.value && !map.value) {
    map.value = L.map(mapContainer.value, {
      center: [userPosition.value.lat, userPosition.value.lng],
      zoom: defaultZoom,
      zoomControl: false,
      closePopupOnClick: false,
    })

    L.control.zoom({ position: 'topleft' }).addTo(map.value)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.value)

    // User marker (movable). The matching tab asks for the home house — the same
    // "you" as the big map; the settings page keeps the classic pin.
    const homeIcon = props.userIcon === 'home'

    // A pane below the markers for the community label, so it never sits over the
    // home house: you can drop your location right where the label is, and your
    // house lands on top of it (the label is read by then anyway). Its clicks fall
    // through to the map via the pass-through class below.
    if (homeIcon) {
      map.value.createPane('communityLabel')
      map.value.getPane('communityLabel').style.zIndex = '550'
    }

    const userIconDef = homeIcon
      ? L.divIcon({
          className: 'own-home',
          html: `<div style="width:34px;height:34px;filter:drop-shadow(0 1px 1px rgba(0,0,0,.5))">
              <svg viewBox="0 0 16 16" width="34" height="34" style="display:block" aria-hidden="true">
                <g fill="#c69130"><path d="M7.293 1.5a1 1 0 0 1 1.414 0L11 3.793V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v3.293l2.354 2.353a.5.5 0 0 1-.708.707L8 2.207L1.354 8.853a.5.5 0 1 1-.708-.707z"/><path d="m14 9.293l-6-6l-6 6V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5zm-6-.811c1.664-1.673 5.825 1.254 0 5.018c-5.825-3.764-1.664-6.691 0-5.018"/></g>
              </svg>
            </div>`,
          iconSize: [34, 34],
          iconAnchor: [17, 32],
        })
      : L.icon({
          iconUrl:
            'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })

    // Interactive, because draggable alone is not enough: Marker._initInteraction
    // returns before it builds MarkerDrag when interactive is false, so the marker
    // had `draggable: true` and no way to be dragged, and the dragend handler below
    // could never run. Setting the position by clicking the map still worked, which
    // is why it read as a working map. The community marker stays non-interactive -
    // it is a label, not a control.
    userMarker.value = L.marker([userPosition.value.lat, userPosition.value.lng], {
      draggable: true,
      icon: userIconDef,
    }).addTo(map.value)

    // The home house needs no label; the pin explains itself with a popup.
    if (!homeIcon) {
      userMarker.value
        .bindPopup(t('settings.GMS.map.userLocationLabel'), {
          autoClose: false,
          closeOnClick: false,
          closeButton: false,
        })
        .openPopup()
    }

    // Community marker (fixed). In home mode (the matching tab) it becomes the
    // group of people — your home community; the settings page keeps the pin.
    const communityIconDef = homeIcon
      ? L.divIcon({
          className: 'home-community',
          html: `<div style="width:32px;height:32px;color:#178d81;filter:drop-shadow(0 1px 1px rgba(0,0,0,.45))">
              <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
                <path fill="currentColor" d="M12 5.5A3.5 3.5 0 0 1 15.5 9a3.5 3.5 0 0 1-3.5 3.5A3.5 3.5 0 0 1 8.5 9A3.5 3.5 0 0 1 12 5.5M5 8c.56 0 1.08.15 1.53.42c-.15 1.43.27 2.85 1.13 3.96C7.16 13.34 6.16 14 5 14a3 3 0 0 1-3-3a3 3 0 0 1 3-3m14 0a3 3 0 0 1 3 3a3 3 0 0 1-3 3c-1.16 0-2.16-.66-2.66-1.62a5.54 5.54 0 0 0 1.13-3.96c.45-.27.97-.42 1.53-.42M5.5 18.25c0-2.07 2.91-3.75 6.5-3.75s6.5 1.68 6.5 3.75V20h-13zM0 20v-1.5c0-1.39 1.89-2.56 4.45-2.9c-.59.68-.95 1.62-.95 2.65V20zm24 0h-3.5v-1.75c0-1.03-.36-1.97-.95-2.65c2.56.34 4.45 1.51 4.45 2.9z"/>
              </svg>
            </div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 30],
          popupAnchor: [0, -28],
        })
      : L.icon({
          iconUrl:
            'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          shadowUrl:
            'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        })

    communityMarker.value = L.marker([communityPosition.value.lat, communityPosition.value.lng], {
      draggable: false,
      interactive: false,
      icon: communityIconDef,
    }).addTo(map.value)

    communityMarker.value
      .bindPopup(t('settings.GMS.map.communityLocationLabel'), {
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
        // In home mode the label rides low and lets clicks through, so it never
        // stands between you and dropping your location there. Everywhere else it
        // has to name Leaflet's own popup pane by hand: the key is always present
        // here, and Util.setOptions copies it over the class default, so passing
        // undefined would leave the popup with no pane to attach to at all.
        pane: homeIcon ? 'communityLabel' : 'popupPane',
        className: homeIcon ? 'community-through' : '',
      })
      .openPopup()

    map.value.on('click', onMapClick)
    userMarker.value.on('dragend', onMarkerDragEnd)

    // GeoSearch control
    const provider = new OpenStreetMapProvider()
    const searchControl = new GeoSearchControl({
      provider,
      style: 'button',
      showMarker: false,
      showPopup: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      keepResult: false,
      searchLabel: t('settings.GMS.map.search'),
    })
    map.value.addControl(searchControl)

    map.value.on('geosearch/showlocation', (result) => {
      const { x, y, label } = result.location
      updateUserPosition({ lat: y, lng: x })
    })

    // Center map on user position
    centerMapOnUser()
  }
}

function handleResize() {
  if (map.value) {
    map.value.invalidateSize()
    centerMapOnUser()
  }
}

function onMapClick(e) {
  updateUserPosition(e.latlng)
}

function onMarkerDragEnd() {
  if (userMarker.value) {
    updateUserPosition(userMarker.value.getLatLng())
  }
}

function updateUserPosition(latlng) {
  userPosition.value = { lat: latlng.lat, lng: latlng.lng }
  if (userMarker.value) {
    userMarker.value.setLatLng(latlng)
    userMarker.value.openPopup()
  }
  centerMapOnUser()
  emit('update:userPosition', userPosition.value)
}

function centerMapOnUser() {
  if (map.value && userPosition.value) {
    map.value.setView([userPosition.value.lat, userPosition.value.lng], map.value.getZoom(), {
      animate: true,
      pan: {
        duration: 0.5,
      },
    })
  }
}

function centerMapOnCommunity() {
  if (map.value && communityPosition.value) {
    map.value.setView(
      [communityPosition.value.lat, communityPosition.value.lng],
      map.value.getZoom(),
      {
        animate: true,
        pan: {
          duration: 0.5,
        },
      },
    )
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

/* Leaflet paints div-icons on a white bordered box by default; the home house and
   the community group ride transparent, the way the big map's markers do. */
:deep(.own-home),
:deep(.home-community) {
  background: transparent;
  border: 0;
}

/* The community label must not catch clicks — you set your own location by
   clicking the map, and the label sits right where you may want to click. */
:deep(.community-through),
:deep(.community-through) * {
  pointer-events: none;
}

/* A touch see-through, so the map faintly shows through the bubble — the text
   stays crisp because only the white behind it is softened, not the letters. */
:deep(.community-through .leaflet-popup-content-wrapper),
:deep(.community-through .leaflet-popup-tip) {
  background: rgb(255 255 255 / 82%);
}

.leaflet-control-custom a {
  background-color: #fff;
  width: 30px;
  height: 30px;
  line-height: 30px;
  text-align: center;
  text-decoration: none;
  color: black;
}

.leaflet-control-custom a:hover {
  background-color: #f4f4f4;
}

:deep(.leaflet-control-zoom > a) {
  color: #555 !important;
}
</style>
