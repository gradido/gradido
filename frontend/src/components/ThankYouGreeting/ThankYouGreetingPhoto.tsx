// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { computed, defineComponent, onBeforeUnmount, onMounted, type PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { greetingPicture, requestGreetingPicture } from '@/composables/useGreetingPictures'
import { requestTransactionPicture, transactionPicture } from '@/composables/useTransactionPictures'
import { THANK_YOU_MOTIF_HEIGHT, THANK_YOU_MOTIF_WIDTH } from '@/utils/thankYouMotifs'
import classes from './ThankYouGreetingPhoto.module.scss'

/**
 * The photo of a thank-you greeting in its small rendition, in a place the member has a right
 * to see it after the link is made: the list of one's own links, and the bubble of the
 * booking in the conversation (ZE-019). Asked for by the id of the link once the place is in
 * sight (useGreetingPictures), as a chat's picture is.
 *
 * And the photo a member sent with a transfer, in the same places' way: asked for by the id
 * of the BOOKING (`transaction-id`, useTransactionPictures) -- another range of numbers, and
 * another store.
 *
 * The size and the corners are the place's own: the class the parent writes on this lands on
 * whichever element stands here. The room is there before the photo has come, in the colour
 * of the card -- and stays so where none comes.
 */
export const ThankYouGreetingPhoto = defineComponent({
  name: 'ThankYouGreetingPhoto',
  props: {
    /** The id of the link the greeting was made as: what the server serves the photo by. */
    linkId: { type: Number as PropType<number | null>, default: null },
    /**
     * For the photo sent with a transfer instead: the id of the member's own row of the booking.
     * ⛔ Where it is given, the photo is asked for and looked up by IT alone -- never by `linkId`:
     * a link and a booking with the same number have nothing to do with each other.
     */
    transactionId: { type: Number as PropType<number | null>, default: null },
    /** "Foto von {name}", with the user name of whoever sent the greeting. */
    alt: { type: String, required: true },
    /** Whether "Bild nicht verfügbar" stands in the room itself -- not in one as small as a list's. */
    saysMissing: { type: Boolean, default: false },
  },
  setup(props) {
    const { t } = useI18n()
    const { client } = useApolloClient()

    const room = ref<HTMLSpanElement | null>(null)
    const ofTransfer = computed(() => props.transactionId !== null)
    const known = computed(() =>
      ofTransfer.value ? transactionPicture(props.transactionId) : greetingPicture(props.linkId),
    )
    const src = computed(() => (known.value?.state === 'ready' ? known.value.src : null))
    const missing = computed(() => known.value?.state === 'missing')

    const request = () =>
      ofTransfer.value
        ? requestTransactionPicture(client, props.transactionId)
        : requestGreetingPicture(client, props.linkId)

    /**
     * Asked for once its place is in sight: a long conversation opened at its end does not fetch the
     * photos of its beginning. Where the browser has no IntersectionObserver, when it is drawn. A
     * photo that is here or on its way already is not asked for again (useGreetingPictures).
     */
    let watcher: IntersectionObserver | null = null
    onMounted(() => {
      // Here already -- one's own, kept from what the wallet sent, or fetched before.
      if (!room.value) {
        return
      }
      if (typeof IntersectionObserver === 'undefined') {
        request()
        return
      }
      watcher = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return
        }
        watcher?.disconnect()
        watcher = null
        request()
      })
      watcher.observe(room.value)
    })
    onBeforeUnmount(() => watcher?.disconnect())

    return () =>
      src.value ? (
        <img
          class={['thank-you-greeting-photo', classes['thank-you-greeting-photo']]}
          src={src.value}
          alt={props.alt}
          width={THANK_YOU_MOTIF_WIDTH}
          height={THANK_YOU_MOTIF_HEIGHT}
          data-test='thank-you-greeting-photo'
        />
      ) : (
        <span
          ref={room}
          class={[
            'thank-you-greeting-photo is-waiting',
            classes['thank-you-greeting-photo'],
            { 'is-missing': missing.value },
          ]}
          data-test='thank-you-greeting-photo-room'
        >
          {/* The server gave nothing for it: the sentence the chat says of a picture that is gone --
              in the room itself where the room is large enough to hold it (`says-missing`). */}
          {missing.value && props.saysMissing ? (
            <span class='thank-you-greeting-photo-missing'>{t('chatThread.imageMissing')}</span>
          ) : null}
        </span>
      )
  },
})
