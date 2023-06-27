<template>
  <div class="contribution-messages-list">
    <b-container>
      <div v-for="message in messages" v-bind:key="message.id">
        <contribution-messages-list-item :message="message" />
      </div>
    </b-container>

    <div v-if="contributionStatus === 'PENDING' || contributionStatus === 'IN_PROGRESS'">
      <contribution-messages-formular
        :contributionId="contributionId"
        @get-list-contribution-messages="getListContributionMessages"
        @update-status="updateStatus"
      />
    </div>
  </div>
</template>
<script>
import ContributionMessagesListItem from './slots/ContributionMessagesListItem'
import ContributionMessagesFormular from '../ContributionMessages/ContributionMessagesFormular'
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
    contributionStatus: {
      type: String,
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
    updateStatus(id) {
      this.$emit('update-status', id)
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
