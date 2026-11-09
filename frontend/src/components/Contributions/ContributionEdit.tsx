// AI-GENERATED — not an architecture reference
import { useMutation, useQuery } from '@vue/apollo-composable'
import { computed, defineComponent, type PropType, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ContributionForm,
  type ContributionFormHandle,
  type ContributionFormModel,
} from '@/components/Contributions/ContributionForm'
import { useAppToast } from '@/composables/useToast'
import { openCreations, updateContribution } from '@/graphql/contributions.graphql'

/** What the row hands over when its pencil is tapped, and what the form is then opened with. */
export type ContributionEditItem = {
  id: number
  contributionDate: string
  memo: string
  amount: string
}

/** The form opened on one of the member's own contributions, with what may still be created. */
export const ContributionEdit = defineComponent({
  name: 'ContributionEdit',
  props: {
    modelValue: { type: Object as PropType<ContributionEditItem>, required: true },
  },
  emits: ['contribution-updated'],
  setup(props, { emit }) {
    const { toastError, toastSuccess } = useAppToast()
    const { t } = useI18n()

    const { result: openCreationsResult } = useQuery(openCreations, {}, { fetchPolicy: 'no-cache' })
    const { mutate: updateContributionMutation } = useMutation(updateContribution)
    const formHandle = ref<ContributionFormHandle | null>(null)

    const maxForMonths = computed<number[]>(() => {
      const originalDate = new Date(props.modelValue.contributionDate)
      if (openCreationsResult.value && openCreationsResult.value.openCreations.length) {
        return openCreationsResult.value.openCreations
          .slice(1)
          .map((creation: { year: number; month: number; amount: string }) => {
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

    const handleUpdateContribution = async (contribution: ContributionFormModel) => {
      try {
        await updateContributionMutation({ contributionId: props.modelValue.id, ...contribution })
        toastSuccess(t('contribution.updated'))
        emit('contribution-updated')
      } catch (err) {
        toastError((err as Error).message)
        formHandle.value?.reset()
      }
    }

    // Not before the limits are known, as ContributionCreate does it: with both at 0 the form
    // would say "nothing open to create in either month" until the answer lands.
    return () =>
      openCreationsResult.value ? (
        <ContributionForm
          ref={formHandle}
          modelValue={props.modelValue}
          maxGddLastMonth={maxForMonths.value[0]}
          maxGddThisMonth={maxForMonths.value[1]}
          onUpsert-contribution={handleUpdateContribution}
          onAbort={() => emit('contribution-updated')}
        />
      ) : null
  },
})
