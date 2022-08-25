<template>
  <div class="contribution-messages-list">
    <b-container>
      {{ messagesCount }}
      <div v-for="message in messages" v-bind:key="message.id">
        <b-container>
          <div v-for="message in messages" v-bind:key="message.id">
            <contribution-messages-list-item :message="message" />
          </div>
        </b-container>

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
    <br />
    <br />
    <br />
    <contribution-messages-formular :contributionId="contributionId" />
  </div>
</template>
<script>
import ContributionMessagesListItem from './slots/ContributionMessagesListItem.vue'
import ContributionMessagesFormular from '../ContributionMessages/ContributionMessagesFormular.vue'

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
    messagesCount: {
      type: Number,
      required: true,
    },
    messages: {
      type: Array,
      required: true,
    },
  },
}
</script>
<style scoped>
.temp-message {
  margin-top: 50px;
}
</style>
