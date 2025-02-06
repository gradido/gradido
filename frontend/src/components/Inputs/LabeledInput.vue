<template>
  <div :class="wrapperClassName">
    <BFormGroup :label="label" :label-for="labelFor">
      <BFormInput
        v-bind="$attrs"
      />
      <slot></slot>
    </BFormGroup>
  </div>
</template>

<script setup>
import { computed, defineOptions } from 'vue'

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
})

const wrapperClassName = computed(() => `input-${props.name}`)
const labelFor = computed(() => `${props.name}-input-field`)
</script>
