<!--
  A drop-in replacement for BFormSelect that renders a custom (non-native) dropdown.

  Why: a native <select>'s open option list is painted by the browser and, on Chrome/Safari
  (macOS), follows the OS colour scheme instead of the app's — so the light admin showed a
  dark option list. A BDropdown menu is plain HTML/CSS and stays light in every browser (the
  same reason the wallet's "at home" location dropdown already works). Single select only; a
  multi-select <select size=n> is an always-open list, not a popup, and keeps using BFormSelect.

  API mirrors the BFormSelect usages it replaces: v-model (or :model-value + @update:model-value)
  + :options ([{ value, text }] or plain values) + :disabled, and it emits `change`.
-->
<template>
  <BDropdown
    class="themed-select"
    :class="{ 'themed-select-placeholder': selectedOption === undefined }"
    :disabled="disabled"
    :text="toggleText"
    :data-test="dataTest"
    variant="outline-secondary"
    toggle-class="themed-select-toggle"
  >
    <BDropdownItem
      v-for="option in normalisedOptions"
      :key="String(option.value)"
      :active="option.value === modelValue"
      :disabled="option.disabled === true"
      @click="select(option)"
    >
      {{ option.text }}
    </BDropdownItem>
  </BDropdown>
</template>

<script setup>
import { computed } from 'vue'
import { BDropdown, BDropdownItem } from 'bootstrap-vue-next'

const props = defineProps({
  // eslint-disable-next-line vue/require-prop-types
  modelValue: { default: null },
  options: { type: Array, default: () => [] },
  disabled: { type: Boolean, default: false },
  dataTest: { type: String, default: undefined },
  // Shown on the toggle when nothing matches the current value (mirrors an empty select).
  placeholder: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'change'])

// Accept both [{ value, text, disabled? }] and plain values, like BFormSelect.
const normalisedOptions = computed(() =>
  props.options.map((option) =>
    option !== null && typeof option === 'object'
      ? option
      : { value: option, text: String(option) },
  ),
)
const selectedOption = computed(() =>
  normalisedOptions.value.find((option) => option.value === props.modelValue),
)
const toggleText = computed(() => selectedOption.value?.text ?? props.placeholder)

const select = (option) => {
  if (option.disabled === true || option.value === props.modelValue) {
    return
  }
  emit('update:modelValue', option.value)
  emit('change', option.value)
}
</script>

<style lang="scss">
/* Make the toggle read like a form control: full width, label left, caret right. */
.themed-select {
  width: 100%;

  > .btn.themed-select-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    text-align: left;
  }

  &.themed-select-placeholder > .btn.themed-select-toggle {
    color: #6c757d;
  }
}
</style>
