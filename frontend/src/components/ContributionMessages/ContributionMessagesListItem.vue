<template>
  <div class="contribution-messages-list-item">
    <div v-if="message.type === 'HISTORY'">
      <b-row class="mb-3 border border-197 p-1">
        <b-col cols="10">
          <div class="font-weight-bold" data-test="username">
            {{ storeName.username }} {{ $t('contribution.isEdited') }}
          </div>
          <div class="small">{{ $t('contribution.oldContribution') }}</div>
          <parse-message v-bind="message" data-test="message" class="p-2"></parse-message>
        </b-col>
        <b-col cols="2">
          <avatar :username="storeName.username" :initials="storeName.initials"></avatar>
        </b-col>
      </b-row>
    </div>
    <div v-else-if="isNotModerator" class="text-right pr-4 pr-lg-0 is-not-moderator">
      <b-row class="mb-3">
        <b-col cols="10">
          <div class="font-weight-bold" data-test="username">{{ storeName.username }}</div>
          <div class="small" data-test="date">{{ $d(new Date(message.createdAt), 'short') }}</div>
          <parse-message v-bind="message" data-test="message"></parse-message>
        </b-col>
        <b-col cols="2">
          <avatar :username="storeName.username" :initials="storeName.initials"></avatar>
        </b-col>
      </b-row>
    </div>
    <div v-else>
      <b-row class="mb-3 bg-f5 p-2 is-moderator">
        <b-col cols="2">
          <avatar :username="moderationName.username" :initials="moderationName.initials"></avatar>
        </b-col>
        <b-col cols="10">
          <div class="font-weight-bold">
            <span data-test="username">{{ moderationName.username }}</span>
            <span class="ml-2 text-success small" data-test="moderator">
              {{ $t('community.moderator') }}
            </span>
          </div>

          <div class="small" data-test="date">{{ $d(new Date(message.createdAt), 'short') }}</div>
          <parse-message v-bind="message" data-test="message"></parse-message>
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script>
import Avatar from 'vue-avatar'
import ParseMessage from '@/components/ContributionMessages/ParseMessage.vue'

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
