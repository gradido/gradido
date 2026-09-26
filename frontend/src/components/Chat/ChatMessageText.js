// AI-GENERATED — not an architecture reference
import { h } from 'vue'
import { chatTextParts } from '@/utils/chatTextParts'
import { withoutChatVideoTopic } from '@/utils/chatVideoTopic'

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
 */
export default {
  name: 'ChatMessageText',
  props: {
    text: { type: String, default: '' },
  },
  setup(props) {
    return () =>
      h(
        'span',
        { class: 'chat-message-text' },
        chatTextParts(props.text).map((part) => {
          if (part.type === 'url') {
            return h(
              'a',
              { href: part.value, target: '_blank', rel: 'noopener noreferrer' },
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
