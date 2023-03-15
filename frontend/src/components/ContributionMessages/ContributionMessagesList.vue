<template>
  <div class="contribution-messages-list">
    <div>
      <div v-for="message in messages" v-bind:key="message.id" class="mt-3">
        <contribution-messages-list-item :message="message" />
      </div>
    </div>
    <div>
      <contribution-messages-formular
        v-if="['PENDING', 'IN_PROGRESS'].includes(state)"
        :contributionId="contributionId"
        v-on="$listeners"
        @update-state="updateState"
      />
    </div>

    <div v-b-toggle="'collapse' + String(contributionId)" class="text-center pointer clearboth">
      <b-button variant="outline-primary" block class="mb-3">
        <b-icon icon="arrow-up-short"></b-icon>
        {{ $t('form.close') }}
      </b-button>
    </div>
  </div>
</template>
<script>
import ContributionMessagesListItem from '@/components/ContributionMessages/ContributionMessagesListItem'
import ContributionMessagesFormular from '@/components/ContributionMessages/ContributionMessagesFormular'

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
.clearboth {
  clear: both;
}
</style>
