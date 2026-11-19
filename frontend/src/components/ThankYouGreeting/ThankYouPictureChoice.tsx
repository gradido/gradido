// AI-GENERATED — not an architecture reference
import { computed, defineComponent, type PropType, ref, shallowRef, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChatImageEditor } from '@/components/Chat/ChatImageEditor'
import { usePastedImage } from '@/composables/usePastedImage'
import { chatImageProblemWords, openChatImage } from '@/utils/chatImage'
import { isComputer } from '@/utils/isComputer'
import { pasteIsFor } from '@/utils/pastedImage'
import {
  THANK_YOU_MOTIF_HEIGHT,
  THANK_YOU_MOTIF_WIDTH,
  thankYouMotifs,
} from '@/utils/thankYouMotifs'
import { thankYouPictureEdit, thankYouPicturePreview } from '@/utils/thankYouPicture'
import classes from './ThankYouPictureChoice.module.scss'

/** A picture as chosen, decoded and whole (openChatImage). */
type PhotoSource = Parameters<typeof thankYouPicturePreview>[0]
/** What the member did to it in the editor. */
type PhotoEdit = Parameters<typeof thankYouPicturePreview>[1]

/** The photo in its tile: the picture, what was done to it, and the edited picture for the eye. */
export type ThankYouPhoto = {
  source: PhotoSource
  edit: PhotoEdit
  preview: string
}

/**
 * The picture a thank-you carries, chosen: one of the five motifs, or a photo of the member's
 * own -- chosen on the device or taken with its camera, and cut to the card's place in the
 * chat's picture editor (ZE-017 F9, ZE-024). One building block for the greeting and, later,
 * for a picture with a transfer: it keeps nothing itself. The motif and the photo are its two
 * models, and the photo lives in the memory of the page that uses it.
 */
export const ThankYouPictureChoice = defineComponent({
  name: 'ThankYouPictureChoice',
  props: {
    /** The motif chosen, by its key -- or null where the photo is the choice (v-model:motif). */
    motif: { type: String as PropType<string | null>, default: null },
    /**
     * The photo in its tile, or null (v-model:photo): `{ source, edit, preview }` -- the picture as
     * chosen, decoded and whole (openChatImage), what the member did to it in the editor, and the
     * edited picture for the eye (thankYouPicturePreview). It stays in its tile while a motif is
     * the choice, until another photo takes its place.
     *
     * ⛔ For the memory of a page only: never into the store, never into the device's storage.
     */
    photo: { type: Object as PropType<ThankYouPhoto | null>, default: null },
    /**
     * A photo is on its way into the tile from elsewhere: the page of a duplicated greeting fetches
     * the photo the old one carries. The tile shows that it waits, and takes no photo from the
     * device meanwhile -- what the page is about to put there would land under an open editor. The
     * five motifs stay what they are: a tap on one is the member's own choice.
     */
    busy: { type: Boolean, default: false },
    /**
     * Whether a picture pasted on the page (Ctrl+V) comes here, as one chosen on the device. The
     * transfer's field says no while its choice is closed: it is hidden then, not taken down.
     */
    takesPaste: { type: Boolean, default: true },
  },
  emits: ['update:motif', 'update:photo'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const root = ref<HTMLDivElement | null>(null)

    // The filter is for the types alone: each of the five keys has its motif.
    const motifs = computed(() => thankYouMotifs(t).filter((tile) => tile !== null))

    /** The photo is the choice where no motif is, and a photo is there. */
    const photoChosen = computed(() => props.motif === null && props.photo !== null)

    const id = useId()
    const pickerId = `${id}-picker`
    const cameraId = `${id}-camera`

    /** Whether "Foto aufnehmen" is offered: not on a computer, where `capture` does nothing. */
    const offersCamera = !isComputer()

    /** A photo is being opened. */
    const preparing = ref(false)
    /** The tile of the photo waits: for a photo being opened here, or for one on its way (`busy`). */
    const waiting = computed(() => preparing.value || props.busy)
    /** Why the last photo chosen could not be opened (ChatImageError), or null. */
    const problem = ref<string | null>(null)
    const problemWords = computed(() => chatImageProblemWords(problem.value, t))

    /** The editor, and the picture in it: `{ source, edit }` -- a new photo, or the one in the tile. */
    const editorOpen = ref(false)
    const inEditor = shallowRef<{ source: PhotoSource; edit: PhotoEdit } | null>(null)

    const openEditor = (source: PhotoSource, edit: PhotoEdit) => {
      inEditor.value = { source, edit }
      editorOpen.value = true
    }

    const chooseMotif = (key: string) => {
      // Another go: what went wrong with a photo is said no longer.
      problem.value = null
      emit('update:motif', key)
    }

    /**
     * A tap on the tile with a photo: it chooses the photo, as a tap on any tile chooses its picture;
     * on the chosen photo it opens the cutout once more.
     */
    const onPhotoTile = () => {
      if (!photoChosen.value || !props.photo) {
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
     * A photo chosen -- in the device's picker, with its camera, or pasted --: opened, and handed to
     * the editor filling the card's frame. Nothing is chosen yet -- "Fertig" there takes it over.
     */
    const openPhoto = async (file: File) => {
      const round = ++pictureRound
      problem.value = null
      preparing.value = true
      try {
        const source = await openChatImage(file)
        if (round !== pictureRound) {
          return
        }
        openEditor(source, thankYouPictureEdit())
      } catch (error) {
        if (round !== pictureRound) {
          return
        }
        // A photo chosen before stays in its tile: nothing has taken its place.
        problem.value = (error as { problem?: string } | null)?.problem ?? 'FORMAT'
      } finally {
        if (round === pictureRound) {
          preparing.value = false
        }
      }
    }

    /** The photo the device's picker or its camera answered with. */
    const takePicture = (event: Event) => {
      const input = event.target as HTMLInputElement
      const file = input.files?.[0]
      // Emptied, so the same file chosen again is a change again.
      input.value = ''
      if (file) {
        openPhoto(file)
      }
    }

    /**
     * A picture pasted with Ctrl+V (Cmd+V) on the page: it goes into the editor as a photo chosen on
     * the device (Bernd, 16.10.2026). From the page, wherever the keyboard stands on it -- not from a
     * window over the page (utils/pastedImage) --, and only where a photo could be chosen now: not
     * while the choice is hidden (`takesPaste`), while a photo is on its way from elsewhere (`busy`,
     * whose field takes none either), or while the editor is open over a photo.
     */
    usePastedImage(
      openPhoto,
      (event) =>
        props.takesPaste && !props.busy && !editorOpen.value && pasteIsFor(event, root.value),
    )

    /**
     * "Fertig" in the editor: the photo, with what was done to it, is in its tile and is the choice.
     * The picture for the eye is made here, once, from the same drawing as the two renditions that
     * are sent later.
     */
    const applyEdit = (edit: PhotoEdit) => {
      const edited = inEditor.value
      if (!edited) {
        return
      }
      let preview: string
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

    return () => (
      <div
        ref={root}
        class={['thank-you-picture-choice', classes['thank-you-picture-choice']]}
        data-test='thank-you-greeting-picture-choice'
      >
        <div class='tyg-motifs'>
          {motifs.value.map((tile) => (
            <button
              key={tile.key}
              type='button'
              class={['tyg-motif', { 'is-chosen': tile.key === props.motif }]}
              aria-pressed={tile.key === props.motif}
              data-test={`thank-you-greeting-motif-${tile.key}`}
              onClick={() => chooseMotif(tile.key)}
            >
              {/* ⛔ An <img>, never the SVG inlined: the motifs share the ids of their
                  gradients. The name stands beside it, so the picture itself says nothing. */}
              <img
                src={tile.src}
                alt=''
                width={THANK_YOU_MOTIF_WIDTH}
                height={THANK_YOU_MOTIF_HEIGHT}
              />
              <span class='tyg-motif-name'>{tile.name}</span>
              {tile.key === props.motif ? (
                <span class='tyg-motif-check' aria-hidden='true'>
                  <svg
                    viewBox='0 0 20 20'
                    width='16'
                    height='16'
                    fill='none'
                    stroke='currentColor'
                    stroke-width='2.2'
                    stroke-linecap='round'
                    stroke-linejoin='round'
                  >
                    <path d='M5 10.5l3.5 3.5L15 7' />
                  </svg>
                </span>
              ) : null}
            </button>
          ))}

          {/* The sixth tile: a photo of one's own. Empty, the whole tile is the label of the field
              the device's picker answers; with a photo, the tile is a button like the five -- a tap
              chooses the photo, a tap on the chosen photo opens its cutout again -- and says under
              its name how another photo is chosen.
              ⛔ A label for a file field that is hidden only from the eye, as in the chat's compose
              bar (FOTO-04): the label opens the field without a line of script, and the field stays
              in the tab order, its focus shown on the tile. */}
          <div
            class={[
              'tyg-motif tyg-own',
              {
                'is-chosen': photoChosen.value,
                'is-empty': !props.photo,
                'is-busy': waiting.value,
              },
            ]}
            aria-busy={waiting.value ? 'true' : undefined}
            data-test='thank-you-greeting-own'
          >
            {!props.photo ? (
              <label
                for={pickerId}
                class='tyg-own-face'
                data-test='thank-you-greeting-photo-choose'
              >
                <span class='tyg-own-room' aria-hidden='true'>
                  <svg
                    viewBox='0 0 24 24'
                    width='30'
                    height='30'
                    fill='none'
                    stroke='currentColor'
                    stroke-width='1.6'
                    stroke-linecap='round'
                    stroke-linejoin='round'
                  >
                    <rect x='3' y='4.5' width='18' height='15' rx='2.5' />
                    <circle cx='8.5' cy='10' r='1.6' />
                    <path d='M4 17l5-4.5 3.5 3 3-2.5 4.5 4' />
                  </svg>
                </span>
                <span class='tyg-motif-name'>{t('thank-you-greeting.picture.own')}</span>
              </label>
            ) : (
              <button
                type='button'
                class='tyg-own-face'
                aria-pressed={photoChosen.value}
                data-test='thank-you-greeting-photo'
                onClick={onPhotoTile}
              >
                {/* The name stands beside it, as with the motifs. */}
                <img
                  src={props.photo.preview}
                  alt=''
                  width={THANK_YOU_MOTIF_WIDTH}
                  height={THANK_YOU_MOTIF_HEIGHT}
                  data-test='thank-you-greeting-photo-picture'
                />
                <span class='tyg-motif-name'>{t('thank-you-greeting.picture.own')}</span>
                {/* What a press does now, for whoever does not see the tile: it opens the cutout. */}
                {photoChosen.value ? (
                  <span class='visually-hidden'>{t('chatThread.imageEdit')}</span>
                ) : null}
                {photoChosen.value ? (
                  <span class='tyg-motif-check' aria-hidden='true'>
                    <svg
                      viewBox='0 0 20 20'
                      width='16'
                      height='16'
                      fill='none'
                      stroke='currentColor'
                      stroke-width='2.2'
                      stroke-linecap='round'
                      stroke-linejoin='round'
                    >
                      <path d='M5 10.5l3.5 3.5L15 7' />
                    </svg>
                  </span>
                ) : null}
              </button>
            )}
            {/* No `capture` on this one: here the picker offers the photos and the files. While a
                photo is on its way from elsewhere (`busy`), the field takes none: its label does
                nothing then. */}
            <input
              id={pickerId}
              type='file'
              accept='image/*'
              class='visually-hidden tyg-own-field'
              disabled={props.busy}
              data-test='thank-you-greeting-photo-picker'
              onChange={takePicture}
            />
            {props.photo ? (
              <label
                for={pickerId}
                class='tyg-own-other'
                data-test='thank-you-greeting-photo-other'
              >
                {t('thank-you-greeting.picture.other')}
              </label>
            ) : null}
          </div>

          {/* "Foto aufnehmen": the same kind of field with `capture`, which a phone and a tablet
              answer with their camera app. ⛔ Not on a computer, whose browser takes no notice of
              `capture` and would open the same dialog as the tile (E-047). */}
          {offersCamera ? (
            <>
              <input
                id={cameraId}
                type='file'
                accept='image/*'
                capture='environment'
                class='visually-hidden tyg-camera-field'
                disabled={props.busy}
                data-test='thank-you-greeting-camera-field'
                onChange={takePicture}
              />
              <label
                for={cameraId}
                class={['tyg-camera', { 'is-busy': waiting.value }]}
                data-test='thank-you-greeting-camera'
              >
                <svg
                  viewBox='0 0 24 24'
                  width='20'
                  height='20'
                  fill='none'
                  stroke='currentColor'
                  stroke-width='1.7'
                  stroke-linecap='round'
                  stroke-linejoin='round'
                  aria-hidden='true'
                >
                  <path d='M4 8.5h3l1.5-2.5h7L17 8.5h3a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 20 19.5H4A1.5 1.5 0 0 1 2.5 18v-8A1.5 1.5 0 0 1 4 8.5z' />
                  <circle cx='12' cy='13.5' r='3.5' />
                </svg>
                <span>{t('chatThread.attachCamera')}</span>
              </label>
            </>
          ) : null}
        </div>

        {/* A photo that could not be opened: why, in the sentences the chat says it with. */}
        {problem.value ? (
          <p
            class='tyg-picture-problem'
            role='alert'
            data-test='thank-you-greeting-picture-problem'
          >
            {problemWords.value}
          </p>
        ) : null}
        {/* For the ear: a photo is being opened, or is on its way. Always in the page, so the
            words are announced when they come (a live region that appears together with its text
            is not). */}
        <p class='visually-hidden' role='status' data-test='thank-you-greeting-picture-status'>
          {waiting.value ? t('chatThread.imagePreparing') : ''}
        </p>

        {/* The chat's editor under the card's frame: no shapes, no "Sichern"; "Größe" also fits
            the whole photo in. "Fertig" takes the photo over, "Abbrechen" leaves the choice as it
            was. */}
        <ChatImageEditor
          modelValue={editorOpen.value}
          onUpdate:modelValue={(open: boolean) => {
            editorOpen.value = open
          }}
          source={inEditor.value?.source ?? null}
          edit={inEditor.value?.edit}
          onDone={applyEdit}
        />
      </div>
    )
  },
})
