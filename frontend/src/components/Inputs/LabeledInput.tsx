// AI-GENERATED — not an architecture reference
import { BFormGroup, BFormInput, BFormTextarea } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, useModel } from 'vue'

export const LabeledInput = defineComponent({
  name: 'LabeledInput',
  inheritAttrs: false,
  props: {
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
    // The two props and the event of `defineModel()`, as the .vue file had them.
    modelValue: { type: null as unknown as PropType<string | number | Date | null> },
    modelModifiers: { type: null as unknown as PropType<Record<string, boolean>> },
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, slots }) {
    const model = useModel(props, 'modelValue')

    const wrapperClassName = computed(() => (props.name ? `input-${props.name}` : 'input'))
    const labelFor = computed(() => `${props.name}-input-field`)

    // The fields are typed without a date; a date field's value passes through as it is.
    const shown = () => model.value as string | number | null | undefined
    const take = (value: string | number | null | undefined) => {
      model.value = value
    }

    return () => (
      <div class={wrapperClassName.value}>
        <BFormGroup label={props.label} labelFor={labelFor.value}>
          {props.textarea === 'true' ? (
            <BFormTextarea
              {...attrs}
              id={labelFor.value}
              name={props.name}
              modelValue={shown()}
              onUpdate:modelValue={take}
              // no prop of BFormTextarea: it lands on the element as the empty attribute the
              // template left there
              {...({ trim: '' } as object)}
              rows={props.rows}
              maxRows={props.maxRows}
              noResize
            />
          ) : (
            <BFormInput
              {...attrs}
              id={labelFor.value}
              name={props.name}
              modelValue={shown()}
              onUpdate:modelValue={take}
            />
          )}
          {slots.default?.()}
        </BFormGroup>
      </div>
    )
  },
})
