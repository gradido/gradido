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
        @get-list-contribution-messages="refetch"
        @update-status="updateStatus"
        @reload-contribution="reloadContribution"
        @update-contributions="updateContributions"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'

import { adminListContributionMessages } from '../../graphql/adminListContributionMessages.js'
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
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
})

const emit = defineEmits(['update-status', 'reload-contribution', 'update-contributions'])
const { toastError } = useAppToast()

const messages = ref([])

const { onResult, onError, result, refetch } = useQuery(
  adminListContributionMessages,
  {
    contributionId: props.contributionId,
  },
  {
    fetchPolicy: 'no-cache',
  },
)

onError((error) => {
  toastError(error.message)
})

onResult(() => {
  messages.value = result.value.adminListContributionMessages.messages
})

const updateStatus = (id) => {
  emit('update-status', id)
}

const reloadContribution = (id) => {
  emit('reload-contribution', id)
}

const updateContributions = () => {
  emit('update-contributions')
}
</script>
<style scoped>
.temp-message {
  margin-top: 50px;
}
</style>
