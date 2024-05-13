<template>
  <div style="height: 400px; width: 100%">
    <div style="height: 100px">
      <b-row class="test-buttons mt-3">
        <b-col cols="12" md="3" lg="3">
          <b-button
            block
            type="reset"
            variant="secondary"
            @click="showMap = !showMap"
            class="mb-3 mb-md-0 mb-lg-0"
          >
            {{ $t('userlocationcapturing.mapswitch') }}
          </b-button>
        </b-col>
        <b-col cols="12" md="5" lg="5">
          <b-button
            block
            type="reset"
            variant="secondary"
            @click="fixYourKoord = !fixYourKoord"
            class="mb-3 mb-md-0 mb-lg-0"
          >
            {{ $t('userlocationcapturing.fixkoordswitch') }}
          </b-button>
        </b-col>
        <b-col cols="12" md="3" lg="3" class="text-lg-left">
          <p>
            {{
              fixYourKoord
                ? $t('userlocationcapturing.fixedkoordinates')
                : $t('userlocationcapturing.currentkoordinates')
            }}
          </p>
          <p>{{ userLocation }}</p>
        </b-col>
      </b-row>
    </div>
    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet-geosearch@2.6.0/assets/css/leaflet.css"
    />
    <l-map
      v-if="showMap"
      :zoom="zoom"
      :center="center"
      :options="mapOptions"
      style="height: 80%"
      @update:center="centerUpdate"
      @update:zoom="zoomUpdate"
    >
      <l-tile-layer :url="url" :attribution="attribution" />
      <l-geosearch :options="geosearchOptions" />
      <l-marker :lat-lng="userLocation">
        <l-tooltip :options="{ permanent: true, interactive: true }">
          <div @click="fixLocation">
            {{ $t('userlocationcapturing.userlocationlabel') }}
          </div>
        </l-tooltip>
      </l-marker>
      <l-marker :lat-lng="comLocation">
        <l-tooltip :options="{ permanent: true }">
          <div>
            {{ $t('userlocationcapturing.communitylocationlabel') }}
          </div>
        </l-tooltip>
      </l-marker>
    </l-map>
  </div>
</template>

<script>
import CONFIG from '@/config'
import { latLng, Icon } from 'leaflet'
import { LMap, LTileLayer, LMarker, LTooltip } from 'vue2-leaflet'
import { OpenStreetMapProvider } from 'leaflet-geosearch'
import LGeosearch from 'vue2-leaflet-geosearch'
import { userLocationQuery } from '@/graphql/queries'

delete Icon.Default.prototype._getIconUrl
Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
})

export default {
  name: 'UserGMSLocationMap',
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LTooltip,
    LGeosearch,
  },
  data() {
    return {
      zoom: 13,
      center: null, // : latLng(49.280377, 9.690151),
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      userLocation: null, // latLng(49.280377, 9.690151),
      comLocation: null, // : latLng(49.280377, 9.690151),
      currentZoom: 11.5,
      currentCenter: null, // : latLng(49.280377, 9.690151),
      showParagraph: false,
      mapOptions: {
        zoomSnap: 0.5,
      },
      showMap: true,
      fixYourKoord: false,
      geosearchOptions: {
        provider: new OpenStreetMapProvider(),
      },
    }
  },
  methods: {
    zoomUpdate(zoom) {
      this.currentZoom = zoom
    },
    centerUpdate(center) {
      this.currentCenter = center
      if (!this.fixYourKoord) {
        this.userLocation = center
      }
    },
    fixLocation() {
      this.fixYourKoord = !this.fixYourKoord
    },
    async onChange() {
      this.fixYourKoord = !this.fixYourKoord
    },
    async getUserLocation() {
      console.log('getUserLocation')
      this.$apollo
        .query({
          query: userLocationQuery,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          console.log('getUserLocation data=', result.data)
          this.userLocation = result.data.userLocation.userLocation
          this.currentCenter = this.userLocation
          this.center = this.userLocation
          this.comLocation = result.data.userLocation.communityLocation
        })
        .catch(() => {
          this.toastError('userLocation has no result, use default data')
          this.comLocation = CONFIG.COMMUNITY_LOCATION
          this.userLocation = this.comLocation
          this.currentCenter = this.comLocation
          this.center = this.comLocation
        })
    },

    beforeCreated() {
      console.log('beforeCreated')
      this.getUserLocation()
    },
    beforeClose(event) {
      console.log('beforeClose:', this.modal.data, event, this.userLocation)
      this.$emit(this.userLocation)
    },
  },
}
</script>
