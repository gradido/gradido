<script>
import 'leaflet/dist/leaflet.css'
import LocMap from '@/components/UserSettings/UserGMSLocationMap'
import { updateUserInfos } from '@/graphql/mutations'

/*
const apiKey = 'THpEFO62ipFK9OLk8OOx';
*/
export default {
  name: 'UserGMSLocationCapturing',
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
  computed: {
    computedUserLocation: function() {
      return this.userLocation
    },
    computedCommunityLocation: function() {
      return this.communityLocation
    },
  },
  */
  data() {
    return {
      // userLocation: this.initialUserLocation,
      // communityLocation: this.initialCommunityLocation,
      capturedLocation: undefined,
    }
  },
  created: function () {
    // eslint-disable-next-line
    console.log('UserGMSLocationCapturing created...')
    /*
    // eslint-disable-next-line
    console.log('UserGMSLocationCapturing created... initialUserLocation=', this.initialUserLocation)
    this.userLocation = this.initialUserLocation
    console.log('UserGMSLocationCapturing created... initialCommunityLocation=', this.initialCommunityLocation)
    this.communityLocation = this.initialCommunityLocation
    // eslint-disable-next-line
    console.log('UserGMSLocationCapturing created... userLocation=', this.userLocation)
    // eslint-disable-next-line
    console.log('UserGMSLocationCapturing created... communityLocation=', this.communityLocation)
    */
  },
  components: { LocMap },
  methods: {
    close() {
      this.$emit('close')
    },
    async saveclose() {
      // eslint-disable-next-line
      console.log('UserGMSLocationCapturing saveclose... capturedLocation=', this.capturedLocation)
      // this.saveLocation()
      try {
        const loc = { longitude: this.capturedLocation.lng, laditude: this.capturedLocation.lat }
        // eslint-disable-next-line
        console.log('UserGMSLocationCapturing loc=', loc)
        await this.$apollo.mutate({
          mutation: updateUserInfos,
          variables: {
            gmsLocation: {
              longitude: this.capturedLocation.lng,
              latitude: this.capturedLocation.lat,
            },
          },
        })
        // eslint-disable-next-line
        console.log('UserGMSLocationCapturing updateUserInfos')
        this.toastSuccess(this.$t('userlocationcapturing.success'))
      } catch (error) {
        // eslint-disable-next-line
        console.log('UserGMSLocationCapturing updateUserInfos failed:', error)
        this.toastError(error)
      }

      this.$emit('close')
    },
    /*
    async saveLocation() {
      // eslint-disable-next-line
      console.log('UserGMSLocationCapturing saveLocation als Array=', this.userLocation)
      try {
        await this.$apollo.mutate({
          mutation: updateUserInfos,
          variables: {
            gmsLocation: this.capturedLocation,
          },
        })
        // eslint-disable-next-line
        console.log('UserGMSLocationCapturing updateUserInfos')
        this.toastSuccess(this.$t('userlocationcapturing.success'))
      } catch (error) {
        // eslint-disable-next-line
        console.log('UserGMSLocationCapturing updateUserInfos failed')
        this.toastError(error)
      }
    },
    */
    updateUserLocation(currentUserLocation) {
      // eslint-disable-next-line
      console.log('UserGMSLocationCapturing updateUserLocation:', currentUserLocation, this.userLocation)
      this.capturedLocation = currentUserLocation
    },
  },
}
</script>

<template>
  <transition name="modal-fade">
    <div class="modal-backdrop">
      <div class="modal">
        <b-container class="bg-white appBoxShadow gradido-border-radius p-4 mt--3">
          <button type="button" class="btn-close" @click="close">x</button>
          <div class="h3">{{ $t('userlocationcapturing.headline') }}</div>
          <div class="map-height">
            <loc-map @currentUserLocation="updateUserLocation"></loc-map>
          </div>
          <div class="below-map text-lg-right">
            <b-button variant="gradido" @click="saveclose">
              {{ $t('userlocationcapturing.button') }}
            </b-button>
          </div>
        </b-container>
      </div>
    </div>
  </transition>
</template>

<style>
.modal-backdrop {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.5);
  opacity: 1;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal {
  background: #ffffff;
  box-shadow: 2px 2px 20px 1px;
  overflow-x: auto;
  display: flex;
  flex-direction: column;
}

.map-height {
  height: 520px;
}

.below-map {
  top: 90%;
}

.btn-close {
  position: absolute;
  top: 0;
  right: 0;
  border: none;
  font-size: 20px;
  padding: 10px;
  cursor: pointer;
  font-weight: bold;
  color: #088000;
  background: transparent;
}

.modal-fade-enter,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.5s ease;
}
</style>
