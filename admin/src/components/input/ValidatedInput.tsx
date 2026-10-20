// AI-GENERATED — not an architecture reference
import { BFormInvalidFeedback } from 'bootstrap-vue-next'
import { computed, defineComponent, type PropType, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { AnySchema } from 'yup'
import { LabeledInput } from './LabeledInput'

export const ValidatedInput = defineComponent({
  name: 'ValidatedInput',
  props: {
    label: {
      type: String,
      required: true,
    },
    modelValue: [String, Number, Date],
    name: {
      type: String,
      required: true,
    },
    rules: {
      type: Object as PropType<AnySchema>,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    const { locale } = useI18n()

    const model = ref(props.modelValue)

    const valid = computed(() => {
      if (
        (props.modelValue === undefined || props.modelValue === '' || props.modelValue === null) &&
        isOptional.value
      ) {
        return null
      }
      return props.rules.isValidSync(props.modelValue)
    })
    const errorMessage = computed(() => {
      if (props.modelValue === undefined || props.modelValue === '' || props.modelValue === null) {
        return undefined
      }
      try {
        props.rules.validateSync(props.modelValue)
        return undefined
      } catch (e) {
        return (e as Error).message
      }
    })

    const updateValue = (newValue: unknown) => {
      emit('update:modelValue', newValue, props.name, valid.value)
    }

    // update model and if value changed and model isn't null, check validation,
    // for loading Input with existing value and show correct validation state
    watch(
      () => props.modelValue,
      () => {
        model.value = props.modelValue
      },
    )

    // extract additional parameter like min and max from schema
    const schemaDescription = computed(() => props.rules.describe())
    const getTestParameter = (name: string) =>
      schemaDescription.value?.tests?.find((t) => t.name === name)?.params?.[name]
    const minValue = computed(() => getTestParameter('min'))
    const maxValue = computed(() => getTestParameter('max'))
    const resetValue = computed(() => (schemaDescription.value as { default?: unknown }).default)
    const isOptional = computed(() => schemaDescription.value.optional)

    // ⚠️ The attributes twice, as before: spread here and handed on by Vue as well, since
    // LabeledInput is the root. Most of what follows is no prop of LabeledInput but attributes
    // it hands on to the field, hence the spread; the kebab-case names are what reaches it.
    return () => (
      <LabeledInput
        {...attrs}
        {...{
          min: minValue.value,
          max: maxValue.value,
          'model-value': model.value,
          'reset-value': resetValue.value,
          locale: locale.value,
          required: !isOptional.value,
        }}
        label={props.label}
        name={props.name}
        {...{ state: valid.value }}
        onUpdate:modelValue={updateValue}
      >
        {errorMessage.value ? (
          <BFormInvalidFeedback>{errorMessage.value}</BFormInvalidFeedback>
        ) : null}
      </LabeledInput>
    )
  },
})
