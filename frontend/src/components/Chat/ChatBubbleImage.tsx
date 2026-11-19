// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import {
  type CSSProperties,
  computed,
  defineComponent,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { chatImage, requestChatImage } from '@/composables/useChatImages'
import classes from './ChatBubbleImage.module.scss'

/** A class by its name and in the module's spelling: the stylesheet's rules hang on the latter. */
const c = (name: string) => [name, classes[name]]

/** One of `message.images`. */
interface ChatImage {
  imageUuid: string
  width: number
  height: number
}

/**
 * The picture of one chat message, fetched when its bubble comes into sight (useChatImages) and
 * shown in the room its size gives it. `open` says the member wants it large, with the button
 * that was pressed, which the large view hands the focus back to.
 */
export const ChatBubbleImage = defineComponent({
  name: 'ChatBubbleImage',
  props: {
    /** One of `message.images`: `{ imageUuid, width, height }`. */
    image: { type: Object as PropType<ChatImage>, required: true },
  },
  emits: ['open'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const { client } = useApolloClient()

    const root = ref<HTMLElement | null>(null)
    const known = computed(() => chatImage(props.image.imageUuid))
    const src = computed<string | null>(() =>
      known.value?.state === 'ready' ? known.value.src : null,
    )
    /** The server gave nothing for it -- "Bild nicht verfügbar", in the room the picture would have had. */
    const missing = computed(() => known.value?.state === 'missing')

    /** The picture's proportions, for the room it is given before and after it has come. */
    const room = computed<CSSProperties>(() => ({
      aspectRatio: `${props.image.width} / ${props.image.height}`,
    }))

    /**
     * Its proportions as a number, and twice its size, for the width the stylesheet gives it -- the
     * names and the measure the large view has (ChatImageView).
     */
    const size = computed(
      () =>
        ({
          '--chat-image-ratio': String(props.image.width / props.image.height),
          '--chat-image-twice': `${props.image.width * 2}px`,
        }) as CSSProperties,
    )

    const request = () => requestChatImage(client, props.image.imageUuid)

    /**
     * Asked for once its bubble is in sight: a long thread opened at its end does not fetch the
     * pictures of its beginning. Where the browser has no IntersectionObserver, when it is drawn. A
     * picture that is here or on its way already is not asked for again (useChatImages).
     */
    let watcher: IntersectionObserver | null = null
    onMounted(() => {
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
      watcher.observe(root.value as HTMLElement)
    })
    onBeforeUnmount(() => watcher?.disconnect())

    // The picture of a message, in its bubble (E-044 F3/F5; the mockup, "Bilder im Faden"): as
    // large as a greeting's picture stands, and whole (Bernd, 17.10.2026) -- a tall screenshot
    // shows its top, and all of it in the large view a tap opens. A button, because a tap on it
    // does something.
    return () =>
      missing.value ? (
        <div
          ref={root}
          class={[c('chat-bubble-image'), c('is-missing')]}
          style={[room.value, size.value]}
          data-test='chat-bubble-image-missing'
        >
          {t('chatThread.imageMissing')}
        </div>
      ) : (
        <button
          ref={root}
          type='button'
          class={c('chat-bubble-image')}
          aria-label={t('chatThread.imageOpen')}
          title={t('chatThread.imageOpen')}
          style={size.value}
          data-test='chat-bubble-image'
          onClick={(event: MouseEvent) => emit('open', event.currentTarget)}
        >
          {/* ⛔ Width and height from the message, as attributes and as its proportions: the bubble
              has its size before the picture has come, so nothing below it jumps when it does. Until
              then a quiet surface -- no spinner. `alt=""`: the button names what it does, and the
              caption under it says what the picture is about, where the sender wrote one. */}
          <img
            class={[c('chat-bubble-image-picture'), !src.value ? c('is-waiting') : '']}
            src={src.value || undefined}
            width={props.image.width}
            height={props.image.height}
            style={room.value}
            alt=''
            data-test='chat-bubble-image-picture'
          />
        </button>
      )
  },
})
