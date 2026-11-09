// AI-GENERATED — not an architecture reference
import { BLink } from 'bootstrap-vue-next'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFilters } from '@/composables/useFilters'
import classes from './ParseMessage.module.scss'

const LINK_REGEX_PATTERN =
  /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*))/i

type MessagePart = { type: 'date' | 'link' | 'text' | 'amount'; text: string }

// Render a minimal, safe subset of markdown: **bold**. The text is
// HTML-escaped first, then only the bold markers become <strong>, so a
// message can never inject markup (messages come from users too).
//
// [\s\S] rather than . because the bold shortcut wraps whatever is selected,
// line breaks included: select two lines, press Cmd/Ctrl+B, and the markers
// end up around a newline. A dot does not match one, so that message arrived
// with its asterisks showing. The lazy quantifier still takes the shortest
// match, so two separate bold runs stay two.
const renderBold = (text: string) => {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped.replace(/\*\*([\s\S]+?)\*\*/g, '<strong>$1</strong>')
}

/**
 * The text of a thread message: links made clickable, bold markers rendered, and for a history
 * entry the date and the amount it carries in front of and behind the old text.
 */
export const ParseMessage = defineComponent({
  name: 'ParseMessage',
  props: {
    message: { type: String, required: true },
    type: { type: String, required: true },
  },
  setup(props) {
    const { d } = useI18n()
    const { GDD } = useFilters()

    const parsedMessage = computed<MessagePart[]>(() => {
      let string = props.message
      const linkified: MessagePart[] = []
      let amount: string | undefined
      if (props.type === 'HISTORY') {
        const split = string.split(/\n\s*---\n\s*/)
        string = split[1]
        linkified.push({ type: 'date', text: split[0].trim() })
        amount = split[2].trim()
      }
      let match: RegExpMatchArray | null
      while ((match = string.match(LINK_REGEX_PATTERN))) {
        const index = match.index ?? 0
        if (index > 0) {
          linkified.push({ type: 'text', text: string.substring(0, index) })
        }
        linkified.push({ type: 'link', text: match[0] })
        string = string.substring(index + match[0].length)
      }
      if (string.length > 0) {
        linkified.push({ type: 'text', text: string })
      }
      if (amount) {
        linkified.push({ type: 'amount', text: amount })
      }
      return linkified
    })

    return () => (
      <div class={['mt-1', 'message-body', classes['message-body']]}>
        {parsedMessage.value.map(({ type: messageType, text }, index) => (
          <span key={index}>
            {messageType === 'link' ? (
              <BLink href={text} target='_blank'>
                {text}
              </BLink>
            ) : messageType === 'date' ? (
              <span>
                {d(new Date(text), 'short')} <br />
              </span>
            ) : messageType === 'amount' ? (
              <span>
                <br /> {GDD(text)}
              </span>
            ) : (
              <span innerHTML={renderBold(text)} />
            )}
          </span>
        ))}
      </div>
    )
  },
})
