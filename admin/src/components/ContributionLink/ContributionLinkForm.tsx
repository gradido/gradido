// AI-GENERATED — not an architecture reference
import { useMutation } from '@vue/apollo-composable'
import {
  BButton,
  BCol,
  BForm,
  BFormGroup,
  BFormInput,
  BFormSelect,
  BFormTextarea,
  BRow,
} from 'bootstrap-vue-next'
import { defineComponent, ref, watch, withModifiers } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDateFormatter } from '@/composables/useDateFormatter'
import { useAppToast } from '@/composables/useToast'
import { createContributionLink } from '@/graphql/createContributionLink'
import { updateContributionLink } from '@/graphql/updateContributionLink'

type ContributionLinkFormData = {
  id?: number
  name?: string | null
  memo?: string | null
  amount?: string | null
  validFrom: string | null | undefined
  validTo: string | null | undefined
  cycle?: string
  maxPerCycle?: string
  maxAmountPerMonth?: string
}

export const ContributionLinkForm = defineComponent({
  name: 'ContributionLinkForm',
  props: {
    contributionLinkData: {
      type: Object,
      default: () => ({}),
    },
    editContributionLink: { type: Boolean, required: true },
  },
  emits: ['get-contribution-links', 'close-contribution-form'],
  setup(props, { emit }) {
    const { t } = useI18n()

    const { formatDateFromDateTime } = useDateFormatter()

    const form = ref<ContributionLinkFormData>({
      name: null,
      memo: null,
      amount: null,
      validFrom: null,
      validTo: null,
      cycle: 'ONCE',
      maxAmountPerMonth: '0',
    })

    const min = new Date().toLocaleDateString()
    const { toastError, toastSuccess } = useAppToast()

    const cycle = ref([
      { value: 'ONCE', text: t('contributionLink.options.cycle.once') },
      { value: 'DAILY', text: t('contributionLink.options.cycle.daily') },
    ])

    const maxPerCycle = ref([{ value: '1', text: '1 x' }])

    const { mutate: contributionLinkMutation } = useMutation(createContributionLink)

    const { mutate: contributionLinkMutationUpdate } = useMutation(updateContributionLink)

    // ⚠️ Takes the object the parent handed over and writes the trimmed dates into it, as the
    // template version did.
    watch(
      () => props.contributionLinkData,
      (newVal) => {
        form.value = newVal as ContributionLinkFormData
        form.value.validFrom = formatDateFromDateTime(newVal.validFrom)
        form.value.validTo = formatDateFromDateTime(newVal.validTo)
      },
    )

    const onReset = () => {
      form.value = { validFrom: null, validTo: null }
    }

    const onSubmit = async () => {
      if (form.value.validFrom === null) {
        return toastError(t('contributionLink.noStartDate'))
      }

      if (form.value.validTo === null) {
        return toastError(t('contributionLink.noEndDate'))
      }

      const variables = {
        ...form.value,
        // maxAmountPerMonth: 1, // TODO this is added only for test puropuse during migration since max amount input is commented out but without it being a number bigger then 0 it doesn't work
        id: props.contributionLinkData.id ? props.contributionLinkData.id : null,
      }

      try {
        const mutationType = props.editContributionLink
          ? contributionLinkMutationUpdate
          : contributionLinkMutation
        const result = await mutationType({ ...variables })
        const link = props.editContributionLink
          ? result?.data.updateContributionLink.link
          : result?.data.createContributionLink.link
        toastSuccess(props.editContributionLink ? t('contributionLink.changeSaved') : link)
        onReset()
        emit('close-contribution-form')
        emit('get-contribution-links')
      } catch (error) {
        toastError((error as Error).message)
      }
    }

    return () => (
      <div class='contribution-link-form'>
        {/* BForm declares neither event: both fall through to its <form> as native listeners */}
        <BForm class='m-5' onSubmit={withModifiers(onSubmit, ['prevent'])} onReset={onReset}>
          {/* Date */}
          <BRow>
            <BCol>
              <BFormGroup label={t('contributionLink.validFrom')}>
                <BFormInput
                  v-model={form.value.validFrom}
                  reset-button=''
                  size='lg'
                  min={min}
                  class='mb-4 test-validFrom'
                  reset-value=''
                  label-no-date-selected={t('contributionLink.noDateSelected')}
                  required
                  type='date'
                />
              </BFormGroup>
            </BCol>
            <BCol>
              <BFormGroup label={t('contributionLink.validTo')}>
                <BFormInput
                  v-model={form.value.validTo}
                  reset-button=''
                  size='lg'
                  min={form.value.validFrom ? form.value.validFrom : min}
                  class='mb-4 test-validTo'
                  reset-value=''
                  label-no-date-selected={t('contributionLink.noDateSelected')}
                  required
                  type='date'
                />
              </BFormGroup>
            </BCol>
          </BRow>

          {/* Name */}
          <BFormGroup label={t('contributionLink.name')}>
            <BFormInput
              v-model={form.value.name}
              size='lg'
              type='text'
              placeholder='Name'
              required
              maxlength='100'
              class='test-name'
            />
          </BFormGroup>
          {/* Desc */}
          <BFormGroup label={t('contributionLink.memo')}>
            <BFormTextarea
              v-model={form.value.memo}
              size='lg'
              placeholder={t('contributionLink.memo')}
              required
              maxlength='255'
              class='test-memo'
            />
          </BFormGroup>
          {/* Amount */}
          <BFormGroup label={t('contributionLink.amount')}>
            <BFormInput
              v-model={form.value.amount}
              size='lg'
              type='number'
              placeholder='0'
              required
              class='test-amount'
            />
          </BFormGroup>
          <BRow class='mb-4'>
            <BCol>
              {/* Cycle */}
              <label for='cycle'>{t('contributionLink.cycle')}</label>
              <BFormSelect
                v-model={form.value.cycle}
                options={cycle.value}
                class='mb-3'
                size='lg'
              />
            </BCol>
            <BCol>
              {/* maxPerCycle */}
              <label for='maxPerCycle'>{t('contributionLink.maxPerCycle')}</label>
              <BFormSelect
                v-model={form.value.maxPerCycle}
                options={maxPerCycle.value}
                disabled
                class='mb-3'
                size='lg'
              />
            </BCol>
          </BRow>

          {/* Max amount */}
          {/*
          <BFormGroup :label="$t('contributionLink.maximumAmount')">
            <BFormInput
              v-model="form.maxAmountPerMonth"
              size="lg"
              :disabled="disabled"
              type="number"
              placeholder="0"
            ></BFormInput>
          </BFormGroup>
          */}
          <div class='mt-6'>
            <BButton type='submit' variant='primary' class='me-2'>
              {props.editContributionLink
                ? t('contributionLink.saveChange')
                : t('contributionLink.create')}
            </BButton>
            <BButton type='reset' variant='danger' class='me-2'>
              {t('contributionLink.clear')}
            </BButton>
            <BButton onClick={withModifiers(() => emit('close-contribution-form'), ['prevent'])}>
              {t('close')}
            </BButton>
            {
              // ⚠️ A debugging leftover of the template version, kept 1:1: it logs on every render.
              // biome-ignore lint/suspicious/noConsole: kept as the template had it
              console.log(props.editContributionLink)
            }
          </div>
        </BForm>
      </div>
    )
  },
})
