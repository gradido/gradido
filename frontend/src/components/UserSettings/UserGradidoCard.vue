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

    <app-modal
      v-model="needsUsername"
      :title="$t('gradido-card.needs-username-title')"
      ok-only
      @on-ok="needsUsername = false"
    >
      <span data-test="gradido-card-needs-username">{{ $t('gradido-card.needs-username') }}</span>
    </app-modal>
  </div>
</template>

<script setup>
import { BButton, BCol, BRow } from 'bootstrap-vue-next'
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import AppModal from '@/components/AppModal'
import { useGradidoCard } from '@/composables/useGradidoCard'

const { downloadCard, printCardSheet } = useGradidoCard()
const store = useStore()

const preview = ref('')
const isBusy = ref(false)
const needsUsername = ref(false)

/**
 * No card without a user name.
 *
 * Not because the fallback is long. It is not: without a user name the address falls back to
 * the Gradido ID, and that resolves exactly as well -- the line even fits, since the address
 * on the card now shrinks to the width it has.
 *
 * The reason is what a card is for. It carries somebody's address out into the world, and the
 * address is meant to show a *name*: that is the whole point of having one instead of an
 * identifier. A card printed without a user name puts a string of digits where the name
 * belongs, permanently -- it is given away and cannot be called back or corrected. So the way
 * to a card leads through choosing a name, and the message says so rather than quietly
 * handing out a card that can never become the one that was wanted.
 *
 * The field is on this very tab, a little further up, which is why the message points there
 * instead of sending anybody somewhere else.
 *
 * This is for the time in between. Once the user name is compulsory the case cannot arise,
 * and the gate can go.
 */
const hasUsername = computed(() => Boolean(store.state.username))

/**
 * Drawn only when somebody asks for a card, never on opening the page: it costs a query for
 * the large picture, and this section sits on the tab the settings page opens on.
 *
 * Both ways show the picture they just handed over, not a second drawing of it -- so what is
 * on screen is what came out, and not merely something that looks like it.
 */
const run = async (action) => {
  if (!hasUsername.value) {
    needsUsername.value = true
    return
  }
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
