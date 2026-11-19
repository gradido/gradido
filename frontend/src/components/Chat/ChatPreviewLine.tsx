// AI-GENERATED — not an architecture reference
import { computed, defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { CONTACT_META_SEPARATOR } from '@/components/Contacts/contactDisplay'
import { chatPreviewLine } from '@/utils/chatPreview'
import IMdiImageOutline from '~icons/mdi/image-outline'
import classes from './ChatPreviewLine.module.scss'

/**
 * The line under a name on "Kontakte & Chat" (E-083, Bernd, 23.10.2026): the beginning of the
 * latest message -- or, with a person, of the latest booking, where that came later --, so that
 * one sees at once what was last said. "Du: Danke, bis morgen!", "Elfi: Morgen um zehn?",
 * "20,00 GDD · Danke für Deine Hilfe".
 *
 * `preview` is a ChatPreview of the contact list or of the list of groups; `unread` whether it
 * waits unread for the member -- the row knows, from its own count.
 */
/**
 * A ChatPreview as its reader takes it (utils/chatPreview). The queries that deliver one are
 * untyped (.graphql), and the rows hand on what they got.
 */
type ChatPreview = Parameters<typeof chatPreviewLine>[0]

export const ChatPreviewLine = defineComponent({
  name: 'ChatPreviewLine',
  props: {
    preview: { type: Object as PropType<object>, required: true },
    unread: { type: Boolean, default: false },
  },
  setup(props) {
    const { t, n } = useI18n()

    const line = computed(() => chatPreviewLine(props.preview as ChatPreview, { t, n }))

    return () => (
      <span
        class={[
          'chat-preview-line small d-block',
          classes['chat-preview-line'],
          props.unread ? 'fw-semibold' : 'text-muted',
        ]}
        data-test='chat-preview-line'
      >
        {/* One line, cut off where it ends, in the size and colour of the lines around it -- dark and
            bold while what it shows waits unread. Its pieces carry the space or the dot after them
            IN themselves: Vue drops the space between two elements, and a screen reader would hear
            them run together. (Inside the line, not over it: a comment at the top would make the
            component a fragment, and the classes the row hands it would have nowhere to go.) */}
        {line.value.by ? (
          <span class='chat-preview-line-by' data-test='chat-preview-by'>
            {`${t('chatPreview.by', { name: line.value.by })} `}
          </span>
        ) : null}
        {line.value.picture ? (
          <IMdiImageOutline
            class='chat-preview-line-icon'
            aria-hidden='true'
            data-test='chat-preview-picture'
          />
        ) : null}
        {line.value.label ? (
          <span data-test='chat-preview-label'>
            {line.value.words ? `${line.value.label}${CONTACT_META_SEPARATOR}` : line.value.label}
          </span>
        ) : null}
        {line.value.words ? (
          <span class='chat-preview-line-words' data-test='chat-preview-words'>
            {line.value.words}
          </span>
        ) : null}
      </span>
    )
  },
})
