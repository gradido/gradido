<template>
  <div :class="wrapperClassName">
    <BFormGroup :label="label" :label-for="labelFor">
      <BFormTextarea
        v-if="textarea === 'true'"
        v-bind="{ ...$attrs, id: labelFor, name }"
        v-model="model"
        trim
        :rows="rows"
        :max-rows="maxRows"
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
  // Height of the textarea. When maxRows is larger than rows, the field grows with
  // the text up to maxRows. Both default to the previous fixed height, so callers
  // that do not ask for more keep the layout they had.
  rows: {
    type: [Number, String],
    required: false,
    default: 4,
  },
  maxRows: {
    type: [Number, String],
    required: false,
    default: 4,
  },
})

const model = defineModel()

const wrapperClassName = computed(() => (props.name ? `input-${props.name}` : 'input'))
const labelFor = computed(() => `${props.name}-input-field`)
</script>
