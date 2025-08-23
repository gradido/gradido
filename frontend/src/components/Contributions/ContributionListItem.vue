<template>
  <div>
    <div
      class="contribution-list-item bg-white app-box-shadow gradido-border-radius pt-3 px-3"
      :class="localStatus === 'IN_PROGRESS' ? 'pulse border border-205' : ''"
    >
      <BRow>
        <BCol cols="3" lg="2" md="2">
          <BAvatar rounded="lg" :variant="variant" size="4.55em">
            <variant-icon :icon="icon" variant="white" />
          </BAvatar>
        </BCol>
        <BCol>
          <div class="small">
            {{ $d(new Date(contributionDate), 'short') }}
          </div>
          <div class="mt-3 fw-bold">{{ $t('contributionText') }}</div>
          <div class="mb-3 text-break word-break">{{ memo }}</div>
          <div v-if="updatedBy > 0" class="mt-2 mb-2 small">
            {{ $t('moderatorChangedMemo') }}
          </div>
          <div
            v-if="localStatus === 'IN_PROGRESS'"
            class="text-danger pointer hover-font-bold"
            @click="emit('toggle-messages-visible')"
          >
            {{ $t('contribution.alert.answerQuestion') }}
            <br />
            {{ $t('answerNow') }}
          </div>
        </BCol>
        <BCol cols="9" lg="3" offset="3" offset-md="0" offset-lg="0">
          <div class="small">
            {{ $t('creation') }} {{ $t('(') }}{{ hours }} {{ $t('h') }}{{ $t(')') }}
          </div>
          <div v-if="localStatus === 'DELETED'" class="small">
            {{ $t('contribution.deleted') }}
          </div>
          <div v-else class="fw-bold">{{ $filters.GDD(amount) }}</div>
        </BCol>
        <BCol cols="12" md="1" lg="1" class="text-end align-items-center">
          <div v-if="messagesCount > 0 && !moderatorId" @click="emit('toggle-messages-visible')">
            <collapse-icon class="text-end" :visible="messagesVisible" />
          </div>
        </BCol>
      </BRow>
      <BRow v-if="!['CONFIRMED', 'DELETED'].includes(localStatus) || messagesCount > 0" class="p-2">
        <BCol cols="3" class="me-auto text-center">
          <div
            v-if="!['CONFIRMED', 'DELETED'].includes(localStatus) && !moderatorId"
            class="test-delete-contribution pointer me-3"
            @click="processDeleteContribution({ id })"
          >
            <IBiTrash />

            <div>{{ $t('delete') }}</div>
          </div>
        </BCol>
        <BCol cols="3" class="text-center">
          <div
            v-if="!['CONFIRMED', 'DELETED'].includes(localStatus) && !moderatorId"
            class="test-edit-contribution pointer me-3"
            @click="
              $emit('update-contribution-form', {
                id,
                contributionDate,
                memo,
                amount,
              })
            "
          >
            <IBiPencil />
            <div>{{ $t('edit') }}</div>
          </div>
        </BCol>
        <BCol cols="6" class="text-center">
          <div
            v-if="messagesCount > 0 && !moderatorId"
            class="pointer"
            @click="emit('toggle-messages-visible')"
          >
            <IBiChatDots />
            <div>{{ $t('Chat') }}</div>
          </div>
        </BCol>
      </BRow>
      <BCollapse :model-value="messagesVisible">
        <contribution-messages-list
          v-if="messagesCount > 0"
          :messages="localMessages"
          :status="localStatus"
          :contribution-id="id"
          @close-messages-list="emit('toggle-messages-visible')"
          @add-contribution-message="addContributionMessage"
        />
      </BCollapse>
      <div class="pb-3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import CollapseIcon from '../TransactionRows/CollapseIcon'
import ContributionMessagesList from '@/components/ContributionMessages/ContributionMessagesList'
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'
import { useMutation } from '@vue/apollo-composable'
import { GDD_PER_HOUR } from '../../constants'
import { deleteContribution } from '@/graphql/contributions.graphql'
import { useContributionStatus } from '@/composables/useContributionStatus'

const props = defineProps({
  id: {
    type: Number,
  },
  amount: {
    type: String,
  },
  memo: {
    type: String,
  },
  messages: {
    type: Array,
    required: false,
    default: () => [],
  },
  contributionDate: {
    type: String,
  },
  updatedBy: {
    type: Number,
    required: false,
  },
  contributionStatus: {
    type: String,
    required: false,
    default: '',
  },
  messagesCount: {
    type: Number,
    required: false,
  },
  moderatorId: {
    type: Number,
    required: false,
    default: 0,
  },
  messagesVisible: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const { toastError, toastSuccess } = useAppToast()
const { t } = useI18n()
const { getVariant, getIcon } = useContributionStatus()

const { mutate: deleteContributionMutation } = useMutation(deleteContribution)

const localMessages = ref([])
const localStatus = ref(props.contributionStatus)
const variant = computed(() => getVariant(props.contributionStatus))
const icon = computed(() => getIcon(props.contributionStatus))

// if parent reload messages, update local messages copy
watch(
  () => props.messages,
  () => {
    if (props.messages?.length > 0) {
      localMessages.value = [...props.messages]
    }
  },
  { immediate: true },
)

watch(
  () => props.contributionStatus,
  () => {
    localStatus.value = props.contributionStatus
  },
)

const hours = computed(() => parseFloat((props.amount / GDD_PER_HOUR).toFixed(2)))

async function processDeleteContribution(item) {
  if (props.allContribution) {
    // eslint-disable-next-line no-console
    console.warn('tried to delete contribution from all contributions')
    return
  }
  if (window.confirm(t('contribution.delete'))) {
    try {
      await deleteContributionMutation(item)
      toastSuccess(t('contribution.deleted'))
      localStatus.value = 'DELETED'
      emit('contribution-changed')
    } catch (err) {
      toastError(err.message)
    }
  }
}

function addContributionMessage(message) {
  localMessages.value.push(message)
  localStatus.value = 'PENDING'
  emit('contribution-changed')
}

const emit = defineEmits([
  'toggle-messages-visible',
  'update-contribution-form',
  'contribution-changed',
])
</script>

<style lang="scss" scoped>
:deep(.b-avatar-custom > svg) {
  width: 2.5em;
  height: 2.5em;
}
</style>
