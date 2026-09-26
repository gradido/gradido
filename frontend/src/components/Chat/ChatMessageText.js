// AI-GENERATED — not an architecture reference
import { h } from 'vue'
import { useI18n } from 'vue-i18n'
import { chatTextParts } from '@/utils/chatTextParts'
import { chatVideoAppUrl, offersJitsiApp } from '@/utils/chatVideoApp'
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
 *
 * On a computer an invitation of our own gets a second way beside it (V4b): " · Open in the Jitsi
 * app", to the same room as `jitsi-meet://` (chatVideoApp) -- in the sender's own bubble too. The
 * first link stays as it is: whoever clicks chooses, and nothing is remembered (E-020). Its words
 * are the reader's, in the reader's language: they work the wallet, they are no part of the
 * message. ⛔ No `target`: an app's link opens no window, and `_blank` would leave an empty tab
 * behind in Chrome and Safari. Asked at every drawing whether this is a computer, nothing kept.
 */
export default {
  name: 'ChatMessageText',
  props: {
    text: { type: String, default: '' },
  },
  setup(props) {
    const { t } = useI18n()
    return () => {
      const offered = offersJitsiApp()
      return h(
        'span',
        { class: 'chat-message-text' },
        chatTextParts(props.text).flatMap((part) => {
          if (part.type === 'url') {
            const link = h(
              'a',
              { href: part.value, target: '_blank', rel: 'noopener noreferrer' },
              withoutChatVideoTopic(part.value),
            )
            const inApp = offered ? chatVideoAppUrl(part.value) : null
            if (!inApp) return [link]
            return [
              link,
              ' · ',
              h(
                'a',
                {
                  href: inApp,
                  class: 'chat-video-app-link',
                  title: t('chatThread.videoInAppHint'),
                },
                t('chatThread.videoInApp'),
              ),
            ]
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
    }
  },
}
