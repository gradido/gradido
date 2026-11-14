// AI-GENERATED — not an architecture reference
import { BButton, BCol, BForm, BFormGroup, BRow, type ButtonVariant } from 'bootstrap-vue-next'
import {
  computed,
  defineComponent,
  onMounted,
  onUnmounted,
  type PropType,
  reactive,
  ref,
  toRaw,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { date as dateSchema, number, object, string } from 'yup'
import { OpenCreationsAmount } from '@/components/Contributions/OpenCreationsAmount'
import LabeledInput from '@/components/Inputs/LabeledInput.vue'
import ValidatedInput from '@/components/Inputs/ValidatedInput.vue'
import ThemedSelect from '@/components/ThemedSelect.vue'
import { useCreationGroupChoice } from '@/composables/useCreationGroupChoice'
import { useMinimalContributionDate } from '@/composables/useMinimalContributionDate'
import { GDD_PER_HOUR } from '@/constants'
import './ContributionForm.css'

/**
 * What the form is handed and what it hands back: a new contribution without `id`, one to
 * edit with it. The index signature is for the inputs, which hand their value up by name.
 */
/** What a parent reaches through a `ref` on the form: the way to free the button after a failure. */
export type ContributionFormHandle = { reset: () => void }

export type ContributionFormModel = {
  id?: number | string
  contributionDate?: string
  memo: string
  hours?: number | string
  amount: number | string
  creationGroups?: string[]
  [field: string]: unknown
}

const amountToHours = (amount: number | string) => (Number(amount) / GDD_PER_HOUR).toFixed(2)
const hoursToAmount = (hours: unknown) => (Number(hours) * GDD_PER_HOUR).toFixed(2)

/** The form to submit a contribution, and to change one that is not confirmed yet. */
export const ContributionForm = defineComponent({
  name: 'ContributionForm',
  props: {
    modelValue: { type: Object as PropType<ContributionFormModel>, required: true },
    maxGddLastMonth: { type: Number, required: true },
    maxGddThisMonth: { type: Number, required: true },
  },
  emits: ['upsert-contribution', 'abort'],
  setup(props, { emit, expose }) {
    const { t, d } = useI18n()

    const entityDataToForm = computed<ContributionFormModel>(() => ({
      ...props.modelValue,
      hours:
        props.modelValue.hours !== undefined
          ? props.modelValue.hours
          : amountToHours(props.modelValue.amount),
      contributionDate: props.modelValue.contributionDate
        ? new Date(props.modelValue.contributionDate).toISOString().slice(0, 10)
        : undefined,
    }))

    const form = reactive<ContributionFormModel>({ ...entityDataToForm.value })

    // Group functions: the creation-group field (create only), as the support form has it.
    // Optional / non-blocking. Not pre-filled where a contribution is edited, where the field is
    // hidden (`!form.id`) -- asking there would cost a query whose answer is thrown away.
    const { selected: selectedCreationGroup, options: creationGroupSelectOptions } =
      useCreationGroupChoice({ initial: form.creationGroups?.[0] ?? '', suggest: !form.id })

    const now = ref(new Date()) // checked every minute, updated if day, month or year changed
    const disableSmartValidState = ref(false)
    // set to true after submit, to disable submit button
    const submitted = ref(false)

    const minimalDate = computed(() => useMinimalContributionDate(now.value))
    const isThisMonth = computed(() => {
      const formContributionDate = new Date(form.contributionDate ?? '')
      return (
        formContributionDate.getMonth() === now.value.getMonth() &&
        formContributionDate.getFullYear() === now.value.getFullYear()
      )
    })

    // reactive validation schema, because some boundaries depend on form input and existing data
    const validationSchema = computed(() => {
      const maxAmounts = Number(isThisMonth.value ? props.maxGddThisMonth : props.maxGddLastMonth)
      const maxHours = parseFloat(Number(maxAmounts / GDD_PER_HOUR).toFixed(2))

      return object({
        // The date field is required and needs to be a valid date
        // contribution date
        contributionDate: dateSchema()
          .required('form.validation.contributionDate.required')
          .min(minimalDate.value.toISOString().slice(0, 10), ({ min }) => ({
            key: 'form.validation.contributionDate.min',
            values: { min: d(min) },
          })) // min date is first day of last month
          .max(now.value.toISOString().slice(0, 10), ({ max }) => ({
            key: 'form.validation.contributionDate.max',
            values: { max: d(max) },
          })), // date cannot be in the future
        memo: string()
          .min(5, ({ min }) => ({ key: 'form.validation.contributionMemo.min', values: { min } }))
          .max(512, ({ max }) => ({ key: 'form.validation.contributionMemo.max', values: { max } }))
          .required('form.validation.contributionMemo.required'),
        hours: string()
          .typeError({
            key: 'form.validation.hours.typeError',
            values: { min: 0.01, max: maxHours },
          })
          .transform((currentValue) =>
            !currentValue || typeof currentValue !== 'string'
              ? currentValue
              : currentValue.replace(',', '.'),
          )
          // min and max are needed for html min max which validatedInput will take from this scheme
          .min(0.01, ({ min }) => ({ key: 'form.validation.hours.min', values: { min } }))
          .max(maxHours, ({ max }) => ({ key: 'form.validation.hours.max', values: { max } }))
          .test('decimal-places', 'form.validation.hours.decimal-places', (value) => {
            if (value === undefined || value === null) {
              return true
            }
            return /^\d+(\.\d{0,2})?$/.test(value.toString())
          })
          // min and max are not working with string, so we need to do it manually
          .test(
            'min-hours',
            { key: 'form.validation.hours.min', values: { min: 0.01 } },
            (value) => {
              if (value === undefined || value === null || Number.isNaN(parseFloat(value))) {
                return false
              }
              return parseFloat(value) >= 0.01
            },
          )
          .test(
            'max-hours',
            { key: 'form.validation.hours.max', values: { max: maxHours } },
            (value) => {
              if (value === undefined || value === null || Number.isNaN(parseFloat(value))) {
                return false
              }
              return parseFloat(value) <= maxHours
            },
          ),
        amount: number().min(0.01).max(maxAmounts),
      })
    })

    const disabled = computed(() => !validationSchema.value.isValidSync(form) || submitted.value)

    // decide message if no open creation exists
    const noOpenCreation = computed(() => {
      if (props.maxGddThisMonth <= 0 && props.maxGddLastMonth <= 0) {
        return t('contribution.noOpenCreation.allMonth')
      }
      if (form.contributionDate) {
        if (isThisMonth.value && props.maxGddThisMonth <= 0) {
          return t('contribution.noOpenCreation.thisMonth')
        }
        if (!isThisMonth.value && props.maxGddLastMonth <= 0) {
          return t('contribution.noOpenCreation.lastMonth')
        }
      }
      return undefined
    })

    // make sure, that base date for min and max date is up to date, even if user work at midnight
    onMounted(() => {
      const interval = setInterval(() => {
        const localNow = new Date()
        if (
          localNow.getDate() !== now.value.getDate() ||
          localNow.getMonth() !== now.value.getMonth() ||
          localNow.getFullYear() !== now.value.getFullYear()
        ) {
          now.value = localNow
        }
      }, 60 * 1000) // check every minute

      onUnmounted(() => {
        clearInterval(interval)
      })
    })

    const updateField = (newValue: unknown, name?: string) => {
      if (typeof name === 'string' && name.length) {
        form[name] = newValue
        if (name === 'hours') {
          const hoursTransformed = validationSchema.value.fields.hours.cast(newValue)
          const amount = hoursTransformed ? hoursToAmount(hoursTransformed) : GDD_PER_HOUR
          form.amount = amount.toString()
        }
      }
    }

    const submit = () => {
      submitted.value = true
      form.creationGroups = selectedCreationGroup.value ? [selectedCreationGroup.value] : []
      emit('upsert-contribution', toRaw(form))
    }
    // The parent sends what `submit` handed up; when that fails, the button is freed again for a
    // second try. Without it a failed submission left the form locked.
    const reset = () => {
      submitted.value = false
    }

    expose({
      form,
      isThisMonth,
      noOpenCreation,
      disabled,
      selectedCreationGroup,
      updateField,
      submit,
      reset,
    })

    // `block` is no prop of BButton: it lands on the button as the empty attribute it was.
    const block = { block: '' } as object

    return () => (
      <>
        <OpenCreationsAmount
          minimalDate={minimalDate.value}
          maxGddLastMonth={props.maxGddLastMonth}
          maxGddThisMonth={props.maxGddThisMonth}
        />
        <div class='mb-3' />
        <div class='contribution-form'>
          <BForm
            class='form-style p-3 bg-white app-box-shadow gradido-border-radius'
            onSubmit={(event: Event) => {
              event.preventDefault()
              submit()
            }}
          >
            <ValidatedInput
              id='contribution-date'
              modelValue={form.contributionDate}
              name='contributionDate'
              label={t('contribution.selectDate')}
              no-flip={true}
              class='mb-4 bg-248'
              type='date'
              rules={validationSchema.value.fields.contributionDate}
              disableSmartValidState={disableSmartValidState.value}
              onUpdate:modelValue={updateField}
            />
            {noOpenCreation.value ? (
              <div class='p-3' data-test='contribution-message'>
                {noOpenCreation.value}
              </div>
            ) : (
              <div>
                {!form.id ? (
                  <BFormGroup
                    id='contribution-creation-group-group'
                    class='mb-4'
                    label={t('contribution.creationGroup.label')}
                    description={t('contribution.creationGroup.help')}
                  >
                    <ThemedSelect
                      modelValue={selectedCreationGroup.value}
                      options={creationGroupSelectOptions.value}
                      data-test='contribution-creation-group'
                      onUpdate:modelValue={(value: string) => {
                        selectedCreationGroup.value = value
                      }}
                    />
                  </BFormGroup>
                ) : null}
                <ValidatedInput
                  id='contribution-memo'
                  modelValue={form.memo}
                  name='memo'
                  label={t('contribution.activity')}
                  placeholder={t('contribution.yourActivity')}
                  rules={validationSchema.value.fields.memo}
                  textarea='true'
                  disableSmartValidState={disableSmartValidState.value}
                  onUpdate:modelValue={updateField}
                />
                {/* Data protection: said where the text is written, not buried in a help page.
                    Deliberately without a duration — the wording must stay true if the community
                    list's time window ever changes. */}
                <div class='form-text mb-3' data-test='contribution-memo-publication-hint'>
                  {t('contribution.memoIsPublic')}
                </div>
                <ValidatedInput
                  name='hours'
                  modelValue={form.hours}
                  label={t('form.hours')}
                  placeholder='0.01'
                  step='0.01'
                  type='text'
                  rules={validationSchema.value.fields.hours}
                  disableSmartValidState={disableSmartValidState.value}
                  onUpdate:modelValue={updateField}
                />
                <LabeledInput
                  id='contribution-amount'
                  modelValue={form.amount}
                  class='mt-3'
                  name='amount'
                  label={t('form.amount')}
                  placeholder={GDD_PER_HOUR}
                  readonly
                  type='text'
                  trim=''
                />
                <BRow class='mt-5'>
                  <BCol>
                    <BButton
                      {...block}
                      type='reset'
                      variant='secondary'
                      data-test='button-cancel'
                      onClick={() => emit('abort')}
                    >
                      {t('form.cancel')}
                    </BButton>
                  </BCol>
                  <BCol
                    class='text-end mt-lg-0'
                    onMouseover={() => {
                      disableSmartValidState.value = true
                    }}
                  >
                    <BButton
                      {...block}
                      type='submit'
                      variant={'gradido' as ButtonVariant}
                      disabled={disabled.value}
                      data-test='button-submit'
                    >
                      {form.id ? t('form.change') : t('contribution.submit')}
                    </BButton>
                  </BCol>
                </BRow>
              </div>
            )}
          </BForm>
        </div>
      </>
    )
  },
})
