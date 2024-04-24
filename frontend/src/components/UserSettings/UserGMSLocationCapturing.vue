<script>
// import { L } from 'leaflet'
// import { GeocodingControl } from "@maptiler/geocoding-control/leaflet";
// import "@maptiler/geocoding-control/style.css";
import LocMap from './UserGMSLocationMap.vue'

/*
const apiKey = 'THpEFO62ipFK9OLk8OOx';

const map = L.map(document.getElementById("map")).fitBounds([[-65, -160], [65, 160]]);

const scale = devicePixelRatio > 1.5 ? "@2x" : "";
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
    /*
    onMounted() {
      // const key = 'THpEFO62ipFK9OLk8OOx'
      const map = L.map('map').setView([49.280377, 9.690151], 14) // starting position
      L.tileLayer(`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${apiKey}`, {
        // style URL
        tileSize: 512,
        zoomOffset: -1,
        minZoom: 1,
        attribution:
          '\u003ca href="https://www.maptiler.com/copyright/" target="_blank"\u003e\u0026copy; MapTiler\u003c/a\u003e \u003ca href="https://www.openstreetmap.org/copyright" target="_blank"\u003e\u0026copy; OpenStreetMap contributors\u003c/a\u003e',
        crossOrigin: true,
      }).addTo(map)
      L.control.maptilerGeocoding({ apiKey }).addTo(map)
    },
    */
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
          <div class="my-4 text-small">
            <!-- html-import></html-import -->
            <loc-map></loc-map>
          </div>
          <b-row class="my-5">
            <b-col cols="12">
              <div class="text-lg-right">
                <!-- button type="button" class="btn-green" @click="close">Close Modal</button -->
                <b-button variant="gradido" @click="close">
                  {{ $t('userlocationcapturing.button') }}
                </b-button>
              </div>
            </b-col>
          </b-row>
        </b-container>

        <!-- footer class="modal-footer">
          <slot name="footer">This is the default footer!</slot>
          <button type="button" class="btn-green" @click="close">Close Modal</button>
        </footer -->
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

.modal-header,
.modal-footer {
  padding: 15px;
  display: flex;
}

.modal-header {
  position: relative;
  border-bottom: 1px solid #eeeeee;
  color: #088000;
  justify-content: space-between;
}

.modal-footer {
  border-top: 1px solid #eeeeee;
  flex-direction: column;
  justify-content: flex-end;
}

.modal-body {
  position: relative;
  padding: 20px 10px;
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

.btn-green {
  color: white;
  background: #088000;
  border: 1px solid #4aae9b;
  border-radius: 2px;
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
