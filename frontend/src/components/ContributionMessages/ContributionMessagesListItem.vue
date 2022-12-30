<template>
  <div class="contribution-messages-list-item">
    <div v-if="isNotModerator" class="text-right pr-4 pr-lg-0">
      <b-row class="mb-3">
        <b-col cols="10">
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
    <div v-else>
      <b-row class="mb-3 bg-f5 p-2">
        <b-col cols="2">
          <avatar :username="moderationName.username" :initials="moderationName.initials"></avatar>
        </b-col>
        <b-col cols="10">
          <div class="font-weight-bold">
            {{ moderationName.username }}
            <span class="ml-2 text-success small">{{ $t('community.moderator') }}</span>
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
  /* float: right; */
  /* background-color: rgb(261, 204, 221); */
  /* width: 75%;
  margin-top: 20px;
  margin-bottom: 20px;
  clear: both; */
}
.is-moderator {
  /* clear: both; */
  /* background-color: rgb(255, 255, 128); */
  /* width: 75%;
  margin-top: 20px; */
}
</style>
