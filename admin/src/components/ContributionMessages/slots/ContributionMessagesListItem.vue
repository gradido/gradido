<template>
  <div class="contribution-messages-list-item">
    <is-moderator v-if="message.isModerator" :message="message"></is-moderator>
    <is-not-moderator v-else :message="message"></is-not-moderator>
  </div>
</template>
<script>
import IsModerator from '@/components/ContributionMessages/slots/IsModerator.vue'
import IsNotModerator from '@/components/ContributionMessages/slots/IsNotModerator.vue'

export default {
  name: 'ContributionMessagesListItem',
  components: {
    IsModerator,
    IsNotModerator,
  },
  props: {
    message: {
      type: Object,
      required: true,
      default() {
        return {}
      },
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
