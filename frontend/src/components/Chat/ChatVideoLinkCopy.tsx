// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { withoutChatVideoTime } from '@/utils/chatVideoTopic'
import IBiCopy from '~icons/bi/copy'
import classes from './ChatVideoLinkCopy.module.scss'
import './ChatVideoLinkCopy.scss'

/**
 * The copy button behind a video room's link in a message (Bernd, 29.09.2026): "Ein Videolink
 * sollte immer auch eine Möglichkeit zum Kopieren des Links haben" -- to hand the same room on to
 * another chat, or to meet there again later. Everybody who reads the message has it, not only
 * whoever invited, in a conversation of two as in a group: ChatMessageText puts it behind every link
 * of Gradido's own form.
 *
 * It copies the room with its topic, without the time of a planned call (Bernd's choice,
 * `withoutChatVideoTime`): the address "Copy link" in the gear gives. The thread shows the room
 * only, so this is the one way to the meeting's title besides the browser's own "copy link
 * address".
 *
 * Say "copied" only once it is. Where the page is not served over TLS, and in some browsers built
 * into other apps, `navigator.clipboard` is not there at all -- the call throws before there is a
 * promise to reject (useCopyLinks). Then the member is asked to copy by hand: the room as shown is
 * a working address, only without the meeting's title.
 */
export const ChatVideoLinkCopy = defineComponent({
  name: 'ChatVideoLinkCopy',
  props: {
    /** The link as the message carries it: an address of Gradido's own form (V4a, V5b). */
    href: { type: String, required: true },
  },
  setup(props) {
    const { t } = useI18n()
    const { toastSuccess, toastError } = useAppToast()

    const copy = async () => {
      try {
        await navigator.clipboard.writeText(withoutChatVideoTime(props.href))
        toastSuccess(t('chatThread.videoLinkCopied'))
      } catch {
        toastError(t('gdd_per_link.not-copied'))
      }
    }

    return () => (
      // A button, not a link: it copies and opens nothing. Named for the ear and for the pointer
      // ("Copy link"); the icon is for the eye only.
      <button
        type='button'
        class={['chat-video-link-copy', classes['chat-video-link-copy']]}
        title={t('chatThread.videoCopyLink')}
        aria-label={t('chatThread.videoCopyLink')}
        data-test='chat-video-link-copy'
        onClick={copy}
      >
        <IBiCopy aria-hidden='true' />
      </button>
    )
  },
})
