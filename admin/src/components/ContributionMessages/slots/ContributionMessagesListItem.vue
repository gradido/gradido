<template>
  <div class="contribution-messages-list-item">
    <div v-if="message.isModerator" class="text-right is-moderator">
      <b-avatar square :text="initialLetters" variant="warning"></b-avatar>
      <span class="ml-2 mr-2">{{ message.userFirstName }} {{ message.userLastName }}</span>
      <span class="ml-2">{{ $d(new Date(message.createdAt), 'short') }}</span>
      <small class="ml-4 text-success">{{ $t('moderator') }}</small>
      <div class="mt-2">{{ message.message }}</div>
    </div>
    <div v-else class="text-left is-not-moderator">
      <b-avatar :text="initialLetters" variant="info"></b-avatar>
      <span class="ml-2 mr-2">{{ message.userFirstName }} {{ message.userLastName }}</span>
      <span class="ml-2">{{ $d(new Date(message.createdAt), 'short') }}</span>
      <div class="mt-2">{{ message.message }}</div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'ContributionMessagesListItem',
  props: {
    message: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      pattern:
        // eslint-disable-next-line no-useless-escape
        /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/gi,
      messageObject: this.message,
    }
  },
  methods: {
    linkify(inputText) {
      // console.log(inputText.match(this.pattern))
      this.messageObject.message = inputText.replace(
        this.pattern,
        "<i><a href='$1' target='_blank'>$1</a></i>",
      )
    },
  },
  created() {
    this.linkify(this.messageObject.message)
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
