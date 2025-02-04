<template>
  <div :class="wrapperClassName">
    <BFormGroup :label="label" :label-for="labelFor">
      <BFormInput
        v-bind="$attrs"
        :min="minValue"
        :max="maxValue"
        :model-value="modelValue"
        :reset-value="props.schemaDescription.default"
        :locale="$i18n.locale"
        :required="!props.schemaDescription.optional"
        @input="updateValue($event.target.value)"
      />
      <BFormInvalidFeedback v-if="errorMessage">
        {{ props.errorMessage }}
      </BFormInvalidFeedback>
    </BFormGroup>
  </div>
</template>

<script setup>
import { computed, defineOptions } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  errorMessage: {
    type: String,
    required: false,
  },
  label: {
    type: String,
    required: true,
  },
  modelValue: {
    type: String,
    required: true,
  },
  name: [String, Number],
  schemaDescription: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits('update:modelValue')
const updateValue = (newValue) => emit('update:modelValue', newValue, props.name)

// extract additional parameter like min and max from schema
const getDateOnly = (rules, name) => rules.find((test) => test.name === name)?.params[name]

const minValue = computed(() => getDateOnly(props.schemaDescription.tests, 'min'))
const maxValue = computed(() => getDateOnly(props.schemaDescription.tests, 'max'))
const wrapperClassName = computed(() => `input-${props.name}`)
const labelFor = computed(() => `${props.name}-input-field`)
</script>
