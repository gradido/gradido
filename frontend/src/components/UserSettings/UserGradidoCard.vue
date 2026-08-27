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
        <!-- ⛔ Above the contact block and on by default. A card is handed to strangers, and
             whether one's real name travels with it is the holder's decision, not ours
             (Bernd, 27.08.2026). Ticked, the card is exactly the one it always was; unticked,
             the user name takes the top line -- bare, without the word "user name" in front
             of it, because up there it is simply what this person is called -- and the
             labelled line that used to carry it below goes away. -->
        <div class="d-flex align-items-center gap-3 mb-1">
          <span class="fw-bold">{{ $t('gradido-card.real-name') }}</span>
          <BFormCheckbox
            v-model="printRealName"
            class="small"
            data-test="gradido-card-print-real-name"
          >
            {{ $t('gradido-card.real-name-print') }}
          </BFormCheckbox>
        </div>
        <div class="small text-muted mb-3" data-test="gradido-card-real-name-hint">
          {{ $t('gradido-card.real-name-hint') }}
        </div>

        <div class="d-flex align-items-center gap-3 mb-1">
          <label class="fw-bold mb-0" for="gradido-card-contact">
            {{ $t('gradido-card.contact') }}
          </label>
          <BFormCheckbox
            v-model="printHeading"
            class="small"
            data-test="gradido-card-print-heading"
          >
            {{ $t('gradido-card.contact-print-heading') }}
          </BFormCheckbox>
        </div>
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

    <!-- The sheet leads. It is what somebody actually wants from a business card -- ten of
         them, at the right size, ready to cut -- and the download is the way out for the one
         person in a hundred taking the picture to a print shop. First position for the
         common act. (Bernd, 21.08.2026) -->
    <BRow>
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
      <BCol cols="12" md="6" class="mb-3">
        <!-- ⚠️ `secondary`, not `primary`. The sheet beside it is the main act; this one is the
             quieter twin. And `.btn-primary` carries Argon's leftovers: an olive fill (#5a7b02)
             with a BLUE border (#5e72e4) that matches nothing -- wrong in light mode too, only
             less visible there. `secondary` is the one variant with a kept dark-mode rule.
             (Bernd, 24.08.2026: "der könnte z. B. grau sein" -- and he cannot judge the green
             himself, so it was measured: 2.84:1 against the dark card, nearly invisible.) -->
        <BButton
          variant="secondary"
          :disabled="isBusy"
          data-test="download-gradido-card"
          @click="onDownload"
        >
          <IBiDownload class="me-1" />
          {{ $t('gradido-card.download') }}
        </BButton>
        <div class="small mt-2">{{ $t('gradido-card.download-hint') }}</div>
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
import { BButton, BCol, BFormCheckbox, BFormTextarea, BRow } from 'bootstrap-vue-next'
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
// On by default: the word reads as an invitation to get in touch rather than as a label.
// Five full lines are the case where it is in the way, and then it can go.
const printHeading = ref(true)
// On by default as well, and for a different reason: this is the card as it has always
// been printed. Turning it off is a deliberate step somebody takes, not a state they can
// find themselves in without having chosen it.
const printRealName = ref(true)

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
 *
 * Without an ID there is no key. A fallback name would be shared by everybody who ever has
 * none -- and `state.gradidoID` is null before the login response arrives and again after
 * logging out, so that is a state the wallet really passes through. A single shared key would
 * hand one member's telephone number to the next, which is the one thing this is here to
 * prevent. Not remembering is the safe direction.
 */
const storageKey = (name = 'contact') => {
  const { gradidoID } = store.state
  return gradidoID ? `gradido-card-${name}:${gradidoID}` : null
}

const readStored = (name) => {
  const key = storageKey(name)
  if (!key) return null
  try {
    return window.localStorage.getItem(key)
  } catch {
    // A browser with storage switched off must not cost the card. The field is then simply
    // empty on the next visit, which is a smaller loss than a section that fails to load.
    return null
  }
}

const writeStored = (name, value) => {
  const key = storageKey(name)
  if (!key) return
  try {
    window.localStorage.setItem(key, value)
  } catch {
    // as above: not being able to remember is no reason to fail
  }
}

/**
 * Drawn while the member types, so that the field looks like its result. Held back briefly,
 * because every draw loads the logo, the leaf and the picture and paints the whole card --
 * cheap, but not once per keystroke.
 *
 * The counter is what the timer alone cannot do. Cancelling a timer stops a draw that has
 * not started; it does nothing about one that is already running. On a slow device two draws
 * can overlap, and if the older one finishes last it puts the older lines back on screen --
 * where they would sit until the next keystroke, showing something other than what the card
 * would carry. So each draw remembers which round it belongs to and only the current round
 * is allowed to write.
 */
let redrawTimer = null
let redrawRound = 0

const redraw = async () => {
  const round = ++redrawRound
  const isCurrent = () => round === redrawRound

  if (!hasUsername.value) {
    preview.value = ''
    return
  }
  try {
    const card = await drawCard({
      contact: lines.value,
      heading: printHeading.value,
      realName: printRealName.value,
      preview: true,
    })
    if (isCurrent()) preview.value = card
  } catch {
    // The preview is a convenience. If an image fails to load, the two buttons below still
    // work and report for themselves -- showing nothing here is better than showing an
    // error where a card belongs.
    if (isCurrent()) preview.value = ''
  }
}

const redrawSoon = () => {
  window.clearTimeout(redrawTimer)
  redrawTimer = window.setTimeout(redraw, 250)
}

watch(contactText, (value) => {
  writeStored('contact', value)
  redrawSoon()
})

// The tick redraws at once rather than after the pause: it is a single decision, not typing,
// and waiting a quarter second for a checkbox looks like the box did not take.
watch(printHeading, (value) => {
  writeStored('contact-heading', value ? '1' : '0')
  redraw()
})

watch(printRealName, (value) => {
  writeStored('real-name', value ? '1' : '0')
  redraw()
})

onMounted(() => {
  contactText.value = readStored('contact') ?? ''
  // Only an explicit "0" turns these off, so a browser that remembers nothing keeps the
  // defaults -- and for the real name that direction matters: a device that cannot remember
  // must fall back to the card as it has always been, never to a quieter one nobody chose.
  printHeading.value = readStored('contact-heading') !== '0'
  printRealName.value = readStored('real-name') !== '0'
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
    preview.value =
      (await action({
        contact: lines.value,
        heading: printHeading.value,
        realName: printRealName.value,
      })) ?? preview.value
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
   sideways the moment the first card appears. The width has to be a definite one: the column
   is `md="auto"`, so it takes its width from its content, and `width: 100%` inside it would
   be measured against a width that is not decided yet -- reserving nothing. */
.gradido-card-empty {
  width: 24rem;
  max-width: 100%;
  min-height: 4rem;
}
</style>
