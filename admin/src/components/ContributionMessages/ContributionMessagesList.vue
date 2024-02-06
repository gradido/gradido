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
        :contributionMemo="contributionMemo"
        :hideResubmission="hideResubmission"
        :inputResubmissionDate="resubmissionAt"
        @get-list-contribution-messages="$apollo.queries.Messages.refetch()"
        @update-status="updateStatus"
        @reload-contribution="reloadContribution"
        @update-contributions="updateContributions"
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
    contributionMemo: {
      type: String,
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
    hideResubmission: {
      type: Boolean,
      required: true,
    },
    resubmissionAt: {
      type: String,
      required: false,
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
    reloadContribution(id) {
      this.$emit('reload-contribution', id)
    },
    updateContributions() {
      this.$emit('update-contributions')
    },
  },
}
</script>
<style scoped>
.temp-message {
  margin-top: 50px;
}
</style>
