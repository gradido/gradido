<template>
  <div class="contribution-messages-list-item">
    <div v-if="message.type === 'HISTORY'">
      <BRow class="mb-3 border border-197 p-1">
        <BCol cols="10">
          <small>{{ $d(new Date(message.createdAt), 'short') }}</small>
          <div v-if="isNotModerator" class="fw-bold" data-test="username">
            {{ storeName.username }} {{ $t('contribution.isEdited') }}
          </div>
          <div v-else class="fw-bold" data-test="moderator-name">
            {{ $t('community.moderator') }} {{ $t('contribution.isEdited') }}
          </div>
          <div class="small">
            {{ $t('contribution.oldContribution') }}
          </div>
          <parse-message v-bind="message" data-test="message" class="p-2"></parse-message>
        </BCol>
        <BCol cols="2">
          <!-- ⛔ The same branch the name above takes. A history entry is written by whoever
               made the change -- the member or the moderation -- and this circle used to be
               the member's own either way. While both sides were lettered circles that was
               a detail nobody could see; with real faces it puts the member's own portrait
               next to "the moderation edited this". -->
          <app-avatar
            class="vue3-avatar"
            :size="LIST_AVATAR_SIZE"
            :color="'#fff'"
            v-bind="isNotModerator ? ownAvatar : moderationAvatar"
          />
        </BCol>
      </BRow>
    </div>
    <div v-else-if="isNotModerator" class="text-end pe-4 pe-lg-0 is-not-moderator">
      <BRow class="mb-3">
        <BCol cols="10">
          <div class="fw-bold" data-test="username">{{ storeName.username }}</div>
          <div class="small" data-test="date">{{ $d(new Date(message.createdAt), 'short') }}</div>
          <parse-message v-bind="message" data-test="message"></parse-message>
        </BCol>
        <BCol cols="2">
          <app-avatar
            class="vue3-avatar"
            :size="LIST_AVATAR_SIZE"
            :color="'#fff'"
            v-bind="ownAvatar"
          />
        </BCol>
      </BRow>
    </div>
    <div v-else>
      <BRow class="mb-3 p-2 is-moderator">
        <BCol cols="2">
          <app-avatar :size="LIST_AVATAR_SIZE" :color="'#fff'" v-bind="moderationAvatar" />
        </BCol>
        <BCol cols="10">
          <div class="font-weight-bold">
            <span data-test="username">{{ moderationName.username }}</span>
            <span class="ms-2 text-success small" data-test="moderator">
              {{ $t('community.moderator') }}
            </span>
          </div>
          <div class="small" data-test="date">{{ $d(new Date(message.createdAt), 'short') }}</div>
          <parse-message v-bind="message" data-test="message"></parse-message>
        </BCol>
      </BRow>
    </div>
  </div>
</template>

<script>
import ParseMessage from '@/components/ContributionMessages/ParseMessage'
import AppAvatar from '@/components/AppAvatar.vue'
import { avatarLettering } from '@/utils/avatarLettering'
import { avatarZoomBindings } from '@/composables/useAvatarZoom'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { LIST_AVATAR_SIZE } from '@/constants'

export default {
  name: 'ContributionMessagesListItem',
  components: {
    AppAvatar,
    ParseMessage,
  },
  props: {
    message: {
      type: Object,
      required: true,
    },
  },
  data() {
    // The size every list of people in the wallet uses, the booking rows and both positions
    // of the right-hand column included. A dialogue is a list of people too (ES-028).
    return { LIST_AVATAR_SIZE }
  },
  computed: {
    // Aliases, not assembled names (NU-020): the alias is unique per community, so two
    // people who happen to share a name no longer read as the same person here.
    isNotModerator() {
      return this.storeName.username === this.moderationName.username
    },
    // The member's own side, from the store the wallet fills at login. Letters from the
    // alias, colour from the real initials (AS-010) -- avatarLettering holds that pair
    // together, the same as in the booking rows.
    storeName() {
      const { letters, colorSeed } = avatarLettering({
        alias: this.$store.state.username,
        firstName: this.$store.state.firstName,
        lastName: this.$store.state.lastName,
      })
      return {
        username: this.$store.state.username,
        initials: letters,
        colorSeed,
      }
    },
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
     * normally (RegisterAccount sets it from the home community). Handing over the gradidoID
     * alone left every member's own zoom on the small rendition -- found by the review of
     * 12.09.2026, and the reason `communityUuid` now travels in the store.
     *
     * ⚠️ It still answers only for pictures that may be shown to members
     * (`mayBeShownToMembers`): a member who switched that off sees their own small rendition
     * enlarged rather than the full one. No error, a little softer.
     */
    ownAvatar() {
      const avatar = this.$store.state.avatar
      const props = {
        name: this.storeName.username,
        initials: this.storeName.initials,
        colorSeed: this.storeName.colorSeed,
        src: avatar ? `data:image/jpeg;base64,${avatar}` : '',
      }
      return {
        ...props,
        ...avatarZoomBindings(
          {
            gradidoID: this.$store.state.gradidoID,
            communityUuid: this.$store.state.communityUuid,
            alias: this.storeName.username,
          },
          props,
        ),
      }
    },
    // The message author's side -- for moderation messages the moderator, under their
    // alias (NU-020). The real name no longer travels on the message at all: the server
    // sends the finished colour digit instead (NU-017), so the circle keeps the colour
    // it always had (AS-010) while nothing but the alias arrives here.
    moderationName() {
      const { letters, colorIndex } = avatarLettering({
        alias: this.message.userAlias,
        avatarColorIndex: this.message.userAvatarColorIndex,
      })
      return {
        username: this.message.userAlias,
        initials: letters,
        colorIndex,
      }
    },
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
    moderationAvatar() {
      const member = {
        alias: this.message.userAlias,
        avatarColorIndex: this.message.userAvatarColorIndex,
        gradidoID: this.message.userGradidoID,
        communityUuid: this.message.userCommunityUuid,
        avatarUpdatedAt: this.message.userAvatarUpdatedAt,
      }
      const props = memberAvatarProps(member)
      return { ...props, ...avatarZoomBindings(member, props) }
    },
  },
}
</script>

<style scoped lang="scss">
.is-moderator {
  background-color: var(--surface-muted);
}
</style>
