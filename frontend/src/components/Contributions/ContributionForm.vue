<template>
  <div class="contribution-form">
    <BForm
      ref="form"
      class="form-style p-3 bg-white app-box-shadow gradido-border-radius"
      @submit.prevent="submit"
    >
      <ValidatedInput
        id="contribution-date"
        :model-value="formValues.date"
        name="date"
        :label="$t('contribution.selectDate')"
        :no-flip="true"
        class="mb-4 bg-248"
        type="date"
        :rules="validationSchema"
        @update:model-value="updateField"
      />
      <div v-if="showMessage" class="p-3" data-test="contribtion-message">
        {{ noOpenCreation }}
      </div>
      <div v-else>
        <input-textarea
          id="contribution-memo"
          :model-value="formValues.memo"
          name="memo"
          :label="$t('contribution.activity')"
          :placeholder="$t('contribution.yourActivity')"
          :rules="validationSchema"
          @update:model-value="updateField"
        />
        <ValidatedInput
          name="hours"
          :model-value="formValues.hours"
          :label="$t('form.hours')"
          placeholder="0.01"
          step="0.01"
          type="number"
          :rules="validationSchema"
          @update:model-value="updateField"
        />
        <LabeledInput
          id="contribution-amount"
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
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import InputTextarea from '@/components/Inputs/InputTextarea'
import ValidatedInput from '@/components/Inputs/ValidatedInput'
import LabeledInput from '@/components/Inputs/LabeledInput'
import { memo } from '@/validationSchemas'
import { useForm } from 'vee-validate'
import { object, date, number } from 'yup'

const props = defineProps({
  modelValue: { type: Object, required: true },
  isThisMonth: { type: Boolean, required: true },
  minimalDate: { type: Date, required: true },
  maxGddLastMonth: { type: Number, required: true },
  maxGddThisMonth: { type: Number, required: true },
})

const emit = defineEmits(['update-contribution', 'set-contribution'])

const { t } = useI18n()
let allFieldsValid = ref(false)

const form = ref({ ...props.modelValue })

const maxHours = computed(() => Number(props.isThisMonth ? props.maxGddThisMonth : props.maxGddLastMonth / 20))

const validationSchema = computed(() => {
  // const maxGDD = Number(props.isThisMonth ? props.maxGddThisMonth : props.maxGddLastMonth)
  // const maxHours = Number(maxGDD / 20)
  console.log('compute validationSchema', { maxHours })
  return object({
    // The date field is required and needs to be a valid date
    // contribution date
    date: date()
      .required('contribution.noDateSelected')
      .min(new Date(new Date().setMonth(new Date().getMonth() - 1, 1)).toISOString().slice(0, 10))  // min date is first day of last month
      .max(new Date().toISOString().slice(0, 10))
      .default(''), // date cannot be in the future
    memo,
    hours: number().required('contribution.noHours')
      .min(0.01, ({min}) => ({ key: 'form.validation.gddCreationTime.min', values: { min } }))
      .max(maxHours.value, ({max}) => ({ key: 'form.validation.gddCreationTime.max', values: { max } }))
      .test(
        'decimal-places',
        'form.validation.gddCreationTime.decimal-places',
        (value) => {
          if (value === undefined || value === null) return true
          return /^\d+(\.\d{0,2})?$/.test(value.toString())
        }
      ),
  })  
})
const {
  values: formValues,
  meta: formMeta,
  resetForm,
  setFieldValue,
} = useForm({
  initialValues: {
    date: props.modelValue.date,
    memo: props.modelValue.memo,
    hours: props.modelValue.hours,
    amount: props.modelValue.amount,
  },
  validationSchema: validationSchema.value,
})

const updateField = (newValue, name) => {
  if (typeof name === 'string' && name.length) {
    setFieldValue(name, newValue)
  }
  if (name === 'hours') {
    setFieldValue('amount', (newValue * 20).toFixed(2).toString())
  }
  /*
  validationSchema.value.validateAt(name, formValues)
  .then(() => {
    allFieldsValid = true
  })
  .catch((e) => {
    allFieldsValid = false
    console.log('validation error')
    console.log(JSON.stringify(e, null, 2))
    //errorMessage = e.message
  })*/
}

const showMessage = computed(() => {
  if (props.maxGddThisMonth <= 0 && props.maxGddLastMonth <= 0) return true
  if (props.modelValue.date)
    return (
      (props.isThisMonth && props.maxGddThisMonth <= 0) ||
      (!props.isThisMonth && props.maxGddLastMonth <= 0)
    )
  return false
})

const disabled = computed(() => {
  return !allFieldsValid 
  /*
  return (
    !formMeta.value.valid ||
    (props.isThisMonth && parseFloat(form.value.amount) > parseFloat(props.maxGddThisMonth)) ||
    (!props.isThisMonth && parseFloat(form.value.amount) > parseFloat(props.maxGddLastMonth))
  )*/
})

const noOpenCreation = computed(() => {
  if (props.maxGddThisMonth <= 0 && props.maxGddLastMonth <= 0) {
    return t('contribution.noOpenCreation.allMonth')
  }
  if (props.isThisMonth && props.maxGddThisMonth <= 0) {
    return t('contribution.noOpenCreation.thisMonth')
  }
  if (!props.isThisMonth && props.maxGddLastMonth <= 0) {
    return t('contribution.noOpenCreation.lastMonth')
  }
  return ''
})

function submit() {
  const dataToSave = { ...formValues }
  let emitOption = 'set-contribution'
  if (props.modelValue.id) {
    dataToSave.id = props.modelValue.id
    emitOption = 'update-contribution'
  }
  emit(emitOption, dataToSave)
  fullFormReset()
}

function fullFormReset() {
  resetForm({
    values: {
      date: '',
      memo: '',
      hours: 0.0,
      amount: '',
    }
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
