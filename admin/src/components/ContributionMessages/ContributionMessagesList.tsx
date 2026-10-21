// AI-GENERATED — not an architecture reference
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { BContainer, BListGroup, BListGroupItem, BTooltip } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, ref, toDisplayString } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { MemberWalletLink } from '@/components/MemberWalletLink'
import { fetchMemberAvatars } from '@/composables/useMemberAvatars'
import { useAppToast } from '@/composables/useToast'
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

// The space the card leaves between its parts: a space on either side of a non-breaking one.
const GAP = '   '

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

    const { onResult, onError, result, refetch } = useQuery(
      adminListContributionMessages,
      {
        contributionId: props.contribution.id,
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
          <BListGroupItem>
            {/* `title` is no prop of RouterLink: it falls through to the anchor. */}
            <RouterLink to={searchLink.value} title={t('goTo.userSearch')}>
              {/* toDisplayString: as {{ }} did, a name that is null shows as nothing, not as 'null' */}
              {`${toDisplayString(props.contribution.user.firstName)} ${toDisplayString(props.contribution.user.lastName)}`}
            </RouterLink>
            {GAP}
            <a href={mailtoLink.value}>{email.value}</a>
            {`${GAP}${toDisplayString(props.contribution.user.publicName)} `}
            <MemberWalletLink
              member={props.contribution.user}
              name={props.contribution.user.alias || props.contribution.user.firstName}
            />
            {GAP}
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
