// AI-GENERATED — not an architecture reference
/**
 * The fields somebody opens an account with: first name, last name, address, the consent --
 * and, where a member vouches for the account, the two password fields and the sentence that
 * says what follows (E-017, E-020).
 *
 * Moved out of the registration page as they stood, so that the page a thank-you arrives on
 * asks with the same fields, the same checks and the same words (ZE-017 F5). They register
 * with the form of the page around them (`useForm`), which reads `firstname`, `lastname`,
 * `email`, `newPassword` and `agree` from its values.
 */
import {
  BCol,
  BFormCheckbox,
  BFormGroup,
  BFormInput,
  BFormInvalidFeedback,
  BRow,
} from 'bootstrap-vue-next'
import { useField } from 'vee-validate'
import { defineComponent, type PropType } from 'vue'
import { useI18n } from 'vue-i18n'
import { InputEmail } from '@/components/Inputs/InputEmail'
import { InputPasswordConfirmation } from '@/components/Inputs/InputPasswordConfirmation'
import { shownValidState } from '@/validation-rules'
import classes from './AccountFields.module.scss'

export const AccountFields = defineComponent({
  name: 'AccountFields',
  props: {
    // The two password fields and the sentence under them.
    withPassword: { type: Boolean, default: false },
    // Who vouches: named in that sentence. Without a name it speaks of "the member".
    guarantorName: { type: String as PropType<string | null>, default: null },
  },
  setup(props) {
    const { t } = useI18n()

    const {
      value: firstname,
      meta: firstnameMeta,
      errorMessage: firstnameError,
      handleBlur: firstnameBlur,
    } = useField<string>('firstname', {
      required: true,
      min: 3,
    })

    const {
      value: lastname,
      meta: lastnameMeta,
      errorMessage: lastnameError,
      handleBlur: lastnameBlur,
    } = useField<string>('lastname', {
      required: true,
      min: 2,
    })

    const { value: agree, meta: agreeMeta } = useField<boolean>('agree', 'required')

    return () => (
      <>
        <BRow>
          <BCol sm='12' md='6'>
            <BFormGroup class='mb-3' label={t('form.firstname')} labelFor='registerFirstname'>
              <BFormInput
                id='registerFirstname'
                modelValue={firstname.value}
                name='firstname'
                placeholder={t('form.firstname')}
                state={shownValidState(firstnameMeta)}
                aria-describedby='registerFirstnameLiveFeedback'
                onUpdate:modelValue={(entered) => {
                  firstname.value = String(entered ?? '')
                }}
                onBlur={(event) => firstnameBlur(event, true)}
              />

              {firstnameError.value ? (
                <BFormInvalidFeedback id='registerFirstnameLiveFeedback'>
                  {firstnameError.value}
                </BFormInvalidFeedback>
              ) : null}
            </BFormGroup>
          </BCol>
          <BCol sm='12' md='6'>
            <BFormGroup class='mb-3' label={t('form.lastname')} labelFor='registerLastname'>
              <BFormInput
                id='registerLastname'
                modelValue={lastname.value}
                name='lastname'
                placeholder={t('form.lastname')}
                state={shownValidState(lastnameMeta)}
                aria-describedby='registerLastnameLiveFeedback'
                onUpdate:modelValue={(entered) => {
                  lastname.value = String(entered ?? '')
                }}
                onBlur={(event) => lastnameBlur(event, true)}
              />

              {lastnameError.value ? (
                <BFormInvalidFeedback id='registerLastnameLiveFeedback'>
                  {lastnameError.value}
                </BFormInvalidFeedback>
              ) : null}
            </BFormGroup>
          </BCol>
        </BRow>
        <BRow>
          <BCol>
            <InputEmail name='email' />
          </BCol>
        </BRow>
        {/* E-017: where a member vouches for the account, the guest chooses the password right here. */}
        {props.withPassword ? (
          <>
            <InputPasswordConfirmation register />
            <p class='text-muted account-fields-hint' data-test='register-guarantor-hint'>
              {props.guarantorName
                ? t('site.signup.guarantorHint', { name: props.guarantorName })
                : t('site.signup.guarantorHintAnonymous')}
            </p>
          </>
        ) : null}
        <BRow>
          <BCol cols='12' class='my-4'>
            <BFormCheckbox
              id='registerCheckbox'
              name='agree'
              class={classes.agree}
              modelValue={agree.value}
              state={(agreeMeta.valid && agreeMeta.dirty) || undefined}
              onUpdate:modelValue={(checked) => {
                agree.value = Boolean(checked)
              }}
            >
              <span class='text-muted' innerHTML={t('site.signup.agree')} />
            </BFormCheckbox>
          </BCol>
        </BRow>
      </>
    )
  },
})
