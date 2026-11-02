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

    // What the form holds for a new link. The server needs a cycle: after a reset, after a link
    // was created and after an edit was closed the select stood empty, and creating the next
    // link failed (measured in the built admin, 23.10.2026).
    const newLinkForm = (): ContributionLinkFormData => ({
      name: null,
      memo: null,
      amount: null,
      validFrom: null,
      validTo: null,
      cycle: 'ONCE',
      maxAmountPerMonth: '0',
    })

    const form = ref<ContributionLinkFormData>(newLinkForm())

    const min = new Date().toLocaleDateString()
    const { toastError, toastSuccess } = useAppToast()

    const cycle = ref([
      { value: 'ONCE', text: t('contributionLink.options.cycle.once') },
      { value: 'DAILY', text: t('contributionLink.options.cycle.daily') },
    ])

    const maxPerCycle = ref([{ value: '1', text: '1 x' }])

    const { mutate: contributionLinkMutation } = useMutation(createContributionLink)

    const { mutate: contributionLinkMutationUpdate } = useMutation(updateContributionLink)

    // A copy of the row, with its dates trimmed to the day. The row is the list's own, and the
    // list holds what Apollo answered, which Apollo freezes: writing the trimmed dates into it
    // threw "Cannot assign to read only property 'validFrom'", and both date fields stayed empty
    // (measured in the built admin, 23.10.2026). A copy also keeps what is typed here out of
    // the list until it is saved.
    watch(
      () => props.contributionLinkData,
      (newVal) => {
        // Closing an edit hands over an empty object: the form is a new link's again.
        if (Object.keys(newVal).length === 0) {
          form.value = newLinkForm()
          return
        }
        form.value = {
          ...(newVal as ContributionLinkFormData),
          validFrom: formatDateFromDateTime(newVal.validFrom),
          validTo: formatDateFromDateTime(newVal.validTo),
        }
      },
    )

    const onReset = () => {
      form.value = newLinkForm()
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
        {/* BForm declares neither event: both fall through to its <form> as native listeners.
            On a phone its margin is 8px, not 48px: at 320px the form was 220px wide and its
            fields 124px (measured 23.10.2026). The pairs of dates and of cycles stand under each
            other there, side by side from 992px on, as before. */}
        <BForm class='m-2 m-lg-5' onSubmit={withModifiers(onSubmit, ['prevent'])} onReset={onReset}>
          {/* Date */}
          <BRow>
            <BCol cols='12' lg='6'>
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
            <BCol cols='12' lg='6'>
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
            <BCol cols='12' lg='6'>
              {/* Cycle */}
              <label for='cycle'>{t('contributionLink.cycle')}</label>
              <BFormSelect
                v-model={form.value.cycle}
                options={cycle.value}
                class='mb-3'
                size='lg'
              />
            </BCol>
            <BCol cols='12' lg='6'>
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
          {/* On a phone the buttons wrap with room between them, in a row as in a column; from
              992px on the row of before, its buttons 8px apart. */}
          <div class='mt-6 d-flex flex-wrap gap-2 d-lg-block'>
            <BButton type='submit' variant='primary' class='me-lg-2'>
              {props.editContributionLink
                ? t('contributionLink.saveChange')
                : t('contributionLink.create')}
            </BButton>
            <BButton type='reset' variant='danger' class='me-lg-2'>
              {t('contributionLink.clear')}
            </BButton>
            <BButton onClick={withModifiers(() => emit('close-contribution-form'), ['prevent'])}>
              {t('close')}
            </BButton>
          </div>
        </BForm>
      </div>
    )
  },
})
