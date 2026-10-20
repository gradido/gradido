// AI-GENERATED — not an architecture reference
import { BFormGroup, BFormInput, BFormTextarea } from 'bootstrap-vue-next'
import { computed, defineComponent, useModel } from 'vue'

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
      type: Boolean,
      required: false,
      default: false,
    },
    // what defineModel() declared
    modelValue: {},
    modelModifiers: {},
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, slots }) {
    const model = useModel(props, 'modelValue')

    const wrapperClassName = computed(() => (props.name ? `input-${props.name}` : 'input'))
    const labelFor = computed(() => `${props.name}-input-field`)

    return () => (
      <div class={wrapperClassName.value}>
        <BFormGroup label={props.label} labelFor={labelFor.value}>
          {props.textarea ? (
            <BFormTextarea
              {...{ ...attrs, id: labelFor.value, name: props.name }}
              v-model={model.value}
              // ⚠️ No prop of BFormTextarea: it lands on the element as the empty attribute it
              // always was. Spread, because the type rightly knows no `trim`.
              {...{ trim: '' }}
              rows={4}
              maxRows={4}
              noResize
            />
          ) : (
            <BFormInput
              {...{ ...attrs, id: labelFor.value, name: props.name }}
              v-model={model.value}
            />
          )}
          {slots.default?.()}
        </BFormGroup>
      </div>
    )
  },
})
