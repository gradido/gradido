<template>
  <div>
    <div v-if="showForm">
      <contribution-form
        v-if="maxForMonths"
        :model-value="form"
        :max-gdd-last-month="maxGddLastMonth"
        :max-gdd-this-month="maxGddThisMonth"
        :success-message="$t('contribution.submitted')"
        @upsert-contribution="handleCreateContribution"
      />
    </div>
    <div v-else>
      <open-creations-amount
        :minimal-date="minimalDate"
        :max-gdd-last-month="maxGddLastMonth"
        :max-gdd-this-month="maxGddThisMonth"
      />
      <div class="mb-3"></div>
      <success-message
        :message="$t('contribution.submitted')"
        @on-back="showForm = true"
      ></success-message>
    </div>
  </div>
</template>

<script setup>
import ContributionForm from '@/components/Contributions/ContributionForm.vue'
import { GDD_PER_HOUR } from '@/constants'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { openCreationsAmounts, createContribution } from '@/graphql/contributions.graphql'
import { useAppToast } from '@/composables/useToast'
import { computed, ref } from 'vue'
import SuccessMessage from '@/components/SuccessMessage.vue'
import OpenCreationsAmount from '@/components/Contributions/OpenCreationsAmount.vue'
import { useMinimalContributionDate } from '@/composables/useMinimalContributionDate'

const { toastError } = useAppToast()

const { result: maxForMonths, refetch } = useQuery(
  openCreationsAmounts,
  {},
  { fetchPolicy: 'no-cache' },
)
const { mutate: createContributionMutation } = useMutation(createContribution)

const form = ref(emptyForm())
const showForm = ref(true)

const maxGddLastMonth = computed(() => parseFloat(maxForMonths.value?.openCreations[1].amount))
const maxGddThisMonth = computed(() => parseFloat(maxForMonths.value?.openCreations[2].amount))
const minimalDate = computed(() => useMinimalContributionDate(new Date()))

function emptyForm() {
  return {
    contributionDate: undefined,
    memo: '',
    hours: '',
    amount: GDD_PER_HOUR,
  }
}

async function handleCreateContribution(contribution) {
  try {
    form.value = emptyForm()
    await createContributionMutation({ ...contribution })
    await refetch()
    showForm.value = false
  } catch (err) {
    toastError(err.message)
  }
}
</script>
<style scoped>
.fade-out-enter-active,
.fade-out-leave-active {
  transition: opacity 0.5s ease;
}

.fade-out-enter-from,
.fade-out-leave-to {
  opacity: 0;
}
</style>
