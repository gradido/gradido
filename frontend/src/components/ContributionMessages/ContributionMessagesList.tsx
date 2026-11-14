// AI-GENERATED — not an architecture reference
import { BButton } from 'bootstrap-vue-next'
import { defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { ContributionMessagesFormular } from '@/components/ContributionMessages/ContributionMessagesFormular'
import {
  type ContributionMessage,
  ContributionMessagesListItem,
} from '@/components/ContributionMessages/ContributionMessagesListItem'
import IBiArrowUpShort from '~icons/bi/arrow-up-short'
import classes from './ContributionMessagesList.module.scss'

/**
 * The thread under a contribution: its messages, the reply field while the contribution is
 * still open, and the button that folds the thread away again. Another thread (a support
 * request) names the states in which it takes a reply.
 */
export const ContributionMessagesList = defineComponent({
  name: 'ContributionMessagesList',
  props: {
    contributionId: { type: Number, required: true },
    status: { type: String, required: true },
    messages: { type: Array as PropType<ContributionMessage[]>, required: true },
    replyStates: {
      type: Array as PropType<string[]>,
      default: () => ['PENDING', 'IN_PROGRESS'],
    },
    // For the reply field, handed on by name: as attributes they would also land on this
    // component's own element, the function as its source text.
    send: {
      type: Function as PropType<(message: string) => Promise<ContributionMessage>>,
      default: undefined,
    },
    maxLength: { type: Number, default: undefined },
  },
  emits: ['close-messages-list'],
  setup(props, { emit, attrs }) {
    const { t } = useI18n()

    // `block` is no prop of BButton: it lands on the button as the empty attribute it was.
    const block = { block: '' } as object

    return () => (
      <div class='contribution-messages-list'>
        <div>
          {props.messages.map((message) => (
            <div key={message.id} class='mt-3'>
              <ContributionMessagesListItem message={message} />
            </div>
          ))}
        </div>
        <div>
          {/* What the row listens for on this thread (`add-contribution-message`) is the reply
              field's event: handed on as the attributes it arrives as, as `v-bind="$attrs"` did. */}
          {props.replyStates.includes(props.status) ? (
            <ContributionMessagesFormular
              contributionId={props.contributionId}
              send={props.send}
              maxLength={props.maxLength}
              {...attrs}
            />
          ) : null}
        </div>

        <div class={['text-center pointer', 'clearboth', classes.clearboth]}>
          <BButton variant='outline-primary' {...block} onClick={() => emit('close-messages-list')}>
            <IBiArrowUpShort /> {t('form.collapse')}
          </BButton>
        </div>
      </div>
    )
  },
})
