// AI-GENERATED — not an architecture reference
import { useApolloClient, useMutation } from '@vue/apollo-composable'
import { BAvatar, BCol, BCollapse, BRow, type ColorVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ContributionMessagesList } from '@/components/ContributionMessages/ContributionMessagesList'
import type { ContributionMessage } from '@/components/ContributionMessages/ContributionMessagesListItem'
import contributionRowClasses from '@/components/Contributions/ContributionListItem.module.scss'
import CollapseIcon from '@/components/TransactionRows/CollapseIcon.vue'
import VariantIcon from '@/components/VariantIcon.vue'
import { fetchMemberAvatars } from '@/composables/useMemberAvatars'
import { useAppToast } from '@/composables/useToast'
import {
  closeSupportTicket,
  createSupportTicketMessage,
  listSupportTicketMessages,
} from '@/graphql/supportTickets.graphql'
import { creationGroupLabel } from '@/utils/creationGroupLabel'
import { supportTicketRefusal } from '@/utils/supportTicketRefusal'
import { SUPPORT_TICKET_SIGNS } from '@/utils/supportTicketStatus'
import { MESSAGE_MAX_CHARS } from '@/validationSchemas'
import IBiChatDots from '~icons/bi/chat-dots'
import IBiCheckLg from '~icons/bi/check-lg'
import classes from './SupportTicketListItem.module.scss'

/** A row of `listSupportTickets`: the list hands every field of it to this item by name. */
export type SupportTicketRow = {
  id: number
  text: string
  status: string
  createdAt: string
  creationGroupTag: string | null
  creationGroupName: string | null
}

// The member writes into an open request, one with a question back and a closed one -- writing
// opens it again --, never into a deleted one (SUA-010).
const REPLY_STATES = ['OPEN', 'IN_PROGRESS', 'CLOSED']
const CLOSABLE = ['OPEN', 'IN_PROGRESS']

/**
 * One of the member's own requests, in the form of a contribution's row. Its thread is asked for
 * when the member opens it -- unlike a contribution's, which comes with the list --, and again
 * when the list reports another state for it.
 */
export const SupportTicketListItem = defineComponent({
  name: 'SupportTicketListItem',
  props: {
    id: { type: Number, required: true },
    text: { type: String, required: true },
    status: { type: String, required: true },
    createdAt: { type: String, required: true },
    creationGroupTag: { type: String, default: null },
    creationGroupName: { type: String, default: null },
    messagesVisible: { type: Boolean, default: false },
  },
  emits: ['toggle-messages-visible', 'ticket-changed'],
  setup(props, { emit, expose }) {
    const { t, d } = useI18n()
    const { toastError, toastSuccess } = useAppToast()
    const { client: apolloClient } = useApolloClient()
    const { mutate: createMessageMutation } = useMutation(createSupportTicketMessage)
    const { mutate: closeMutation } = useMutation(closeSupportTicket)

    const localStatus = ref(props.status)
    watch(
      () => props.status,
      (status) => {
        localStatus.value = status
      },
    )
    const sign = computed(
      () => SUPPORT_TICKET_SIGNS[localStatus.value] ?? SUPPORT_TICKET_SIGNS.OPEN,
    )
    const groupLabel = computed(() =>
      props.creationGroupTag
        ? creationGroupLabel({ tag: props.creationGroupTag, name: props.creationGroupName })
        : '',
    )
    const hasThread = computed(() => localStatus.value !== 'DELETED')
    const closable = computed(() => CLOSABLE.includes(localStatus.value))

    const messages = ref<ContributionMessage[]>([])
    // Only the answer to the newest question is taken: a thread asked for again (another state
    // from the list) must not be overwritten by the answer to the question before.
    let asked = 0
    const loadThread = async () => {
      const question = ++asked
      try {
        const answer = await apolloClient.query({
          query: listSupportTicketMessages,
          variables: { supportTicketId: props.id },
          fetchPolicy: 'network-only',
        })
        if (question !== asked) {
          return
        }
        messages.value = answer.data.listSupportTicketMessages
        // The faces of the thread's authors in one go, once the thread is there (the thread's
        // own pieces never ask). Best effort: nobody loses a thread over a portrait.
        fetchMemberAvatars(
          apolloClient,
          messages.value.map((message) => ({
            gradidoID: message.userGradidoID,
            communityUuid: message.userCommunityUuid,
            avatarUpdatedAt: message.userAvatarUpdatedAt,
          })),
        )
      } catch (error) {
        if (question === asked) {
          toastError(supportTicketRefusal(t, error))
        }
      }
    }

    watch(
      () => props.messagesVisible,
      (visible) => {
        if (visible) {
          loadThread()
        }
      },
      { immediate: true },
    )
    watch(
      () => props.status,
      (status) => {
        // A deleted request shows no thread: what was loaded goes, and so does any answer
        // still on its way.
        if (status === 'DELETED') {
          asked += 1
          messages.value = []
          return
        }
        if (props.messagesVisible) {
          loadThread()
        }
      },
    )

    /** What the thread's reply field sends: the member's words in this request. */
    const send = async (message: string): Promise<ContributionMessage> => {
      try {
        const answer = await createMessageMutation({ supportTicketId: props.id, message })
        return answer?.data.createSupportTicketMessage
      } catch (error) {
        throw new Error(supportTicketRefusal(t, error))
      }
    }

    // The reply shows at once; then the thread is asked for again. A read still on its way left
    // before the reply and would come back without it -- the new read drops it, and its answer
    // holds the history and the reply alike.
    const addMessage = (message: ContributionMessage) => {
      messages.value = [...messages.value, message]
      localStatus.value = 'OPEN'
      loadThread()
      emit('ticket-changed')
    }

    const closing = ref(false)
    const close = async () => {
      if (closing.value) {
        return
      }
      closing.value = true
      try {
        await closeMutation({ supportTicketId: props.id })
        toastSuccess(t('support.closed'))
        localStatus.value = 'CLOSED'
      } catch (error) {
        toastError(supportTicketRefusal(t, error))
      } finally {
        closing.value = false
        emit('ticket-changed')
      }
    }

    const toggleMessages = () => emit('toggle-messages-visible')

    // The row's actions look as a contribution's do; role and keys make them reachable and usable
    // from the keyboard as well.
    const keyboardAction = (action: () => void) => ({
      role: 'button',
      tabindex: 0,
      class: classes.action,
      onKeydown: (event: KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          action()
        }
      },
    })

    expose({ localStatus, messages, close, addMessage })

    return () => (
      <div
        class={[
          'support-ticket-list-item',
          contributionRowClasses['contribution-list-item'],
          'bg-white app-box-shadow gradido-border-radius pt-3 px-3',
        ]}
      >
        <BRow>
          <BCol cols='3' lg='2' md='2'>
            <BAvatar rounded='lg' variant={sign.value.variant as ColorVariant} size='4.55em'>
              <VariantIcon icon={sign.value.icon} variant='white' />
            </BAvatar>
          </BCol>
          <BCol>
            <div class='small text-muted' data-test='support-ticket-number'>
              {t('support.number', { number: props.id })}
            </div>
            <div class='small'>{d(new Date(props.createdAt), 'short')}</div>
            <div class='mt-3 fw-bold'>
              {groupLabel.value ? (
                <span>{groupLabel.value}</span>
              ) : (
                <span class='fw-normal fst-italic text-muted'>
                  {t('contribution.creationGroup.none')}
                </span>
              )}
            </div>
            <div class={['mb-3 text-break word-break', classes.text]}>{props.text}</div>
            {localStatus.value === 'IN_PROGRESS' ? (
              <div
                {...keyboardAction(toggleMessages)}
                class='text-danger pointer hover-font-bold mb-3'
                data-test='support-answer-question'
                onClick={toggleMessages}
              >
                {t('support.answerQuestion')} <br /> {t('answerNow')}
              </div>
            ) : null}
          </BCol>
          <BCol cols='12' md='1' lg='1' class='text-end align-items-center'>
            {hasThread.value ? (
              <div {...keyboardAction(toggleMessages)} onClick={toggleMessages}>
                <CollapseIcon class='text-end' visible={props.messagesVisible} />
              </div>
            ) : null}
          </BCol>
        </BRow>
        {hasThread.value ? (
          <BRow class='p-2'>
            <BCol cols='6' class='text-center'>
              {closable.value ? (
                <div
                  {...keyboardAction(close)}
                  class='pointer d-flex flex-column align-items-center'
                  data-test='support-ticket-done'
                  onClick={close}
                >
                  {/* the large check: the plain one draws smaller than the chat sign beside it */}
                  <IBiCheckLg />
                  <div>{t('support.done')}</div>
                </div>
              ) : null}
            </BCol>
            <BCol cols='6' class='text-center'>
              <div
                {...keyboardAction(toggleMessages)}
                class='pointer d-flex flex-column align-items-center'
                data-test='support-ticket-chat'
                onClick={toggleMessages}
              >
                <IBiChatDots />
                <div>{t('Chat')}</div>
              </div>
            </BCol>
          </BRow>
        ) : null}
        <BCollapse modelValue={props.messagesVisible && hasThread.value}>
          <ContributionMessagesList
            messages={messages.value}
            status={localStatus.value}
            contributionId={props.id}
            replyStates={REPLY_STATES}
            send={send}
            maxLength={MESSAGE_MAX_CHARS}
            onClose-messages-list={toggleMessages}
            onAdd-contribution-message={addMessage}
          />
        </BCollapse>
        <div class='pb-3' />
      </div>
    )
  },
})
