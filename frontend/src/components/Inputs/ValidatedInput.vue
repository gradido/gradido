<template>
  <LabeledInput 
    v-bind="$attrs"
    :min="minValue"
    :max="maxValue"
    :model-value="currentValue"
    :reset-value="resetValue"
    :locale="$i18n.locale"
    :required="!isOptional"
    :label="props.label"
    :name="props.name"
    :state="meta.valid"
    @input="updateValue($event.target.value)">
    <BFormInvalidFeedback v-if="errorMessage">
        {{ $t(translatedErrorString) }}
    </BFormInvalidFeedback>
  </LabeledInput>
</template>

<script setup>
import { computed } from 'vue'
import LabeledInput from './LabeledInput'
import { useI18n } from 'vue-i18n'
import { isLanguageKey } from '@/validationSchemas'
import { useField } from 'vee-validate'

const props = defineProps({
  errorMessage: [String, Object],
  label: {
    type: String,
    required: true,
  },
  modelValue: [String, Number],
  name: {
    type: String,
    required: true,
  },
  rules: {
    type: Object,
    default: () => ({}),
  },
})

const { t } = useI18n()
const translatedErrorString = computed(() => {
  const error = errorMessage.value
  const type = typeof error
  console.log(error)
  if (type === 'object') {
    return t(error.key, error.values)
  } else if (type === 'string' && error.length > 0 && isLanguageKey(error)) {
    return t(error)
  } else {
    return error
  }
})

const emit = defineEmits(['update:modelValue'])
const updateValue = (newValue) => emit('update:modelValue', newValue, props.name)

// extract additional parameter like min and max from schema
const getDateOnly = (schemaDescription, name) => schemaDescription.fields[props.name].tests.find((test) => test.name === name)?.params[name]

const schemaDescription = computed(() => props.rules.describe())
console.log(schemaDescription.value)
const minValue = computed(() => getDateOnly(schemaDescription.value, 'min'))
const maxValue = computed(() => getDateOnly(schemaDescription.value, 'max'))
const resetValue = computed(() => schemaDescription.value.fields[props.name].default)
const isOptional = computed(() => schemaDescription.value.fields[props.name].optional)

const { value: currentValue, errorMessage, meta } = useField(props.name, props.rules)
console.log('max value: ', maxValue)
</script>
