<template>
  <div class="bg-white app-box-shadow gradido-border-radius p-5">
    <div class="h3 fw-bold mb-4">{{ $t('gdd_per_link.created') }}</div>
    <clipboard-copy
      :link="link"
      :amount="amount"
      :memo="memo"
      :valid-until="validUntil"
    ></clipboard-copy>
    <div class="mb-4">
      <label class="cheque-label">
        {{ $t('thank-you-cheque.download') }}
        <BButton size="sm" class="cheque-icon" data-test="downloadCheque" @click="download">
          <IBiDownload />
        </BButton>
      </label>
      <!-- The picture is the cheque itself, not a sample: whoever presses the button gets
           exactly what is shown, and it is drawn only once for both. -->
      <div v-if="chequeImage" class="text-center">
        <img
          :src="chequeImage"
          class="cheque-preview pointer"
          :alt="$t('thank-you-cheque.download')"
          @click="download"
        />
      </div>
    </div>
    <label class="fw-bold">{{ $t('qrCode') }}</label>
    <div class="text-center">
      <div>
        <figure-qr-code :link="link" />
      </div>
      <div>
        <BButton variant="gradido" class="mt-4" data-test="close-btn" @click="$emit('on-back')">
          {{ $t('form.close') }}
        </BButton>
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, ref } from 'vue'
import ClipboardCopy from '../ClipboardCopy'
import FigureQrCode from '../QrCode/FigureQrCode'
import { useThankYouCheque } from '@/composables/useThankYouCheque'

const props = defineProps({
  link: { type: String, required: true },
  amount: { type: String, required: true },
  memo: { type: String, required: true },
  validUntil: { type: String, required: true },
})

defineEmits(['on-back'])

const { drawThankYouCheque, downloadThankYouCheque } = useThankYouCheque({ ...props })

const chequeImage = ref(null)

// Drawn when the page appears, so the button hands the picture over without a wait. A
// failure stays quiet here on purpose - there is nothing the member asked for yet. It is
// reported when the button is pressed, which is when it stands in the way.
onMounted(async () => {
  try {
    chequeImage.value = await drawThankYouCheque()
  } catch {
    chequeImage.value = null
  }
})

const download = () => downloadThankYouCheque(chequeImage.value)
</script>

<style lang="scss" scoped>
.cheque-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.cheque-icon {
  padding: 0.15rem 0.45rem;
  line-height: 1;
}

.cheque-preview {
  width: 100%;
  max-width: 340px;
  border-radius: 4px;
  box-shadow: 0 1px 5px rgb(0 0 0 / 18%);
}
</style>
