<template>
  <div class="contribution-messages-list-item">
    <div v-if="message.isModerator" class="text-right is-moderator">
      <b-avatar square variant="warning"></b-avatar>
      <span class="ml-2 mr-2">{{ message.userFirstName }} {{ message.userLastName }}</span>
      <span class="ml-2">{{ $d(new Date(message.createdAt), 'short') }}</span>
      <small class="ml-4 text-success">{{ $t('moderator') }}</small>
      <div class="mt-2" v-html="linkifiedMessage"></div>
    </div>
    <div v-else class="text-left is-not-moderator">
      <b-avatar variant="info"></b-avatar>
      <span class="ml-2 mr-2">{{ message.userFirstName }} {{ message.userLastName }}</span>
      <span class="ml-2">{{ $d(new Date(message.createdAt), 'short') }}</span>
      <div class="mt-2" v-html="linkifiedMessage"></div>
    </div>
  </div>
</template>
<script>
const PATTERN =
  /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*))/gi

export default {
  name: 'ContributionMessagesListItem',
  props: {
    message: {
      type: Object,
      required: true,
    },
  },
  computed: {
    linkifiedMessage() {
      return this.message.message.replace(PATTERN, "<i><a href='$1' target='_blank'>$1</a></i>")
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
