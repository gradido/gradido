<template>
  <BFormGroup :label="label" :label-for="labelFor" data-test="input-identifier">
    <BFormInput
      :id="labelFor"
      :model-value="value"
      :name="name"
      :placeholder="placeholder"
      type="text"
      :state="meta.valid"
      trim
      class="bg-248"
      :disabled="disabled"
      autocomplete="off"
      @update:model-value="value = $event"
    />
    <BFormInvalidFeedback v-if="errorMessage">
      {{ errorMessage }}
    </BFormInvalidFeedback>
  </BFormGroup>
</template>
<script setup>
import { computed, watch } from 'vue'
import { useField } from 'vee-validate'

const props = defineProps({
  rules: {
    type: Object,
    default: () => ({
      required: true,
      validIdentifier: true,
    }),
  },
  name: { type: String, required: true },
  label: { type: String, required: true },
  placeholder: { type: String, required: true },
  modelValue: { type: String },
  disabled: { type: Boolean, required: false, default: false },
})

const emit = defineEmits(['update:modelValue', 'onValidation'])

const { value, meta, errorMessage } = useField(props.name, props.rules, {
  initialValue: props.modelValue,
})

const labelFor = computed(() => props.name + '-input-field')

watch(value, (newValue) => {
  emit('update:modelValue', newValue)
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== value.value) {
      value.value = newValue
      emit('onValidation')
    }
  },
)
</script>
