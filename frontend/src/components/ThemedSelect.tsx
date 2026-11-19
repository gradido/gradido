// AI-GENERATED — not an architecture reference
import { BDropdown, BDropdownItem } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType } from 'vue'
import './ThemedSelect.scss'

export interface ThemedSelectOption {
  value: unknown
  text: string
  disabled?: boolean
}

/**
 * A drop-in replacement for BFormSelect that renders a custom (non-native) dropdown.
 *
 * Why it exists: a native <select>'s open option list is painted by the browser, and on
 * Chrome/Safari (macOS) it follows the OS colour scheme, not the app's — so a light app
 * showed a dark option list. A BDropdown menu is plain HTML/CSS and follows the app theme in
 * every browser (the same reason the "at home" location dropdown already works). Single
 * select only; a multi-select <select size=n> is an always-open list, not a popup, and keeps
 * using BFormSelect.
 *
 * API mirrors the BFormSelect usages it replaces: v-model + :options ([{ value, text }] or
 * plain values) + :disabled, and it emits `change` with the new value.
 */
export const ThemedSelect = defineComponent({
  name: 'ThemedSelect',
  props: {
    // Any type, as a select's value is: no runtime check, like the untyped prop it was.
    modelValue: { type: null as unknown as PropType<unknown>, default: null as unknown },
    options: { type: Array as PropType<unknown[]>, default: () => [] },
    disabled: { type: Boolean, default: false },
    dataTest: { type: String, default: undefined },
    // Shown on the toggle when nothing matches the current value (mirrors an empty select).
    placeholder: { type: String, default: '' },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    // Accept both [{ value, text, disabled? }] and plain values, like BFormSelect.
    const normalisedOptions = computed<ThemedSelectOption[]>(() =>
      props.options.map((option) =>
        option !== null && typeof option === 'object'
          ? (option as ThemedSelectOption)
          : { value: option, text: String(option) },
      ),
    )
    const selectedOption = computed(() =>
      normalisedOptions.value.find((option) => option.value === props.modelValue),
    )
    const toggleText = computed(() => selectedOption.value?.text ?? props.placeholder)

    const select = (option: ThemedSelectOption) => {
      if (option.disabled === true || option.value === props.modelValue) {
        return
      }
      emit('update:modelValue', option.value)
      emit('change', option.value)
    }

    return () => (
      <BDropdown
        class={[
          'themed-select',
          { 'themed-select-placeholder': selectedOption.value === undefined },
        ]}
        disabled={props.disabled}
        text={toggleText.value}
        data-test={props.dataTest}
        variant='outline-secondary'
        menuClass='themed-select-menu'
        toggleClass='themed-select-toggle'
      >
        {normalisedOptions.value.map((option) => (
          <BDropdownItem
            key={String(option.value)}
            active={option.value === props.modelValue}
            disabled={option.disabled === true}
            onClick={() => select(option)}
          >
            {option.text}
          </BDropdownItem>
        ))}
      </BDropdown>
    )
  },
})
