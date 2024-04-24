<template>

  <div style="height: 400px; width: 100%">
    <div style="height: 100px; overflow: auto;">
      <p>{{ $t('userlocationcapturing.currentkoordinates') }} {{ withPopup }} </p>
      <button @click="showMap = !showMap">
        {{ $t('userlocationcapturing.mapswitch') }}
      </button>
      <button @click="fixYourKoord = !fixYourKoord">
        {{ $t('userlocationcapturing.fixkoordswitch') }}
      </button>
    </div>
    <link rel="stylesheet" href="https://unpkg.com/leaflet-geosearch@2.6.0/assets/css/leaflet.css">
    <l-map
      v-if="showMap"
      :zoom="zoom"
      :center="center"
      :options="mapOptions"
      style="height: 80%"
      @update:center="centerUpdate"
      @update:zoom="zoomUpdate"
    >
      <l-tile-layer
        :url="url"
        :attribution="attribution"
      />
      <l-geosearch :options="geosearchOptions"/>
      <l-marker :lat-lng="withPopup">
        <l-tooltip :options="{ permanent: true, interactive: true }">
          <div @click="fixLocation">
            {{ $t('userlocationcapturing.userlocationlabel') }}
            <p v-show="showParagraph">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque
              sed pretium nisl, ut sagittis sapien. Sed vel sollicitudin nisi.
              Donec finibus semper metus id malesuada.
            </p>
          </div>
        </l-tooltip>
      </l-marker>
      <l-marker :lat-lng="withTooltip">
        <l-tooltip :options="{ permanent: true, interactive: true }">
          <div @click="innerClick">
            {{ $t('userlocationcapturing.communitylocationlabel') }}
            <p v-show="showParagraph">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque
              sed pretium nisl, ut sagittis sapien. Sed vel sollicitudin nisi.
              Donec finibus semper metus id malesuada.
            </p>
          </div>
        </l-tooltip>
      </l-marker>
    </l-map>
  </div>
</template>

<script>
import { latLng, Icon } from "leaflet";
import { LMap, LTileLayer, LMarker, LPopup, LTooltip } from "vue2-leaflet";
import { OpenStreetMapProvider } from "leaflet-geosearch";
import LGeosearch from "vue2-leaflet-geosearch";

delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default {
  name: "UserGMSLocationMap",
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LPopup,
    LTooltip,
    LGeosearch
  },
  data() {
    return {
      zoom: 13,
      center: latLng(49.280377, 9.690151),
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution:
        '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      withPopup: latLng(49.280377, 9.690151),
      withTooltip: latLng(49.280377, 9.690151),
      currentZoom: 11.5,
      currentCenter: latLng(49.280377, 9.690151),
      showParagraph: false,
      mapOptions: {
        zoomSnap: 0.5
      },
      showMap: true,
      fixYourKoord: false,
      geosearchOptions: {
          provider: new OpenStreetMapProvider()
      }
    };
  },
  methods: {
    zoomUpdate(zoom) {
      this.currentZoom = zoom;
    },
    centerUpdate(center) {
      this.currentCenter = center;
      if(!this.fixYourKoord) {
        this.withPopup = center;
      }
    },
    showLongText() {
      this.showParagraph = !this.showParagraph;
    },
    innerClick() {
      // alert("Click!");
    },
    fixLocation() {
      this.fixYourKoord = !this.fixYourKoord;
    }
  }
};
</script>
