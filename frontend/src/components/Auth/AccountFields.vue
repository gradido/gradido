<!-- AI-GENERATED — not an architecture reference -->
<template>
  <BRow>
    <BCol sm="12" md="6">
      <BFormGroup class="mb-3" :label="$t('form.firstname')" label-for="registerFirstname">
        <BFormInput
          id="registerFirstname"
          :model-value="firstname"
          name="firstname"
          :placeholder="$t('form.firstname')"
          :state="shownValidState(firstnameMeta)"
          aria-describedby="registerFirstnameLiveFeedback"
          @update:model-value="firstname = $event"
          @blur="firstnameBlur($event, true)"
        />

        <BFormInvalidFeedback v-if="firstnameError" id="registerFirstnameLiveFeedback">
          {{ firstnameError }}
        </BFormInvalidFeedback>
      </BFormGroup>
    </BCol>
    <BCol sm="12" md="6">
      <BFormGroup class="mb-3" :label="$t('form.lastname')" label-for="registerLastname">
        <BFormInput
          id="registerLastname"
          :model-value="lastname"
          name="lastname"
          :placeholder="$t('form.lastname')"
          :state="shownValidState(lastnameMeta)"
          aria-describedby="registerLastnameLiveFeedback"
          @update:model-value="lastname = $event"
          @blur="lastnameBlur($event, true)"
        />

        <BFormInvalidFeedback v-if="lastnameError" id="registerLastnameLiveFeedback">
          {{ lastnameError }}
        </BFormInvalidFeedback>
      </BFormGroup>
    </BCol>
  </BRow>
  <BRow>
    <BCol>
      <input-email name="email" :label="$t('form.email')" :placeholder="$t('form.email')" />
    </BCol>
  </BRow>
  <!-- E-017: where a member vouches for the account, the guest chooses the password right here. -->
  <template v-if="withPassword">
    <input-password-confirmation register />
    <p class="text-muted account-fields-hint" data-test="register-guarantor-hint">
      {{
        guarantorName
          ? $t('site.signup.guarantorHint', { name: guarantorName })
          : $t('site.signup.guarantorHintAnonymous')
      }}
    </p>
  </template>
  <BRow>
    <BCol cols="12" class="my-4">
      <BFormCheckbox
        id="registerCheckbox"
        name="agree"
        :model-value="agree"
        :state="(agreeMeta.valid && agreeMeta.dirty) || undefined"
        @update:model-value="agree = $event"
      >
        <!-- eslint-disable-next-line @intlify/vue-i18n/no-v-html -->
        <span class="text-muted" v-html="$t('site.signup.agree')"></span>
      </BFormCheckbox>
    </BCol>
  </BRow>
</template>

<script setup>
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
import { useField } from 'vee-validate'
import {
  BCol,
  BFormCheckbox,
  BFormGroup,
  BFormInput,
  BFormInvalidFeedback,
  BRow,
} from 'bootstrap-vue-next'
import InputEmail from '@/components/Inputs/InputEmail'
import InputPasswordConfirmation from '@/components/Inputs/InputPasswordConfirmation'
import { shownValidState } from '@/validation-rules'

defineProps({
  // The two password fields and the sentence under them.
  withPassword: { type: Boolean, default: false },
  // Who vouches: named in that sentence. Without a name it speaks of "the member".
  guarantorName: { type: String, default: null },
})

const {
  value: firstname,
  meta: firstnameMeta,
  errorMessage: firstnameError,
  handleBlur: firstnameBlur,
} = useField('firstname', {
  required: true,
  min: 3,
})

const {
  value: lastname,
  meta: lastnameMeta,
  errorMessage: lastnameError,
  handleBlur: lastnameBlur,
} = useField('lastname', {
  required: true,
  min: 2,
})

const { value: agree, meta: agreeMeta } = useField('agree', 'required')
</script>

<style scoped>
/* Lines of about the same length: in Open Sans "Ich stimme der Datenschutzerklärung zu." breaks
   after "Datenschutzerklärung" on the usual iPhones, and "zu." stands alone. A browser that
   does not know the value wraps as before. */
:deep(label[for='registerCheckbox']) {
  text-wrap: balance;
}
</style>
