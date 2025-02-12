<template>
  <div class="contribution-form">
    <BForm
      ref="form"
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
      <div v-if="noOpenCreation" class="p-3" data-test="contribtion-message">
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
          @update:model-value="updateField"
          textarea="true"
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
          placeholder="20"
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
import { reactive, computed, watchEffect, watch, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ValidatedInput from '@/components/Inputs/ValidatedInput'
import LabeledInput from '@/components/Inputs/LabeledInput'
import { memo as memoSchema } from '@/validationSchemas'
import { object, date as dateSchema, number } from 'yup'

const props = defineProps({
  modelValue: { type: Object, required: true },
  maxGddLastMonth: { type: Number, required: true },
  maxGddThisMonth: { type: Number, required: true },
})

const emit = defineEmits(['update-contribution', 'set-contribution', 'update:modelValue'])

const { t } = useI18n()

const form = reactive({ ...props.modelValue })

// update local form if in parent form changed, it is necessary because the community page will reuse this form also for editing existing
// contributions, and it will reusing a existing instance of this component
watch(() => props.modelValue, (newValue) => Object.assign(form, newValue))

// use computed to make sure child input update if props from parent from this component change
const amount = computed(() => (form.hours * 20).toFixed(2).toString())
const date = computed(() => form.date)
const hours = computed(() => form.hours)
const memo = computed(() => form.memo)

const isThisMonth = computed(() => {
  const formDate = new Date(form.date)
  const now = new Date()
  return formDate.getMonth() === now.getMonth() && formDate.getFullYear() === now.getFullYear()
});

// const maxHours = computed(() => Number((isThisMonth.value ? props.maxGddThisMonth : props.maxGddLastMonth) / 20))
// const maxAmounts = computed(() => Number(isThisMonth.value ? parseFloat(props.maxGddThisMonth): parseFloat(props.maxGddLastMonth)))

const validationSchema = computed(() => {
  const maxHours = Number((isThisMonth.value ? props.maxGddThisMonth : props.maxGddLastMonth) / 20)
  const maxAmounts = Number(isThisMonth.value ? parseFloat(props.maxGddThisMonth): parseFloat(props.maxGddLastMonth))

  return object({
    // The date field is required and needs to be a valid date
    // contribution date
    date: dateSchema()
      .required('contribution.noDateSelected')
      .min(new Date(new Date().setMonth(new Date().getMonth() - 1, 1)).toISOString().slice(0, 10))  // min date is first day of last month
      .max(new Date().toISOString().slice(0, 10))
      .default(''), // date cannot be in the future
    memo: memoSchema,
    hours: number().transform((value, originalValue) => 
        originalValue === "" ? undefined : value
      )
      .required('contribution.noHours')
      .min(0.01, ({min}) => ({ key: 'form.validation.gddCreationTime.min', values: { min } }))
      .max(maxHours, ({max}) => ({ key: 'form.validation.gddCreationTime.max', values: { max } }))
      .test(
        'decimal-places',
        'form.validation.gddCreationTime.decimal-places',
        (value) => {
          if (value === undefined || value === null) return true
          return /^\d+(\.\d{0,2})?$/.test(value.toString())
        }
      ),
    amount: number().max(maxAmounts)
  })
})

const updateField = (newValue, name) => {
  if (typeof name === 'string' && name.length) {
    form[name] = newValue
    if (name === 'hours') {
      form.amount = (newValue * 20).toFixed(2).toString()
    }
  }
  console.log('update field', { newValue, name, form, amount: amount.value })
  emit('update:modelValue', form)  
}

const disabled = computed(() => !validationSchema.value.isValidSync(form))

const noOpenCreation = computed(() => {
  if (props.maxGddThisMonth <= 0 && props.maxGddLastMonth <= 0) {
    return t('contribution.noOpenCreation.allMonth')
  }
  if (form.date) {
    if (props.isThisMonth && props.maxGddThisMonth <= 0) {
      return t('contribution.noOpenCreation.thisMonth')
    }
    if (!props.isThisMonth && props.maxGddLastMonth <= 0) {
      return t('contribution.noOpenCreation.lastMonth')
    }
  }
  return undefined
})

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
  form = {
    date: '',
    memo: '',
    hours: 0.0,
    amount: 0.0,
  }
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
