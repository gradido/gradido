<template>
  <LabeledInput 
    v-bind="$attrs"
    :min="minValue"
    :max="maxValue"
    :model-value="model"
    :reset-value="resetValue"
    :locale="$i18n.locale"
    :required="!isOptional"
    :label="label"
    :name="name"
    :state="valid"
    @update:modelValue="updateValue"
    >
    <BFormInvalidFeedback v-if="errorMessage">
        {{ errorMessage }}
    </BFormInvalidFeedback>
  </LabeledInput>
</template>

<script setup>
import { computed, ref, watchEffect, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import LabeledInput from './LabeledInput'
import { translateYupErrorString } from '@/validationSchemas'

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  modelValue: [String, Number, Date],
  name: {
    type: String,
    required: true,
  },
  rules: {
    type: Object,
    required: true,
  },
})
const model = ref(props.modelValue)
let wasUpdated = false

function updateErrorMessage() {
  try {
    props.rules.validateSync(model.value)
    errorMessage.value = undefined
  } catch(e) {
    errorMessage.value = translateYupErrorString(e.message, t)
  }
}

const { t } = useI18n()
const errorMessage = ref()
const valid = computed(() => props.rules.isValidSync(model.value))

const emit = defineEmits(['update:modelValue'])
const updateValue = ((newValue) => {
  wasUpdated = true
  model.value = newValue
  updateErrorMessage()
  emit('update:modelValue', newValue, props.name)  
})

// validate on rule change, but only if updateValue was called at least one
watch(() => props.rules, () => {
  if(wasUpdated) {
    updateErrorMessage()
  }
})
// update model if parent change
watch(() => props.modelValue, () => {
  model.value = props.modelValue
})

// extract additional parameter like min and max from schema
const schemaDescription = computed(() => props.rules.describe())
const getTestParameter = (name) => schemaDescription.value?.tests?.find(t => t.name === name)?.params[name]
const minValue = computed(() => getTestParameter('min'))
const maxValue = computed(() => getTestParameter('max'))
const resetValue = computed(() => schemaDescription.default)
const isOptional = computed(() => schemaDescription.optional)
</script>
