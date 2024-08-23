<template>
  <div class="contribution-messages-list-item clearfix">
    <div v-if="isModeratorMessage" class="text-end p-2 rounded-sm mb-3" :class="boxClass">
      <small class="ms-4" data-test="moderator-label">
        {{ $t('moderator.moderator') }}
      </small>
      <small class="ms-2" data-test="moderator-date">
        {{ $d(new Date(message.createdAt), 'short') }}
      </small>
      <span class="ms-2 me-2" data-test="moderator-name">
        {{ message.userFirstName }} {{ message.userLastName }}
      </span>
      <BAvatar square variant="warning"></BAvatar>
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
      <BAvatar variant="info"></BAvatar>
      <span class="ms-2 me-2" data-test="user-name">
        {{ message.userFirstName }} {{ message.userLastName }}
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
