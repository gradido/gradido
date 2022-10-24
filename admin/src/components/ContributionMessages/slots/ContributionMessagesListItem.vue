<template>
  <div class="contribution-messages-list-item">
    <div v-if="message.isModerator" class="text-right is-moderator">
      <b-avatar square variant="warning"></b-avatar>
      <span class="ml-2 mr-2">{{ message.userFirstName }} {{ message.userLastName }}</span>
      <span class="ml-2">{{ $d(new Date(message.createdAt), 'short') }}</span>
      <small class="ml-4 text-success">{{ $t('moderator') }}</small>
      <div class="mt-2">
        <span v-for="({ type, text }, index) in linkifiedMessage" :key="index">
          <b-link v-if="type === 'link'" :to="text">{{ text }}</b-link>
          <span v-else>{{ text }}</span>
        </span>
      </div>
    </div>
    <div v-else class="text-left is-not-moderator">
      <b-avatar variant="info"></b-avatar>
      <span class="ml-2 mr-2">{{ message.userFirstName }} {{ message.userLastName }}</span>
      <span class="ml-2">{{ $d(new Date(message.createdAt), 'short') }}</span>
      <div class="mt-2">
        <span v-for="({ type, text }, index) in linkifiedMessage" :key="index">
          <b-link v-if="type === 'link'" :to="text">{{ text }}</b-link>
          <span v-else>{{ text }}</span>
        </span>
      </div>
    </div>
  </div>
</template>
<script>
const PATTERN =
  /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*))/i

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
      const linkified = []
      let string = this.message.message
      let match
      while ((match = string.match(PATTERN))) {
        if (match.index > 0)
          linkified.push({ type: 'text', text: string.substring(0, match.index) })
        linkified.push({ type: 'link', text: match[0] })
        string = string.substring(match.index + match[0].length)
      }
      if (string.length > 0) linkified.push({ type: 'text', text: string })
      return linkified
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
