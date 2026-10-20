// AI-GENERATED — not an architecture reference
/*
  A drop-in replacement for BFormSelect that renders a custom (non-native) dropdown.

  Why: a native <select>'s open option list is painted by the browser and, on Chrome/Safari
  (macOS), follows the OS colour scheme instead of the app's — so the light admin showed a
  dark option list. A BDropdown menu is plain HTML/CSS and stays light in every browser (the
  same reason the wallet's "at home" location dropdown already works). Single select only; a
  multi-select <select size=n> is an always-open list, not a popup, and keeps using BFormSelect.

  API mirrors the BFormSelect usages it replaces: v-model (or :model-value + @update:model-value)
  + :options ([{ value, text }] or plain values) + :disabled, and it emits `change`.
*/
import { BDropdown, BDropdownItem } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType } from 'vue'
// Not a module: OpenCreationsTable styles the toggle by these class names too.
import './ThemedSelect.scss'

type ThemedSelectOption = { value: unknown; text: string; disabled?: boolean }

export const ThemedSelect = defineComponent({
  name: 'ThemedSelect',
  props: {
    modelValue: {
      type: null as unknown as PropType<string | number | boolean | object | null>,
      default: null,
    },
    options: { type: Array as PropType<unknown[]>, default: () => [] },
    disabled: { type: Boolean, default: false },
    dataTest: { type: String, default: undefined },
    // Shown on the toggle when nothing matches the current value (mirrors an empty select).
    placeholder: { type: String, default: '' },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    // Accept both [{ value, text, disabled? }] and plain values, like BFormSelect.
    const normalisedOptions = computed(() =>
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
        toggleClass='themed-select-toggle'
      >
        {normalisedOptions.value.map((option) => (
          <BDropdownItem
            key={String(option.value)}
            active={option.value === props.modelValue}
            disabled={(option as ThemedSelectOption).disabled === true}
            onClick={() => select(option)}
          >
            {option.text}
          </BDropdownItem>
        ))}
      </BDropdown>
    )
  },
})
