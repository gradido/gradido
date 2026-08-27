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
          <app-avatar
            class="vue3-avatar"
            :name="storeName.username"
            :initials="storeName.initials"
            :color-seed="storeName.colorSeed"
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
            :name="storeName.username"
            :initials="storeName.initials"
            :color-seed="storeName.colorSeed"
          />
        </BCol>
      </BRow>
    </div>
    <div v-else>
      <BRow class="mb-3 p-2 is-moderator">
        <BCol cols="2">
          <app-avatar
            :name="moderationName.username"
            :initials="moderationName.initials"
            :color-index="moderationName.colorIndex"
          />
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
  },
}
</script>

<style scoped lang="scss">
.is-moderator {
  background-color: var(--surface-muted);
}
</style>
