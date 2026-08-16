<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div class="gradido-card-section">
    <div class="h3">{{ $t('gradido-card.title') }}</div>
    <div class="small mb-3">{{ $t('gradido-card.description') }}</div>

    <BRow class="mb-3">
      <BCol cols="12" md="auto" class="mb-3">
        <img
          v-if="preview"
          :src="preview"
          class="gradido-card-preview"
          :alt="$t('gradido-card.title')"
          data-test="gradido-card-preview"
        />
        <div
          v-else-if="!hasUsername"
          class="gradido-card-empty small"
          data-test="gradido-card-empty"
        >
          {{ $t('gradido-card.needs-username') }}
        </div>
        <div v-else class="gradido-card-empty" />
      </BCol>

      <BCol cols="12" md>
        <label class="fw-bold mb-1" for="gradido-card-contact">
          {{ $t('gradido-card.contact') }}
        </label>
        <!-- height: auto, or the template's `.form-control { height: 50px }` overrides rows
             and the field shows two lines however many it is meant to hold. -->
        <BFormTextarea
          id="gradido-card-contact"
          v-model="contactText"
          :placeholder="$t('gradido-card.contact-placeholder')"
          :rows="5"
          style="height: auto"
          data-test="gradido-card-contact"
        />
        <div
          class="small mt-2"
          :class="tooManyLines ? 'text-warning' : 'text-muted'"
          data-test="gradido-card-contact-count"
        >
          {{
            tooManyLines
              ? $t('gradido-card.contact-too-many', { max: CONTACT_MAX_LINES })
              : $t('gradido-card.contact-count', { count: lines.length, max: CONTACT_MAX_LINES })
          }}
        </div>
        <div class="small text-muted mt-1">{{ $t('gradido-card.contact-hint') }}</div>
      </BCol>
    </BRow>

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
        <div class="small mt-2">{{ $t('gradido-card.download-hint') }}</div>
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
        <div class="small mt-2">{{ $t('gradido-card.sheet-hint') }}</div>
      </BCol>
    </BRow>

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
import { BButton, BCol, BFormTextarea, BRow } from 'bootstrap-vue-next'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import AppModal from '@/components/AppModal'
import { useGradidoCard } from '@/composables/useGradidoCard'
import { CONTACT_MAX_LINES, contactLines } from '@/utils/gradidoCard'

const { drawCard, downloadCard, printCardSheet } = useGradidoCard()
const store = useStore()

const preview = ref('')
const isBusy = ref(false)
const needsUsername = ref(false)
const contactText = ref('')

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

const lines = computed(() => contactLines(contactText.value.split('\n')))

const tooManyLines = computed(
  () => contactText.value.split('\n').filter((line) => line.trim()).length > CONTACT_MAX_LINES,
)

/**
 * The contact lines are kept on this device, under the member's own Gradido ID.
 *
 * Not on the server, and that is the point rather than a shortcut: typed for a print run,
 * they stay a decision per batch instead of becoming a stored profile field that would need
 * its own release switch, its own deletion rules and its own answer for federation.
 *
 * The key carries the Gradido ID because a browser can be shared -- a household computer, a
 * machine in a cafe. The next person to open the settings finds an empty field.
 *
 * The guard is against being *seen*, not against being *looked for*: whoever uses the same
 * browser and knows where to look can read it. That is why the hint under the field says the
 * lines stay on this device rather than promising they are safe.
 */
const storageKey = () => `gradido-card-contact:${store.state.gradidoID ?? 'unknown'}`

const readStored = () => {
  try {
    return window.localStorage.getItem(storageKey())
  } catch {
    // A browser with storage switched off must not cost the card. The field is then simply
    // empty on the next visit, which is a smaller loss than a section that fails to load.
    return null
  }
}

const writeStored = (value) => {
  try {
    window.localStorage.setItem(storageKey(), value)
  } catch {
    // as above: not being able to remember is no reason to fail
  }
}

/**
 * Drawn while the member types, so that the field looks like its result. Held back briefly,
 * because every draw loads the logo, the leaf and the picture and paints the whole card --
 * cheap, but not once per keystroke.
 */
let redrawTimer = null

const redraw = async () => {
  if (!hasUsername.value) {
    preview.value = ''
    return
  }
  try {
    preview.value = await drawCard({ contact: lines.value, preview: true })
  } catch {
    // The preview is a convenience. If an image fails to load, the two buttons below still
    // work and report for themselves -- showing nothing here is better than showing an
    // error where a card belongs.
    preview.value = ''
  }
}

const redrawSoon = () => {
  window.clearTimeout(redrawTimer)
  redrawTimer = window.setTimeout(redraw, 250)
}

watch(contactText, (value) => {
  writeStored(value)
  redrawSoon()
})

onMounted(() => {
  contactText.value = readStored() ?? ''
  redraw()
})

onBeforeUnmount(() => window.clearTimeout(redrawTimer))

/**
 * The two ways to a card fetch the large picture, unlike the preview above.
 *
 * Both show the picture they just handed over, not a second drawing of it -- so what is on
 * screen after a download is what came out of it.
 */
const run = async (action) => {
  if (!hasUsername.value) {
    needsUsername.value = true
    return
  }
  isBusy.value = true
  try {
    preview.value = (await action({ contact: lines.value })) ?? preview.value
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

/* Holds the width of the preview while there is none, so the field beside it does not jump
   sideways the moment the first card appears. */
.gradido-card-empty {
  width: 100%;
  max-width: 24rem;
  min-height: 4rem;
}
</style>
