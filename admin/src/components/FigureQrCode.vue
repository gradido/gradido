<template>
  <div class="figure-qr-code">
    <div class="qrbox">
      <q-r-canvas v-if="showQr" :options="qrOptions" class="canvas" />
    </div>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import { QRCanvas } from 'qrcanvas-vue'
import { COIN_IMAGE_PATH, qrCodeOptions } from '@/utils/qrCode'

const props = defineProps({
  link: { type: String, required: true },
})

const image = ref(null)
const showQr = ref(false)

const qrOptions = computed(() => qrCodeOptions(props.link, image.value))

const coinImage = new Image()
coinImage.src = COIN_IMAGE_PATH
coinImage.onload = () => {
  image.value = coinImage
  showQr.value = true
}
</script>
<style scoped>
.qrbox {
  padding: 20px;
  background-color: rgb(255 255 255);
}

.canvas {
  width: 90%;
  max-width: 300px;
  padding: 5px;
  background-color: rgb(255 255 255);
}
</style>
