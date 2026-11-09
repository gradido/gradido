// AI-GENERATED — not an architecture reference
import { useMutation, useQuery } from '@vue/apollo-composable'
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ContributionForm,
  type ContributionFormHandle,
  type ContributionFormModel,
} from '@/components/Contributions/ContributionForm'
import { OpenCreationsAmount } from '@/components/Contributions/OpenCreationsAmount'
import SuccessMessage from '@/components/SuccessMessage.vue'
import { useMinimalContributionDate } from '@/composables/useMinimalContributionDate'
import { useAppToast } from '@/composables/useToast'
import { GDD_PER_HOUR } from '@/constants'
import { createContribution, openCreationsAmounts } from '@/graphql/contributions.graphql'

const emptyForm = (): ContributionFormModel => ({
  contributionDate: undefined,
  memo: '',
  hours: '',
  amount: GDD_PER_HOUR,
})

/** The "contribute" tab: the form, and after a submission the success screen in its place. */
export const ContributionCreate = defineComponent({
  name: 'ContributionCreate',
  setup() {
    const { t } = useI18n()
    const { toastError } = useAppToast()

    const { result: maxForMonths, refetch } = useQuery(
      openCreationsAmounts,
      {},
      { fetchPolicy: 'no-cache' },
    )
    const { mutate: createContributionMutation } = useMutation(createContribution)

    const form = ref(emptyForm())
    const showForm = ref(true)
    const formHandle = ref<ContributionFormHandle | null>(null)

    const maxGddLastMonth = computed(() => parseFloat(maxForMonths.value?.openCreations[1].amount))
    const maxGddThisMonth = computed(() => parseFloat(maxForMonths.value?.openCreations[2].amount))
    const minimalDate = computed(() => useMinimalContributionDate(new Date()))

    const handleCreateContribution = async (contribution: ContributionFormModel) => {
      try {
        form.value = emptyForm()
        await createContributionMutation({ ...contribution })
        await refetch()
        showForm.value = false
      } catch (err) {
        toastError((err as Error).message)
        formHandle.value?.reset()
      }
    }

    return () => (
      <div>
        {showForm.value ? (
          <div>
            {maxForMonths.value ? (
              <ContributionForm
                ref={formHandle}
                modelValue={form.value}
                maxGddLastMonth={maxGddLastMonth.value}
                maxGddThisMonth={maxGddThisMonth.value}
                onUpsert-contribution={handleCreateContribution}
              />
            ) : null}
          </div>
        ) : (
          <div>
            <OpenCreationsAmount
              minimalDate={minimalDate.value}
              maxGddLastMonth={maxGddLastMonth.value}
              maxGddThisMonth={maxGddThisMonth.value}
            />
            <div class='mb-3' />
            <SuccessMessage
              message={t('contribution.submitted')}
              onOn-back={() => {
                showForm.value = true
              }}
            />
          </div>
        )}
      </div>
    )
  },
})
