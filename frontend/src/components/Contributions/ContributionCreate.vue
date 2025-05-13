<template>
  <contribution-form
    v-if="maxForMonths"
    :model-value="form"
    :max-gdd-last-month="parseFloat(maxForMonths.openCreations[1].amount)"
    :max-gdd-this-month="parseFloat(maxForMonths.openCreations[2].amount)"
    @upsert-contribution="handleCreateContribution"
    @reset-form="resetForm"
  />
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
    resetForm()
    refetch()
  } catch (err) {
    toastError(err.message)
  }
}

function resetForm() {
  form.value = emptyForm()
}
</script>
