<template>
  <div class="contribution-messages-list">
    <div>
      <div v-for="message in messages" :key="message.id" class="mt-3">
        <contribution-messages-list-item :message="message" />
      </div>
    </div>
    <div>
      <contribution-messages-formular
        v-if="['PENDING', 'IN_PROGRESS'].includes(status)"
        :contribution-id="contributionId"
        v-bind="$attrs"
      />
    </div>

    <div class="text-center pointer clearboth">
      <BButton variant="outline-primary" block @click="$emit('close-messages-list')">
        <IBiArrowUpShort />
        {{ $t('form.close') }}
      </BButton>
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
    status: {
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
.clearboth {
  clear: both;
}
</style>
