<template>
  <div class="contribution-messages-list">
    <BListGroup>
      <BListGroupItem>
        <a :href="mailtoLink">
          {{ contribution.firstName }} {{ contribution.lastName }} &lt;{{ contribution.email }}&gt;
        </a>
        &nbsp;
        {{
          $t('contributionMessagesForm.hasRegisteredAt', {
            createdAt: new Date(contribution.createdAt).toLocaleString(),
          })
        }}
      </BListGroupItem>
    </BListGroup>
    <BContainer>
      <div v-for="message in messages" :key="message.id">
        <contribution-messages-list-item
          :message="message"
          :contribution-user-id="contribution.userId"
        />
      </div>
    </BContainer>
    <div v-if="contribution.status === 'PENDING' || contribution.status === 'IN_PROGRESS'">
      <contribution-messages-formular
        :contribution-id="contribution.id"
        :contribution-memo="contribution.memo"
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
import { ref, computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'

import { adminListContributionMessages } from '../../graphql/adminListContributionMessages.js'
import { useAppToast } from '@/composables/useToast'

const props = defineProps({
  contribution: {
    type: Object,
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
const mailtoLink = computed(() => {
  return `mailto:${props.contribution.email}`
})

const messages = ref([])

const { onResult, onError, result, refetch } = useQuery(
  adminListContributionMessages,
  {
    contributionId: props.contribution.id,
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
