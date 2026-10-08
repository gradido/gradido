<template>
  <div class="figure-qr-code">
    <div class="qrbox">
      <div>
        <q-r-canvas id="qrcanvas" ref="canvas" :options="options" class="canvas mb-3" />
      </div>
      <a
        id="download"
        ref="download"
        download="GradidoLinkQRCode.png"
        href=""
        @click="downloadImg()"
      >
        {{ $t('download') }}
      </a>
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

const canvas = ref(null)
const download = ref(null)
const image = ref(null)

const options = computed(() => qrCodeOptions(props.link, image.value))

const coinImage = new Image()
coinImage.src = COIN_IMAGE_PATH
coinImage.onload = () => {
  image.value = coinImage
}

const downloadImg = () => {
  download.value.href = canvas.value.$el.toDataURL('image/png')
}
</script>

<style scoped>
.qrbox {
  padding: 20px;
  background-color: #fff;
}

.canvas {
  width: 90%;
  max-width: 300px;
}
</style>
