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
      :zoom="this.zoom"
      :center="this.center"
      :options="mapOptions"
      class="map_div3"
      @update:center="centerUpdate"
      @update:zoom="zoomUpdate"
    >
      <l-tile-layer :url="url" :attribution="attribution" />
      <l-geosearch :options="geosearchOptions" />
      <l-marker :lat-lng="this.userLocation">
        <l-tooltip :options="{ permanent: true, interactive: true }">
          <div @click="fixLocation">
            {{ $t('userlocationcapturing.userlocationlabel') }}
          </div>
        </l-tooltip>
      </l-marker>
      <l-marker :lat-lng="this.comLocation">
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
  /*
  props: {
    initialUserLocation: {
      type: Array,
      required: true,
    },
    initialCommunityLocation: {
      type: Array,
      required: true,
    },
  },
  */
  computed: {
    computedUserLocation: {
      get: function () {
        // const a = new Array(this.initialUserLocation)
        // eslint-disable-next-line
        console.log('UserGMSLocationMap userLocation als Array=', this.userLocation)
        // eslint-disable-next-line
        console.log('UserGMSLocationMap computedUserLocation lat=',this.userLocation[0])
        // eslint-disable-next-line
        console.log('UserGMSLocationMap computedUserLocation lon=',this.userLocation[1])
        if (
          this.userLocation[0] === undefined ||
          this.userLocation[1] === undefined
        ) {
          const splitNumbers = CONFIG.COMMUNITY_LOCATION.split(',').map(Number)
          return latLng(splitNumbers[0], splitNumbers[1])
        } else {
          return latLng(this.userLocation[0], this.userLocation[1]) // (49.280377, 9.690151)
        }
      },
      set: function (newValue) {
        this.userLocation = newValue
      },
    },
    computedComLocation: {
      get: function () {
        // eslint-disable-next-line
        console.log('UserGMSLocationMap computedCommunityLocation als Array=', this.comLocation)
        // eslint-disable-next-line
        console.log('UserGMSLocationMap comLocation lat=',this.comLocation[0])
        // eslint-disable-next-line
        console.log('computedComLocation lon=',this.comLocation[1])
        if (
          this.comLocation[0] === undefined ||
          this.comLocation[1] === undefined
        ) {
          const splitNumbers = CONFIG.COMMUNITY_LOCATION.split(',').map(Number)
          return latLng(splitNumbers[0], splitNumbers[1])
        } else {
          return latLng(this.comLocation[0], this.comLocation[1]) // (49.280377, 9.690151)
        }
      },
      set: function (newValue) {
        this.comLocation = newValue
      },
    },
    computedCenter: {
      get: function () {
        return latLng(this.userLocation[0], this.userLocation[1]) // (49.280377, 9.690151)
      },
      set: function (newValue) {
        this.center = newValue
      },
    },
    computedCurrentCenter: {
      get: function () {
        return latLng(this.userLocation[0], this.userLocation[1]) // (49.280377, 9.690151)
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
      splitNumbers: CONFIG.COMMUNITY_LOCATION.split(',').map(Number),
      userLocation: latLng(splitNumbers[0], splitNumbers[1]),
      comLocation: latLng(splitNumbers[0], splitNumbers[1]),
      center: latLng(splitNumbers[0], splitNumbers[1]),
      currentCenter: latLng(splitNumbers[0], splitNumbers[1]),
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
        // this.cLocation = new Array<Number>(2)
        // eslint-disable-next-line
        console.log('UserGMSLocationMap created... comLocation=', this.comLocation)
        if (cLla && cLlo) {
          this.comLocation = { cLla, cLlo }
          // eslint-disable-next-line
          console.log('UserGMSLocationMap created... set comLocation=', this.comLocation)
        } else {
          this.comLocation = CONFIG.COMMUNITY_LOCATION.split(',').map(Number) // [49.280377, 9.690151]
          // eslint-disable-next-line
          console.log('UserGMSLocationMap created... set comLocation from CONFIG: comLocation=', this.comLocation)
        }
        const uLla = Number.parseFloat(result.data.userLocation.userLocation.latitude)
        // eslint-disable-next-line
        console.log('UserGMSLocationMap created... uLla=', uLla)
        const uLlo = Number.parseFloat(result.data.userLocation.userLocation.longitude)
        // eslint-disable-next-line
        console.log('UserGMSLocationMap created... uLlo=', uLlo)
        // this.uLocation = new Array<Number>(2)
        if (uLla && uLlo) {
          this.userLocation = { uLla, uLlo }
          // eslint-disable-next-line
          console.log('UserGMSLocationMap created... set userLocation=', this.userLocation)
        } else {
          this.userLocation = this.comLocation
          // eslint-disable-next-line
          console.log('UserGMSLocationMap created... set userLocation from comLocation: userLocation=', this.userLocation)
        }
      })
      .catch(() => {
        // eslint-disable-next-line
        console.log('UserGMSLocationMap created... userLocation has no result, use default data')
        this.comLocation = CONFIG.COMMUNITY_LOCATION.split(',').map(Number)
        this.userLocation = this.comLocation
      })
  },
  /*
  created: function () {
    // eslint-disable-next-line
    console.log('UserGMSLocationMap created... initialUserLocation=', this.initialUserLocation)
    if (this.initialUserLocation[0] === undefined || this.initialUserLocation[1] === undefined) {
      const splitNumbers = CONFIG.COMMUNITY_LOCATION.split(',').map(Number)
      this.userLocation = latLng(splitNumbers[0], splitNumbers[1])
    } else {
      this.userLocation = latLng(this.initialUserLocation[0], this.initialUserLocation[1]) // (49.280377, 9.690151)
    }
    // eslint-disable-next-line
    console.log('UserGMSLocationMap created... initialCommunityLocation=', this.initialCommunityLocation)
    if (
      this.initialCommunityLocation[0] === undefined ||
      this.initialCommunityLocation[1] === undefined
    ) {
      const splitNumbers = CONFIG.COMMUNITY_LOCATION.split(',').map(Number)
      this.comLocation = latLng(splitNumbers[0], splitNumbers[1])
    } else {
      this.comLocation = latLng(this.initialCommunityLocation[0], this.initialCommunityLocation[1]) // (49.280377, 9.690151)
    }
    this.center = this.userLocation
    this.currentCenter = this.userLocation
  },
  */
  /*
  beforeMount: function() {
    // eslint-disable-next-line
    console.log('UserGMSLocationMap beforeMount...')
    this.userLocation = latLng(this.initialUserLocation[0], this.initialUserLocation[1]) // this.computedUserLocation
    this.comLocation = latLng(this.initialCommunityLocation[0], this.initialCommunityLocation[1]) // this.computedComLocation
    this.center = latLng(this.initialUserLocation[0], this.initialUserLocation[1]) // this.computedUserLocation
    this.currentCenter = latLng(this.initialUserLocation[0], this.initialUserLocation[1]) // this.computedUserLocation
  },
  */
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
    onChange() {
      this.fixYourKoord = !this.fixYourKoord
    },
  },
}
</script>
