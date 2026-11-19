// AI-GENERATED — not an architecture reference
import { defineComponent, useModel } from 'vue'
import classes from './ChatCheck.module.scss'

/**
 * A box and its word as the compose bar has them (ChatComposeBar, "Also by e-mail"): the
 * browser's own box in the wallet's gold, the word beside it, darker once the box is ticked.
 * For the boxes of the video call's questions, so that every box in the contact window looks
 * alike (Bernd, 26.09.2026: the questions had Bootstrap's box, its edge barely visible on white).
 */
export const ChatCheck = defineComponent({
  name: 'ChatCheck',
  props: {
    modelValue: { type: Boolean, default: false },
    /** The `data-test` of the box itself. */
    boxTest: { type: String, default: null },
  },
  /*
   * ⚠️ `change` carries the box's own state, read off the box. `checked` is still the old value at
   * that moment wherever a parent binds it with v-model: the new one comes back down as a prop only
   * when the parent draws again (measured 26.09.2026 -- the box remembered the opposite of a tick).
   */
  emits: ['update:modelValue', 'change'],
  setup(props, { emit, slots }) {
    const checked = useModel(props, 'modelValue')

    // The box inside its label, as under the compose bar: a long word wraps beside the box.
    return () => (
      <label class={['chat-check', classes['chat-check']]}>
        <input
          v-model={checked.value}
          type='checkbox'
          class='chat-check-box'
          data-test={props.boxTest}
          onChange={(event: Event) => emit('change', (event.target as HTMLInputElement).checked)}
        />
        <span class='chat-check-text'>{slots.default?.()}</span>
      </label>
    )
  },
})
