<template>
  <div class="contribution-messages-list">
    <b-container>
      <div v-for="message in messages" v-bind:key="message.id">
        <contribution-messages-list-item :message="message" />
      </div>
    </b-container>
    <b-container>
      <contribution-messages-formular
        v-if="['PENDING', 'IN_PROGRESS'].includes(state)"
        :contributionId="contributionId"
        v-on="$listeners"
        @update-state="updateState"
      />
    </b-container>

    <div
      v-b-toggle="'collapse' + String(contributionId)"
      class="text-center pointer h2 clearboth pt-1"
    >
      <b-button variant="outline-primary" block class="mt-4">
        <b-icon icon="arrow-up-short"></b-icon>
        {{ $t('form.close') }}
      </b-button>
    </div>
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
      required: true,
    },
    messages: {
      type: Array,
      required: true,
    },
  },
  methods: {
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
.clearboth {
  clear: both;
}
</style>
