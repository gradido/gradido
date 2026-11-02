// AI-GENERATED — not an architecture reference
import { computed, defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { ParseMessage } from '@/components/ContributionMessages/ParseMessage'
import { MemberAvatar } from '@/components/MemberAvatar'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { openMemberAvatarZoom } from '@/composables/useMemberAvatarZoom'
// The one size a face has in this interface, the same as in the wallet.
import { LIST_AVATAR_SIZE } from '@/constants'
import IBiPencilFill from '~icons/bi/pencil-fill'
import IBiStickyFill from '~icons/bi/sticky-fill'
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
    // Every message stands in the same neutral grey (ContributionMessagesListItem.css), and the
    // side it leans to says who wrote it -- a change as well, the moderation's on the right, the
    // member's on the left. A note and a change say what they are in their head (Bernd,
    // 25.10.2026); their own colours, violet and yellow, went with the others.
    const boxClass = computed(() => [
      'message-bubble',
      isModeratorMessage.value ? 'is-moderator' : 'is-user',
      { 'is-note': isModeratorHiddenMessage.value, 'is-change': isHistory.value },
    ])

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

    // What a message is, where it is more than a word of the conversation: a note only the
    // moderation sees, with the sticky note, and a change of the contribution, with the pencil
    // the details button shows for it. In the head, where the moderation's messages say
    // "Moderator". The note says who sees it to a screen reader and under the pointer; the line
    // below it that said so went.
    const kind = (margin: string) => {
      if (isModeratorHiddenMessage.value) {
        return (
          <small
            class={['message-kind d-inline-block', margin]}
            title={t('moderator.notice-tooltip')}
            data-test='message-kind'
          >
            <IBiStickyFill class='me-1' aria-hidden='true' />
            {t('moderator.notice')}
            <span class='visually-hidden'>{` – ${t('moderator.notice-tooltip')}`}</span>
          </small>
        )
      }
      if (isHistory.value) {
        return (
          <small class={['message-kind d-inline-block', margin]} data-test='message-kind'>
            <IBiPencilFill class='me-1' aria-hidden='true' />
            {t('moderator.change')}
          </small>
        )
      }
      return null
    }

    const history = () =>
      isHistory.value ? (
        <small class='d-block mt-1' data-test='history-label'>
          {t('moderator.history')}
        </small>
      ) : null

    // The message hands all of its fields to ParseMessage, which takes `message` and `type` from
    // them: a change comes apart into its old date, text and amount.
    const parsed = (dataTest: string) => (
      <ParseMessage
        {...(props.message as unknown as { message: string; type: string })}
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
            {kind('ms-4') ?? (
              <small class='ms-4 d-inline-block' data-test='moderator-label'>
                {t('moderator.moderator')}
              </small>
            )}
            <small class='ms-2 d-inline-block' data-test='moderator-date'>
              {d(new Date(props.message.createdAt), 'short')}
            </small>
            <span class='ms-2 me-2 no-select d-inline-block' data-test='moderator-name'>
              {props.message.userAlias}
            </span>
            {face()}
            {history()}
            {parsed('moderator-message')}
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
            {kind('ms-3')}
            {history()}
            {parsed('user-message')}
          </div>
        )}
      </div>
    )
  },
})
