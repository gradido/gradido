<template>
  <div :class="wrapperClassName">
    <BFormGroup :label="label" :label-for="labelFor">
      <BFormTextarea v-if="textarea" 
        v-bind="{ ...$attrs, id: labelFor, name }"
        v-model="model"
        trim
        :rows="4"
        :max-rows="4"
        no-resize
        />
      <BFormInput v-else 
        v-bind="{ ...$attrs, id: labelFor, name }"
        v-model="model"
      />      
      <slot></slot>
    </BFormGroup>
  </div>
</template>

<script setup>
import { computed, defineOptions, watchEffect, ref, defineModel } from 'vue'
defineOptions({
  inheritAttrs: false,
})

const props = defineProps({
  label: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  // modelValue: [String, Number, Date],
  textarea: {
    type: Boolean,
    required: false,
    default: false,
  }
})

const model = defineModel()
// const model = ref(props.modelValue)
/*const model = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})*/
const wrapperClassName = computed(() => props.name ? `input-${props.name}` : 'input')
const labelFor = computed(() => `${props.name}-input-field`)

// const emit = defineEmits(['update:modelValue'])

watchEffect(() => {
  console.log(`${props.name}: ${props.modelValue}`)
  // model.value = props.modelValue
})
</script>
