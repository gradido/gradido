<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="gradido-card-section">
    <div class="h3">{{ $t('gradido-card.title') }}</div>
    <div class="text-small mb-3">{{ $t('gradido-card.description') }}</div>

    <BRow>
      <BCol cols="12" md="6" class="mb-3">
        <BButton
          variant="primary"
          :disabled="isBusy"
          data-test="download-gradido-card"
          @click="onDownload"
        >
          <IBiDownload class="me-1" />
          {{ $t('gradido-card.download') }}
        </BButton>
        <div class="text-small mt-2">{{ $t('gradido-card.download-hint') }}</div>
      </BCol>
      <BCol cols="12" md="6" class="mb-3">
        <BButton
          variant="gradido"
          :disabled="isBusy"
          data-test="print-gradido-sheet"
          @click="onSheet"
        >
          <IBiPrinter class="me-1" />
          {{ $t('gradido-card.sheet') }}
        </BButton>
        <div class="text-small mt-2">{{ $t('gradido-card.sheet-hint') }}</div>
      </BCol>
    </BRow>

    <div v-if="preview" class="mt-2">
      <img :src="preview" class="gradido-card-preview" :alt="$t('gradido-card.title')" />
    </div>
  </div>
</template>

<script setup>
import { BButton, BCol, BRow } from 'bootstrap-vue-next'
import { ref } from 'vue'
import { useGradidoCard } from '@/composables/useGradidoCard'

const { downloadCard, printCardSheet } = useGradidoCard()

const preview = ref('')
const isBusy = ref(false)

/**
 * Drawn only when somebody asks for a card, never on opening the page: it costs a query for
 * the large picture, and this section sits on the tab the settings page opens on.
 *
 * Both ways show the picture they just handed over, not a second drawing of it -- so what is
 * on screen is what came out, and not merely something that looks like it.
 */
const run = async (action) => {
  isBusy.value = true
  try {
    preview.value = (await action()) ?? ''
  } finally {
    isBusy.value = false
  }
}

const onDownload = () => run(downloadCard)
const onSheet = () => run(printCardSheet)
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it -- the build fails with "Invalid empty selector". */
.gradido-card-preview {
  width: 100%;
  max-width: 24rem;
  height: auto;
  display: block;
}
</style>
