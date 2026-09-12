<template>
  <div class="contribution-messages-list-item clearfix">
    <div v-if="isModeratorMessage" class="text-end p-2 rounded-sm mb-3" :class="boxClass">
      <small class="ms-4" data-test="moderator-label">
        {{ $t('moderator.moderator') }}
      </small>
      <small class="ms-2" data-test="moderator-date">
        {{ $d(new Date(message.createdAt), 'short') }}
      </small>
      <span class="ms-2 me-2 no-select" data-test="moderator-name">
        {{ message.userAlias }}
      </span>
      <!-- The face of whoever wrote it, where they show one -- the moderation and the member
           alike (Bernd, 12.09.2026). Without a picture the circle carries their letters, as
           every other list of people does; the generic person icon said nothing about
           anybody. -->
      <member-avatar
        :size="LIST_AVATAR_SIZE"
        :name="authorName"
        v-bind="authorAvatar"
        @zoom="openPicture"
      />
      <small v-if="isHistory">
        <hr />
        {{ $t('moderator.history') }}
        <hr />
      </small>
      <parse-message v-bind="message" data-test="moderator-message"></parse-message>
      <small v-if="isModeratorHiddenMessage">
        <hr />
        {{ $t('moderator.request') }}
      </small>
    </div>
    <div v-else class="text-start p-2 rounded-sm mb-3" :class="boxClass">
      <member-avatar
        :size="LIST_AVATAR_SIZE"
        :name="authorName"
        v-bind="authorAvatar"
        @zoom="openPicture"
      />
      <span class="ms-2 me-2 no-select" data-test="user-name">
        {{ message.userAlias }}
      </span>
      <small class="ms-2" data-test="user-date">
        {{ $d(new Date(message.createdAt), 'short') }}
      </small>
      <small v-if="isHistory">
        <hr />
        {{ $t('moderator.history') }}
        <hr />
      </small>
      <parse-message v-bind="message" data-test="user-message"></parse-message>
    </div>
  </div>
</template>
<script>
import ParseMessage from '@/components/ContributionMessages/ParseMessage'
import MemberAvatar from '@/components/MemberAvatar.vue'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { openMemberAvatarZoom } from '@/composables/useMemberAvatarZoom'
import { LIST_AVATAR_SIZE } from '@/constants'

export default {
  name: 'ContributionMessagesListItem',
  components: {
    ParseMessage,
    MemberAvatar,
  },
  props: {
    message: {
      type: Object,
      required: true,
    },
    contributionUserId: {
      type: Number,
      required: true,
    },
  },
  data() {
    // The one size a face has in this interface, the same as in the wallet.
    return { LIST_AVATAR_SIZE }
  },
  computed: {
    /**
     * The author of THIS message, as a member is named everywhere: the pair, the alias, and
     * the colour digit the server computed from the real initials.
     *
     * ⛔ Not the contribution's member and not the signed-in moderator -- the message says
     * who wrote it, and a thread carries both sides. Taking it from anywhere else is how a
     * face ends up next to somebody else's words.
     */
    author() {
      return {
        alias: this.message.userAlias,
        avatarColorIndex: this.message.userAvatarColorIndex,
        gradidoID: this.message.userGradidoID,
        communityUuid: this.message.userCommunityUuid,
        avatarUpdatedAt: this.message.userAvatarUpdatedAt,
      }
    },
    authorAvatar() {
      return memberAvatarProps(this.author)
    },
    authorName() {
      return this.message.userAlias ?? ''
    },
    isModeratorMessage() {
      return this.contributionUserId !== this.message.userId
    },
    isModeratorHiddenMessage() {
      return this.message.type === 'MODERATOR'
    },
    isHistory() {
      return this.message.type === 'HISTORY'
    },
    boxClass() {
      if (this.isModeratorHiddenMessage) return 'is-moderator is-moderator-hidden-message'
      if (this.isHistory) return 'is-user is-user-history-message'
      if (this.isModeratorMessage) return 'is-moderator is-moderator-message'
      return 'is-user is-user-message'
    },
  },
  methods: {
    openPicture() {
      openMemberAvatarZoom({
        member: this.author,
        src: this.authorAvatar.src,
        label: this.$t('avatar.zoom-picture', { name: this.authorName }),
      })
    },
  },
}
</script>
<style>
.is-moderator {
  clear: both;
  float: right;
  width: 75%;
}

.is-moderator-message {
  background-color: rgb(228 237 245);
}

.is-moderator-hidden-message {
  background-color: rgb(217 161 228);
}

.is-user {
  clear: both;
  width: 75%;
}

.is-user-message {
  background-color: rgb(236 235 213);
}

.is-user-history-message {
  background-color: rgb(235 226 57);
}
</style>
