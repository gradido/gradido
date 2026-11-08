// AI-GENERATED — not an architecture reference
import { BButton, BFormGroup, BFormInput, BFormInvalidFeedback } from 'bootstrap-vue-next'
import { useField } from 'vee-validate'
import { computed, defineComponent, type PropType, ref, toRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { shownValidState } from '@/validation-rules'
import IBiEye from '~icons/bi/eye'
import IBiEyeSlash from '~icons/bi/eye-slash'
import classes from './InputPassword.module.scss'

export const InputPassword = defineComponent({
  name: 'InputPassword',
  props: {
    name: { type: String, default: 'password' },
    rules: {
      type: [Object, String] as PropType<string | Record<string, unknown>>,
      default: 'required',
    },
    allowFullValidation: { type: Boolean, default: false },
    label: { type: String, default: null },
    placeholder: { type: String, default: null },
    // What a browser's password store may do here. Left out, the browser decides, as it did.
    autocomplete: { type: String, default: undefined },
  },
  setup(props) {
    const { t } = useI18n()

    const defaultTranslations = computed(() => ({
      label: props.label || t('form.password'),
      placeholder: props.placeholder || t('form.password'),
    }))

    const name = toRef(props, 'name')
    const { value, errorMessage, meta, errors, handleBlur } = useField<string>(name, props.rules, {
      bails: !props.allowFullValidation,
      // The message names the field as the label above it does. The field name alone cannot:
      // `password` is the old password in the settings, `newPassword` reads "Passwort" where
      // an account gets its first one and "Neues Passwort" where it changes it.
      label: () => defaultTranslations.value.label,
    })

    // Nothing red before the field has been left once: a guest who opens the form has done nothing
    // wrong yet. The rules a password still misses appear when it is left unfinished.
    const shownState = computed(() => shownValidState(meta))

    const showPassword = ref(false)

    const toggleShowPassword = () => {
      showPassword.value = !showPassword.value
    }

    const ariaInput = computed(() => ({
      'aria-invalid': shownState.value === false ? 'true' : false,
      'aria-describedby': `${props.name}-feedback`,
    }))

    const ariaMsg = computed(() => ({
      id: `${props.name}-feedback`,
    }))

    const labelFor = computed(() => `${props.name}-input-field`)

    return () => (
      <div class={classes.inputPassword}>
        <BFormGroup label={defaultTranslations.value.label} labelFor={labelFor.value}>
          {/* The eye stands inside the field, as the warning sign does in the e-mail field:
              one field, one rounded frame. As a box of its own beside the input it had no frame
              at all -- its variant, outline-light, is one this template does not build, and all
              it drew was the buttons' dark shadow, which the dark card swallows (Bernd,
              21.09.2026). Inside, the frame's colour, the focus ring and a browser's autofill
              ground are the field's own. The rules are shared with the thank-you card's PIN
              (assets/scss/_reveal-field.scss). */}
          <div class='reveal-field'>
            <BFormInput
              id={labelFor.value}
              modelValue={value.value}
              name={props.name}
              placeholder={defaultTranslations.value.placeholder}
              type={showPassword.value ? 'text' : 'password'}
              state={shownState.value}
              autocomplete={props.autocomplete}
              class={['rounded-input password-input', classes.passwordInput]}
              data-test='password-input-field'
              {...ariaInput.value}
              onUpdate:modelValue={(entered) => {
                value.value = String(entered ?? '')
              }}
              onBlur={(event) => handleBlur(event, true)}
            />
            {/* A control like any other: reachable with the tab key, where a native button turns
                Enter and Space into the click, and named for a screen reader by what it will do. */}
            <BButton
              variant={null}
              class='reveal-eye'
              aria-label={showPassword.value ? t('form.hidePassword') : t('form.showPassword')}
              data-test='password-eye'
              onClick={toggleShowPassword}
            >
              {showPassword.value ? <IBiEye class='eye-icon' /> : <IBiEyeSlash class='eye-icon' />}
            </BButton>
          </div>
          {shownState.value === false && (errorMessage.value || errors.value.length) ? (
            <BFormInvalidFeedback forceShow {...ariaMsg.value}>
              {props.allowFullValidation ? (
                <div>
                  {errors.value.map((error) => (
                    <span key={error}>
                      {error} <br />
                    </span>
                  ))}
                </div>
              ) : (
                errorMessage.value
              )}
            </BFormInvalidFeedback>
          ) : null}
        </BFormGroup>
      </div>
    )
  },
})
