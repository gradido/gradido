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
    @update:model-value="updateValue"
  >
    <BFormInvalidFeedback v-if="errorMessage">
      {{ errorMessage }}
    </BFormInvalidFeedback>
  </LabeledInput>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
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

const { t } = useI18n()

const model = ref(props.modelValue)

const valid = computed(() => {
  if (
    (props.modelValue === undefined || props.modelValue === '' || props.modelValue === null) &&
    isOptional.value
  ) {
    return null
  }
  return props.rules.isValidSync(props.modelValue)
})
const errorMessage = computed(() => {
  if (props.modelValue === undefined || props.modelValue === '' || props.modelValue === null) {
    return undefined
  }
  try {
    props.rules.validateSync(props.modelValue)
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
</script>
