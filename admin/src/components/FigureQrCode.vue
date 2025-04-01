<template>
  <div class="figure-qr-code">
    <div class="qrbox">
      <q-r-canvas v-if="showQr" :options="qrOptions" class="canvas" />
    </div>
  </div>
</template>
<script>
import { QRCanvas } from 'qrcanvas-vue'

export default {
  name: 'FigureQrCode',
  components: {
    QRCanvas,
  },
  props: {
    link: { type: String, required: true },
  },
  data() {
    return {
      image: null,
      showQr: false,
    }
  },
  computed: {
    qrOptions() {
      return {
        cellSize: 8,
        correctLevel: 'H',
        data: this.link,
        logo: { image: this.image },
      }
    },
  },
  created() {
    const image = new Image()
    image.src = '/img/gdd-coin.png'
    image.onload = () => {
      this.image = image
      this.showQr = true
    }
  },
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
