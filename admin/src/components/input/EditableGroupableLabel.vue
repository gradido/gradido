<template>
  <BFormGroup :label="label" :label-for="idName">
    <BFormInput :id="idName" :model-value="modelValue" @update:model-value="inputValue = $event" />
  </BFormGroup>
</template>

<script setup>
import { inject, ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: false,
    default: null,
  },
  label: {
    type: String,
    required: true,
  },
  idName: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:model-value'])

// Provided by the EditableGroup this label sits in; without one there is nobody to tell.
const editableGroup = inject('editableGroup', null)

const inputValue = ref(props.modelValue)
const originalValue = inputValue.value

watch(inputValue, () => {
  if (inputValue.value !== originalValue) {
    editableGroup?.valueChanged()
  } else {
    editableGroup?.invalidValues()
  }
  emit('update:model-value', inputValue.value)
})
</script>
