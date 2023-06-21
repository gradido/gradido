<template>
  <div class="contribution-messages-list">
    <b-container>
      <div v-for="message in messages" v-bind:key="message.id">
        <contribution-messages-list-item :message="message" />
      </div>
    </b-container>

    <div v-if="contributionState === 'PENDING' || contributionState === 'IN_PROGRESS'">
      <contribution-messages-formular
        :contributionId="contributionId"
        @get-list-contribution-messages="getListContributionMessages"
        @update-state="updateState"
      />
    </div>
  </div>
</template>
<script>
import ContributionMessagesListItem from './slots/ContributionMessagesListItem'
import ContributionMessagesFormular from '../ContributionMessages/ContributionMessagesFormular'
import { adminListContributionMessages } from '../../graphql/adminListContributionMessages.js'

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
    contributionState: {
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
          query: adminListContributionMessages,
          variables: {
            contributionId: id,
          },
          fetchPolicy: 'no-cache',
        })
        .then((result) => {
          console.log(result)
          this.messages = result.data.adminListContributionMessages.messages
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
