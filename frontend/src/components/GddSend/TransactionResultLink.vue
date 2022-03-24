<template>
  <b-container>
    <b-row>
      <b-col>
        <b-card class="p-0 gradido-custom-background">
          <div class="p-4">
            <div class="h3">{{ $t('gdd_per_link.created') }}</div>
          </div>
          <b-row>
            <b-col class="text-center">
              <figure-qr-code :text="link" />
            </b-col>
          </b-row>
          <div class="p-4">
            <clipboard-copy :code="code" />
          </div>

          <p class="text-center mt-3">
            <b-button variant="success" @click="$emit('on-reset')">{{ $t('form.close') }}</b-button>
          </p>
        </b-card>
      </b-col>
    </b-row>
  </b-container>
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
    code: {
      type: String,
      required: true,
    },
  },
  computed: {
    link() {
      return `${window.location.origin}/redeem/${this.code}`
    },
  },
}
</script>
