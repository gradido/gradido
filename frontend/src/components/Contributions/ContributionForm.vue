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
        :state="dataFieldMeta.valid"
        :label="$t('contribution.selectDate')"
        :no-flip="true"
        class="mb-4 bg-248"
        type="date"
        :schema-description="schemaDescription.fields.date"
        @update:model-value="updateField"
      />
      <div v-if="showMessage" class="p-3" data-test="contribtion-message">
        {{ noOpenCreation }}
      </div>
      <div v-else>
        <input-textarea
          id="contribution-memo"
          name="memo"
          :label="$t('contribution.activity')"
          :placeholder="$t('contribution.yourActivity')"
          :rules="{ required: true, min: 5, max: 255 }"
        />
        <input-hour
          name="hours"
          :label="$t('form.hours')"
          placeholder="0.01"
          :rules="{
            required: true,
            // decimal: 2,
            min: 0.01,
            max: validMaxTime,
          }"
          :valid-max-time="validMaxTime"
        />
        <input-amount
          id="contribution-amount"
          class="mt-3"
          name="amount"
          :label="$t('form.amount')"
          placeholder="20"
          :rules="{ required: true, gddSendAmount: { min: 20, max: validMaxGDD } }"
          typ="ContributionForm"
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
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import InputHour from '@/components/Inputs/InputHour'
import InputAmount from '@/components/Inputs/InputAmount'
import InputTextarea from '@/components/Inputs/InputTextarea'
import ValidatedInput from '@/components/Inputs/ValidatedInput.vue'
import { createContributionFormValidation } from '@/validationSchemas'
import { useForm, useField } from 'vee-validate'

const props = defineProps({
  modelValue: { type: Object, required: true },
  isThisMonth: { type: Boolean, required: true },
  minimalDate: { type: Date, required: true },
  maxGddLastMonth: { type: Number, required: true },
  maxGddThisMonth: { type: Number, required: true },
})

const emit = defineEmits(['update-contribution', 'set-contribution'])

const { t } = useI18n()

const form = ref({ ...props.modelValue })

const validationSchema = createContributionFormValidation(t)
const schemaDescription = validationSchema.describe()
// console.log(schemaDescription)

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
  validationSchema
})

const { meta: dataFieldMeta } = useField('date')

const updateField = (newValue, name) => {
  if(typeof name === 'string' && name.length) {
    setFieldValue(name, newValue)
  }
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
  return (
    !formMeta.value.valid ||
    (props.isThisMonth && parseFloat(form.value.amount) > parseFloat(props.maxGddThisMonth)) ||
    (!props.isThisMonth && parseFloat(form.value.amount) > parseFloat(props.maxGddLastMonth))
  )
})

const validMaxGDD = computed(() => {
  return Number(props.isThisMonth ? props.maxGddThisMonth : props.maxGddLastMonth)
})

const validMaxTime = computed(() => {
  return Number(validMaxGDD.value / 20)
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

watch(
  () => formValues.hours,
  () => {
    updateAmount(formValues.hours)
  }
)

function updateAmount(hours) {
  setFieldValue('amount', (hours * 20).toFixed(2).toString())
}

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
      id: null,
      date: '',
      memo: '',
      hours: 0,
      amount: '',
    },
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
