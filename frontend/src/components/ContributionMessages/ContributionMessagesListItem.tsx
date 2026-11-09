// AI-GENERATED — not an architecture reference
import { BCol, BRow } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import AppAvatar from '@/components/AppAvatar.vue'
import { ParseMessage } from '@/components/ContributionMessages/ParseMessage'
import { avatarZoomBindings } from '@/composables/useAvatarZoom'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
// The size every list of people in the wallet uses, the booking rows and both positions
// of the right-hand column included. A dialogue is a list of people too (ES-028).
import { LIST_AVATAR_SIZE } from '@/constants'
import { useWalletStore } from '@/store/useWalletStore'
import { avatarLettering } from '@/utils/avatarLettering'
import classes from './ContributionMessagesListItem.module.scss'

/** A message of a contribution's thread, as `contributionMessageFields` selects it. */
export type ContributionMessage = {
  id: number
  message: string
  createdAt: string
  type: string
  userAlias: string
  userAvatarColorIndex: number | null
  userGradidoID: string
  userCommunityUuid: string | null
  userAvatarUpdatedAt: string | null
}

/** One message of the thread: the member's own on the right, the moderation's on the left. */
export const ContributionMessagesListItem = defineComponent({
  name: 'ContributionMessagesListItem',
  props: {
    message: { type: Object as PropType<ContributionMessage>, required: true },
  },
  setup(props) {
    const { t, d } = useI18n()
    const store = useWalletStore()

    // The member's own side, from the store the wallet fills at login. Letters from the
    // alias, colour from the real initials (AS-010) -- avatarLettering holds that pair
    // together, the same as in the booking rows.
    const storeName = computed(() => {
      const { letters, colorSeed } = avatarLettering({
        alias: store.username,
        firstName: store.firstName,
        lastName: store.lastName,
      })
      return {
        username: store.username,
        initials: letters,
        colorSeed,
      }
    })
    /**
     * The member's own face beside their own messages.
     *
     * ⛔ The picture comes from the STORE, not from the member-avatar store: that one holds
     * what other members show each other, and the wallet has its own small rendition from
     * the login (`state.avatar`) -- which is also the one a member sees when they have
     * hidden their picture from everybody else.
     *
     * ⚠️ The zoom asks for the full size the way it does for anybody else -- by the uuid
     * PAIR. Both halves have to be here: `users` is unique on (gradido_id, community_uuid),
     * and a missing uuid is read as `IS NULL`, which matches no member that ever registered
     * normally (the registration sets it from the home community). Handing over the gradidoID
     * alone left every member's own zoom on the small rendition -- found by the review of
     * 12.09.2026, and the reason `communityUuid` now travels in the store.
     *
     * ⚠️ It still answers only for pictures that may be shown to members
     * (`mayBeShownToMembers`): a member who switched that off sees their own small rendition
     * enlarged rather than the full one. No error, a little softer.
     */
    const ownAvatar = computed(() => {
      const avatar = store.avatar as string | null
      const avatarProps = {
        name: storeName.value.username,
        initials: storeName.value.initials,
        colorSeed: storeName.value.colorSeed,
        src: avatar ? `data:image/jpeg;base64,${avatar}` : '',
      }
      return {
        ...avatarProps,
        ...avatarZoomBindings(
          {
            gradidoID: store.gradidoID as string | null,
            communityUuid: store.communityUuid as string | null,
            alias: storeName.value.username,
          },
          avatarProps,
        ),
      }
    })
    // The message author's side -- for moderation messages the moderator, under their
    // alias (NU-020). The real name no longer travels on the message at all: the server
    // sends the finished colour digit instead (NU-017), so the circle keeps the colour
    // it always had (AS-010) while nothing but the alias arrives here.
    const moderationName = computed(() => {
      const { letters, colorIndex } = avatarLettering({
        alias: props.message.userAlias,
        avatarColorIndex: props.message.userAvatarColorIndex,
      })
      return {
        username: props.message.userAlias,
        initials: letters,
        colorIndex,
      }
    })
    // Aliases, not assembled names (NU-020): the alias is unique per community, so two
    // people who happen to share a name no longer read as the same person here.
    const isNotModerator = computed(
      () => storeName.value.username === moderationName.value.username,
    )
    /**
     * The moderator's face, if they show one.
     *
     * The picture is read from the store the page filled in one round trip
     * (ContributionList) -- this component never fetches. `memberAvatarProps` answers with
     * the letters alone while there is nothing to show, so a moderation without a picture
     * looks exactly as it did before.
     *
     * ⚠️ Worked out in ONE call, letters, colour and picture together: calling the helper
     * once per prop is the split it exists to prevent (AS-010).
     */
    const moderationAvatar = computed(() => {
      const member = {
        alias: props.message.userAlias,
        avatarColorIndex: props.message.userAvatarColorIndex,
        gradidoID: props.message.userGradidoID,
        communityUuid: props.message.userCommunityUuid,
        avatarUpdatedAt: props.message.userAvatarUpdatedAt,
      }
      const avatarProps = memberAvatarProps(member)
      return { ...avatarProps, ...avatarZoomBindings(member, avatarProps) }
    })

    const when = () => d(new Date(props.message.createdAt), 'short')

    return () => (
      <div class='contribution-messages-list-item'>
        {props.message.type === 'HISTORY' ? (
          <div>
            <BRow class='mb-3 border border-197 p-1'>
              <BCol cols='10'>
                <small>{when()}</small>
                {isNotModerator.value ? (
                  <div class='fw-bold' data-test='username'>
                    {`${storeName.value.username} ${t('contribution.isEdited')}`}
                  </div>
                ) : (
                  <div class='fw-bold' data-test='moderator-name'>
                    {`${t('community.moderator')} ${t('contribution.isEdited')}`}
                  </div>
                )}
                <div class='small'>{t('contribution.oldContribution')}</div>
                <ParseMessage {...props.message} data-test='message' class='p-2' />
              </BCol>
              <BCol cols='2'>
                {/* ⛔ The same branch the name above takes. A history entry is written by whoever
                    made the change -- the member or the moderation -- and this circle used to be
                    the member's own either way. While both sides were lettered circles that was
                    a detail nobody could see; with real faces it puts the member's own portrait
                    next to "the moderation edited this". */}
                <AppAvatar
                  class='vue3-avatar'
                  size={LIST_AVATAR_SIZE}
                  color='#fff'
                  {...(isNotModerator.value ? ownAvatar.value : moderationAvatar.value)}
                />
              </BCol>
            </BRow>
          </div>
        ) : isNotModerator.value ? (
          <div class='text-end pe-4 pe-lg-0 is-not-moderator'>
            <BRow class='mb-3'>
              <BCol cols='10'>
                <div class='fw-bold' data-test='username'>
                  {storeName.value.username}
                </div>
                <div class='small' data-test='date'>
                  {when()}
                </div>
                <ParseMessage {...props.message} data-test='message' />
              </BCol>
              <BCol cols='2'>
                <AppAvatar
                  class='vue3-avatar'
                  size={LIST_AVATAR_SIZE}
                  color='#fff'
                  {...ownAvatar.value}
                />
              </BCol>
            </BRow>
          </div>
        ) : (
          <div>
            <BRow class={['mb-3 p-2', 'is-moderator', classes['is-moderator']]}>
              <BCol cols='2'>
                <AppAvatar size={LIST_AVATAR_SIZE} color='#fff' {...moderationAvatar.value} />
              </BCol>
              <BCol cols='10'>
                <div class='font-weight-bold'>
                  <span data-test='username'>{moderationName.value.username}</span>
                  <span class='ms-2 text-success small' data-test='moderator'>
                    {t('community.moderator')}
                  </span>
                </div>
                <div class='small' data-test='date'>
                  {when()}
                </div>
                <ParseMessage {...props.message} data-test='message' />
              </BCol>
            </BRow>
          </div>
        )}
      </div>
    )
  },
})
