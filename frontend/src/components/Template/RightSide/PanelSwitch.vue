<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- Two words, one of them in force. A pair of tabs rather than a dropdown or a gear:
       both positions are named and one tap away, which is what makes this not a setting
       (E-020, KF-009). -->
  <div
    class="panel-switch"
    role="group"
    :aria-label="$t('rightSide.aria')"
    data-test="panel-switch"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="panel-switch-segment"
      :class="option.value === modelValue ? 'active' : ''"
      :style="{ flexGrow: option.share ?? 1 }"
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
 * The switch over the right-hand column: the newest bookings or the contacts (KF-009). The
 * two words themselves come from `transaction.lastTransactions` / `rightSide.contacts`.
 *
 * It knows nothing about either panel -- it is handed the positions and says which one was
 * picked. What the positions mean, and which one a route starts on, is the layout's
 * business, and remembering the answer is `useRightSidePref`.
 *
 * ⛔ It also carries the column's heading, and that is the whole point of the shape below.
 * The panels used to print their own `h3` under this control, so the answer was written
 * twice -- once quietly in the active segment, once loudly right beneath it -- and the two
 * together ate the top of a column that is three grid columns wide. The active tab IS the
 * heading now, which is why it is set at heading weight rather than at control size.
 * (Bernd, 03.09.2026: "anstatt der Überschrift eben diese beiden Buttons".)
 */
const props = defineProps({
  /** The position in force. */
  modelValue: { type: String, required: true },
  /**
   * `[{ value, label, share }]` -- the label is the FINISHED word, not a key.
   *
   * `share` is how much of the row that position takes, relative to the others; it
   * defaults to 1. ⛔ It is the CALLER's to set, not this component's to guess by
   * position: which word is long depends on the language, and a rule like "the first
   * one is wider" would be a claim about content this component never sees.
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
/* The pair fills the column, half each, and the line under it is the one the heading used
   to sit above. */
.panel-switch {
  display: flex;
  border-bottom: 1px solid var(--bs-border-color, #dee2e6);
  margin-bottom: 1rem;
}

/* ⛔ `flex-basis: 0` with `min-width: 0`, and the GROWTH comes from the caller (`share`).
   Sized by their content the two tabs would jump about between languages -- German pairs
   "Letzte Transaktionen" with "Kontakte", French "Dernières transactions" with "Contacts",
   22 characters against 8 -- so the row is divided by the track instead.

   ⚠️ Equal halves were the first answer and they were wrong: half of a three-column-wide
   column is not enough for the long word, so it wrapped to two lines and took the short
   one with it, in German as soon as the active tab turned bold. Two thirds to one third
   holds the long word on one line in all ten languages and still leaves the short one more
   room than it needs. (Bernd, 04.09.2026.) */
.panel-switch-segment {
  flex-basis: 0;
  flex-shrink: 1;
  min-width: 0;
  appearance: none;
  background: transparent;
  border: 0;

  /* Sits ON the container's line: 3px of colour over the 1px rule, pulled down by the
     negative margin so the two do not stack into a 4px edge. */
  border-bottom: 3px solid transparent;
  margin-bottom: -1px;
  padding: 0.4rem 0.25rem 0.5rem;
  color: var(--bs-secondary-color, #6c757d);
  font-size: 0.9rem;
  line-height: 1.25;
  text-align: center;
}

/* ⛔ The mark has to carry on its own, without the other tab beside it for comparison --
   a member looking at one column cannot see what the unchosen state would have looked
   like. That is why it is three things at once, not one: the text goes to full body
   colour, the weight goes to 600, and the bar appears. The version this replaces changed
   only a background, from white to #e9ecef on a white card -- six percent, and Bernd could
   not tell which position stood.

   ⚠️ `--success` rather than a literal green: it is the one green defined in BOTH modes
   (#047006 light, #46c04a dark). A literal would be invisible in one of them. */
.panel-switch-segment.active {
  color: var(--bs-body-color);
  font-weight: 600;
  border-bottom-color: var(--success, #047006);
}

/* Without Bootstrap's `.btn` there is no focus ring left, and this is a real control. */
.panel-switch-segment:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: -2px;
  border-radius: 3px;
}
</style>
