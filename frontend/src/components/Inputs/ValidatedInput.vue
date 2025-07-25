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
    :state="smartValidState"
    @blur="afterFirstInput = true"
    @update:modelValue="updateValue"
  >
    <BFormInvalidFeedback v-if="errorMessage">
      {{ errorMessage }}
    </BFormInvalidFeedback>
  </LabeledInput>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
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
  disableSmartValidState: {
    type: Boolean,
    default: false,
  },
})

const { t } = useI18n()

const model = ref(props.modelValue !== 0 ? props.modelValue : '')
// change to true after user leave the input field the first time
// prevent showing errors on form init
const afterFirstInput = ref(false)

const valid = computed(() => props.rules.isValidSync(model.value))
// smartValidState controls the visual validation feedback for the input field.
// The goal is to avoid showing red (invalid) borders too early, creating a smoother UX:
//
// - On initial form open, the field is neutral (no validation state shown).
// - If the user enters a value that passes validation, we show a green (valid) state immediately.
// - We only show red (invalid) feedback *after* the user has blurred the field for the first time.
//
// Before first blur:
//   - show green if valid, otherwise neutral (null)
// After first blur:
//   - show true or false according to the validation result
const smartValidState = computed(() => {
  if (afterFirstInput.value || props.disableSmartValidState) {
    return valid.value
  }
  return valid.value ? true : null
})
const errorMessage = computed(() => {
  try {
    props.rules.validateSync(model.value)
    return undefined
  } catch (e) {
    return translateYupErrorString(e.message, t)
  }
})

const emit = defineEmits(['update:modelValue'])
const updateValue = (newValue) => {
  emit('update:modelValue', newValue, props.name, valid.value)
}

// update model and if value changed and model isn't null, check validation,
// for loading Input with existing value and show correct validation state
watch(
  () => props.modelValue,
  () => {
    model.value = props.modelValue
  },
)

// extract additional parameter like min and max from schema
const schemaDescription = computed(() => props.rules.describe())
const getTestParameter = (name) =>
  schemaDescription.value?.tests?.find((t) => t.name === name)?.params[name]
const minValue = computed(() => getTestParameter('min'))
const maxValue = computed(() => getTestParameter('max'))
const resetValue = computed(() => schemaDescription.value.default)
const isOptional = computed(() => schemaDescription.value.optional)

// reset on mount
onMounted(() => {
  afterFirstInput.value = false
})
</script>
<!-- disable animation on invalid input -->
<style>
.form-control {
  transition: none !important;
  transform: none !important;
  animation: none !important;
}
</style>
