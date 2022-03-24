<template>
  <div class="figure-qr-code">
    <figure class="qrcode">
      <vue-qrcode :value="text" type="image/png" class="qrbox"></vue-qrcode>
      <img class="qrcode__image" src="img/gdd-coin.png" alt="GDD" />
    </figure>
  </div>
</template>
<script>
import VueQrcode from 'vue-qrcode'

export default {
  name: 'FigureQrCode',
  components: {
    VueQrcode,
  },
  props: {
    text: { type: String, required: true },
  },
}
</script>
<style scoped>
.qrcode {
  display: inline-block;
  font-size: 0;
  margin-bottom: 0;
  position: relative;
}
.qrbox {
  width: 400px;
}
.qrcode__image {
  background-color: #fff;
  border: 0.25rem solid #fff;
  border-radius: 0.25rem;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.25);
  height: 15%;
  left: 50%;
  overflow: hidden;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 15%;
}
</style>
