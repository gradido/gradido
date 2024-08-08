<template>
  <div class="bg-white app-box-shadow gradido-border-radius p-5">
    <div class="h3 mb-4">{{ $t('gdd_per_link.created') }}</div>
    <clipboard-copy
      :link="link"
      :amount="amount"
      :memo="memo"
      :valid-until="validUntil"
    ></clipboard-copy>
    <label>{{ $t('qrCode') }}</label>
    <div class="text-center">
      <div><figure-qr-code :link="link" /></div>
      <div>
        <BButton variant="secondary" class="mt-4" data-test="close-btn" @click="$emit('on-back')">
          {{ $t('form.close') }}
        </BButton>
      </div>
    </div>
  </div>
</template>
<script>
import ClipboardCopy from '../ClipboardCopy'
import FigureQrCode from '../QrCode/FigureQrCode'

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
}
</script>
