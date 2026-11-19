// AI-GENERATED — not an architecture reference
import { BFormInvalidFeedback } from 'bootstrap-vue-next'
import {
  computed,
  defineComponent,
  getCurrentInstance,
  onMounted,
  type PropType,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import type { AnyObject, ObjectSchema, Schema } from 'yup'
import { translateYupErrorString } from '@/validationSchemas'
import { LabeledInput } from './LabeledInput'
import './ValidatedInput.scss'

/** A field of a form's schema, as yup types what a form reads out of `schema.fields`. */
type Rules = ObjectSchema<AnyObject>['fields'][string] | Schema

export const ValidatedInput = defineComponent({
  name: 'ValidatedInput',
  props: {
    label: {
      type: String,
      required: true,
    },
    modelValue: [String, Number, Date] as PropType<string | number | Date>,
    name: {
      type: String,
      required: true,
    },
    rules: {
      type: Object as PropType<Rules>,
      required: true,
    },
    disableSmartValidState: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  setup(props, { attrs, emit }) {
    const { t } = useI18n()
    // `$i18n.locale` of the template, read off the instance as the template read it.
    const instance = getCurrentInstance()

    // yup's type of a schema's field takes in a reference to another field; the rules of a
    // field are a schema.
    const rules = () => props.rules as Schema

    const model = ref(props.modelValue !== 0 ? props.modelValue : '')
    // change to true after user leave the input field the first time
    // prevent showing errors on form init
    const afterFirstInput = ref(false)

    const valid = computed(() => rules().isValidSync(model.value))
    // smartValidState controls the visual validation feedback for the input field.
    // The goal is to avoid showing red (invalid) borders too early, creating a smoother UX:
    //
    // - On initial form open, the field is neutral (no validation state shown).
    // - If the user enters a value that passes validation, we show a green (valid) state immediately.
    // - We only show red (invalid) feedback *after* the user has blurred the field for the first time.
    //
    // Before first blur:
    //   - show green if valid, otherwise neutral (null)
    // After first blur:
    //   - show true or false according to the validation result
    const smartValidState = computed(() => {
      if (afterFirstInput.value || props.disableSmartValidState) {
        return valid.value
      }
      return valid.value ? true : null
    })
    const errorMessage = computed<string | undefined>(() => {
      try {
        rules().validateSync(model.value)
        return undefined
      } catch (e) {
        return translateYupErrorString((e as Error).message, t)
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
    const schemaDescription = computed(() => rules().describe())
    const getTestParameter = (name: string) =>
      schemaDescription.value?.tests?.find((t) => t.name === name)?.params?.[name]
    const minValue = computed(() => getTestParameter('min'))
    const maxValue = computed(() => getTestParameter('max'))
    const resetValue = computed(() => schemaDescription.value.default)
    const isOptional = computed(() => schemaDescription.value.optional)

    // reset on mount
    onMounted(() => {
      afterFirstInput.value = false
    })

    return () => (
      <LabeledInput
        {...attrs}
        // None of these is a prop of LabeledInput: they go on to the field with the attributes,
        // under the names the template gave them.
        {...({
          min: minValue.value,
          max: maxValue.value,
          'reset-value': resetValue.value,
          locale: instance?.proxy?.$i18n.locale,
          required: !isOptional.value,
          state: smartValidState.value,
        } as object)}
        modelValue={model.value}
        label={props.label}
        name={props.name}
        onBlur={() => {
          afterFirstInput.value = true
        }}
        onUpdate:modelValue={updateValue}
      >
        {errorMessage.value ? (
          <BFormInvalidFeedback>{errorMessage.value}</BFormInvalidFeedback>
        ) : null}
      </LabeledInput>
    )
  },
})
