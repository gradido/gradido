<template>
  <div>
    <!-- Both fields ask for a password that does not exist yet (`new-password`): a browser
         does not put a saved one in, as it would on a sign-in form -- on the page a thank-you
         arrives on, the saved one belongs to whoever owns the computer. -->
    <BRow class="mb-2">
      <BCol>
        <input-password
          id="new-password-input-field"
          :rules="{
            required: true,
            containsLowercaseCharacter: true,
            containsUppercaseCharacter: true,
            containsNumericCharacter: true,
            atLeastEightCharacters: true,
            atLeastOneSpecialCharacter: true,
            noWhitespaceCharacters: true,
          }"
          :label="register ? $t('form.password') : $t('form.password_new')"
          name="newPassword"
          :placeholder="register ? $t('form.password') : $t('form.password_new')"
          autocomplete="new-password"
          allow-full-validation
        />
      </BCol>
    </BRow>
    <BRow class="mb-2">
      <BCol>
        <input-password
          id="repeat-new-password-input-field"
          :rules="{
            required: true,
            samePassword: 'newPassword',
          }"
          :label="register ? $t('form.passwordRepeat') : $t('form.password_new_repeat')"
          name="newPasswordRepeat"
          :placeholder="register ? $t('form.passwordRepeat') : $t('form.password_new_repeat')"
          autocomplete="new-password"
        />
      </BCol>
    </BRow>
  </div>
</template>
<script setup>
import InputPassword from './InputPassword'

defineProps({
  // Never read here — the two fields register themselves with vee-validate. Optional
  // so callers without a binding stay warning-free; existing callers keep passing it.
  modelValue: {
    type: Object,
    required: false,
    default: null,
  },
  register: {
    type: Boolean,
    required: false,
  },
})
</script>
