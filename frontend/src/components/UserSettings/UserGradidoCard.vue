<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="gradido-card-section">
    <div class="h3">{{ $t('gradido-card.title') }}</div>
    <div class="text-small mb-3">{{ $t('gradido-card.description') }}</div>

    <BButton
      variant="primary"
      :disabled="isDrawing"
      data-test="download-gradido-card"
      @click="onDownload"
    >
      <IBiDownload class="me-1" />
      {{ $t('gradido-card.download') }}
    </BButton>

    <div v-if="preview" class="mt-4">
      <img :src="preview" class="gradido-card-preview" :alt="$t('gradido-card.title')" />
      <div class="text-small mt-2">{{ $t('gradido-card.print-hint') }}</div>
    </div>
  </div>
</template>

<script setup>
import { BButton } from 'bootstrap-vue-next'
import { ref } from 'vue'
import { useGradidoCard } from '@/composables/useGradidoCard'

const { downloadCard } = useGradidoCard()

const preview = ref('')
const isDrawing = ref(false)

/**
 * Drawn only when somebody asks for a card, never on opening the page: it costs a query for
 * the large picture, and this section sits on the tab the settings page opens on.
 *
 * The preview shows the picture that was just handed over, not a second drawing of it -- so
 * what is on screen is what is in the download, and not merely something that looks like it.
 */
const onDownload = async () => {
  isDrawing.value = true
  try {
    preview.value = (await downloadCard()) ?? ''
  } finally {
    isDrawing.value = false
  }
}
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
