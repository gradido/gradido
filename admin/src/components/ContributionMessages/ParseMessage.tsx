// AI-GENERATED — not an architecture reference
import { BLink } from 'bootstrap-vue-next'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import classes from './ParseMessage.module.css'

const LINK_REGEX_PATTERN =
  /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*))/i

type MessagePart = { type: 'text' | 'link' | 'date' | 'amount'; text: string }

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

export const ParseMessage = defineComponent({
  name: 'ParseMessage',
  props: {
    message: {
      type: String,
      required: true,
    },
    // The message's own field, as the server names it and as the wallet's twin takes it: the
    // message object is handed over whole (v-bind), so a prop under another name never arrived,
    // and a change of a contribution showed its raw text, dashes and all (Bernd, 25.10.2026).
    type: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { d, n } = useI18n()

    const parsedMessage = computed(() => {
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

    const renderPart = ({ type, text }: MessagePart) => {
      if (type === 'link') {
        return (
          <BLink href={text} target='_blank'>
            {text}
          </BLink>
        )
      }
      if (type === 'date') {
        return (
          <span>
            {`${d(new Date(text), 'short')} `}
            <br />
          </span>
        )
      }
      if (type === 'amount') {
        return (
          <span>
            <br />
            {` ${n(Number(text), 'decimal')} GDD`}
          </span>
        )
      }
      return <span innerHTML={renderBold(text)} />
    }

    return () => (
      <div class={['mt-2', classes.messageBody]}>
        {parsedMessage.value.map((part, index) => (
          <span key={index}>{renderPart(part)}</span>
        ))}
      </div>
    )
  },
})
