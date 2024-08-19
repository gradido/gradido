<template>
  <div>
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
          immediate
          name="newPassword"
          :placeholder="register ? $t('form.password') : $t('form.password_new')"
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
          immediate
          name="newPasswordRepeat"
          :placeholder="register ? $t('form.passwordRepeat') : $t('form.password_new_repeat')"
        />
      </BCol>
    </BRow>
  </div>
</template>
<script setup>
import InputPassword from './InputPassword'

defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  register: {
    type: Boolean,
    required: false,
  },
})
</script>
