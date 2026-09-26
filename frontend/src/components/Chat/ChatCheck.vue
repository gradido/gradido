<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The box inside its label, as under the compose bar: a long word wraps beside the box. -->
  <label class="chat-check">
    <input
      v-model="checked"
      type="checkbox"
      class="chat-check-box"
      :data-test="boxTest"
      @change="emit('change', $event.target.checked)"
    />
    <span class="chat-check-text"><slot /></span>
  </label>
</template>

<script setup>
import { defineModel } from 'vue'

/**
 * A box and its word as the compose bar has them (ChatComposeBar, "Also by e-mail"): the
 * browser's own box in the wallet's gold, the word beside it, darker once the box is ticked.
 * For the boxes of the video call's questions, so that every box in the contact window looks
 * alike (Bernd, 26.09.2026: the questions had Bootstrap's box, its edge barely visible on white).
 */
const checked = defineModel({ type: Boolean, default: false })
/*
 * ⚠️ `change` carries the box's own state, read off the box. `checked` is still the old value at
 * that moment wherever a parent binds it with v-model: the new one comes back down as a prop only
 * when the parent draws again (measured 26.09.2026 -- the box remembered the opposite of a tick).
 */
defineProps({
  /** The `data-test` of the box itself. */
  boxTest: { type: String, default: null },
})
const emit = defineEmits(['change'])
</script>

<style scoped>
.chat-check {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  min-width: 0;
  margin: 0;
  color: var(--bs-secondary-color, #6c757d);
  cursor: pointer;
}

/* The compose bar's box. Its top edge centred on the word's first line at any font size: the line
   is 1.5em high, the box 1.1rem -- under the compose bar (0.8rem) that is the bar's 0.05rem. */
.chat-check-box {
  flex: 0 0 auto;
  width: 1.1rem;
  height: 1.1rem;
  margin: calc(0.75em - 0.55rem) 0 0;
  accent-color: var(--gold, #c58d38);
}

.chat-check-box:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: 2px;
}

.chat-check-box:checked + .chat-check-text {
  color: var(--bs-body-color);
}
</style>
