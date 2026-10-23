// AI-GENERATED — not an architecture reference
import { computed, defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { ParseMessage } from '@/components/ContributionMessages/ParseMessage'
import { MemberAvatar } from '@/components/MemberAvatar'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { openMemberAvatarZoom } from '@/composables/useMemberAvatarZoom'
// The one size a face has in this interface, the same as in the wallet.
import { LIST_AVATAR_SIZE } from '@/constants'
import './ContributionMessagesListItem.css'

// A message of the thread as the server sends it; v-bind hands it to ParseMessage whole.
export type ContributionMessage = {
  message: string
  type: string
  createdAt: string
  userAlias?: string | null
  userId: number
  userAvatarColorIndex?: number | null
  userGradidoID?: string | null
  userCommunityUuid?: string | null
  userAvatarUpdatedAt?: string | null
  [field: string]: unknown
}

export const ContributionMessagesListItem = defineComponent({
  name: 'ContributionMessagesListItem',
  props: {
    message: {
      type: Object as PropType<ContributionMessage>,
      required: true,
    },
    contributionUserId: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const { t, d } = useI18n()

    /**
     * The author of THIS message, as a member is named everywhere: the pair, the alias, and
     * the colour digit the server computed from the real initials.
     *
     * ⛔ Not the contribution's member and not the signed-in moderator -- the message says
     * who wrote it, and a thread carries both sides. Taking it from anywhere else is how a
     * face ends up next to somebody else's words.
     */
    const author = computed(() => ({
      alias: props.message.userAlias,
      avatarColorIndex: props.message.userAvatarColorIndex,
      gradidoID: props.message.userGradidoID,
      communityUuid: props.message.userCommunityUuid,
      avatarUpdatedAt: props.message.userAvatarUpdatedAt,
    }))
    const authorAvatar = computed(() => memberAvatarProps(author.value))
    const authorName = computed(() => props.message.userAlias ?? '')
    const isModeratorMessage = computed(() => props.contributionUserId !== props.message.userId)
    const isModeratorHiddenMessage = computed(() => props.message.type === 'MODERATOR')
    const isHistory = computed(() => props.message.type === 'HISTORY')
    const boxClass = computed(() => {
      if (isModeratorHiddenMessage.value) {
        return 'is-moderator is-moderator-hidden-message'
      }
      if (isHistory.value) {
        return 'is-user is-user-history-message'
      }
      if (isModeratorMessage.value) {
        return 'is-moderator is-moderator-message'
      }
      return 'is-user is-user-message'
    })

    const openPicture = () => {
      // Without an alias the plain wording -- see the same spot in the contributions table.
      openMemberAvatarZoom({
        // Its JSDoc asks for a gradidoID; without one it opens nothing, which is its own check.
        member: author.value as { gradidoID: string; communityUuid?: string | null },
        src: authorAvatar.value.src,
        label: authorName.value
          ? t('avatar.zoom-picture', { name: authorName.value })
          : t('avatar.zoom-picture-plain'),
      })
    }

    // The face of whoever wrote it, where they show one -- the moderation and the member
    // alike (Bernd, 12.09.2026). Without a picture the circle carries their letters, as
    // every other list of people does; the generic person icon said nothing about anybody.
    const face = () => (
      <MemberAvatar
        size={LIST_AVATAR_SIZE}
        name={authorName.value}
        {...authorAvatar.value}
        onZoom={openPicture}
      />
    )

    const history = () =>
      isHistory.value ? (
        <small>
          <hr />
          {t('moderator.history')}
          <hr />
        </small>
      ) : null

    // The message hands all of its fields to ParseMessage, which takes `message` from them.
    const parsed = (dataTest: string) => (
      <ParseMessage
        {...(props.message as unknown as { message: string; messageType: string })}
        data-test={dataTest}
      />
    )

    // The parts of a message's head (label, date, name, face) stand as boxes of their own. The
    // JSX leaves no space between them, so as plain text they were ONE word, and in a narrow
    // message Bootstrap's `.card { overflow-wrap: break-word }` broke it anywhere -- inside the
    // date ("2.10.20|26"), inside the name. Between boxes a line may break.
    return () => (
      <div class='contribution-messages-list-item clearfix'>
        {isModeratorMessage.value ? (
          <div class={['text-end p-2 rounded-sm mb-3', boxClass.value]}>
            <small class='ms-4 d-inline-block' data-test='moderator-label'>
              {t('moderator.moderator')}
            </small>
            <small class='ms-2 d-inline-block' data-test='moderator-date'>
              {d(new Date(props.message.createdAt), 'short')}
            </small>
            <span class='ms-2 me-2 no-select d-inline-block' data-test='moderator-name'>
              {props.message.userAlias}
            </span>
            {face()}
            {history()}
            {parsed('moderator-message')}
            {isModeratorHiddenMessage.value ? (
              <small>
                <hr />
                {t('moderator.request')}
              </small>
            ) : null}
          </div>
        ) : (
          <div class={['text-start p-2 rounded-sm mb-3', boxClass.value]}>
            {face()}
            <span class='ms-2 me-2 no-select d-inline-block' data-test='user-name'>
              {props.message.userAlias}
            </span>
            <small class='ms-2 d-inline-block' data-test='user-date'>
              {d(new Date(props.message.createdAt), 'short')}
            </small>
            {history()}
            {parsed('user-message')}
          </div>
        )}
      </div>
    )
  },
})
