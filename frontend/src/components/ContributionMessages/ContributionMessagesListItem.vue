<template>
  <div class="contribution-messages-list-item">
    <div v-if="isNotModerator" class="is-not-moderator text-right">
      <b-row>
        <b-col>
          <div class="font-weight-bold">{{ storeName.username }}</div>
          <div class="small">{{ $d(new Date(message.createdAt), 'short') }}</div>
          <parse-message v-bind="message"></parse-message>
        </b-col>
        <b-col cols="2">
          <avatar :username="storeName.username" :initials="storeName.initials"></avatar>
        </b-col>
      </b-row>
      <!-- <span class="ml-2 mr-2">{{ storeName.username }}</span>
      <span class="ml-2">{{ $d(new Date(message.createdAt), 'short') }}</span> -->
    </div>
    <div v-else class="is-moderator text-left">
      <b-row>
        <b-col cols="2">
          <avatar :username="moderationName.username" :initials="moderationName.initials"></avatar>
        </b-col>
        <b-col cols="auto">
          <div class="font-weight-bold">
            {{ moderationName.username }}
            <small class="ml-2 text-success">{{ $t('community.moderator') }}</small>
          </div>

          <div class="small">{{ $d(new Date(message.createdAt), 'short') }}</div>
          <parse-message v-bind="message"></parse-message>
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
<style>
.is-not-moderator {
  float: right;
  /* background-color: rgb(261, 204, 221); */
  width: 75%;
  margin-top: 20px;
  margin-bottom: 20px;
  clear: both;
}
.is-moderator {
  clear: both;
  /* background-color: rgb(255, 255, 128); */
  width: 75%;
  margin-top: 20px;
}
</style>
