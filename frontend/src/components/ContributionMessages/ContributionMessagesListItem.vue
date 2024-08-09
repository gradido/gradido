<template>
  <div class="contribution-messages-list-item">
    <div v-if="message.type === 'HISTORY'">
      <BRow class="mb-3 border border-197 p-1">
        <BCol cols="10">
          <small>{{ $d(new Date(message.createdAt), 'short') }}</small>
          <div v-if="isNotModerator" class="font-weight-bold" data-test="username">
            {{ storeName.username }} {{ $t('contribution.isEdited') }}
          </div>
          <div v-else class="font-weight-bold" data-test="moderator-name">
            {{ $t('community.moderator') }} {{ $t('contribution.isEdited') }}
          </div>
          <div class="small">
            {{ $t('contribution.oldContribution') }}
          </div>
          <parse-message v-bind="message" data-test="message" class="p-2"></parse-message>
        </BCol>
        <BCol cols="2">
          <avatar :username="storeName.username" :initials="storeName.initials"></avatar>
        </BCol>
      </BRow>
    </div>
    <div v-else-if="isNotModerator" class="text-right pr-4 pr-lg-0 is-not-moderator">
      <BRow class="mb-3">
        <BCol cols="10">
          <div class="font-weight-bold" data-test="username">{{ storeName.username }}</div>
          <div class="small" data-test="date">{{ $d(new Date(message.createdAt), 'short') }}</div>
          <parse-message v-bind="message" data-test="message"></parse-message>
        </BCol>
        <BCol cols="2">
          <avatar :username="storeName.username" :initials="storeName.initials"></avatar>
        </BCol>
      </BRow>
    </div>
    <div v-else>
      <BRow class="mb-3 bg-f5 p-2 is-moderator">
        <BCol cols="2">
          <avatar :username="moderationName.username" :initials="moderationName.initials"></avatar>
        </BCol>
        <BCol cols="10">
          <div class="font-weight-bold">
            <span data-test="username">{{ moderationName.username }}</span>
            <span class="ml-2 text-success small" data-test="moderator">
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
import Avatar from 'vue-avatar'
import ParseMessage from '@/components/ContributionMessages/ParseMessage'

export default {
  name: 'ContributionMessagesListItem',
  components: {
    Avatar,
    ParseMessage,
  },
  props: {
    message: {
      type: Object,
      required: true,
    },
  },
  computed: {
    isNotModerator() {
      return this.storeName.username === this.moderationName.username
    },
    storeName() {
      return {
        username: `${this.$store.state.firstName} ${this.$store.state.lastName}`,
        initials: `${this.$store.state.firstName[0]}${this.$store.state.lastName[0]}`,
      }
    },
    moderationName() {
      return {
        username: `${this.message.userFirstName} ${this.message.userLastName}`,
        initials: `${this.message.userFirstName[0]}${this.message.userLastName[0]}`,
      }
    },
  },
}
</script>
