<template>
  <div class="contribution-messages-list">
    <BContainer>
      <div v-for="message in messages" :key="message.id">
        <contribution-messages-list-item
          :message="message"
          :contribution-user-id="contributionUserId"
        />
      </div>
    </BContainer>
    <div v-if="contributionStatus === 'PENDING' || contributionStatus === 'IN_PROGRESS'">
      <contribution-messages-formular
        :contribution-id="contributionId"
        :contribution-memo="contributionMemo"
        :hide-resubmission="hideResubmission"
        :input-resubmission-date="resubmissionAt"
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
  emits: ['update-status', 'reload-contribution', 'update-contributions'],
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
