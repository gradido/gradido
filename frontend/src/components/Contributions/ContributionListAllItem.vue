<template>
  <div>
    <div class="contribution-list-item bg-white app-box-shadow gradido-border-radius pt-3 px-3">
      <BRow>
        <BCol cols="3" lg="2" md="2">
          <BAvatar rounded="lg" :variant="variant" size="4.55em">
            <variant-icon :icon="icon" variant="white" />
          </BAvatar>
        </BCol>
        <BCol>
          <div class="me-3 small text-muted" data-test="contribution-number">
            {{ $t('contribution.number', { number: id }) }}
          </div>
          <div class="small">
            {{ $d(new Date(contributionDate), 'short') }}
          </div>
          <div class="mt-3 fw-bold">
            <span v-if="groupLabel">{{ groupLabel }}</span>
            <span v-else class="fw-normal fst-italic text-muted">
              {{ $t('contribution.groupTag.none') }}
            </span>
          </div>
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
          <!-- No DELETED branch: a deleted contribution is soft-removed and never reaches
               this list (loadAllContributions queries without withDeleted). -->
          <div class="fw-bold">{{ $filters.GDD(amount) }}</div>
        </BCol>
        <BCol cols="12" md="1" lg="1" class="text-end align-items-center" />
      </BRow>
      <div class="pb-3"></div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { GDD_PER_HOUR } from '../../constants'
import { useContributionStatus } from '@/composables/useContributionStatus'
import { groupTagLabels } from '@/utils/groupTagLabel'

// Data protection: the community list shows deeds, not people. The submitter is not even
// loaded in the backend; each contribution is identified by its number, which only its
// author can connect to themselves — and only if they choose to.
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
  groupTags: {
    type: Array,
    required: false,
    default: () => [],
  },
})

// Group functions: the contribution's group takes the place of the old, unhelpful
// "contribution text" heading. Several groups are listed one after another.
const groupLabel = computed(() => groupTagLabels(props.groupTags))

const { getVariant, getIcon } = useContributionStatus()
const variant = computed(() => getVariant(props.contributionStatus))
const icon = computed(() => getIcon(props.contributionStatus))

const hours = computed(() => parseFloat((props.amount / GDD_PER_HOUR).toFixed(2)))
</script>

<style lang="scss" scoped>
:deep(.b-avatar-custom > svg) {
  width: 2.5em;
  height: 2.5em;
}
</style>
