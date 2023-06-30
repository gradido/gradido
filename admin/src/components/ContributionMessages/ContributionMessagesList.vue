<template>
  <div class="contribution-messages-list">
    <b-container>
      <div v-for="message in messages" v-bind:key="message.id">
        <contribution-messages-list-item
          :message="message"
          :contributionUserId="contributionUserId"
        />
      </div>
    </b-container>
    <div v-if="contributionStatus === 'PENDING' || contributionStatus === 'IN_PROGRESS'">
      <contribution-messages-formular
        :contributionId="contributionId"
        @get-list-contribution-messages="$apollo.queries.Messages.refetch()"
        @update-status="updateStatus"
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
    contributionStatus: {
      type: String,
      required: true,
    },
    contributionUserId: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      messages: [],
    }
  },
  apollo: {
    Messages: {
      query() {
        return adminListContributionMessages
      },
      variables() {
        return {
          contributionId: this.contributionId,
        }
      },
      fetchPolicy: 'no-cache',
      update({ adminListContributionMessages }) {
        this.messages = adminListContributionMessages.messages
      },
      error({ message }) {
        this.toastError(message)
      },
    },
  },
  methods: {
    updateStatus(id) {
      this.$emit('update-status', id)
    },
  },
}
</script>
<style scoped>
.temp-message {
  margin-top: 50px;
}
</style>
