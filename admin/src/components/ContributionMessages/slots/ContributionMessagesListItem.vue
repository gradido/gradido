<template>
  <div>
    <is-moderator v-if="isModerator" :message="message"></is-moderator>
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
      // storeName: `${this.$store.state.firstName} ${this.$store.state.lastName}`,
      moderationName: `${this.message.userFirstName} ${this.message.userLastName}`,
    }
  },
  computed: {
    isModerator() {
      return this.$store.state.moderator.id === this.message.userId
    },
  },
}
</script>
