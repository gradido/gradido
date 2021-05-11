<template>
  <b-alert show variant="secondary">
    <span class="alert-text" v-html="$t('form.scann_code')"></span>
    <b-col v-show="!scan" lg="12" class="text-right">
      <a @click="toggle" class="nav-link pointer">
        <img src="img/icons/gradido/qr-scan-pure.png" height="50" />
      </a>
    </b-col>

    <div v-if="scan">
      <b-row>
        <qrcode-capture @detect="onDetect" capture="user"></qrcode-capture>
      </b-row>

      <qrcode-stream class="mt-3" @decode="onDecode" @detect="onDetect"></qrcode-stream>

      <b-container>
        <b-row>
          <b-col lg="8">
            <b-alert show variant="secondary">
              <span class="alert-text" v-html="$t('form.scann_code')"></span>
            </b-alert>
          </b-col>
        </b-row>
      </b-container>
    </div>
    <div @click="toggle">
      <b-alert v-show="scan" show variant="primary" class="pointer text-center">
        <span class="alert-text">
          <strong>{{ $t('form.cancel') }}</strong>
        </span>
      </b-alert>
    </div>
  </b-alert>
</template>
<script>
import { QrcodeStream } from 'vue-qrcode-reader'

export default {
  name: 'QrCode',
  components: {
    QrcodeStream,
  },
  data() {
    return {
      scan: false,
    }
  },
  methods: {
    toggle() {
      this.scan = !this.scan
    },
    async onDecode(decodedString) {
      const arr = JSON.parse(decodedString)
      this.emit('set-transaction', { email: arr[0].email, amount: arr[0].amount })
      this.scan = false
    },
  },
}
</script>
<style>
.pointer {
  cursor: pointer;
}
</style>
