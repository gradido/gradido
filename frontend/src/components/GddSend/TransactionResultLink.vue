<template>
  <b-row>
    <b-col>
      <b-card class="p-0 gradido-custom-background">
        <div class="h3 mb-4">{{ $t('gdd_per_link.created') }}</div>
        <clipboard-copy
          :link="link"
          :amount="amount"
          :memo="memo"
          @show-qr-code-button="showQrCodeButton"
        ></clipboard-copy>

        <div class="text-center">
          <figure-qr-code v-if="showQrcode" :link="link" />

          <b-button variant="secondary" @click="$emit('on-reset')" class="mt-4">
            {{ $t('form.close') }}
          </b-button>
        </div>
      </b-card>
    </b-col>
  </b-row>
</template>
<script>
import ClipboardCopy from '../ClipboardCopy.vue'
import FigureQrCode from '../QrCode/FigureQrCode.vue'

export default {
  name: 'TransactionResultLink',
  components: {
    ClipboardCopy,
    FigureQrCode,
  },
  props: {
    link: { type: String, required: true },
    amount: { type: Number, required: true },
    memo: { type: String, required: true },
  },
  data() {
    return {
      showQrcode: false,
    }
  },
  methods: {
    showQrCodeButton() {
      this.showQrcode = !this.showQrcode
    },
  },
}
</script>
