<template>
  <div class="mt-3 mb-5">
    <b-button @click="showModal">{{ $t('settings.GMS.location.button') }}</b-button>
    <modal
      v-bind:initial-user-location="this.userLocation"
      v-bind:initial-community-location="this.communityLocation"
      v-show="isModalVisible"
      @close="closeModal"
      @before-open="beforeOpen"
      @before-close="beforeClose"
    />
  </div>
</template>
<script>
import modal from '@/components/UserSettings/UserGMSLocationCapturing'
import { userLocationQuery } from '@/graphql/queries'
import CONFIG from '@/config'

export default {
  name: 'UserGMSLocation',
  components: {
    modal,
  },
  created: async function() {
    console.log('UserGMSLocation created...')
    await this.$apollo
      .query({
        query: userLocationQuery,
        fetchPolicy: 'network-only',
      })
      .then((result) => {
        console.log('getUserLocation data=', result.data)
        // this.toastError('getUserLocation:',result.data)
        const cLla = Number.parseFloat(result.data.userLocation.communityLocation.latitude)
        console.log('cLla=', cLla)
        const cLlo = Number.parseFloat(result.data.userLocation.communityLocation.longitude)
        console.log('cLlo=', cLlo, this.communityLocation)
        // this.cLocation = new Array<Number>(2)
        console.log('communityLocation=', this.communityLocation)
        if(cLla && cLlo) {
          this.communityLocation = { cLla, cLlo }
          console.log('set communityLocation=', this.communityLocation)
        } else {
          this.communityLocation = CONFIG.COMMUNITY_LOCATION.split(',').map(Number) // [49.280377, 9.690151]
          console.log('set communityLocation from CONFIG: cLocation=', this.communityLocation)
        }
        const uLla = Number.parseFloat(result.data.userLocation.userLocation.latitude)
        console.log('uLla=', uLla)
        const uLlo = Number.parseFloat(result.data.userLocation.userLocation.longitude)
        console.log('uLlo=', uLlo)
        // this.uLocation = new Array<Number>(2)
        if(uLla && uLlo) {
          this.userLocation = { uLla, uLlo }
          console.log('set userLocation=', this.userLocation)
        } else {
          this.userLocation = this.communityLocation
          console.log('set uLocation from cLocation: userLocation=', this.userLocation)
        }
      })
      .catch(() => {
        console.log('userLocation has no result, use default data')
        this.communityLocation = CONFIG.COMMUNITY_LOCATION.split(',').map(Number)
        this.userLocation = this.communityLocation
      })
  },
  /*
  computed: {
    locations: function() {
      console.log('UserGMSLocation locations...')
      if (this.uLocation) {
        console.log('UserGMSLocation uLocation=', this.uLocation)
        return this.uLocation
      } else {
        console.log('UserGMSLocation config LOCATION=', CONFIG.COMMUNITY_LOCATION)
        const split = CONFIG.COMMUNITY_LOCATION.split(',')
        console.log('split=', split)
        const splitNumbers = CONFIG.COMMUNITY_LOCATION.split(',').map(Number)
        console.log('splitNumbers=', splitNumbers)
        return CONFIG.COMMUNITY_LOCATION.split(',').map(Number) // [49.280377, 9.690151]
      }
    },
    cLocation: function() {
      console.log('UserGMSLocation communityLocation...')
      if (this.cLocation) {
        console.log('UserGMSLocation cLocation=', this.cLocation)
        return this.cLocation
      } else {
        console.log('UserGMSLocation config LOCATION=', CONFIG.COMMUNITY_LOCATION.split(',').map(Number))
        return CONFIG.COMMUNITY_LOCATION.split(',').map(Number) // [49.280377, 9.690151]
      }
    },
  },
  */
  data() {
    return {
      isModalVisible: false,
      userLocation: Array<Number>(2),
      communityLocation: Array<Number>(2),
    }
  },
  methods: {
    showModal() {
      console.log('UserGMSLocation showModal')
      this.isModalVisible = true
    },
    closeModal() {
      console.log('UserGMSLocation closeModal')
      this.isModalVisible = false
    },
    beforeOpen(event) {
      console.log('UserGMSLocation beforeOpen')
      this.modal.data = event.params
    },
    beforeClose() {
      console.log('UserGMSLocation beforeClose')
      this.$emit(this.modal.data)
    },
    created() {
      console.log('UserGMSLocation created...')
      this.getUserLocation()
    },
    async getUserLocation() {
      console.log('UserGMSLocation getUserLocation')
      await this.$apollo
        .query({
          query: userLocationQuery,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          console.log('getUserLocation data=', result.data)
          // this.toastError('getUserLocation:',result.data)
          const cLla = Number.parseFloat(result.data.userLocation.communityLocation.latitude)
          console.log('cLla=', cLla)
          const cLlo = Number.parseFloat(result.data.userLocation.communityLocation.longitude)
          console.log('cLlo=', cLlo, this.communityLocation)
          // this.cLocation = new Array<Number>(2)
          console.log('communityLocation=', this.communityLocation)
          if(cLla && cLlo) {
            this.communityLocation = { cLla, cLlo }
            console.log('set communityLocation=', this.communityLocation)
          } else {
            this.communityLocation = CONFIG.COMMUNITY_LOCATION.split(',').map(Number) // [49.280377, 9.690151]
            console.log('set communityLocation from CONFIG: cLocation=', this.communityLocation)
          }
          const uLla = Number.parseFloat(result.data.userLocation.userLocation.latitude)
          console.log('uLla=', uLla)
          const uLlo = Number.parseFloat(result.data.userLocation.userLocation.longitude)
          console.log('uLlo=', uLlo)
          // this.uLocation = new Array<Number>(2)
          if(uLla && uLlo) {
            this.userLocation = { uLla, uLlo }
            console.log('set userLocation=', this.userLocation)
          } else {
            this.userLocation = this.communityLocation
            console.log('set uLocation from cLocation: userLocation=', this.userLocation)
          }
        })
        .catch(() => {
          console.log('userLocation has no result, use default data')
          this.communityLocation = CONFIG.COMMUNITY_LOCATION.split(',').map(Number)
          this.userLocation = this.communityLocation
        })
    },
  },
}
</script>
