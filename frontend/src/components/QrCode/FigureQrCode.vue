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
        @click="downloadImg(this)"
      >
        {{ $t('download') }}
      </a>
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
  methods: {
    downloadImg() {
      const canvas = this.$refs.canvas.$el
      const image = canvas.toDataURL('image/png')
      this.$refs.download.href = image
    },
  },
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
