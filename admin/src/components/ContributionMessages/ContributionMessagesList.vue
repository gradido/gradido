<template>
  <div class="contribution-messages-list">
    <b-container>
      {{ messages.lenght }}
      <div v-for="message in messages" v-bind:key="message.id">
        <contribution-messages-list-item :message="message" />
      </div>
    </b-container>

    <contribution-messages-formular
      :contributionId="contributionId"
      @get-list-contribution-messages="getListContributionMessages"
      @update-state="updateState"
    />
  </div>
</template>
<script>
import ContributionMessagesListItem from './slots/ContributionMessagesListItem.vue'
import ContributionMessagesFormular from '../ContributionMessages/ContributionMessagesFormular.vue'
import { listContributionMessages } from '../../graphql/listContributionMessages.js'

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
  },
  data() {
    return {
      messages: [],
    }
  },
  methods: {
    getListContributionMessages(id) {
      this.messages = []
      this.$apollo
        .query({
          query: listContributionMessages,
          variables: {
            contributionId: id,
          },
          fetchPolicy: 'no-cache',
        })
        .then((result) => {
          this.messages = result.data.listContributionMessages.messages
        })
        .catch((error) => {
          this.toastError(error.message)
        })
    },
    updateState(id) {
      this.$emit('update-state', id)
    },
  },
  created() {
    this.getListContributionMessages(this.contributionId)
  },
}
</script>
<style scoped>
.temp-message {
  margin-top: 50px;
}
</style>
