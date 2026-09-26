// AI-GENERATED — not an architecture reference
import { h, inject } from 'vue'
import { chatTextParts } from '@/utils/chatTextParts'
import { CHAT_VIDEO_JOIN, chatVideoAppUrl, offersJitsiApp } from '@/utils/chatVideoApp'
import { withoutChatVideoTopic } from '@/utils/chatVideoTopic'

/** A click that opens a link where it stands: no key held, the main button. The others -- a new
 * tab, a new window, a download -- are the browser's, and they go as they always did. */
const plainClick = (event) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

/**
 * The text of one chat message: plain text, bold runs as `<strong>`, and its web and e-mail
 * addresses as links.
 *
 * ⛔ Every piece is built with h() and reaches the page as text or as an attribute value --
 * never as markup, because the text comes from the other side of the conversation (see
 * chatTextParts). No `v-html`, no `innerHTML`.
 *
 * ⚠️ A render function rather than a template, for the reason MemoText gives: the house
 * formatter breaks lines around inline elements, and Vue turns such a break into a space.
 * Here it would even be SHOWN -- the bubble keeps the message's own line breaks and spaces
 * (`white-space: pre-wrap`), so a break the formatter put in would stand in the text.
 *
 * A video room's link SHOWS its server and room only (V4a): the topic's encoded addition after
 * `#` says nothing to anybody, and the invitation names the topic in words above it. The link
 * itself keeps the whole address -- the addition is what gives the meeting its title. Only that
 * one addition is left out of sight (`withoutChatVideoTopic`); every other address is shown as it
 * is. The thread only: memos and mails show addresses whole.
 *
 * On a computer a click on the link of an invitation of our own asks first (V4b, Bernd,
 * 26.09.2026): "Join call", with the box "Start in the Jitsi app" under it -- the question the
 * contact window provides (`CHAT_VIDEO_JOIN`), in the sender's own bubble too. The link itself
 * stays the room's address, so a click with a key held, the middle button and "copy link" work as
 * on any link. On a phone, and where no window provides the question, it opens the room straight
 * away, as it always did. Whether this is a computer is asked at the click, nothing kept.
 */
export default {
  name: 'ChatMessageText',
  props: {
    text: { type: String, default: '' },
  },
  setup(props) {
    const join = inject(CHAT_VIDEO_JOIN, null)
    return () =>
      h(
        'span',
        { class: 'chat-message-text' },
        chatTextParts(props.text).map((part) => {
          if (part.type === 'url') {
            const asks = join && chatVideoAppUrl(part.value) !== null
            return h(
              'a',
              {
                href: part.value,
                target: '_blank',
                rel: 'noopener noreferrer',
                ...(asks
                  ? {
                      onClick: (event) => {
                        if (!plainClick(event) || !offersJitsiApp()) return
                        event.preventDefault()
                        join(part.value)
                      },
                    }
                  : {}),
              },
              withoutChatVideoTopic(part.value),
            )
          }
          if (part.type === 'email') {
            return h('a', { href: `mailto:${part.value}` }, part.value)
          }
          if (part.type === 'bold') {
            return h('strong', part.value)
          }
          return part.value
        }),
      )
  },
}
