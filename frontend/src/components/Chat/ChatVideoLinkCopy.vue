<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- A button, not a link: it copies and opens nothing. Named for the ear and for the pointer
       ("Copy link"); the icon is for the eye only. -->
  <button
    type="button"
    class="chat-video-link-copy"
    :title="t('chatThread.videoCopyLink')"
    :aria-label="t('chatThread.videoCopyLink')"
    data-test="chat-video-link-copy"
    @click="copy"
  >
    <IBiCopy aria-hidden="true" />
  </button>
</template>

<script setup>
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
import { useI18n } from 'vue-i18n'
import { useAppToast } from '@/composables/useToast'
import { withoutChatVideoTime } from '@/utils/chatVideoTopic'

const props = defineProps({
  /** The link as the message carries it: an address of Gradido's own form (V4a, V5b). */
  href: { type: String, required: true },
})

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
</script>

<style lang="scss">
/* Block comments only: lightningcss parses SFC style blocks, and a double slash is not a comment
   to it.

   The link keeps room for the button at its end (ChatMessageText marks it), and the button stands
   in that room (margin-left, scoped below): a line may break before a button, and a link that
   reached the edge left the icon alone on the next line (measured in a group's narrower bubble,
   29.09.2026). The room at a link's end goes with its last character -- the line breaks inside the
   address rather than between the two -- and the button itself takes no width on the line. The
   gap of 0.3em between the address and the icon is the room's rest. Not scoped: the link is
   ChatMessageText's. */
.chat-message-text .chat-video-link {
  padding-right: 1.3em;
}
</style>

<style lang="scss" scoped>
/* Block comments only: lightningcss parses SFC style blocks, and a double slash is not a comment
   to it.

   Behind the link, in the link's colour: it belongs to the link, and green is what can be tapped
   here. The colour the way Bootstrap draws a link, so both themes follow the one token (--link,
   gradido-template-dark.scss); the picture view sets its caption's links and this alike
   (ChatImageView). */
.chat-video-link-copy {
  position: relative;
  margin-left: -1em;
  padding: 0;
  border: 0;
  background: none;
  color: rgba(var(--bs-link-color-rgb), var(--bs-link-opacity, 1));
  font: inherit;
  line-height: 1;
}

.chat-video-link-copy:hover {
  color: rgba(var(--bs-link-hover-color-rgb), var(--bs-link-opacity, 1));
}

/* The icon at the size of the letters, on their line, as the house's icons stand in text: 1em
   wide, as the margin above counts it. */
.chat-video-link-copy svg {
  width: 1em;
  height: 1em;
  vertical-align: -0.125em;
}

/* A place to tap larger than the icon, without taking room from the text: out to the right and a
   little up and down, and not to the left, where the link is. */
.chat-video-link-copy::after {
  content: '';
  position: absolute;
  inset: -0.4em -0.4em -0.4em 0;
}
</style>
