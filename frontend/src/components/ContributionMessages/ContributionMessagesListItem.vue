<template>
  <div class="contribution-messages-list-item">
    <div v-if="isNotModerator" class="is-not-moderator text-right">
      <b-avatar variant="info"></b-avatar>
      <span class="ml-2 mr-2">{{ message.userFirstName }} {{ message.userLastName }}</span>
      <span class="ml-2">{{ $d(new Date(message.createdAt), 'short') }}</span>
      <linkify-message :message="message.message"></linkify-message>
    </div>
    <div v-else class="is-moderator text-left">
      <b-avatar square variant="warning"></b-avatar>
      <span class="ml-2 mr-2">{{ message.userFirstName }} {{ message.userLastName }}</span>
      <span class="ml-2">{{ $d(new Date(message.createdAt), 'short') }}</span>
      <small class="ml-4 text-success">{{ $t('community.moderator') }}</small>
      <linkify-message :message="message.message"></linkify-message>
    </div>
  </div>
</template>

<script>
import LinkifyMessage from '@/components/ContributionMessages/LinkifyMessage.vue'

export default {
  name: 'ContributionMessagesListItem',
  components: {
    LinkifyMessage,
  },
  props: {
    message: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      storeName: `${this.$store.state.firstName} ${this.$store.state.lastName}`,
      moderationName: `${this.message.userFirstName} ${this.message.userLastName}`,
    }
  },
  computed: {
    isNotModerator() {
      return this.storeName === this.moderationName
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
