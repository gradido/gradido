<template>
  <div>
    <div class="contribution-list-item bg-white app-box-shadow gradido-border-radius pt-3 px-3">
      <BRow>
        <BCol cols="3" lg="2" md="2">
          <app-avatar
            v-if="username.username"
            :name="username.username"
            :initials="username.initials"
            color="#fff"
            class="vue3-avatar fw-bold"
          />
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
        </BCol>
        <BCol cols="9" lg="3" offset="3" offset-md="0" offset-lg="0">
          <div class="small">
            {{ $t('creation') }} {{ $t('(') }}{{ hours }} {{ $t('h') }}{{ $t(')') }}
          </div>
          <div v-if="contributionStatus === 'DENIED'" class="fw-bold">
            <variant-icon icon="x-circle" variant="danger" />
            {{ $t('contribution.alert.denied') }}
          </div>
          <div v-if="contributionStatus === 'DELETED'" class="small">
            {{ $t('contribution.deleted') }}
          </div>
          <div v-else class="fw-bold">{{ $filters.GDD(amount) }}</div>
        </BCol>
        <BCol cols="12" md="1" lg="1" class="text-end align-items-center" />
      </BRow>
      <div class="pb-3"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppAvatar from '@/components/AppAvatar.vue'
import { GDD_PER_HOUR } from '../../constants'
import { useContributionStatus } from '@/composables/useContributionStatus'

const props = defineProps({
  amount: {
    type: String,
  },
  memo: {
    type: String,
  },
  user: {
    type: Object,
    required: false,
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
})

const { getVariant, getIcon } = useContributionStatus()
const variant = computed(() => getVariant(props.contributionStatus))
const icon = computed(() => getIcon(props.contributionStatus))

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
</script>

<style lang="scss" scoped>
:deep(.b-avatar-custom > svg) {
  width: 2.5em;
  height: 2.5em;
}
</style>
