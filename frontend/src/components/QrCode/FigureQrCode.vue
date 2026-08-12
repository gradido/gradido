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
      <div v-if="cheque" class="mt-2">
        <a href="#" class="test-download-cheque" @click.prevent="downloadCheque">
          {{ $t('thank-you-cheque.download') }}
        </a>
      </div>
    </div>
  </div>
</template>
<script>
import { QRCanvas } from 'qrcanvas-vue'
import CONFIG from '@/config'
import { drawCheque, chequeFileName } from '@/utils/thankYouCheque'
import { useAppToast } from '@/composables/useToast'

export default {
  name: 'FigureQrCode',
  components: {
    QRCanvas,
  },
  props: {
    link: { type: String, required: true },
    /**
     * When set, a second link "download thank-you cheque" appears. The sentences
     * printed on the cheque are built here so that the call sites only have to
     * pass raw data.
     *
     * thank-you cheque: { kind: 'thankYou',      amount, memo, validUntil }
     * starting bonus:   { kind: 'startingBonus', amount, memo, name, validFrom, validTo }
     */
    cheque: { type: Object, default: null },
  },
  setup() {
    const { toastError } = useAppToast()
    return { toastError }
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
  computed: {
    isStartingBonus() {
      return this.cheque?.kind === 'startingBonus'
    },
    /** For a starting bonus the contribution link's name states the occasion, otherwise the memo does. */
    occasion() {
      return this.isStartingBonus ? this.cheque.name : this.cheque?.memo
    },
    chequeData() {
      if (!this.cheque) return null
      const date = (value) => this.$d(new Date(value), 'short')
      if (this.isStartingBonus) {
        return {
          kind: 'startingBonus',
          community: CONFIG.COMMUNITY_NAME,
          headline: this.$t('thank-you-cheque.starting-credit', { amount: this.cheque.amount }),
          validLine: this.$t('thank-you-cheque.starting-credit-valid', {
            from: date(this.cheque.validFrom),
            to: date(this.cheque.validTo),
          }),
        }
      }
      const { firstName, lastName, username, gradidoId } = this.$store.state
      return {
        kind: 'thankYou',
        name: `${firstName} ${lastName}`.trim(),
        address: `${CONFIG.COMMUNITY_NAME}/${username || gradidoId}`,
        initials: `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`,
        headline: `${firstName} ${this.$t('transaction-link.send_you')} ${this.cheque.amount} Gradido.`,
        validLine: this.$t('thank-you-cheque.valid-until', { date: date(this.cheque.validUntil) }),
      }
    },
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
    async downloadCheque() {
      try {
        const image = await drawCheque({
          ...this.chequeData,
          memo: this.cheque.memo,
          hintLine: this.$t('thank-you-cheque.scan-qr'),
          qrCanvas: this.$refs.canvas.$el,
        })
        const a = document.createElement('a')
        a.href = image
        a.download = chequeFileName(this.occasion, this.cheque.amount)
        a.click()
      } catch (error) {
        // The cheque is only drawn on click. If one of its pictures fails to load,
        // that must not stay silent.
        this.toastError(error.message)
      }
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
