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
      :center="center"
      :options="mapOptions"
      class="map_div3"
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
  computed: {
    computedUserLocation: {
      get: function () {
        // const a = new Array(this.initialUserLocation)
        // eslint-disable-next-line
        console.log('initialUserLocation als Array=', this.initialUserLocation)
        // eslint-disable-next-line
        console.log('lat=',this.initialUserLocation[0])
        // eslint-disable-next-line
        console.log('lon=',this.initialUserLocation[1])
        if (
          this.initialUserLocation[0] === undefined ||
          this.initialUserLocation[1] === undefined
        ) {
          const splitNumbers = CONFIG.COMMUNITY_LOCATION.split(',').map(Number)
          return latLng(splitNumbers[0], splitNumbers[1])
        } else {
          return latLng(this.initialUserLocation[0], this.initialUserLocation[1]) // (49.280377, 9.690151)
        }
      },
      set: function (newValue) {
        this.userLocation = newValue
      },
    },
    computedComLocation: {
      get: function () {
        // eslint-disable-next-line
        console.log('initialCommunityLocation als Array=', this.initialCommunityLocation)
        // eslint-disable-next-line
        console.log('lat=',this.initialCommunityLocation[0])
        // eslint-disable-next-line
        console.log('lon=',this.initialCommunityLocation[1])
        if (
          this.initialCommunityLocation[0] === undefined ||
          this.initialCommunityLocation[1] === undefined
        ) {
          const splitNumbers = CONFIG.COMMUNITY_LOCATION.split(',').map(Number)
          return latLng(splitNumbers[0], splitNumbers[1])
        } else {
          return latLng(this.initialCommunityLocation[0], this.initialCommunityLocation[1]) // (49.280377, 9.690151)
        }
      },
      set: function (newValue) {
        this.comLocation = newValue
      },
    },
    computedCenter: {
      get: function () {
        return latLng(this.initialUserLocation[0], this.initialUserLocation[1]) // (49.280377, 9.690151)
      },
      set: function (newValue) {
        this.center = newValue
      },
    },
    computedCurrentCenter: {
      get: function () {
        return latLng(this.initialUserLocation[0], this.initialUserLocation[1]) // (49.280377, 9.690151)
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
      userLocation: this.computedUserLocation,
      comLocation: this.computedComLocation,
      center: this.computedUserLocation,
      currentCenter: this.computedUserLocation,
    }
  },
  created: function () {
    // eslint-disable-next-line
    console.log('UserGMSLocationMap created: initialUserLocation=', this.initialUserLocation)
    if (this.initialUserLocation[0] === undefined || this.initialUserLocation[1] === undefined) {
      const splitNumbers = CONFIG.COMMUNITY_LOCATION.split(',').map(Number)
      this.userLocation = latLng(splitNumbers[0], splitNumbers[1])
    } else {
      this.userLocation = latLng(this.initialUserLocation[0], this.initialUserLocation[1]) // (49.280377, 9.690151)
    }
    // eslint-disable-next-line
    console.log('UserGMSLocationMap beforeCreate: initialCommunityLocation=', this.initialCommunityLocation)
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
  /*
  updated: function() {
    // eslint-disable-next-line
    console.log('UserGMSLocationMap updated...')
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
    /*
    beforeCreate() {
      // eslint-disable-next-line
      console.log('UserGMSLocationMap beforeCreated')
      this.userLocation = this.computedUserLocation
      this.comLocation = this.computedComLocation
      this.center = this.computedUserLocation
      this.currentCenter = this.computedUserLocation
    },
    created() {
      // eslint-disable-next-line
      console.log('created')
      this.userLocation = this.computedUserLocation
      this.comLocation = this.computedComLocation
      this.center = this.computedUserLocation
      this.currentCenter = this.computedUserLocation
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
    */
    onChange() {
      this.fixYourKoord = !this.fixYourKoord
    },
  },
}
</script>
