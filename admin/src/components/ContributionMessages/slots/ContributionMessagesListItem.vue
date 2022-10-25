<template>
  <div class="contribution-messages-list-item">
    <div v-if="message.isModerator" class="text-right is-moderator">
      <b-avatar square variant="warning"></b-avatar>
      <span class="ml-2 mr-2">{{ message.userFirstName }} {{ message.userLastName }}</span>
      <span class="ml-2">{{ $d(new Date(message.createdAt), 'short') }}</span>
      <small class="ml-4 text-success">{{ $t('moderator') }}</small>
      <linkify-message :message="message.message"></linkify-message>
    </div>
    <div v-else class="text-left is-not-moderator">
      <b-avatar variant="info"></b-avatar>
      <span class="ml-2 mr-2">{{ message.userFirstName }} {{ message.userLastName }}</span>
      <span class="ml-2">{{ $d(new Date(message.createdAt), 'short') }}</span>
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
}
</script>
<style>
.is-not-moderator {
  clear: both;
  width: 75%;
  margin-top: 20px;
  /* background-color: rgb(261, 204, 221); */
}
.is-moderator {
  clear: both;
  float: right;
  width: 75%;
  margin-top: 20px;
  margin-bottom: 20px;
  /* background-color: rgb(255, 255, 128); */
}
</style>
