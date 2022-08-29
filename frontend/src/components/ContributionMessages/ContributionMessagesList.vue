<template>
  <div class="contribution-messages-list">
    <b-container>
      <div v-for="message in messages" v-bind:key="message.id">
        <contribution-messages-list-item :message="message" />
      </div>
    </b-container>
    <contribution-messages-formular
      v-if="state === 'PENDING' || state === 'IN_PROGRESS'"
      class="mt-5"
      :contributionId="contributionId"
      @get-list-contribution-messages="getListContributionMessages"
      @update-state="updateState"
    />
  </div>
</template>
<script>
import ContributionMessagesListItem from '@/components/ContributionMessages/ContributionMessagesListItem.vue'
import ContributionMessagesFormular from '@/components/ContributionMessages/ContributionMessagesFormular.vue'

export default {
  name: 'ContributionMessagesList',
  components: {
    ContributionMessagesListItem,
    ContributionMessagesFormular,
  },
  props: {
    contributionId: {
      type: Number,
      required: true,
    },
    state: {
      type: String,
      required: false,
    },
    messages: {
      type: Array,
      required: true,
    },
  },
  methods: {
    getListContributionMessages() {
      this.$emit('get-list-contribution-messages', this.contributionId)
    },
    updateState(id) {
      this.$emit('update-state', id)
    },
  },
}
</script>
<style scoped>
.temp-message {
  margin-top: 50px;
}
</style>
