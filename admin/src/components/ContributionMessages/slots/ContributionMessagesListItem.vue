<template>
  <div class="contribution-messages-list-item">
    <div
      v-if="isModerator"
      class="text-right is-moderator p-2 rounded-sm mb-3"
      :class="isModeratorMessage ? 'is-hidden-moderator-message ' : 'is-moderator-message'"
    >
      <small class="ml-4" data-test="moderator-label">
        {{ $t('moderator.moderator') }}
      </small>
      <small class="ml-2" data-test="moderator-date">
        {{ $d(new Date(message.createdAt), 'short') }}
      </small>
      <span class="ml-2 mr-2" data-test="moderator-name">
        {{ message.userFirstName }} {{ message.userLastName }}
      </span>
      <b-avatar square variant="warning"></b-avatar>

      <parse-message v-bind="message" data-test="moderator-message"></parse-message>
      <small v-if="isModeratorMessage">
        <hr />
        {{ $t('moderator.request') }}
      </small>
    </div>
    <div v-else class="text-left is-user p-2 rounded-sm is-user-message mb-3">
      <b-avatar variant="info"></b-avatar>
      <span class="ml-2 mr-2" data-test="user-name">
        {{ message.userFirstName }} {{ message.userLastName }}
      </span>
      <small class="ml-2" data-test="user-date">
        {{ $d(new Date(message.createdAt), 'short') }}
      </small>
      <parse-message v-bind="message" data-test="user-message"></parse-message>
    </div>
  </div>
</template>
<script>
import ParseMessage from '@/components/ContributionMessages/ParseMessage'

export default {
  name: 'ContributionMessagesListItem',
  components: {
    ParseMessage,
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
  computed: {
    isModerator() {
      return this.contributionUserId !== this.message.userId
    },
    isModeratorMessage() {
      return this.message.type === 'MODERATOR'
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
  background-color: rgb(228, 237, 245);
}
.is-hidden-moderator-message {
  background-color: rgb(217, 161, 228);
}
.is-user {
  clear: both;
  width: 75%;
}
.is-user-message {
  background-color: rgb(236, 235, 213);
}
</style>
