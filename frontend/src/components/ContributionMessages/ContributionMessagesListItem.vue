<template>
  <div class="contribution-messages-list-item">
    <div v-if="isNotModerator" class="is-not-moderator text-right">
      <b-avatar :text="initialLetters" variant="info"></b-avatar>
      <span class="ml-2 mr-2">{{ message.userFirstName }} {{ message.userLastName }}</span>
      <span class="ml-2">{{ $d(new Date(message.createdAt), 'short') }}</span>
      <div class="mt-2">{{ message.message }}</div>
    </div>
    <div v-else class="is-moderator text-left">
      <b-avatar square :text="initialLetters" variant="warning"></b-avatar>
      <span class="ml-2 mr-2">{{ message.userFirstName }} {{ message.userLastName }}</span>
      <span class="ml-2">{{ $d(new Date(message.createdAt), 'short') }}</span>
      <small class="ml-4 text-success">{{ $t('community.moderator') }}</small>
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
      // eslint-disable-next-line no-useless-escape
      pattern: /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*))/gi,
      messageObject: this.message,
      storeName: `${this.$store.state.firstName} ${this.$store.state.lastName}`,
      moderationName: `${this.message.userFirstName} ${this.message.userLastName}`,
    }
  },
  computed: {
    isNotModerator() {
      return this.storeName === this.moderationName
    },
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
