// AI-GENERATED — not an architecture reference
import { BCol, BRow } from 'bootstrap-vue-next'
import { defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { InputPassword } from './InputPassword'

export const InputPasswordConfirmation = defineComponent({
  name: 'InputPasswordConfirmation',
  props: {
    // Never read here — the two fields register themselves with vee-validate. Optional
    // so callers without a binding stay warning-free; existing callers keep passing it.
    modelValue: {
      type: Object as PropType<Record<string, unknown> | null>,
      required: false,
      default: null,
    },
    register: {
      type: Boolean,
      required: false,
    },
  },
  setup(props) {
    const { t } = useI18n()

    return () => (
      <div>
        {/* Both fields ask for a password that does not exist yet (`new-password`): a browser
            does not put a saved one in, as it would on a sign-in form -- on the page a thank-you
            arrives on, the saved one belongs to whoever owns the computer. */}
        <BRow class='mb-2'>
          <BCol>
            <InputPassword
              id='new-password-input-field'
              rules={{
                required: true,
                containsLowercaseCharacter: true,
                containsUppercaseCharacter: true,
                containsNumericCharacter: true,
                atLeastEightCharacters: true,
                atLeastOneSpecialCharacter: true,
                noWhitespaceCharacters: true,
              }}
              label={props.register ? t('form.password') : t('form.password_new')}
              name='newPassword'
              placeholder={props.register ? t('form.password') : t('form.password_new')}
              autocomplete='new-password'
              allowFullValidation
            />
          </BCol>
        </BRow>
        <BRow class='mb-2'>
          <BCol>
            <InputPassword
              id='repeat-new-password-input-field'
              rules={{
                required: true,
                samePassword: 'newPassword',
              }}
              label={props.register ? t('form.passwordRepeat') : t('form.password_new_repeat')}
              name='newPasswordRepeat'
              placeholder={
                props.register ? t('form.passwordRepeat') : t('form.password_new_repeat')
              }
              autocomplete='new-password'
            />
          </BCol>
        </BRow>
      </div>
    )
  },
})
