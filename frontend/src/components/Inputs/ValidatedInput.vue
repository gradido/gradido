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
    :state="valid"
    @input="updateValue($event.target.value)">
    <BFormInvalidFeedback v-if="errorMessage">
        {{ $t(translatedErrorString) }}
    </BFormInvalidFeedback>
  </LabeledInput>
</template>

<script setup>
import { computed, ref } from 'vue'
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

let valid = ref(false)
let errorMessage = ref('')
let currentValue = ref(props.modelValue)

const { t } = useI18n()
const translatedErrorString = computed(() => {
  const error = errorMessage.value
  const type = typeof error
  // console.log(error)
  if (type === 'object') {
    return t(error.key, error.values)
  } else if (type === 'string' && error.length > 0 && isLanguageKey(error)) {
    return t(error)
  } else {
    return error
  }
})

const emit = defineEmits(['update:modelValue'])
const updateValue = ((newValue) => {
  // emit('update:modelValue', newValue, props.name)

  const data = new Object()
  data[props.name] = newValue
  
  const result = props.rules.validateSyncAt(props.name, data)
  console.log('result: ', JSON.stringify(result, null, 2))
  /*
  .then(() => {
    valid = true
    console.log("%s is valid, emit event", props.name)
    emit('update:modelValue', newValue, props.name)
  })
  .catch((e) => {
    valid = false
    console.log(t(e.message))
    errorMessage = e.message
    console.log('max value: %o for name: %s, rules: %o', maxValue.value, props.name, props.rules)    
  })
*/  
})

// extract additional parameter like min and max from schema
const getDateOnly = (schemaDescription, name) => schemaDescription.fields[props.name].tests.find((test) => test.name === name)?.params[name]

const schemaDescription = computed(() => props.rules.describe())
console.log(schemaDescription.value)
const minValue = computed(() => getDateOnly(schemaDescription.value, 'min'))
const maxValue = computed(() => getDateOnly(schemaDescription.value, 'max'))
const resetValue = computed(() => schemaDescription.value.fields[props.name].default)
const isOptional = computed(() => schemaDescription.value.fields[props.name].optional)

// const { value: currentValue, errorMessage, meta } = useField(props.name, props.rules)

</script>
