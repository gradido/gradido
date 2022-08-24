<template>
  <div class="contribution-messages-list">
    <b-container>
      <div v-for="message in messages" v-bind:key="message.id">
        <contribution-messages-list-item :typeId="state">
          <template #IN_PROGRESS>
            <is-moderator :message="message"></is-moderator>
          </template>
          <template #PENDING>
            <is-not-moderator :message="message" class="text-right"></is-not-moderator>
          </template>
        </contribution-messages-list-item>
      </div>
    </b-container>
    <br />
    <br />
    <br />
    <contribution-messages-formular :contributionId="contributionId" />
  </div>
</template>
<script>
import ContributionMessagesListItem from '@/components/ContributionMessages/ContributionMessagesListItem.vue'
import IsModerator from '@/components/ContributionMessages/slots/IsModerator.vue'
import IsNotModerator from '@/components/ContributionMessages/slots/IsNotModerator.vue'
import ContributionMessagesFormular from '@/components/ContributionMessages/ContributionMessagesFormular.vue'
export default {
  name: 'ContributionMessagesList',
  components: {
    ContributionMessagesListItem,
    IsModerator,
    IsNotModerator,
    ContributionMessagesFormular,
  },
  props: {
    contributionId: {
      type: Number,
      required: true,
    },
    state: {
      type: String,
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
