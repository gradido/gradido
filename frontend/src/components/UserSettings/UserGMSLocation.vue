<template>
  <div class="mt-3 mb-5">
    <b-button @click="showModal">{{ $t('settings.GMS.location.button') }}</b-button>
    <modal
      v-show="isModalVisible"
      @close="closeModal"
      @before-open="beforeOpen"
      @before-close="beforeClose"
    />
  </div>
</template>
<script>
import modal from '@/components/UserSettings/UserGMSLocationCapturing'

export default {
  name: 'UserGMSLocation',
  components: {
    modal,
  },
  /*
  created: async function () {
    // eslint-disable-next-line
    console.log('UserGMSLocation created...')
    await this.$apollo
      .query({
        query: userLocationQuery,
        fetchPolicy: 'network-only',
      })
      .then((result) => {
        // eslint-disable-next-line
        console.log('UserGMSLocation created... getUserLocation data=', result.data)
        // this.toastError('getUserLocation:',result.data)
        const cLla = Number.parseFloat(result.data.userLocation.communityLocation.latitude)
        // eslint-disable-next-line
        console.log('UserGMSLocation created... cLla=', cLla)
        const cLlo = Number.parseFloat(result.data.userLocation.communityLocation.longitude)
        // eslint-disable-next-line
        console.log('UserGMSLocation created... cLlo=', cLlo, this.communityLocation)
        // this.cLocation = new Array<Number>(2)
        // eslint-disable-next-line
        console.log('UserGMSLocation created... communityLocation=', this.communityLocation)
        if (cLla && cLlo) {
          this.communityLocation = { cLla, cLlo }
          // eslint-disable-next-line
          console.log('UserGMSLocation created... set communityLocation=', this.communityLocation)
        } else {
          this.communityLocation = CONFIG.COMMUNITY_LOCATION.split(',').map(Number) // [49.280377, 9.690151]
          // eslint-disable-next-line
          console.log('UserGMSLocation created... set communityLocation from CONFIG: cLocation=', this.communityLocation)
        }
        const uLla = Number.parseFloat(result.data.userLocation.userLocation.latitude)
        // eslint-disable-next-line
        console.log('UserGMSLocation created... uLla=', uLla)
        const uLlo = Number.parseFloat(result.data.userLocation.userLocation.longitude)
        // eslint-disable-next-line
        console.log('UserGMSLocation created... uLlo=', uLlo)
        // this.uLocation = new Array<Number>(2)
        if (uLla && uLlo) {
          this.userLocation = { uLla, uLlo }
          // eslint-disable-next-line
          console.log('UserGMSLocation created... set userLocation=', this.userLocation)
        } else {
          this.userLocation = this.communityLocation
          // eslint-disable-next-line
          console.log('UserGMSLocation created... set uLocation from cLocation: userLocation=', this.userLocation)
        }
      })
      .catch(() => {
        // eslint-disable-next-line
        console.log('UserGMSLocation created... userLocation has no result, use default data')
        this.communityLocation = CONFIG.COMMUNITY_LOCATION.split(',').map(Number)
        this.userLocation = this.communityLocation
      })
  },
  */
  /*
  computed: {
    locations: function() {
      // eslint-disable-next-line
      console.log('UserGMSLocation locations...')
      if (this.uLocation) {
        // eslint-disable-next-line
        console.log('UserGMSLocation uLocation=', this.uLocation)
        return this.uLocation
      } else {
        // eslint-disable-next-line
        console.log('UserGMSLocation config LOCATION=', CONFIG.COMMUNITY_LOCATION)
        const split = CONFIG.COMMUNITY_LOCATION.split(',')
        // eslint-disable-next-line
        console.log('split=', split)
        const splitNumbers = CONFIG.COMMUNITY_LOCATION.split(',').map(Number)
        // eslint-disable-next-line
        console.log('splitNumbers=', splitNumbers)
        return CONFIG.COMMUNITY_LOCATION.split(',').map(Number) // [49.280377, 9.690151]
      }
    },
    cLocation: function() {
      // eslint-disable-next-line
      console.log('UserGMSLocation communityLocation...')
      if (this.cLocation) {
        // eslint-disable-next-line
        console.log('UserGMSLocation cLocation=', this.cLocation)
        return this.cLocation
      } else {
        // eslint-disable-next-line
        console.log('UserGMSLocation config LOCATION=', CONFIG.COMMUNITY_LOCATION.split(',').map(Number))
        return CONFIG.COMMUNITY_LOCATION.split(',').map(Number) // [49.280377, 9.690151]
      }
    },
  },
  */
  data() {
    return {
      isModalVisible: false,
      userLocation: Array,
      communityLocation: Array,
    }
  },
  methods: {
    showModal() {
      // eslint-disable-next-line
      console.log('UserGMSLocation showModal')
      this.isModalVisible = true
    },
    closeModal() {
      // eslint-disable-next-line
      console.log('UserGMSLocation closeModal')
      this.isModalVisible = false
    },
    beforeOpen(event) {
      // eslint-disable-next-line
      console.log('UserGMSLocation beforeOpen')
      this.modal.data = event.params
    },
    beforeClose() {
      // eslint-disable-next-line
      console.log('UserGMSLocation beforeClose')
      this.$emit(this.modal.data)
    },
    /*
    async getUserLocation() {
      // eslint-disable-next-line
      console.log('UserGMSLocation getUserLocation...')
      await this.$apollo
        .query({
          query: userLocationQuery,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          // eslint-disable-next-line
          console.log('getUserLocation data=', result.data)
          // this.toastError('getUserLocation:',result.data)
          const cLla = Number.parseFloat(result.data.userLocation.communityLocation.latitude)
          // eslint-disable-next-line
          console.log('cLla=', cLla)
          const cLlo = Number.parseFloat(result.data.userLocation.communityLocation.longitude)
          // eslint-disable-next-line
          console.log('cLlo=', cLlo, this.communityLocation)
          // this.cLocation = new Array<Number>(2)
          // eslint-disable-next-line
          console.log('communityLocation=', this.communityLocation)
          if (cLla && cLlo) {
            this.communityLocation = { cLla, cLlo }
            // eslint-disable-next-line
            console.log('set communityLocation=', this.communityLocation)
          } else {
            this.communityLocation = CONFIG.COMMUNITY_LOCATION.split(',').map(Number) // [49.280377, 9.690151]
            // eslint-disable-next-line
            console.log('set communityLocation from CONFIG: cLocation=', this.communityLocation)
          }
          const uLla = Number.parseFloat(result.data.userLocation.userLocation.latitude)
          // eslint-disable-next-line
          console.log('uLla=', uLla)
          const uLlo = Number.parseFloat(result.data.userLocation.userLocation.longitude)
          // eslint-disable-next-line
          console.log('uLlo=', uLlo)
          // this.uLocation = new Array<Number>(2)
          if (uLla && uLlo) {
            this.userLocation = { uLla, uLlo }
            // eslint-disable-next-line
            console.log('set userLocation=', this.userLocation)
          } else {
            this.userLocation = this.communityLocation
            // eslint-disable-next-line
            console.log('set uLocation from cLocation: userLocation=', this.userLocation)
          }
        })
        .catch(() => {
          // eslint-disable-next-line
          console.log('userLocation has no result, use default data')
          this.communityLocation = CONFIG.COMMUNITY_LOCATION.split(',').map(Number)
          this.userLocation = this.communityLocation
        })
    },
    */
  },
}
</script>
