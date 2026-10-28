// AI-GENERATED — not an architecture reference
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { BContainer, BListGroup, BListGroupItem, BTooltip } from 'bootstrap-vue-next'
import {
  computed,
  defineComponent,
  nextTick,
  type PropType,
  ref,
  toDisplayString,
  useId,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { MemberRemarkEditor, MemberRemarkLine, MemberRemarkToggle } from '@/components/MemberRemark'
import { MemberWalletLink } from '@/components/MemberWalletLink'
import { fetchMemberAvatars } from '@/composables/useMemberAvatars'
import { useAppToast } from '@/composables/useToast'
import { useUserRemark } from '@/composables/useUserRemark'
import { CONFIG } from '@/config'
import IArcticonsCircles from '~icons/arcticons/circles'
import { adminListContributionMessages } from '../../graphql/adminListContributionMessages'
import { ContributionMessagesFormular } from './ContributionMessagesFormular'
import {
  type ContributionMessage,
  ContributionMessagesListItem,
} from './slots/ContributionMessagesListItem'

// The contribution as the tables hand it over; only what this list reads of it.
export type Contribution = {
  id: number
  memo: string
  userId: number
  contributionStatus: string
  createdAt: string
  user: {
    firstName?: string
    lastName?: string
    alias?: string | null
    publicName?: string
    createdAt: string
    userIdentifier?: string
    gradidoID?: string
    communityUuid?: string
    findableOnMap?: boolean | null
    emailContact: { email: string }
    [field: string]: unknown
  }
}

export const ContributionMessagesList = defineComponent({
  name: 'ContributionMessagesList',
  props: {
    contribution: {
      type: Object as PropType<Contribution>,
      required: true,
    },
    hideResubmission: {
      type: Boolean,
      required: true,
    },
    resubmissionAt: {
      type: String as PropType<string | null>,
      required: false,
    },
  },
  emits: ['update-status', 'reload-contribution', 'update-contributions', 'resubmission-saved'],
  setup(props, { emit }) {
    const { t } = useI18n()
    const email = computed(() => {
      return props.contribution.user.emailContact.email
    })
    const { toastError } = useAppToast()
    const mailtoLink = computed(() => {
      return `mailto:${email.value}`
    })
    const searchLink = computed(() => {
      return `/user?search=${email.value}`
    })
    const humhubProfileLink = computed(() => {
      if (CONFIG.HUMHUB_ACTIVE !== true) {
        return undefined
      }
      let url = CONFIG.HUMHUB_API_URL
      if (url.endsWith('/')) {
        url = url.slice(0, -1)
      }
      return `${url}/u/${props.contribution.user.userIdentifier}`
    })

    const { client: apolloClient } = useApolloClient()

    const messages = ref<ContributionMessage[]>([])

    // How the card speaks of the member: as the pin and the arrow name them.
    const memberName = computed(
      () => props.contribution.user.alias || props.contribution.user.firstName || '',
    )

    // The moderation's remark on the member (Bernd, 28.10.2026): read with the messages, in the
    // same answer, so that the card takes its shape once and not twice.
    const remark = useUserRemark(
      () => props.contribution.userId,
      () => toastError(t('remark.failedClosed', { name: memberName.value })),
    )
    const remarkFieldId = useId()
    const remarkToggle = ref<{ $el?: HTMLElement } | null>(null)
    // "Fertig" or Escape: the field closes, and the keyboard goes back to the button that opened it.
    const closeRemark = () => {
      remark.close()
      nextTick(() => remarkToggle.value?.$el?.focus())
    }

    // The member the question is about: its answer is that member's remark, whatever the card
    // shows by the time it comes.
    const askedAbout = props.contribution.userId
    const { onResult, onError, result, refetch } = useQuery(
      adminListContributionMessages,
      {
        contributionId: props.contribution.id,
        userId: askedAbout,
      },
      {
        fetchPolicy: 'no-cache',
      },
    )

    onError((error) => {
      toastError(error.message)
    })

    onResult(() => {
      messages.value = result.value.adminListContributionMessages.messages
      remark.take(askedAbout, result.value.userRemark ?? null)
      // The faces of everybody who wrote in this thread, in one round trip. Each message carries
      // a DATE, not a picture: everything already held under that date needs nothing, so opening
      // the same thread twice asks for nothing at all.
      fetchMemberAvatars(
        apolloClient,
        messages.value.map((message) => ({
          gradidoID: message.userGradidoID,
          communityUuid: message.userCommunityUuid,
          avatarUpdatedAt: message.userAvatarUpdatedAt,
        })),
      )
    })

    const updateStatus = (id: number) => {
      emit('update-status', id)
    }

    const reloadContribution = (id: number) => {
      emit('reload-contribution', id)
    }

    const updateContributions = () => {
      emit('update-contributions')
    }

    return () => (
      <div class='contribution-messages-list'>
        <BListGroup>
          {/* The parts of the member line stand side by side at the desk and wrap on a phone,
              each as a whole. The username keeps its buttons beside it where the line has room
              -- on a narrow phone they go to the next line together; the space between is the
              one their keyboard ring stands in (MemberWalletLink.module.css). */}
          <BListGroupItem class='d-flex flex-wrap align-items-center column-gap-3 row-gap-1'>
            {/* `title` is no prop of RouterLink: it falls through to the anchor. */}
            <RouterLink to={searchLink.value} title={t('goTo.userSearch')}>
              {/* toDisplayString: as {{ }} did, a name that is null shows as nothing, not as 'null' */}
              {`${toDisplayString(props.contribution.user.firstName)} ${toDisplayString(props.contribution.user.lastName)}`}
            </RouterLink>
            <a href={mailtoLink.value} class='text-break'>
              {email.value}
            </a>
            <span>
              {`${toDisplayString(props.contribution.user.publicName)} `}
              {/* One line for the buttons: the remark's stands behind the pin and the arrow or the
                  bubble, and never alone on a line of its own. */}
              <span class='text-nowrap'>
                <MemberWalletLink
                  member={props.contribution.user}
                  name={props.contribution.user.alias || props.contribution.user.firstName}
                />
                <MemberRemarkToggle
                  ref={remarkToggle}
                  state={remark}
                  name={memberName.value}
                  controls={remarkFieldId}
                />
              </span>
            </span>
            <span>
              {humhubProfileLink.value ? (
                <a id='humhub-username' href={humhubProfileLink.value} target='_blank'>
                  <IArcticonsCircles class='svg-icon' />
                </a>
              ) : null}
              {/* ⚠️ `triggers` is no prop of BTooltip in bootstrap-vue-next 0.26: it lands on the
                  element as a plain attribute and changes nothing. Kept as it was. */}
              <BTooltip target='humhub-username' {...{ triggers: 'hover' }}>
                {t('goTo.humhubProfile')}
              </BTooltip>
            </span>
          </BListGroupItem>
          {/* The remark under the member line -- or, while it is written, the field in its place. */}
          {remark.open.value ? (
            <MemberRemarkEditor
              state={remark}
              name={memberName.value}
              fieldId={remarkFieldId}
              onDone={closeRemark}
            />
          ) : (
            <MemberRemarkLine state={remark} />
          )}
          <BListGroupItem>
            {`${t('registered')}: ${new Date(props.contribution.user.createdAt).toLocaleDateString()}, ${t('createdAt')}: ${new Date(props.contribution.createdAt).toLocaleDateString()}`}
          </BListGroupItem>
        </BListGroup>
        <BContainer>
          {messages.value.map((message) => (
            <div key={message.id as number}>
              <ContributionMessagesListItem
                message={message}
                contributionUserId={props.contribution.userId}
              />
            </div>
          ))}
        </BContainer>
        {props.contribution.contributionStatus === 'PENDING' ||
        props.contribution.contributionStatus === 'IN_PROGRESS' ? (
          <div>
            <ContributionMessagesFormular
              contributionId={props.contribution.id}
              contributionMemo={props.contribution.memo}
              hideResubmission={props.hideResubmission}
              inputResubmissionDate={props.resubmissionAt}
              onGet-list-contribution-messages={refetch}
              onUpdate-status={updateStatus}
              onReload-contribution={reloadContribution}
              onUpdate-contributions={updateContributions}
              onResubmission-saved={(event: unknown) => emit('resubmission-saved', event)}
            />
          </div>
        ) : null}
      </div>
    )
  },
})
