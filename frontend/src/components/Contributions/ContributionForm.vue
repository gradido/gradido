<template>
  <div class="contribution-form">
    <open-creations-amount
      v-if="lastMonthOpenCreation && thisMonthOpenCreation"
      :minimal-date="minimalDate"
      :max-gdd-last-month="lastMonthOpenCreation.amount"
      :max-gdd-this-month="thisMonthOpenCreation.amount"
    />
    <div class="mb-3"></div>
    <BForm
      class="form-style p-3 bg-white app-box-shadow gradido-border-radius"
      @submit.prevent="submit"
    >
      <ValidatedInput
        id="contribution-date"
        :model-value="date"
        name="date"
        :label="$t('contribution.selectDate')"
        :no-flip="true"
        class="mb-4 bg-248"
        type="date"
        :rules="validationSchema.fields.date"
        @update:model-value="updateField"
      />
      <div v-if="noOpenCreation" class="p-3" data-test="contribution-message">
        {{ noOpenCreation }}
      </div>
      <div v-else>
        <ValidatedInput
          id="contribution-memo"
          :model-value="memo"
          name="memo"
          :label="$t('contribution.activity')"
          :placeholder="$t('contribution.yourActivity')"
          :rules="validationSchema.fields.memo"
          textarea="true"
          @update:model-value="updateField"
        />
        <ValidatedInput
          name="hours"
          :model-value="hours"
          :label="$t('form.hours')"
          placeholder="0.01"
          step="0.01"
          type="number"
          :rules="validationSchema.fields.hours"
          @update:model-value="updateField"
        />
        <LabeledInput
          id="contribution-amount"
          :model-value="amount"
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
              @click="fullFormReset"
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
import { reactive, ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { openCreations } from '@/graphql/contributions.graphql'
import { createContribution, updateContribution, deleteContribution } from '@/graphql/mutations'
import ValidatedInput from '@/components/Inputs/ValidatedInput'
import LabeledInput from '@/components/Inputs/LabeledInput'
import OpenCreationsAmount from '@/components/Contributions/OpenCreationsAmount'
import { memo as memoSchema } from '@/validationSchemas'
import { object, date as dateSchema, number } from 'yup'
import { GDD_PER_HOUR } from '../../constants'

const props = defineProps({
  modelValue: { type: Object, required: true },
})

const emit = defineEmits(['update-contribution', 'set-contribution', 'update:modelValue'])

const { t } = useI18n()

const form = reactive({ ...props.modelValue })
const thisMonthOpenCreation = ref({ month: 0, year: 0, amount: 0 })
const lastMonthOpenCreation = ref({ month: 0, year: 0, amount: 0 })

const { onResult: onResultOpenCreations, refetch: refetchOpenCreations } = useQuery(
  openCreations,
  null,
  {
    fetchPolicy: 'network-only',
  },
)

function getMonth(value) {
  if (value instanceof Date) {
    return value.getMonth()
  }
  return value.month
}

function getYear(value) {
  if (value instanceof Date) {
    return value.getFullYear()
  }
  return value.year
}

function isEqualMonthYear(a, b) {
  return getYear(a) === getYear(b) && getMonth(a) === getMonth(b)
}

// When form.value.id is defined, the form is in edit mode.
// In this case, update the open creation for the current month/year
// by re-adding the value passed from the parent component (props.modelValue.amount).
// The value must be added back because the contribution already exists
// and its amount has already been deducted from the open creations.
function adjustOpenCreationOnEdit(openCreation) {
  if (!openCreation) return null
  const result = { ...openCreation }
  if (form.id && isEqualMonthYear(openCreation, date.value)) {
    result.amount = parseFloat(openCreation.amount) + parseFloat(props.modelValue.amount)
  } else {
    result.amount = parseFloat(openCreation.amount)
  }
  return result
}

const chosenMonthOpenCreation = computed(() => {
  if (!lastMonthOpenCreation.value) return null
  if (!form.date) return thisMonthOpenCreation.value
  return isEqualMonthYear(new Date(form.date), lastMonthOpenCreation.value)
    ? lastMonthOpenCreation.value
    : thisMonthOpenCreation.value
})

onResultOpenCreations(({ data }) => {
  thisMonthOpenCreation.value = adjustOpenCreationOnEdit(data.openCreations.thisMonth)
  lastMonthOpenCreation.value = adjustOpenCreationOnEdit(data.openCreations.lastMonth)
})

// helper
const thisMonthYear = computed(() => new Date().getMonth())
const minimalDate = computed(() => {
  const date = new Date()
  return new Date(date.setMonth(date.getMonth() - 1, 1))
})
const lastMonth = computed(() => minimalDate.value.getMonth())

// update local form if in parent form changed, it is necessary because the community page will reuse this form also for editing existing
// contributions, and it will reusing a existing instance of this component
watch(
  () => props.modelValue,
  (newValue) => Object.assign(form, newValue),
)

// use computed to make sure child input update if props from parent from this component change
const amount = computed(() => form.amount)
const date = computed(() => form.date)
const hours = computed(() => form.hours)
const memo = computed(() => form.memo)

// reactive validation schema, because some boundaries depend on form input and existing data
const validationSchema = computed(() => {
  const maxAmounts = Number(chosenMonthOpenCreation.value?.amount || 0)
  const maxHours = parseFloat(Number(maxAmounts / GDD_PER_HOUR).toFixed(2))

  return object({
    // The date field is required and needs to be a valid date
    // contribution date
    date: dateSchema()
      .required()
      .min(minimalDate.value.toISOString().slice(0, 10)) // min date is first day of last month
      .max(new Date().toISOString().slice(0, 10))
      .default(''), // date cannot be in the future
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

const isThisMonth = computed(() => isEqualMonthYear(new Date(form.date), new Date()))
const noOpenCreation = computed(() => {
  if (thisMonthOpenCreation.value?.amount <= 0 && lastMonthOpenCreation.value?.amount <= 0) {
    return t('contribution.noOpenCreation.allMonth')
  }
  if (form.date) {
    if (isThisMonth.value && thisMonthOpenCreation.value.amount <= 0) {
      return t('contribution.noOpenCreation.thisMonth')
    }
    if (!isThisMonth.value && lastMonthOpenCreation.value.amount <= 0) {
      return t('contribution.noOpenCreation.lastMonth')
    }
  }
  return undefined
})

const updateField = (newValue, name) => {
  if (typeof name === 'string' && name.length) {
    form[name] = newValue
    if (name === 'hours') {
      const amount = form.hours ? (form.hours * GDD_PER_HOUR).toFixed(2) : GDD_PER_HOUR
      form.amount = amount.toString()
    }
  }
  emit('update:modelValue', form)
}

function submit() {
  const dataToSave = { ...form }
  let emitOption = 'set-contribution'
  if (props.modelValue.id) {
    dataToSave.id = props.modelValue.id
    emitOption = 'update-contribution'
  }
  emit(emitOption, dataToSave)
  fullFormReset()
}

function fullFormReset() {
  emit('update:modelValue', {
    id: undefined,
    date: null,
    memo: '',
    hours: '',
    amount: undefined,
  })
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
