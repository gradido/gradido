<template>
  <div>
    <div class="h3">{{ $t('usersearch.mapheadline') }}</div>
    <l-map class="map-style" :center="center">
      <l-tile-layer :url="url" :attribution="attribution"></l-tile-layer>
      <l-marker :lat-lng="markerLatLng"></l-marker>
    </l-map>
  </div>
</template>

<script>
import { LMap, LTileLayer, LMarker } from 'vue2-leaflet'

export default {
  components: {
    LMap,
    LTileLayer,
    LMarker,
  },
  data() {
    return {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a target="_blank" href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      zoom: 15,
      center: [49.280377, 9.690151],
      markerLatLng: [49.280377, 9.690151],
    }
  },
}
</script>
<style>
.map-style {
  height: 300px;
  width: 600px;
  zoom: 'zoom';
}
</style>