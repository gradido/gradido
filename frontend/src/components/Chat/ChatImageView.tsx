// AI-GENERATED — not an architecture reference
import { useApolloClient } from '@vue/apollo-composable'
import { BModal } from 'bootstrap-vue-next'
import {
  computed,
  defineComponent,
  nextTick,
  onBeforeUnmount,
  ref,
  shallowRef,
  watch,
  withModifiers,
} from 'vue'
import { useI18n } from 'vue-i18n'
import ChatMessageText from '@/components/Chat/ChatMessageText'
import {
  chatImage,
  chatImageViewState,
  closeChatImageView,
  requestChatImage,
} from '@/composables/useChatImages'
import IMdiClose from '~icons/mdi/close'
import './ChatImageView.scss'

/** What the view is opened with (useChatImages, `openChatImageView`). */
type ChatImageViewed = {
  imageUuid: string
  width: number
  height: number
  who: string
  name: string
  at: string
  caption?: string
  opener?: HTMLElement | null
}

/**
 * The one large view of a thread, driven from useChatImages (`openChatImageView`), so the logout
 * can close it wherever it is (store.js, beside closeAvatarZoom).
 */
export const ChatImageView = defineComponent({
  name: 'ChatImageView',
  setup() {
    const { t, d } = useI18n()
    const { client } = useApolloClient()

    /**
     * What is shown -- held here until the dialog has faded out, so the picture does not vanish from
     * a dialog still on its way out. Taken from the shared state when it opens.
     */
    const shown = shallowRef<ChatImageViewed | null>(null)
    const open = computed(() => Boolean(chatImageViewState.value))
    watch(
      chatImageViewState,
      (view: ChatImageViewed | null) => {
        if (!view) {
          return
        }
        shown.value = view
        // Here or on its way already, as a rule -- its bubble was in sight to be tapped. Where its
        // question failed, it is asked once more.
        requestChatImage(client, view.imageUuid)
      },
      { immediate: true },
    )

    const src = computed<string | null>(() => {
      const known = shown.value ? chatImage(shown.value.imageUuid) : null
      return known?.state === 'ready' ? known.src : null
    })

    /** "Bild von {name}": the dialog's name, as it has no header of its own. */
    const title = computed(() =>
      shown.value ? t('chatThread.imageViewTitle', { name: shown.value.name }) : '',
    )

    /** When it arrived on this server (E-018), day and time, as the thread says them. */
    const when = computed(() => {
      if (!shown.value) {
        return ''
      }
      const at = new Date(shown.value.at)
      return `${d(at, 'short')}, ${d(at, 'time')}`
    })

    /**
     * The picture's proportions, and twice its size, for the stylesheet: on a phone it grows to fill
     * the screen; at the desk it stops at twice its size -- a picture of 800 pixels blown up to a large
     * screen shows its blocks, not its subject.
     */
    const measure = computed(() =>
      shown.value
        ? {
            '--chat-image-ratio': String(shown.value.width / shown.value.height),
            '--chat-image-twice': `${shown.value.width * 2}px`,
          }
        : {},
    )

    const closeButton = ref<HTMLButtonElement | null>(null)

    /** The focus on "Schließen" once the dialog is there -- the one control it has. */
    const focusClose = () => closeButton.value?.focus({ preventScroll: true })

    const close = () => closeChatImageView()
    /** `@click.self`: a press on the ground itself, not on what stands on it. */
    const closeOnSelf = withModifiers(close, ['self'])

    /** Esc, or anything else the dialog closes on itself. */
    const onModel = (value: boolean) => {
      if (!value) {
        closeChatImageView()
      }
    }

    /**
     * Gone: the focus back to the picture in its bubble -- not left on <body>, which a browser that
     * does not focus a tapped button (Safari) would leave it on. A bubble that has gone meanwhile takes
     * no focus, and the focus stays where it is.
     */
    const letGo = async () => {
      const opener = shown.value?.opener
      shown.value = null
      await nextTick()
      opener?.focus({ preventScroll: true })
    }

    // ⛔ The state lives at module level and outlives this view: closing it with the view keeps a
    // picture from opening by itself the next time a thread is made.
    onBeforeUnmount(closeChatImageView)

    return () => (
      // The picture of a chat message, large (E-044 F4; the mockup, "Großansicht beim Antippen"):
      // who sent it and when, "Schließen", the picture over the whole screen in its proportions, its
      // caption under it. No "Speichern" (E-044 F4).
      //
      // ⛔ A dialog STACKED on the contact window, as the file hint and the video question are --
      // not an overlay of its own at <body>, as AvatarZoom is. Measured in Chrome (P7c): the contact
      // window's focus trap pulls the focus back out of any element outside it, and an Esc then
      // closed the contact window as well. A second BModal is a second trap on the same stack: the
      // window's trap pauses while this one is open, Esc closes this one only, and the focus goes
      // back to where it was when this one opened -- the picture in its bubble. BModal brings the
      // rest: it is put at <body>, `role="dialog"`, the page behind does not scroll. `aria-modal` it
      // does not set (bootstrap-vue-next 0.26.8: only its offcanvas does), so it is written here and
      // lands on the dialog's element, as `aria-label` does.
      <BModal
        modelValue={open.value}
        fullscreen
        no-header
        no-footer
        autofocus={false}
        aria-modal='true'
        aria-label={title.value}
        content-class='chat-image-view-content'
        body-class='chat-image-view-body'
        data-test='chat-image-view'
        onUpdate:modelValue={onModel}
        onShown={focusClose}
        onHidden={letGo}
      >
        {shown.value ? (
          <div class='chat-image-view' onClick={closeOnSelf}>
            <div class='chat-image-view-bar' onClick={closeOnSelf}>
              <div class='chat-image-view-who' data-test='chat-image-view-who'>
                {shown.value.who}
                <small data-test='chat-image-view-when'>{when.value}</small>
              </div>
              <button
                ref={closeButton}
                type='button'
                class='chat-image-view-close'
                aria-label={t('form.close')}
                title={t('form.close')}
                data-test='chat-image-view-close'
                onClick={close}
              >
                <IMdiClose class='chat-image-view-close-icon' aria-hidden='true' />
              </button>
            </div>
            <div class='chat-image-view-stage' style={measure.value} onClick={closeOnSelf}>
              {src.value ? (
                <img
                  class='chat-image-view-picture'
                  src={src.value}
                  width={shown.value.width}
                  height={shown.value.height}
                  alt=''
                  data-test='chat-image-view-picture'
                />
              ) : (
                <span class='chat-image-view-waiting' data-test='chat-image-view-waiting' />
              )}
            </div>
            {shown.value.caption ? (
              <div class='chat-image-view-caption' data-test='chat-image-view-caption'>
                <ChatMessageText text={shown.value.caption} />
              </div>
            ) : null}
          </div>
        ) : null}
      </BModal>
    )
  },
})
