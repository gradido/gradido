// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import classes from './ChatUnreadDot.module.scss'

/**
 * The gold dot at a contact who wrote something not read yet (mockup V03) -- a dot and not a
 * figure: how many conversations wait is the mark in the menu, this says which person.
 *
 * The number is the server's (`Contact.unreadChatMessages`), read off the row the list
 * delivered: the wallet keeps no book of its own, it asks again when the chat's beat sees
 * something move (useChatUpdates). Nothing below 1 is drawn, and nothing about the other
 * side -- their read pointer is theirs (E-016).
 */
export const ChatUnreadDot = defineComponent({
  name: 'ChatUnreadDot',
  props: {
    /** Messages from this person above the member's own read pointer. */
    count: { type: Number, default: 0 },
  },
  setup(props) {
    const { t } = useI18n()

    // A dot to the eye and a sentence to a screen reader, in ONE element: it stands inside the
    // button that opens the person, so the button's name says it -- "Lena … 2 new messages" --
    // and a dot without its sentence cannot come about.
    return () =>
      props.count > 0 ? (
        <span
          class={['chat-unread-contact-dot', classes['chat-unread-contact-dot']]}
          data-test='chat-unread-contact-dot'
        >
          <span class='visually-hidden'>
            {t('contacts.unreadChatMessages', { n: props.count }, props.count)}
          </span>
        </span>
      ) : null
  },
})
