<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The picture a thank-you carries, chosen: one of the five motifs, or a photo of the member's
       own -- chosen on the device or taken with its camera, and cut to the card's place in the
       chat's picture editor (ZE-017 F9, ZE-024). One building block for the greeting and, later,
       for a picture with a transfer: it keeps nothing itself. The motif and the photo are its two
       models, and the photo lives in the memory of the page that uses it. -->
  <div class="thank-you-picture-choice" data-test="thank-you-greeting-picture-choice">
    <div class="tyg-motifs">
      <button
        v-for="tile in motifs"
        :key="tile.key"
        type="button"
        class="tyg-motif"
        :class="{ 'is-chosen': tile.key === motif }"
        :aria-pressed="tile.key === motif"
        :data-test="`thank-you-greeting-motif-${tile.key}`"
        @click="chooseMotif(tile.key)"
      >
        <!-- ⛔ An <img>, never the SVG inlined: the motifs share the ids of their
             gradients. The name stands beside it, so the picture itself says nothing. -->
        <img
          :src="tile.src"
          alt=""
          :width="THANK_YOU_MOTIF_WIDTH"
          :height="THANK_YOU_MOTIF_HEIGHT"
        />
        <span class="tyg-motif-name">{{ tile.name }}</span>
        <span v-if="tile.key === motif" class="tyg-motif-check" aria-hidden="true">
          <svg
            viewBox="0 0 20 20"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M5 10.5l3.5 3.5L15 7" />
          </svg>
        </span>
      </button>

      <!-- The sixth tile: a photo of one's own. Empty, the whole tile is the label of the field
           the device's picker answers; with a photo, the tile is a button like the five -- a tap
           chooses the photo, a tap on the chosen photo opens its cutout again -- and says under
           its name how another photo is chosen.
           ⛔ A label for a file field that is hidden only from the eye, as in the chat's compose
           bar (FOTO-04): the label opens the field without a line of script, and the field stays
           in the tab order, its focus shown on the tile. -->
      <div
        class="tyg-motif tyg-own"
        :class="{ 'is-chosen': photoChosen, 'is-empty': !photo, 'is-busy': preparing }"
        :aria-busy="preparing ? 'true' : undefined"
        data-test="thank-you-greeting-own"
      >
        <label
          v-if="!photo"
          :for="pickerId"
          class="tyg-own-face"
          data-test="thank-you-greeting-photo-choose"
        >
          <span class="tyg-own-room" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              width="30"
              height="30"
              fill="none"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
              <circle cx="8.5" cy="10" r="1.6" />
              <path d="M4 17l5-4.5 3.5 3 3-2.5 4.5 4" />
            </svg>
          </span>
          <span class="tyg-motif-name">{{ t('thank-you-greeting.picture.own') }}</span>
        </label>
        <button
          v-else
          type="button"
          class="tyg-own-face"
          :aria-pressed="photoChosen"
          data-test="thank-you-greeting-photo"
          @click="onPhotoTile"
        >
          <!-- The name stands beside it, as with the motifs. -->
          <img
            :src="photo.preview"
            alt=""
            :width="THANK_YOU_MOTIF_WIDTH"
            :height="THANK_YOU_MOTIF_HEIGHT"
            data-test="thank-you-greeting-photo-picture"
          />
          <span class="tyg-motif-name">{{ t('thank-you-greeting.picture.own') }}</span>
          <!-- What a press does now, for whoever does not see the tile: it opens the cutout. -->
          <span v-if="photoChosen" class="visually-hidden">{{ t('chatThread.imageEdit') }}</span>
          <span v-if="photoChosen" class="tyg-motif-check" aria-hidden="true">
            <svg
              viewBox="0 0 20 20"
              width="16"
              height="16"
              fill="none"
              stroke="currentColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M5 10.5l3.5 3.5L15 7" />
            </svg>
          </span>
        </button>
        <!-- No `capture` on this one: here the picker offers the photos and the files. -->
        <input
          :id="pickerId"
          type="file"
          accept="image/*"
          class="visually-hidden tyg-own-field"
          data-test="thank-you-greeting-photo-picker"
          @change="takePicture"
        />
        <label
          v-if="photo"
          :for="pickerId"
          class="tyg-own-other"
          data-test="thank-you-greeting-photo-other"
        >
          {{ t('thank-you-greeting.picture.other') }}
        </label>
      </div>

      <!-- "Foto aufnehmen": the same kind of field with `capture`, which a phone and a tablet
           answer with their camera app. ⛔ Not on a computer, whose browser takes no notice of
           `capture` and would open the same dialog as the tile (E-047). -->
      <template v-if="offersCamera">
        <input
          :id="cameraId"
          type="file"
          accept="image/*"
          capture="environment"
          class="visually-hidden tyg-camera-field"
          data-test="thank-you-greeting-camera-field"
          @change="takePicture"
        />
        <label
          :for="cameraId"
          class="tyg-camera"
          :class="{ 'is-busy': preparing }"
          data-test="thank-you-greeting-camera"
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
            <path
              d="M4 8.5h3l1.5-2.5h7L17 8.5h3a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18v-8A1.5 1.5 0 0 1 4 8.5z"
            />
            <circle cx="12" cy="13.5" r="3.5" />
          </svg>
          <span>{{ t('chatThread.attachCamera') }}</span>
        </label>
      </template>
    </div>

    <!-- A photo that could not be opened: why, in the sentences the chat says it with. -->
    <p
      v-if="problem"
      class="tyg-picture-problem"
      role="alert"
      data-test="thank-you-greeting-picture-problem"
    >
      {{ problemWords }}
    </p>
    <!-- For the ear: a photo is being opened. Always in the page, so the words are announced
         when they come (a live region that appears together with its text is not). -->
    <p class="visually-hidden" role="status" data-test="thank-you-greeting-picture-status">
      {{ preparing ? t('chatThread.imagePreparing') : '' }}
    </p>

    <!-- The chat's editor under the card's frame: no shapes, no "Sichern"; "Größe" also fits
         the whole photo in. "Fertig" takes the photo over, "Abbrechen" leaves the choice as it
         was. -->
    <chat-image-editor
      v-model="editorOpen"
      :source="inEditor?.source ?? null"
      :edit="inEditor?.edit"
      @done="applyEdit"
    />
  </div>
</template>

<script setup>
import { computed, ref, shallowRef, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import ChatImageEditor from '@/components/Chat/ChatImageEditor.vue'
import { chatImageProblemWords, openChatImage } from '@/utils/chatImage'
import { isComputer } from '@/utils/isComputer'
import {
  THANK_YOU_MOTIF_HEIGHT,
  THANK_YOU_MOTIF_WIDTH,
  thankYouMotifs,
} from '@/utils/thankYouMotifs'
import { thankYouPictureEdit, thankYouPicturePreview } from '@/utils/thankYouPicture'

const props = defineProps({
  /** The motif chosen, by its key -- or null where the photo is the choice (v-model:motif). */
  motif: { type: String, default: null },
  /**
   * The photo in its tile, or null (v-model:photo): `{ source, edit, preview }` -- the picture as
   * chosen, decoded and whole (openChatImage), what the member did to it in the editor, and the
   * edited picture for the eye (thankYouPicturePreview). It stays in its tile while a motif is
   * the choice, until another photo takes its place.
   *
   * ⛔ For the memory of a page only: never into the store, never into the device's storage.
   */
  photo: { type: Object, default: null },
})

const emit = defineEmits(['update:motif', 'update:photo'])

const { t } = useI18n()

const motifs = computed(() => thankYouMotifs(t))

/** The photo is the choice where no motif is, and a photo is there. */
const photoChosen = computed(() => props.motif === null && props.photo !== null)

const id = useId()
const pickerId = `${id}-picker`
const cameraId = `${id}-camera`

/** Whether "Foto aufnehmen" is offered: not on a computer, where `capture` does nothing. */
const offersCamera = !isComputer()

/** A photo is being opened. */
const preparing = ref(false)
/** Why the last photo chosen could not be opened (ChatImageError), or null. */
const problem = ref(null)
const problemWords = computed(() => chatImageProblemWords(problem.value, t))

/** The editor, and the picture in it: `{ source, edit }` -- a new photo, or the one in the tile. */
const editorOpen = ref(false)
const inEditor = shallowRef(null)

const openEditor = (source, edit) => {
  inEditor.value = { source, edit }
  editorOpen.value = true
}

const chooseMotif = (key) => {
  // Another go: what went wrong with a photo is said no longer.
  problem.value = null
  emit('update:motif', key)
}

/**
 * A tap on the tile with a photo: it chooses the photo, as a tap on any tile chooses its picture;
 * on the chosen photo it opens the cutout once more.
 */
const onPhotoTile = () => {
  if (!photoChosen.value) {
    emit('update:motif', null)
    return
  }
  openEditor(props.photo.source, props.photo.edit)
}

/**
 * Only the last photo chosen counts: a second one chosen while the first is still being opened
 * takes its place, and the first one's answer, whenever it comes, is let go.
 */
let pictureRound = 0

/**
 * The photo the device's picker or its camera answered with: opened, and handed to the editor
 * filling the card's frame. Nothing is chosen yet -- "Fertig" there takes it over.
 */
const takePicture = async (event) => {
  const input = event.target
  const file = input.files?.[0]
  // Emptied, so the same file chosen again is a change again.
  input.value = ''
  if (!file) return
  const round = ++pictureRound
  problem.value = null
  preparing.value = true
  try {
    const source = await openChatImage(file)
    if (round !== pictureRound) return
    openEditor(source, thankYouPictureEdit())
  } catch (error) {
    if (round !== pictureRound) return
    // A photo chosen before stays in its tile: nothing has taken its place.
    problem.value = error?.problem ?? 'FORMAT'
  } finally {
    if (round === pictureRound) preparing.value = false
  }
}

/**
 * "Fertig" in the editor: the photo, with what was done to it, is in its tile and is the choice.
 * The picture for the eye is made here, once, from the same drawing as the two renditions that
 * are sent later.
 */
const applyEdit = (edit) => {
  const edited = inEditor.value
  if (!edited) return
  let preview
  try {
    preview = thankYouPicturePreview(edited.source, edit)
  } catch {
    problem.value = 'FORMAT'
    return
  }
  problem.value = null
  emit('update:photo', { source: edited.source, edit, preview })
  emit('update:motif', null)
}
</script>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks and a double slash is not a
   comment to it.

   The gold of the house in two depths, as the page of the greeting has them: the darker one
   carries text on a light ground, the lighter one lines. Named here as well, so the choice
   brings its colours along wherever it is used. */
.thank-you-picture-choice {
  --typ-accent: #8a6124;
  --typ-accent-line: #c58d38;
}

.dark-mode .thank-you-picture-choice {
  --typ-accent: #e6bd70;
}

/* The tiles: picture above name -- two in a row on a phone, all six in one row where there is
   room. With two fixed columns a tile was 500px wide at 1280 and the button under them out of
   sight (measured in the built wallet). */
.tyg-motifs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px;
}

.tyg-motif {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 14px;
  background: var(--bs-body-bg, #fff);
  color: inherit;
  font: inherit;
  text-align: start;
}

/* The room of the picture stands before the picture has come: 36 : 25, as the files are, in
   the colour of the card's place (THANK_YOU_PICTURE_GROUND). A photo fills it as a motif does. */
.tyg-motif img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 36 / 25;
  background: #fbf3de;
  object-fit: cover;
}

.tyg-motif-name {
  padding: 7px 10px 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

/* The chosen tile keeps its size: the thicker line is drawn inside the tile, not added to it. */
.tyg-motif.is-chosen {
  border-color: var(--typ-accent-line);
  box-shadow: inset 0 0 0 1.5px var(--typ-accent-line);
}

.tyg-motif.is-chosen .tyg-motif-name {
  color: var(--typ-accent);
  font-weight: 700;
}

/* The tick stands on the picture, whose ground is light in both themes: its own colours. */
.tyg-motif-check {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #8a6124;
  color: #fff;
}

/* The tile of one's own photo is no button itself: it holds its face -- the label of the
   picker's field, or the button with the photo -- and, under a photo, the way to another one. */
.tyg-own-face {
  position: relative;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  text-align: start;
  cursor: pointer;
}

/* Empty, it is an offer: a broken line of the tile's own width around an empty room. The line is
   all that bounds this tile -- it has no ground of its own --, so it takes the darker gold: the
   lighter one stood at 2.7 : 1 on the light page (measured in the built wallet), this one at 5. */
.tyg-own.is-empty {
  border-style: dashed;
  border-color: var(--typ-accent);
  background: transparent;
}

.tyg-own-room {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 36 / 25;
  color: var(--typ-accent);
}

/* "Anderes Foto": reads as a link, is the label of the picker's field. */
.tyg-own-other {
  align-self: flex-start;
  margin: -3px 0 0;
  padding: 0 10px 9px;
  color: rgba(var(--bs-link-color-rgb), 1);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  overflow-wrap: anywhere;
}

.tyg-own-other:hover {
  text-decoration: underline;
}

/* "Foto aufnehmen": one row under the tiles, as wide as all of them. */
.tyg-camera {
  display: flex;
  grid-column: 1 / -1;
  gap: 10px;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  margin: 0;
  padding: 0.5em 1em;
  border: 1px solid var(--bs-border-color, #dee2e6);
  border-radius: 14px;
  background: var(--bs-body-bg, #fff);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
}

/* While a photo is being opened. */
.tyg-own.is-busy,
.tyg-camera.is-busy {
  cursor: progress;
  opacity: 0.6;
}

/* Why a photo could not be opened. On the light page the house's red for a field in error
   (#dc3545) stands at 4.2 : 1 -- it is made for a white card --, so the sentence takes a deeper
   red there (6 : 1); on the dark page the theme's own, lighter red (7 : 1). */
.tyg-picture-problem {
  margin: 0.75rem 0 0;
  color: #b02a37;
  font-size: 0.875rem;
}

.dark-mode .tyg-picture-problem {
  color: var(--bs-form-invalid-color, #ea868f);
}

/* Whoever walks the page with the keyboard sees where they are. The tile cuts off what
   reaches past its round corners, so the focus of what is inside it is shown on the tile, and
   that of "Anderes Foto" inside its own edge. */
.tyg-motif:focus-visible,
.tyg-own:has(.tyg-own-face:focus-visible),
.tyg-own.is-empty:has(.tyg-own-field:focus-visible),
.tyg-camera-field:focus-visible + .tyg-camera {
  outline: 2px solid var(--typ-accent);
  outline-offset: 2px;
}

.tyg-own-face:focus-visible {
  outline: none;
}

.tyg-own-field:focus-visible + .tyg-own-other {
  outline: 2px solid var(--typ-accent);
  outline-offset: -2px;
}
</style>
