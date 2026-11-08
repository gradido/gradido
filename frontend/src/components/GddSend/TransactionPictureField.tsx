// AI-GENERATED — not an architecture reference
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  type PropType,
  type Ref,
  ref,
  useId,
  vShow,
  watch,
  withDirectives,
} from 'vue'
import { useI18n } from 'vue-i18n'
import ThankYouPictureChoice from '@/components/ThankYouGreeting/ThankYouPictureChoice.vue'
import {
  THANK_YOU_MOTIF_HEIGHT,
  THANK_YOU_MOTIF_WIDTH,
  thankYouMotif,
} from '@/utils/thankYouMotifs'
import type { encodeThankYouPictures } from '@/utils/thankYouPicture'
import classes from './TransactionPictureField.module.scss'

/** The member's own photo as the picture choice hands it over: decoded, with what the editor did. */
export type TransactionPhoto = {
  source: Parameters<typeof encodeThankYouPictures>[0]
  edit: Parameters<typeof encodeThankYouPictures>[1]
  preview: string
}

/** The picture chosen for a transfer: one of the five motifs by its key, or the member's own. */
export type TransactionPicture =
  | { motif: string; photo?: undefined }
  | { motif?: undefined; photo: TransactionPhoto }

/**
 * "Bild dazu": the picture a member may add to a transfer -- one of the five motifs of the
 * thank-you greeting, or a photo of their own (ZE-016). Three states: nothing chosen (one row,
 * "Bild auswählen"), the choice open in place (the greeting's picture choice, used as it is, and
 * "Ohne Bild" under it), and a picture chosen (the picture small, "Anderes Bild" and "Entfernen"
 * beside it). No window.
 *
 * It keeps nothing itself: the picture is its model and lives in the memory of the page
 * (pages/Send.tsx) -- `{ motif }`, `{ photo }` or null.
 *
 * ⛔ It stands in the form of the transfer: every button here says `type="button"`, so that none
 * of them is the form's "Jetzt prüfen".
 *
 * To a member of another community a picture does not travel yet: a sentence stands in the
 * field's place, and a picture chosen before stays in the page's memory untouched.
 */
export const TransactionPictureField = defineComponent({
  name: 'TransactionPictureField',
  props: {
    /**
     * The picture chosen, or null (v-model:picture): `{ motif }` -- one of the five, by its key --
     * or `{ photo }`, the member's own as the picture choice hands it over (`{ source, edit,
     * preview }`).
     *
     * ⛔ For the memory of a page only: never into the store, never into the device's storage.
     */
    picture: { type: Object as PropType<TransactionPicture | null>, default: null },
    /** The recipient is a member of another community: the sentence instead of the field. */
    foreign: { type: Boolean, default: false },
  },
  emits: ['update:picture'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const labelId = `${useId()}-label`

    /** The choice is open; and whether it ever was (see the render function). */
    const open = ref(false)
    const everOpen = ref(false)

    const chooseButton = ref<HTMLButtonElement | null>(null)
    const otherButton = ref<HTMLButtonElement | null>(null)
    const choice = ref<HTMLDivElement | null>(null)

    /** The chosen picture for the eye: a motif's file and name, or the photo as the member cut it. */
    const shown = computed(() => {
      if (props.picture?.photo) {
        return { src: props.picture.photo.preview, name: t('thank-you-greeting.picture.own') }
      }
      return thankYouMotif(props.picture?.motif, t)
    })

    /** Where the keyboard stands after a press took its button away. */
    const focusOn = async (button: Ref<HTMLButtonElement | null>) => {
      await nextTick()
      button.value?.focus()
    }

    const openChoice = async () => {
      everOpen.value = true
      open.value = true
      await nextTick()
      // The row that was pressed is gone: the keyboard goes on in the choice, at its first tile.
      choice.value?.querySelector<HTMLElement>('button, [tabindex], input')?.focus()
    }

    /**
     * A tap on a motif chooses it and closes the choice.
     * ⚠️ The picture choice says `null` for "the photo is the choice" -- after its editor closed
     * with "Fertig", right behind the photo itself (onPhoto), which has done everything already.
     */
    const onMotif = (key: string | null) => {
      if (key === null) {
        return
      }
      emit('update:picture', { motif: key })
      open.value = false
      focusOn(otherButton)
    }

    /**
     * The same after a WINDOW has closed. The editor is one, and a window hands the keyboard back
     * to where it stood before it opened -- the tile of the choice, which is hidden by the time
     * the window has gone: the keyboard falls to the page (measured in the built wallet). So for
     * a second the button is given the keyboard again whenever it has fallen there -- and left
     * alone as soon as the member has put it anywhere else.
     */
    let lookingAfterFocus: ReturnType<typeof setInterval> | null = null
    const stopLookingAfterFocus = () => {
      if (lookingAfterFocus !== null) {
        clearInterval(lookingAfterFocus)
      }
      lookingAfterFocus = null
    }
    const focusOnAfterWindow = (button: Ref<HTMLButtonElement | null>) => {
      focusOn(button)
      stopLookingAfterFocus()
      let looks = 0
      lookingAfterFocus = setInterval(() => {
        looks += 1
        const fallen = document.activeElement === null || document.activeElement === document.body
        const windowOpen = document.querySelector('.modal.show') !== null
        if (fallen && !windowOpen) {
          button.value?.focus()
        }
        if (looks >= 10 || !button.value) {
          stopLookingAfterFocus()
        }
      }, 100)
    }
    onBeforeUnmount(stopLookingAfterFocus)

    /** A photo is chosen when its editor closes with "Fertig". */
    const onPhoto = (photo: TransactionPhoto | null) => {
      if (!photo) {
        return
      }
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

    // Where the picture goes from outside, the choice does not stay open over an empty field.
    watch(
      () => props.picture,
      (picture) => {
        if (picture === null) {
          open.value = false
        }
      },
    )

    /** The row with the picture chosen, or the row that opens the choice, or nothing while open. */
    const row = () => {
      if (shown.value && !open.value) {
        return (
          <div
            class={['send-picture-chosen', classes.sendPictureChosen]}
            data-test='send-picture-chosen'
          >
            {/* An <img> for a motif as well, never the SVG inlined (the motifs share the ids of
                their gradients). The room stands before the file has come: 36 : 25 on the card's
                ground. */}
            <img
              class={['send-picture-thumb', classes.sendPictureThumb]}
              src={shown.value.src}
              alt={shown.value.name}
              width={THANK_YOU_MOTIF_WIDTH}
              height={THANK_YOU_MOTIF_HEIGHT}
              data-test='send-picture-thumb'
            />
            <div class={['send-picture-actions', classes.sendPictureActions]}>
              <button
                ref={otherButton}
                type='button'
                class={['send-picture-link', classes.sendPictureLink]}
                aria-expanded='false'
                data-test='send-picture-other'
                onClick={openChoice}
              >
                {t('send-picture.other')}
              </button>
              <button
                type='button'
                class={['send-picture-link', classes.sendPictureLink]}
                data-test='send-picture-remove'
                onClick={remove}
              >
                {t('send-picture.remove')}
              </button>
            </div>
          </div>
        )
      }
      if (!open.value) {
        return (
          <button
            ref={chooseButton}
            type='button'
            class={['send-picture-choose', classes.sendPictureChoose]}
            aria-expanded='false'
            data-test='send-picture-choose'
            onClick={openChoice}
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
              <rect x='3' y='4.5' width='18' height='15' rx='2.5' />
              <circle cx='8.5' cy='10' r='1.6' />
              <path d='M4 17l5-4.5 3.5 3 3-2.5 4.5 4' />
            </svg>
            <span>{t('avatar.choose-image')}</span>
          </button>
        )
      }
      return null
    }

    return () => {
      if (props.foreign) {
        return (
          <p
            class={['send-picture-home-only', classes.sendPictureHomeOnly]}
            data-test='send-picture-home-only'
          >
            {t('send-picture.home-only')}
          </p>
        )
      }
      return (
        <div
          class={['send-picture', classes.sendPicture]}
          role='group'
          aria-labelledby={labelId}
          data-test='send-picture'
        >
          <div id={labelId} class={['send-picture-label', classes.sendPictureLabel]}>
            {t('send-picture.label')}
          </div>

          {row()}

          {/* The choice, in place. Built at the first opening and hidden rather than taken down
              afterwards: its editor is a window that closes with a movement of its own, and the
              choice closes at the very press that ends it ("Fertig"). */}
          {everOpen.value
            ? withDirectives(
                <div
                  ref={choice}
                  class={['send-picture-open', classes.sendPictureOpen]}
                  data-test='send-picture-open'
                >
                  {/* A picture pasted on the page (Ctrl+V) comes into the choice while it is open. */}
                  <ThankYouPictureChoice
                    motif={props.picture?.motif ?? null}
                    photo={props.picture?.photo ?? null}
                    takesPaste={open.value}
                    onUpdate:motif={onMotif}
                    onUpdate:photo={onPhoto}
                  />
                  <button
                    type='button'
                    class={[
                      'send-picture-link send-picture-none',
                      classes.sendPictureLink,
                      classes.sendPictureNone,
                    ]}
                    data-test='send-picture-none'
                    onClick={remove}
                  >
                    {t('send-picture.none')}
                  </button>
                </div>,
                [[vShow, open.value]],
              )
            : null}
        </div>
      )
    }
  },
})
