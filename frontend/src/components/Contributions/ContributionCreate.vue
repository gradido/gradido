<template>
  <transition name="fade-out" @after-leave="resetForm">
    <div v-if="showForm">
      <contribution-form
        v-if="maxForMonths"
        :model-value="form"
        :max-gdd-last-month="parseFloat(maxForMonths.openCreations[1].amount)"
        :max-gdd-this-month="parseFloat(maxForMonths.openCreations[2].amount)"
        @upsert-contribution="handleCreateContribution"
      />
    </div>
  </transition>
</template>

<script setup>
import ContributionForm from '@/components/Contributions/ContributionForm.vue'
import { GDD_PER_HOUR } from '@/constants'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { openCreationsAmounts, createContribution } from '@/graphql/contributions.graphql'
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'

const { toastError, toastSuccess } = useAppToast()
const { t } = useI18n()

const { result: maxForMonths, refetch } = useQuery(
  openCreationsAmounts,
  {},
  { fetchPolicy: 'no-cache' },
)
const { mutate: createContributionMutation } = useMutation(createContribution)

const form = ref(emptyForm())
const showForm = ref(true)

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
    await createContributionMutation({ ...contribution })
    toastSuccess(t('contribution.submitted'))
    showForm.value = false
  } catch (err) {
    toastError(err.message)
  }
}

function resetForm() {
  refetch()
  showForm.value = true
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
