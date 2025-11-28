<template>
  <open-creations-amount
    :minimal-date="minimalDate"
    :max-gdd-last-month="maxGddLastMonth"
    :max-gdd-this-month="maxGddThisMonth"
  />
  <div class="mb-3"></div>
  <div class="contribution-form">
    <BForm
      class="form-style p-3 bg-white app-box-shadow gradido-border-radius"
      @submit.prevent="submit"
    >
      <ValidatedInput
        id="contribution-date"
        :model-value="form.contributionDate"
        name="contributionDate"
        :label="$t('contribution.selectDate')"
        :no-flip="true"
        class="mb-4 bg-248"
        type="date"
        :rules="validationSchema.fields.contributionDate"
        :disable-smart-valid-state="disableSmartValidState"
        @update:model-value="updateField"
      />
      <div v-if="noOpenCreation" class="p-3" data-test="contribution-message">
        {{ noOpenCreation }}
      </div>
      <div v-else>
        <ValidatedInput
          id="contribution-memo"
          :model-value="form.memo"
          name="memo"
          :label="$t('contribution.activity')"
          :placeholder="$t('contribution.yourActivity')"
          :rules="validationSchema.fields.memo"
          textarea="true"
          :disable-smart-valid-state="disableSmartValidState"
          @update:model-value="updateField"
        />
        <ValidatedInput
          name="hours"
          :model-value="form.hours"
          :label="$t('form.hours')"
          placeholder="0.01"
          step="0.01"
          type="text"
          :rules="validationSchema.fields.hours"
          :disable-smart-valid-state="disableSmartValidState"
          @update:model-value="updateField"
        />
        <LabeledInput
          id="contribution-amount"
          :model-value="form.amount"
          class="mt-3"
          name="amount"
          :label="$t('form.amount')"
          :placeholder="GDD_PER_HOUR"
          readonly
          type="text"
          trim
        />
        <BRow class="mt-5">
          <BCol>
            <BButton
              block
              type="reset"
              variant="secondary"
              data-test="button-cancel"
              @click="emit('abort')"
            >
              {{ $t('form.cancel') }}
            </BButton>
          </BCol>
          <BCol class="text-end mt-lg-0" @mouseover="disableSmartValidState = true">
            <BButton
              block
              type="submit"
              variant="gradido"
              :disabled="disabled"
              data-test="button-submit"
            >
              {{ form.id ? $t('form.change') : $t('contribution.submit') }}
            </BButton>
          </BCol>
        </BRow>
      </div>
    </BForm>
  </div>
</template>
<script setup>
import { reactive, computed, ref, onMounted, onUnmounted, toRaw } from 'vue'
import { useI18n } from 'vue-i18n'
import ValidatedInput from '@/components/Inputs/ValidatedInput'
import LabeledInput from '@/components/Inputs/LabeledInput'
import OpenCreationsAmount from './OpenCreationsAmount.vue'
import { object, date as dateSchema, number, string } from 'yup'
import { GDD_PER_HOUR } from '../../constants'
import { useMinimalContributionDate } from '@/composables/useMinimalContributionDate'

const amountToHours = (amount) => parseFloat(amount / GDD_PER_HOUR).toFixed(2)
const hoursToAmount = (hours) => parseFloat(hours * GDD_PER_HOUR).toFixed(2)

const props = defineProps({
  modelValue: { type: Object, required: true },
  maxGddLastMonth: { type: Number, required: true },
  maxGddThisMonth: { type: Number, required: true },
  successMessage: { type: String, required: true },
})

const emit = defineEmits(['upsert-contribution', 'abort'])

const { t, d } = useI18n()

const entityDataToForm = computed(() => ({
  ...props.modelValue,
  hours:
    props.modelValue.hours !== undefined
      ? props.modelValue.hours
      : amountToHours(props.modelValue.amount),
  contributionDate: props.modelValue.contributionDate
    ? new Date(props.modelValue.contributionDate).toISOString().slice(0, 10)
    : undefined,
}))

const form = reactive({ ...entityDataToForm.value })

const now = ref(new Date()) // checked every minute, updated if day, month or year changed
const disableSmartValidState = ref(false)

const minimalDate = computed(() => useMinimalContributionDate(now.value))
const isThisMonth = computed(() => {
  const formContributionDate = new Date(form.contributionDate)
  return (
    formContributionDate.getMonth() === now.value.getMonth() &&
    formContributionDate.getFullYear() === now.value.getFullYear()
  )
})

// reactive validation schema, because some boundaries depend on form input and existing data
const validationSchema = computed(() => {
  const maxAmounts = Number(
    isThisMonth.value ? parseFloat(props.maxGddThisMonth) : parseFloat(props.maxGddLastMonth),
  )
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
      .typeError({ key: 'form.validation.hours.typeError', values: { min: 0.01, max: maxHours } })
      .transform((currentValue) =>
        !currentValue || typeof currentValue !== 'string'
          ? currentValue
          : currentValue.replace(',', '.'),
      )
      // min and max are needed for html min max which validatedInput will take from this scheme
      .min(0.01, ({ min }) => ({ key: 'form.validation.hours.min', values: { min } }))
      .max(maxHours, ({ max }) => ({ key: 'form.validation.hours.max', values: { max } }))
      .test('decimal-places', 'form.validation.hours.decimal-places', (value) => {
        if (value === undefined || value === null) return true
        return /^\d+(\.\d{0,2})?$/.test(value.toString())
      })
      // min and max are not working with string, so we need to do it manually
      .test('min-hours', { key: 'form.validation.hours.min', values: { min: 0.01 } }, (value) => {
        if (value === undefined || value === null || Number.isNaN(parseFloat(value))) {
          return false
        }
        return parseFloat(value) >= 0.01
      })
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

const disabled = computed(() => !validationSchema.value.isValidSync(form))

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

const updateField = (newValue, name) => {
  if (typeof name === 'string' && name.length) {
    form[name] = newValue
    if (name === 'hours') {
      const hoursTransformed = validationSchema.value.fields.hours.cast(newValue)
      const amount = hoursTransformed ? hoursToAmount(hoursTransformed) : GDD_PER_HOUR
      form.amount = amount.toString()
    }
  }
}

function submit() {
  emit('upsert-contribution', toRaw(form))
}
</script>
<style>
.form-style {
  min-height: 410px;
}

span.errors {
  color: red;
}
</style>
