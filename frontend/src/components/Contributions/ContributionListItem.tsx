// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import { BAvatar, BCol, BCollapse, BRow, type ColorVariant } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ContributionMessagesList } from '@/components/ContributionMessages/ContributionMessagesList'
import type { ContributionMessage } from '@/components/ContributionMessages/ContributionMessagesListItem'
import type { ContributionEditItem } from '@/components/Contributions/ContributionEdit'
import CollapseIcon from '@/components/TransactionRows/CollapseIcon.vue'
import VariantIcon from '@/components/VariantIcon.vue'
import { useContributionStatus } from '@/composables/useContributionStatus'
import { useFilters } from '@/composables/useFilters'
import { useAppToast } from '@/composables/useToast'
import { GDD_PER_HOUR } from '@/constants'
import { deleteContribution } from '@/graphql/contributions.graphql'
import { creationGroupLabels } from '@/utils/creationGroupLabel'
import IBiChatDots from '~icons/bi/chat-dots'
import IBiPencil from '~icons/bi/pencil'
import IBiTrash from '~icons/bi/trash'
import classes from './ContributionListItem.module.scss'

/** A creation group as the wallet's queries select it. */
export type CreationGroup = { tag: string; name: string | null }

/** A row of `listContributions`: the list hands every field of it to this item by name. */
export type ContributionRow = ContributionEditItem & {
  creationGroups: CreationGroup[]
  contributionStatus: string
  messagesCount: number
  messages: ContributionMessage[] | null
  updatedBy: number | null
  moderatorId: number | null
}

const SETTLED = ['CONFIRMED', 'DELETED']

/** One of the member's own contributions, with the thread of messages about it. */
export const ContributionListItem = defineComponent({
  name: 'ContributionListItem',
  props: {
    id: { type: Number, required: true },
    amount: { type: String, required: true },
    memo: { type: String, required: true },
    messages: { type: Array as PropType<ContributionMessage[] | null>, default: () => [] },
    contributionDate: { type: String, required: true },
    updatedBy: { type: Number as PropType<number | null>, default: 0 },
    contributionStatus: { type: String, default: '' },
    messagesCount: { type: Number, default: 0 },
    moderatorId: { type: Number as PropType<number | null>, default: 0 },
    messagesVisible: { type: Boolean, default: false },
    creationGroups: { type: Array as PropType<CreationGroup[]>, default: () => [] },
  },
  emits: ['toggle-messages-visible', 'update-contribution-form', 'contribution-changed'],
  setup(props, { emit, expose }) {
    // Group functions: the contribution's group takes the place of the old, unhelpful
    // "contribution text" heading. Several groups are listed one after another.
    const groupLabel = computed(() => creationGroupLabels(props.creationGroups))

    const { toastError, toastSuccess } = useAppToast()
    const { t, d } = useI18n()
    const { GDD } = useFilters()
    const { getVariant, getIcon } = useContributionStatus()

    const { mutate: deleteContributionMutation } = useMutation(deleteContribution)

    const localMessages = ref<ContributionMessage[]>([])
    const localStatus = ref(props.contributionStatus)
    const variant = computed(() => getVariant(props.contributionStatus))
    const icon = computed(() => getIcon(props.contributionStatus))

    // if parent reload messages, update local messages copy
    watch(
      () => props.messages,
      () => {
        if (props.messages && props.messages.length > 0) {
          localMessages.value = [...props.messages]
        }
      },
      { immediate: true },
    )

    watch(
      () => props.contributionStatus,
      () => {
        localStatus.value = props.contributionStatus
      },
    )

    const hours = computed(() => parseFloat((Number(props.amount) / GDD_PER_HOUR).toFixed(2)))
    const settled = computed(() => SETTLED.includes(localStatus.value))
    const mayChange = computed(() => !settled.value && !props.moderatorId)
    const hasThread = computed(() => props.messagesCount > 0 && !props.moderatorId)

    const processDeleteContribution = async () => {
      if (window.confirm(t('contribution.delete'))) {
        try {
          await deleteContributionMutation({ id: props.id })
          toastSuccess(t('contribution.deleted'))
          localStatus.value = 'DELETED'
          emit('contribution-changed')
        } catch (err) {
          toastError((err as Error).message)
        }
      }
    }

    const addContributionMessage = (message: ContributionMessage) => {
      localMessages.value.push(message)
      localStatus.value = 'PENDING'
      emit('contribution-changed')
    }

    const toggleMessages = () => emit('toggle-messages-visible')

    expose({ icon, variant, localStatus, addContributionMessage })

    return () => (
      <div>
        <div
          class={[
            'contribution-list-item',
            classes['contribution-list-item'],
            'bg-white app-box-shadow gradido-border-radius pt-3 px-3',
            localStatus.value === 'IN_PROGRESS' ? 'pulse border border-205' : '',
          ]}
        >
          <BRow>
            <BCol cols='3' lg='2' md='2'>
              {/* `205` is a colour of the wallet's own, not one of Bootstrap's. */}
              <BAvatar rounded='lg' variant={variant.value as ColorVariant} size='4.55em'>
                <VariantIcon icon={icon.value} variant='white' />
              </BAvatar>
            </BCol>
            <BCol>
              {/* The number identifies the contribution in the community list, where no name
                  is shown. Its author can quote it if they want to be identified there. */}
              <div class='small text-muted' data-test='contribution-number'>
                {t('contribution.number', { number: props.id })}
              </div>
              <div class='small'>{d(new Date(props.contributionDate), 'short')}</div>
              <div class='mt-3 fw-bold'>
                {groupLabel.value ? (
                  <span>{groupLabel.value}</span>
                ) : (
                  <span class='fw-normal fst-italic text-muted'>
                    {t('contribution.creationGroup.none')}
                  </span>
                )}
              </div>
              <div class='mb-3 text-break word-break'>{props.memo}</div>
              {(props.updatedBy ?? 0) > 0 ? (
                <div class='mt-2 mb-2 small'>{t('moderatorChangedMemo')}</div>
              ) : null}
              {localStatus.value === 'IN_PROGRESS' ? (
                <div class='text-danger pointer hover-font-bold' onClick={toggleMessages}>
                  {t('contribution.alert.answerQuestion')} <br /> {t('answerNow')}
                </div>
              ) : null}
            </BCol>
            <BCol cols='9' md='3' lg='3' offset='3' offsetMd='0' offsetLg='0'>
              <div class='small'>
                {`${t('creation')} ${t('(')}${hours.value} ${t('h')}${t(')')}`}
              </div>
              {localStatus.value === 'DELETED' ? (
                <div class='small'>{t('contribution.deleted')}</div>
              ) : (
                <div class='fw-bold'>{GDD(props.amount)}</div>
              )}
            </BCol>
            <BCol cols='12' md='1' lg='1' class='text-end align-items-center'>
              {hasThread.value ? (
                <div onClick={toggleMessages}>
                  <CollapseIcon class='text-end' visible={props.messagesVisible} />
                </div>
              ) : null}
            </BCol>
          </BRow>
          {!settled.value || props.messagesCount > 0 ? (
            <BRow class='p-2'>
              <BCol cols='4' class='text-center'>
                {mayChange.value ? (
                  <div
                    class='test-delete-contribution pointer d-flex flex-column align-items-center'
                    onClick={processDeleteContribution}
                  >
                    <IBiTrash />
                    <div>{t('delete')}</div>
                  </div>
                ) : null}
              </BCol>
              <BCol cols='4' class='text-center'>
                {mayChange.value ? (
                  <div
                    class='test-edit-contribution pointer d-flex flex-column align-items-center'
                    onClick={() =>
                      emit('update-contribution-form', {
                        id: props.id,
                        contributionDate: props.contributionDate,
                        memo: props.memo,
                        amount: props.amount,
                      })
                    }
                  >
                    <IBiPencil />
                    <div>{t('edit')}</div>
                  </div>
                ) : null}
              </BCol>
              <BCol cols='4' class='text-center'>
                {hasThread.value ? (
                  <div
                    class='pointer d-flex flex-column align-items-center'
                    onClick={toggleMessages}
                  >
                    <IBiChatDots />
                    <div>{t('Chat')}</div>
                  </div>
                ) : null}
              </BCol>
            </BRow>
          ) : null}
          <BCollapse modelValue={props.messagesVisible}>
            {props.messagesCount > 0 ? (
              <ContributionMessagesList
                messages={localMessages.value}
                status={localStatus.value}
                contributionId={props.id}
                onClose-messages-list={toggleMessages}
                onAdd-contribution-message={addContributionMessage}
              />
            ) : null}
          </BCollapse>
          <div class='pb-3' />
        </div>
      </div>
    )
  },
})
