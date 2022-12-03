<template>
  <div class="bg-white appBoxShadow gradido-border-radius p-5">
    <div class="h3 mb-4">{{ $t('gdd_per_link.created') }}</div>

    <clipboard-copy
      :link="link"
      :amount="amount"
      :memo="memo"
      :validUntil="validUntil"
    ></clipboard-copy>
    <div class="text-center">
      <div><figure-qr-code :link="link" /></div>
      <div>
        <b-button variant="secondary" @click="$emit('on-reset')" class="mt-4">
          {{ $t('form.close') }}
        </b-button>
      </div>
    </div>

    <!-- <b-row>
      <b-col>
        <div class="h3 mb-4">{{ $t('gdd_per_link.created') }}</div>
        <clipboard-copy
          :link="link"
          :amount="amount"
          :memo="memo"
          :validUntil="validUntil"
          @show-qr-code-button="showQrCodeButton"
        ></clipboard-copy>

        <div class="text-center">
          <figure-qr-code v-if="showQrcode" :link="link" />

          <b-button variant="secondary" @click="$emit('on-reset')" class="mt-4">
            {{ $t('form.close') }}
          </b-button>
        </div>
      </b-col>
    </b-row> -->
  </div>
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
    amount: { type: String, required: true },
    memo: { type: String, required: true },
    validUntil: { type: String, required: true },
  },
  // data() {
  //  return {
  //    showQrcode: false,
  //  }
  // },
  // methods: {
  //   showQrCodeButton() {
  //     this.showQrcode = !this.showQrcode
  //   },
  // },
}
</script>
