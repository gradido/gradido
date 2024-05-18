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
  computed: {
    userLocation: function() {
      console.log('UserGMSLocation userLocation...')
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
    communityLocation: function() {
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
  data() {
    return {
      isModalVisible: false,
      uLocation: Array<Number>(2),
      cLocation: Array<Number>(2),
    }
  },
  methods: {
    showModal() {
      console.log('UserGMSLocation showModal')
      this.getUserLocation()
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
    async getUserLocation() {
      console.log('getUserLocation')
      await  this.$apollo
        .query({
          query: userLocationQuery,
          fetchPolicy: 'network-only',
        })
        .then((result) => {
          console.log('getUserLocation data=', result.data)
          // this.toastError('getUserLocation:',result.data)
          const cLla = Number.parseFloat(result.data.userLocation.communityLocation.latitude)
          const cLlo = Number.parseFloat(result.data.userLocation.communityLocation.longitude)
          if(cLla && cLlo) {
            this.cLocation.push(cLla)
            this.clocation.push(cLlo)
          } else {
            this.cLocation = CONFIG.COMMUNITY_LOCATION.split(',').map(Number) // [49.280377, 9.690151]
          }
          const uLla = Number.parseFloat(result.data.userLocation.userLocation.latitude)
          const uLlo = Number.parseFloat(result.data.userLocation.userLocation.longitude)
          if(uLla && uLlo) {
            this.uLocation.push(uLla)
            this.uLocation.push(uLlo)
          } else {
            this.uLocation = this.cLocation
          }
        })
        .catch(() => {
          console.log('userLocation has no result, use default data')
          this.cLocation = CONFIG.COMMUNITY_LOCATION.split(',').map(Number)
          this.uLocation = this.cLocation
        })
    },
  },
}
</script>
