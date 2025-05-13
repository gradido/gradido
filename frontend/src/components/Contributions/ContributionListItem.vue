<template>
  <div>
    <div
      class="contribution-list-item bg-white app-box-shadow gradido-border-radius pt-3 px-3"
      :class="localStatus === 'IN_PROGRESS' && !allContribution ? 'pulse border border-205' : ''"
    >
      <BRow>
        <BCol cols="3" lg="2" md="2">
          <app-avatar
            v-if="username.username"
            :name="username.username"
            :initials="username.initials"
            color="#fff"
            class="vue3-avatar fw-bold"
          />
          <BAvatar v-else rounded="lg" :variant="variant" size="4.55em">
            <variant-icon :icon="icon" variant="white" />
          </BAvatar>
        </BCol>
        <BCol>
          <div v-if="username.username" class="me-3 fw-bold">
            {{ username.username }}
            <variant-icon :icon="icon" :variant="variant" />
          </div>
          <div class="small">
            {{ $d(new Date(contributionDate), 'short') }}
          </div>
          <div class="mt-3 fw-bold">{{ $t('contributionText') }}</div>
          <div class="mb-3 text-break word-break">{{ memo }}</div>
          <div v-if="updatedBy > 0" class="mt-2 mb-2 small">
            {{ $t('moderatorChangedMemo') }}
          </div>
          <div
            v-if="localStatus === 'IN_PROGRESS' && !allContribution"
            class="text-danger pointer hover-font-bold"
            @click="emit('toggle-messages-visible')"
          >
            {{ $t('contribution.alert.answerQuestion') }}
          </div>
        </BCol>
        <BCol cols="9" lg="3" offset="3" offset-md="0" offset-lg="0">
          <div class="small">
            {{ $t('creation') }} {{ $t('(') }}{{ hours }} {{ $t('h') }}{{ $t(')') }}
          </div>
          <div v-if="localStatus === 'DENIED' && allContribution" class="fw-bold">
            <variant-icon icon="x-circle" variant="danger" />
            {{ $t('contribution.alert.denied') }}
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
      <BRow
        v-if="
          (!['CONFIRMED', 'DELETED'].includes(localStatus) && !allContribution) || messagesCount > 0
        "
        class="p-2"
      >
        <BCol cols="3" class="me-auto text-center">
          <div
            v-if="
              !['CONFIRMED', 'DELETED'].includes(localStatus) && !allContribution && !moderatorId
            "
            class="test-delete-contribution pointer me-3"
            @click="processDeleteContribution({ id })"
          >
            <IBiTrash />

            <div>{{ $t('delete') }}</div>
          </div>
        </BCol>
        <BCol cols="3" class="text-center">
          <div
            v-if="
              !['CONFIRMED', 'DELETED'].includes(localStatus) && !allContribution && !moderatorId
            "
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
            <div>{{ $t('moderatorChat') }}</div>
          </div>
        </BCol>
      </BRow>
      <BCollapse :model-value="messagesVisible">
        <contribution-messages-list
          v-if="messagesCount > 0"
          :messages="localMessages"
          :status="localStatus"
          :contribution-id="contributionId"
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
import AppAvatar from '@/components/AppAvatar.vue'
import { GDD_PER_HOUR } from '../../constants'
import { deleteContribution } from '@/graphql/contributions.graphql'

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
  user: {
    type: Object,
    required: false,
  },
  createdAt: {
    type: String,
  },
  contributionDate: {
    type: String,
  },
  deletedAt: {
    type: String,
    required: false,
  },
  confirmedBy: {
    type: Number,
    required: false,
  },
  confirmedAt: {
    type: String,
    required: false,
  },
  deniedBy: {
    type: Number,
    required: false,
  },
  deniedAt: {
    type: String,
    required: false,
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
  contributionId: {
    type: Number,
    required: true,
  },
  allContribution: {
    type: Boolean,
    required: false,
    default: false,
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

const { mutate: deleteContributionMutation } = useMutation(deleteContribution)

const localMessages = ref([])
const localStatus = ref(props.contributionStatus)

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

const statusMapping = {
  CONFIRMED: { variant: 'success', icon: 'check' },
  DELETED: { variant: 'danger', icon: 'trash' },
  DENIED: { variant: 'warning', icon: 'x-circle' },
  IN_PROGRESS: { variant: '205', icon: 'question' },
  default: { variant: 'primary', icon: 'bell-fill' },
}

const variant = computed(() => {
  return (statusMapping[localStatus.value] || statusMapping.default).variant
})

const icon = computed(() => {
  return (statusMapping[localStatus.value] || statusMapping.default).icon
})

const username = computed(() => {
  if (!props.user) return {}
  return {
    username: props.user.alias
      ? props.user.alias
      : `${props.user.firstName} ${props.user.lastName}`,
    initials: `${props.user.firstName[0]}${props.user.lastName[0]}`,
  }
})

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
