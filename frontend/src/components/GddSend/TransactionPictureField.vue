<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- "Bild dazu": the picture a member may add to a transfer -- one of the five motifs of the
       thank-you greeting, or a photo of their own (ZE-016). Three states: nothing chosen (one row,
       "Bild auswählen"), the choice open in place (the greeting's picture choice, used as it is,
       and "Ohne Bild" under it), and a picture chosen (the picture small, "Anderes Bild" and
       "Entfernen" beside it). No window.

       It keeps nothing itself: the picture is its model and lives in the memory of the page
       (pages/Send.vue) -- `{ motif }`, `{ photo }` or null.

       ⛔ It stands in the form of the transfer: every button here says `type="button"`, so that
       none of them is the form's "Jetzt prüfen".

       To a member of another community a picture does not travel yet: a sentence stands in the
       field's place, and a picture chosen before stays in the page's memory untouched. -->
  <p v-if="foreign" class="send-picture-home-only" data-test="send-picture-home-only">
    {{ t('send-picture.home-only') }}
  </p>
  <div v-else class="send-picture" role="group" :aria-labelledby="labelId" data-test="send-picture">
    <div :id="labelId" class="send-picture-label">{{ t('send-picture.label') }}</div>

    <div v-if="shown && !open" class="send-picture-chosen" data-test="send-picture-chosen">
      <!-- An <img> for a motif as well, never the SVG inlined (the motifs share the ids of their
           gradients). The room stands before the file has come: 36 : 25 on the card's ground. -->
      <img
        class="send-picture-thumb"
        :src="shown.src"
        :alt="shown.name"
        :width="THANK_YOU_MOTIF_WIDTH"
        :height="THANK_YOU_MOTIF_HEIGHT"
        data-test="send-picture-thumb"
      />
      <div class="send-picture-actions">
        <button
          ref="otherButton"
          type="button"
          class="send-picture-link"
          aria-expanded="false"
          data-test="send-picture-other"
          @click="openChoice"
        >
          {{ t('send-picture.other') }}
        </button>
        <button
          type="button"
          class="send-picture-link"
          data-test="send-picture-remove"
          @click="remove"
        >
          {{ t('send-picture.remove') }}
        </button>
      </div>
    </div>
    <button
      v-else-if="!open"
      ref="chooseButton"
      type="button"
      class="send-picture-choose"
      aria-expanded="false"
      data-test="send-picture-choose"
      @click="openChoice"
    >
      <svg
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        stroke-width="1.7"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
        <circle cx="8.5" cy="10" r="1.6" />
        <path d="M4 17l5-4.5 3.5 3 3-2.5 4.5 4" />
      </svg>
      <span>{{ t('avatar.choose-image') }}</span>
    </button>

    <!-- The choice, in place. Built at the first opening and hidden rather than taken down
         afterwards: its editor is a window that closes with a movement of its own, and the
         choice closes at the very press that ends it ("Fertig"). -->
    <div
      v-if="everOpen"
      v-show="open"
      ref="choice"
      class="send-picture-open"
      data-test="send-picture-open"
    >
      <thank-you-picture-choice
        :motif="picture?.motif ?? null"
        :photo="picture?.photo ?? null"
        @update:motif="onMotif"
        @update:photo="onPhoto"
      />
      <button
        type="button"
        class="send-picture-link send-picture-none"
        data-test="send-picture-none"
        @click="remove"
      >
        {{ t('send-picture.none') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import ThankYouPictureChoice from '@/components/ThankYouGreeting/ThankYouPictureChoice.vue'
import {
  THANK_YOU_MOTIF_HEIGHT,
  THANK_YOU_MOTIF_WIDTH,
  thankYouMotif,
} from '@/utils/thankYouMotifs'

const props = defineProps({
  /**
   * The picture chosen, or null (v-model:picture): `{ motif }` -- one of the five, by its key --
   * or `{ photo }`, the member's own as the picture choice hands it over (`{ source, edit,
   * preview }`).
   *
   * ⛔ For the memory of a page only: never into the store, never into the device's storage.
   */
  picture: { type: Object, default: null },
  /** The recipient is a member of another community: the sentence instead of the field. */
  foreign: { type: Boolean, default: false },
})

const emit = defineEmits(['update:picture'])

const { t } = useI18n()

const labelId = `${useId()}-label`

/** The choice is open; and whether it ever was (see the template). */
const open = ref(false)
const everOpen = ref(false)

const chooseButton = ref(null)
const otherButton = ref(null)
const choice = ref(null)

/** The chosen picture for the eye: a motif's file and name, or the photo as the member cut it. */
const shown = computed(() => {
  if (props.picture?.photo) {
    return { src: props.picture.photo.preview, name: t('thank-you-greeting.picture.own') }
  }
  return thankYouMotif(props.picture?.motif, t)
})

/** Where the keyboard stands after a press took its button away. */
const focusOn = async (button) => {
  await nextTick()
  button.value?.focus()
}

const openChoice = async () => {
  everOpen.value = true
  open.value = true
  await nextTick()
  // The row that was pressed is gone: the keyboard goes on in the choice, at its first tile.
  choice.value?.querySelector('button, [tabindex], input')?.focus()
}

/**
 * A tap on a motif chooses it and closes the choice.
 * ⚠️ The picture choice says `null` for "the photo is the choice" -- after its editor closed
 * with "Fertig", right behind the photo itself (onPhoto), which has done everything already.
 */
const onMotif = (key) => {
  if (key === null) return
  emit('update:picture', { motif: key })
  open.value = false
  focusOn(otherButton)
}

/**
 * The same after a WINDOW has closed. The editor is one, and a window hands the keyboard back to
 * where it stood before it opened -- the tile of the choice, which is hidden by the time the
 * window has gone: the keyboard falls to the page (measured in the built wallet). So for a
 * second the button is given the keyboard again whenever it has fallen there -- and left alone
 * as soon as the member has put it anywhere else.
 */
let lookingAfterFocus = null
const stopLookingAfterFocus = () => {
  clearInterval(lookingAfterFocus)
  lookingAfterFocus = null
}
const focusOnAfterWindow = (button) => {
  focusOn(button)
  stopLookingAfterFocus()
  let looks = 0
  lookingAfterFocus = setInterval(() => {
    looks += 1
    const fallen = document.activeElement === null || document.activeElement === document.body
    const windowOpen = document.querySelector('.modal.show') !== null
    if (fallen && !windowOpen) button.value?.focus()
    if (looks >= 10 || !button.value) stopLookingAfterFocus()
  }, 100)
}
onBeforeUnmount(stopLookingAfterFocus)

/** A photo is chosen when its editor closes with "Fertig". */
const onPhoto = (photo) => {
  if (!photo) return
  emit('update:picture', { photo })
  open.value = false
  focusOnAfterWindow(otherButton)
}

/**
 * "Entfernen", and "Ohne Bild" under the open choice: no picture, the choice closed.
 * ⚠️ The picture choice knows no "no picture" -- without a motif a photo in its tile counts as
 * chosen. So the whole picture goes, motif and photo alike.
 */
const remove = () => {
  emit('update:picture', null)
  open.value = false
  focusOn(chooseButton)
}

// The picture went from outside -- "Zurücksetzen", or after the transfer was sent: the choice
// does not stay open over an empty field.
watch(
  () => props.picture,
  (picture) => {
    if (picture === null) open.value = false
  },
)
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it. */
.send-picture {
  margin-top: 1rem;
}

/* The label, set as the labels of the fields above it are. */
.send-picture-label {
  margin-bottom: 0.5rem;
}

/* "Bild auswählen": one row, in the form of "Foto aufnehmen" of the picture choice. */
.send-picture-choose {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-height: 46px;
  margin: 0;
  padding: 0.5em 1em;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 14px;
  background: var(--bs-body-bg, #fff);
  color: inherit;
  font: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

/* Chosen: the picture small, the two ways on beside it. */
.send-picture-chosen {
  display: flex;
  gap: 16px;
  align-items: center;
}

/* 36 : 25 as the motifs are, on the ground of the card (THANK_YOU_PICTURE_GROUND). */
.send-picture-thumb {
  display: block;
  flex: 0 0 auto;
  width: 132px;
  height: auto;
  aspect-ratio: 36 / 25;
  border-radius: 10px;
  background: #fbf3de;
  object-fit: cover;
}

/* On a narrow phone the form leaves 258px: beside a picture of 132 the longer of the ten
   "Anderes Bild" broke into two lines (measured in the built wallet at 320: it, nl, ru). The
   picture steps back a little there. */
@media (width <= 359.98px) {
  .send-picture-chosen {
    gap: 12px;
  }

  .send-picture-thumb {
    width: 104px;
  }
}

.send-picture-actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  min-width: 0;
}

/* "Anderes Bild", "Entfernen", "Ohne Bild": read as links, are buttons. */
.send-picture-link {
  margin: 0;
  padding: 4px 0;
  border: 0;
  background: none;
  color: rgba(var(--bs-link-color-rgb), 1);
  font: inherit;
  font-size: 0.875rem;
  text-align: start;
  cursor: pointer;
  overflow-wrap: anywhere;
}

.send-picture-link:hover {
  text-decoration: underline;
}

.send-picture-none {
  margin-top: 8px;
}

/* Two tiles in a row at every width. On its own the choice asks 130px for a tile, and the form
   of a narrow phone gives it 258 for two and their gap: one column, 1450px high (measured in
   the built wallet). On the page of the greeting, which has the room, nothing changes. */
.send-picture-open :deep(.tyg-motifs) {
  grid-template-columns: repeat(auto-fit, minmax(min(130px, calc(50% - 5px)), 1fr));
}

.send-picture-choose:focus-visible,
.send-picture-link:focus-visible {
  outline: 2px solid var(--bs-link-color, #047006);
  outline-offset: 2px;
}

/* To a member of another community: the sentence in the field's place. */
.send-picture-home-only {
  margin: 1rem 0 0;
  font-size: 0.875rem;
}
</style>
