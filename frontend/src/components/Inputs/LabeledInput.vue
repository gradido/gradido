<template>
  <div :class="wrapperClassName">
    <BFormGroup :label="label" :label-for="labelFor">
      <BFormTextarea
        v-if="textarea === 'true'"
        v-bind="{ ...$attrs, id: labelFor, name }"
        v-model="model"
        trim
        :rows="4"
        :max-rows="4"
        no-resize
      />
      <BFormInput v-else v-bind="{ ...$attrs, id: labelFor, name }" v-model="model" />
      <slot></slot>
    </BFormGroup>
  </div>
</template>

<script setup>
import { computed, defineOptions, defineModel, watch } from 'vue'
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
  textarea: {
    type: String,
    required: false,
    default: 'false',
  },
})

const model = defineModel()

const wrapperClassName = computed(() => (props.name ? `input-${props.name}` : 'input'))
const labelFor = computed(() => `${props.name}-input-field`)
</script>
