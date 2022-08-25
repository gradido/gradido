<template>
  <div class="contribution-messages-list">
    <b-container>
      {{ messages.lenght }}
      <div v-for="message in messages" v-bind:key="message.id">
        <contribution-messages-list-item :message="message" />

        <!-- <contribution-messages-list-item :typeId="message.isModerator">
          <template #1>
            <is-moderator :message="message"></is-moderator>
          </template>
          <template #0>
            <is-not-moderator :message="message" class="text-right"></is-not-moderator>
          </template>
        </contribution-messages-list-item> -->
      </div>
    </b-container>

    <contribution-messages-formular :contributionId="contributionId" />
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
      // console.log('getListContributionMessages', id)
      this.messages = []
      this.$apollo
        .query({
          query: listContributionMessages,
          variables: {
            contributionId: id,
          },
        })
        .then((result) => {
          // console.log('result', result.data.listContributionMessages)
          this.messages = result.data.listContributionMessages.messages
        })
        .catch((error) => {
          this.toastError(error.message)
        })
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
