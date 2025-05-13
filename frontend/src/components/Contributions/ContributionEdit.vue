<template>
  <contribution-form
    :model-value="modelValue"
    :max-gdd-last-month="maxForMonths[0]"
    :max-gdd-this-month="maxForMonths[1]"
    @upsert-contribution="handleUpdateContribution"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import ContributionForm from '@/components/Contributions/ContributionForm.vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { openCreations, updateContribution } from '@/graphql/contributions.graphql'
import { useAppToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'

const { toastError, toastSuccess } = useAppToast()
const { t } = useI18n()

const emit = defineEmits(['contribution-updated'])

const props = defineProps({
  modelValue: { type: Object, required: true },
})

const { result: openCreationsResult } = useQuery(openCreations, {}, { fetchPolicy: 'no-cache' })
const { mutate: updateContributionMutation } = useMutation(updateContribution)

const maxForMonths = computed(() => {
  const originalDate = new Date(props.modelValue.contributionDate)
  if (openCreationsResult.value && openCreationsResult.value.openCreations.length) {
    return openCreationsResult.value.openCreations.slice(1).map((creation) => {
      if (
        creation.year === originalDate.getFullYear() &&
        creation.month === originalDate.getMonth()
      ) {
        return parseFloat(creation.amount) + parseFloat(props.modelValue.amount)
      }
      return parseFloat(creation.amount)
    })
  }
  return [0, 0]
})

async function handleUpdateContribution(contribution) {
  try {
    await updateContributionMutation({ contributionId: props.modelValue.id, ...contribution })
    toastSuccess(t('contribution.updated'))
    emit('contribution-updated')
  } catch (err) {
    toastError(err.message)
  }
}
</script>
