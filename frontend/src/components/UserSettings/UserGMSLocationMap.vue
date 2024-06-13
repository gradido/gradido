<template>
  <div class="map_div1">
    <div class="map_div2">
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
      :center="computedCenter"
      :options="mapOptions"
      class="map_div3"
      @update:center="centerUpdate"
      @update:zoom="zoomUpdate"
    >
      <l-tile-layer :url="url" :attribution="attribution" />
      <l-geosearch :options="geosearchOptions" />
      <l-marker :lat-lng="computedUserLocation">
        <l-tooltip :options="{ permanent: true, interactive: true }">
          <div @click="fixLocation">
            {{ $t('userlocationcapturing.userlocationlabel') }}
          </div>
        </l-tooltip>
      </l-marker>
      <l-marker :lat-lng="computedComLocation">
        <l-tooltip :options="{ permanent: true }">
          <div>
            {{ $t('userlocationcapturing.communitylocationlabel') }}
          </div>
        </l-tooltip>
      </l-marker>
    </l-map>
  </div>
</template>
<style>
.map_div1 {
  height: 400px;
  width: 100%;
}
.map_div2 {
  height: 100px;
}
.map_div3 {
  height: 80%;
}
</style>
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
  computed: {
    computedUserLocation: {
      get: function () {
        // eslint-disable-next-line
        console.log('UserGMSLocationMap computedUserLocation use userLocation=', this.userLocation)
        return latLng(this.userLocation[0], this.userLocation[1]) // (49.280377, 9.690151)
        // return this.userLocation
      },
      set: function (newValue) {
        this.userLocation = newValue
      },
    },
    computedComLocation: {
      get: function () {
        // eslint-disable-next-line
        console.log('UserGMSLocationMap computedCommunityLocation use comLocation=', this.comLocation)
        return latLng(this.comLocation[0], this.comLocation[1]) // (49.280377, 9.690151)
        // return this.comLocation
      },
      set: function (newValue) {
        this.comLocation = newValue
      },
    },
    computedCenter: {
      get: function () {
        return latLng(this.userLocation[0], this.userLocation[1]) // (49.280377, 9.690151)
        // return this.center
      },
      set: function (newValue) {
        this.center = newValue
      },
    },
    computedCurrentCenter: {
      get: function () {
        return latLng(this.userLocation[0], this.userLocation[1]) // (49.280377, 9.690151)
        // return this.currentCenter
      },
      set: function (newValue) {
        this.currentCenter = newValue
      },
    },
  },
  data: function () {
    return {
      zoom: 13,
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
      currentZoom: 11.5,
      showParagraph: false,
      mapOptions: {
        zoomSnap: 0.5,
      },
      showMap: true,
      fixYourKoord: false,
      geosearchOptions: {
        provider: new OpenStreetMapProvider(),
      },
      // splitNumbers: CONFIG.COMMUNITY_LOCATION.split(',').map(Number), 
      userLocation: latLng(49.280377, 9.690151),
      comLocation: latLng(49.280377, 9.690151),
      center: latLng(49.280377, 9.690151),
      currentCenter: latLng(49.280377, 9.690151),
    }
  },
  created: async function () {
    // eslint-disable-next-line
    console.log('UserGMSLocationMap created...')
    await this.$apollo
      .query({
        query: userLocationQuery,
        fetchPolicy: 'network-only',
      })
      .then((result) => {
        // eslint-disable-next-line
        console.log('UserGMSLocationMap created... getUserLocation data=', result.data)
        // this.toastError('getUserLocation:',result.data)
        const cLla = Number.parseFloat(result.data.userLocation.communityLocation.latitude)
        // eslint-disable-next-line
        console.log('UserGMSLocationMap created... cLla=', cLla)
        const cLlo = Number.parseFloat(result.data.userLocation.communityLocation.longitude)
        // eslint-disable-next-line
        console.log('UserGMSLocationMap created... cLlo=', cLlo)
        if (cLla && cLlo) {
          this.comLocation = latLng(cLla, cLlo)
          // eslint-disable-next-line
          console.log('UserGMSLocationMap created... set comLocation=', this.comLocation)
        } else {
          const map = CONFIG.COMMUNITY_LOCATION.split(',').map(Number) // [49.280377, 9.690151]
          this.comLocation = latLng(map[0], map[1])
          // eslint-disable-next-line
          console.log('UserGMSLocationMap created... set comLocation from CONFIG: comLocation=', this.comLocation)
        }
        const uLla = Number.parseFloat(result.data.userLocation.userLocation.latitude)
        // eslint-disable-next-line
        console.log('UserGMSLocationMap created... uLla=', uLla)
        const uLlo = Number.parseFloat(result.data.userLocation.userLocation.longitude)
        // eslint-disable-next-line
        console.log('UserGMSLocationMap created... uLlo=', uLlo)
        if (uLla && uLlo) {
          this.userLocation = latLng(uLla, uLlo)
          // eslint-disable-next-line
          console.log('UserGMSLocationMap created... set userLocation=', this.userLocation)
        } else {
          this.userLocation = latLng(this.comLocation.latitude, this.comLocation.longitude)
          // eslint-disable-next-line
          console.log('UserGMSLocationMap created... set userLocation from comLocation: userLocation=', this.userLocation)
        }
      })
      .catch(() => {
        // eslint-disable-next-line
        console.log('UserGMSLocationMap created... userLocation has no result, use default data')
        const map = CONFIG.COMMUNITY_LOCATION.split(',').map(Number) // [49.280377, 9.690151]
        this.comLocation = latLng(map[0], map[1])
        this.userLocation = latLng(map[0], map[1])
      })
    this.center = latLng(this.userLocation.latitude, this.userLocation.longitude)
    this.currentCenter = latLng(this.userLocation.latitude, this.userLocation.longitude)
  },
  beforeClose: function (event) {
    // eslint-disable-next-line
    console.log('UserGMSLocationMap beforeClose:', this.modal.data, event, this.userLocation)
    this.$emit(this.userLocation)
  },

  methods: {
    zoomUpdate(zoom) {
      // eslint-disable-next-line
      console.log('UserGMSLocationMap zoomUpdate')
      this.currentZoom = zoom
    },
    centerUpdate(center) {
      // eslint-disable-next-line
      console.log('UserGMSLocationMap centerUpdate', center)
      this.center = center
      this.currentCenter = center
      if (!this.fixYourKoord) {
        this.userLocation = center
      }
      // eslint-disable-next-line
      console.log('currentCenter=', this.currentCenter)
      // eslint-disable-next-line
      console.log('userLocation=', this.userLocation)
      this.$emit('currentUserLocation', this.userLocation)
    },
    fixLocation() {
      this.fixYourKoord = !this.fixYourKoord
    },
    mounted() {
      // eslint-disable-next-line
      console.log('mounted')
      this.userLocation = this.computedUserLocation
      this.comLocation = this.computedComLocation
      this.center = this.computedUserLocation
      this.currentCenter = this.computedUserLocation
    },
    beforeClose(event) {
      // eslint-disable-next-line
      console.log('beforeClose:', this.modal.data, event, this.userLocation)
      this.$emit(this.userLocation)
    },
    onChange() {
      this.fixYourKoord = !this.fixYourKoord
    },
  },
}
</script>
