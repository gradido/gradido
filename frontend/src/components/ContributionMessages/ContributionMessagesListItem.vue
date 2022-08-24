<template>
  <div>
    <is-not-moderator v-if="isNotModerator" :message="message"></is-not-moderator>
    <is-moderator v-else :message="message"></is-moderator>
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
