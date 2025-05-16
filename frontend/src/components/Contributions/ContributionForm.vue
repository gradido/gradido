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
          @update:model-value="updateField"
        />
        <ValidatedInput
          name="hours"
          :model-value="form.hours"
          :label="$t('form.hours')"
          placeholder="0.01"
          step="0.01"
          type="number"
          :rules="validationSchema.fields.hours"
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
          <BCol class="text-end mt-lg-0">
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
import { memo as memoSchema } from '@/validationSchemas'
import OpenCreationsAmount from './OpenCreationsAmount.vue'
import { object, date as dateSchema, number } from 'yup'
import { GDD_PER_HOUR } from '../../constants'

const amountToHours = (amount) => parseFloat(amount / GDD_PER_HOUR).toFixed(2)
const hoursToAmount = (hours) => parseFloat(hours * GDD_PER_HOUR).toFixed(2)

const props = defineProps({
  modelValue: { type: Object, required: true },
  maxGddLastMonth: { type: Number, required: true },
  maxGddThisMonth: { type: Number, required: true },
})

const emit = defineEmits(['upsert-contribution', 'update:modelValue', 'abort'])

const { t } = useI18n()

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

const isThisMonth = computed(() => {
  const formContributionDate = new Date(form.contributionDate)
  return (
    formContributionDate.getMonth() === now.value.getMonth() &&
    formContributionDate.getFullYear() === now.value.getFullYear()
  )
})

const minimalDate = computed(() => {
  const minimalDate = new Date(now.value)
  minimalDate.setMonth(now.value.getMonth() - 1, 1)
  return minimalDate
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
      .required()
      .min(minimalDate.value.toISOString().slice(0, 10)) // min date is first day of last month
      .max(now.value.toISOString().slice(0, 10)), // date cannot be in the future
    memo: memoSchema,
    hours: number()
      .required()
      .transform((value, originalValue) => (originalValue === '' ? undefined : value))
      .min(0.01, ({ min }) => ({ key: 'form.validation.gddCreationTime.min', values: { min } }))
      .max(maxHours, ({ max }) => ({ key: 'form.validation.gddCreationTime.max', values: { max } }))
      .test('decimal-places', 'form.validation.gddCreationTime.decimal-places', (value) => {
        if (value === undefined || value === null) return true
        return /^\d+(\.\d{0,2})?$/.test(value.toString())
      }),
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
      const amount = form.hours ? hoursToAmount(form.hours) : GDD_PER_HOUR
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
