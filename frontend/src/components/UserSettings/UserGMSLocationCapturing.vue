<script>
import 'leaflet/dist/leaflet.css'
import LocMap from '@/components/UserSettings/UserGMSLocationMap'

/*
const apiKey = 'THpEFO62ipFK9OLk8OOx';
*/
export default {
  name: 'UserGMSLocationCapturing',
  data() {
    return {}
  },
  components: { LocMap },
  methods: {
    close() {
      this.$emit('close')
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
          <loc-map></loc-map>
          <b-row class="my-5">
            <b-col cols="12">
              <div class="text-lg-right">
                <b-button variant="gradido" @click="close">
                  {{ $t('userlocationcapturing.button') }}
                </b-button>
              </div>
            </b-col>
          </b-row>
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
