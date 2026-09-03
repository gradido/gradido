<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- Two words, one of them in force. A segmented control rather than a dropdown or a
       gear: both positions are named and one tap away, which is what makes this not a
       setting (E-020, KF-009). -->
  <div
    class="panel-switch btn-group btn-group-sm"
    role="group"
    :aria-label="$t('rightSide.aria')"
    data-test="panel-switch"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="btn panel-switch-segment"
      :class="option.value === modelValue ? 'active' : ''"
      :aria-pressed="option.value === modelValue ? 'true' : 'false'"
      :data-test="`panel-switch-${option.value}`"
      @click="pick(option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup>
/**
 * The switch over the right-hand column: bookings or contacts (KF-009). The two words
 * themselves come from `rightSide.bookings` / `rightSide.contacts`.
 *
 * It knows nothing about either panel -- it is handed the positions and says which one was
 * picked. What the positions mean, and which one a route starts on, is the layout's
 * business, and remembering the answer is `useRightSidePref`.
 */
const props = defineProps({
  /** The position in force. */
  modelValue: { type: String, required: true },
  /**
   * `[{ value, label }]` -- the label is the FINISHED word, not a key.
   *
   * ⛔ Not a key. `$t(option.label)` would read the key out of a variable, and the i18n lint
   * only counts literal ones -- every position's word would be reported as unused and the
   * next tidy-up would delete it from ten files. The caller translates; this shows.
   */
  options: { type: Array, required: true },
})

const emit = defineEmits(['update:modelValue'])

// A tap on the position that already stands is not a change. Without this it would write
// the same answer to the device again on every tap, and emit an update the layout would
// have to recognise as a no-op.
const pick = (value) => {
  if (value !== props.modelValue) {
    emit('update:modelValue', value)
  }
}
</script>

<style lang="scss" scoped>
/* Small and quiet: this stands over the column, not in it. The active segment is filled
   so the answer is readable at a glance without reading both words. */
.panel-switch-segment {
  border: 1px solid var(--bs-border-color, #dee2e6);
  color: var(--bs-secondary-color, #6c757d);
  background-color: transparent;
  font-size: 0.78rem;
  padding: 0.15rem 0.6rem;
}

.panel-switch-segment.active {
  background-color: var(--bs-secondary-bg, #e9ecef);
  color: var(--bs-body-color);
  font-weight: 600;
}
</style>
