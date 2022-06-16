<template>
  <div class="figure-qr-code">
    <div class="qrbox">
      <q-r-canvas :options="options" class="canvas" />
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
      options: {
        cellSize: 8,
        correctLevel: 'H',
        data: this.link,
        logo: {
          image: null,
        },
      },
    }
  },
  created() {
    const image = new Image()
    image.src = 'img/gdd-coin.png'
    image.onload = () => {
      this.options = {
        ...this.options,
        logo: {
          image,
        },
      }
    }
  },
}
</script>
<style scoped>
.qrbox {
  padding: 20px;
  background-color: rgb(255, 255, 255);
}
.canvas {
  width: 90%;
  max-width: 300px;
  padding: 5px;
  background-color: rgb(255, 255, 255);
}
</style>
