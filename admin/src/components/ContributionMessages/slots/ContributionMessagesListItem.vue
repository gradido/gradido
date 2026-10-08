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
<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import ParseMessage from '@/components/ContributionMessages/ParseMessage'
import MemberAvatar from '@/components/MemberAvatar.vue'
import { memberAvatarProps } from '@/composables/useMemberAvatars'
import { openMemberAvatarZoom } from '@/composables/useMemberAvatarZoom'
// The one size a face has in this interface, the same as in the wallet.
import { LIST_AVATAR_SIZE } from '@/constants'

const props = defineProps({
  message: {
    type: Object,
    required: true,
  },
  contributionUserId: {
    type: Number,
    required: true,
  },
})

const { t } = useI18n()

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
  if (isModeratorHiddenMessage.value) return 'is-moderator is-moderator-hidden-message'
  if (isHistory.value) return 'is-user is-user-history-message'
  if (isModeratorMessage.value) return 'is-moderator is-moderator-message'
  return 'is-user is-user-message'
})

const openPicture = () => {
  // Without an alias the plain wording -- see the same spot in the contributions table.
  openMemberAvatarZoom({
    member: author.value,
    src: authorAvatar.value.src,
    label: authorName.value
      ? t('avatar.zoom-picture', { name: authorName.value })
      : t('avatar.zoom-picture-plain'),
  })
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
