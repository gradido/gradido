<template>
  <div>
    <coordinates-display
      v-if="map"
      :community-position="communityPosition"
      :user-position="userPosition"
      @centerMap="handleMapCenter"
    />
    <div ref="mapContainer" class="map-container" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import L from 'leaflet'
import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch'
import 'leaflet-geosearch/dist/geosearch.css'
import CoordinatesDisplay from '@/components/UserSettings/CoordinatesDisplay.vue'
import { useI18n } from 'vue-i18n'

const mapContainer = ref(null)
const map = ref(null)
const userMarker = ref(null)
const communityMarker = ref(null)
const searchQuery = ref('')
const userPosition = ref({ lat: 0, lng: 0 })
const communityPosition = ref({ lat: 0, lng: 0 })
const defaultZoom = 13

const emit = defineEmits(['update:userPosition'])

const props = defineProps({
  userMarkerCoords: Object,
  communityMarkerCoords: Object,
})

const { t } = useI18n()

onMounted(async () => {
  console.log('onMounted() props=', props)
  if (props.userMarkerCoords) {
    userPosition.value = props.userMarkerCoords
  }
  if (props.communityMarkerCoords) {
    communityPosition.value = props.communityMarkerCoords
  }
  console.log('onMounted() userPosition=', userPosition)
  console.log('onMounted() communityPosition=', communityPosition)
  setTimeout(() => initMap(), 250)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (map.value) {
    map.value.remove()
  }
  window.removeEventListener('resize', handleResize)
})

function initMap() {
  console.log('initMap()... mapContainer.value=', mapContainer.value)
  console.log('initMap()... map.value=', map.value)
  if (mapContainer.value && !map.value) {
    map.value = L.map(mapContainer.value, {
      center: [userPosition.value.lat, userPosition.value.lng],
      zoom: defaultZoom,
      zoomControl: false,
      closePopupOnClick: false,
    })
    console.log('initMap() map=', map)

    L.control.zoom({ position: 'topleft' }).addTo(map.value)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map.value)

    // User marker (movable)
    userMarker.value = L.marker([userPosition.value.lat, userPosition.value.lng], {
      draggable: true,
      interactive: false,
      icon: L.icon({
        iconUrl:
          'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    }).addTo(map.value)
    console.log('initMap() userMarker=', userMarker)

    userMarker.value
      .bindPopup(t('settings.GMS.map.userLocationLabel'), {
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
      })
      .openPopup()

    // Community marker (fixed)
    communityMarker.value = L.marker([communityPosition.value.lat, communityPosition.value.lng], {
      draggable: false,
      interactive: false,
      icon: L.icon({
        iconUrl:
          'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      }),
    }).addTo(map.value)
    console.log('initMap() communityMarker=', communityMarker)

    communityMarker.value
      .bindPopup(t('settings.GMS.map.communityLocationLabel'), {
        autoClose: false,
        closeOnClick: false,
        closeButton: false,
      })
      .openPopup()

    map.value.on('click', onMapClick)
    userMarker.value.on('dragend', onMarkerDragEnd)

    // GeoSearch control
    const provider = new OpenStreetMapProvider()
    const searchControl = new GeoSearchControl({
      provider: provider,
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
