// AI-GENERATED — not an architecture reference
import { BFormGroup, BFormInput, BFormInvalidFeedback } from 'bootstrap-vue-next'
import { useField } from 'vee-validate'
import { computed, defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { shownValidState } from '@/validation-rules'

export const InputEmail = defineComponent({
  name: 'InputEmail',
  props: {
    name: { type: String, default: 'email' },
    disabled: { type: Boolean, default: false },
  },
  emits: ['onValidation'],
  setup(props, { expose }) {
    const route = useRoute()

    const { value, errorMessage, validate, meta, handleBlur } = useField<string>(
      () => props.name,
      'required|email',
    )

    // Nothing red before the field has been left once (see shownValidState).
    const shownState = computed(() => shownValidState(meta))

    const { t } = useI18n()

    const defaultTranslations = computed(() => ({
      label: t('form.email'),
      placeholder: t('form.email'),
    }))

    const normalizeEmail = (emailAddress: string) => {
      value.value = emailAddress.trim()
      validate()
    }

    const ariaInput = computed(() => ({
      'aria-invalid': shownState.value === false ? 'true' : false,
      'aria-describedby': `${props.name}-feedback`,
    }))

    const ariaMsg = computed(() => ({
      id: `${props.name}-feedback`,
    }))

    const labelFor = computed(() => `${props.name}-input-field`)

    // What the specs read of the field.
    expose({ value })

    return () => (
      <div>
        <BFormGroup
          label={defaultTranslations.value.label}
          labelFor={labelFor.value}
          data-test='input-email'
        >
          <BFormInput
            {...ariaInput.value}
            id={labelFor.value}
            modelValue={value.value}
            state={shownState.value}
            data-test='input-email'
            name={props.name}
            placeholder={defaultTranslations.value.placeholder}
            type='email'
            // no prop of BFormInput (that is the `.trim` modifier of v-model): it lands on the
            // element as the empty attribute the template left there
            {...({ trim: '' } as object)}
            class={['rounded-input', route.path === '/send' ? 'bg-248' : '']}
            disabled={props.disabled}
            autocomplete='off'
            onUpdate:modelValue={(entered) => normalizeEmail(String(entered ?? ''))}
            onBlur={(event) => handleBlur(event, true)}
          />
          <BFormInvalidFeedback {...ariaMsg.value}>{errorMessage.value}</BFormInvalidFeedback>
        </BFormGroup>
      </div>
    )
  },
})
