<template>
  <div>
    <BRow class="mb-2">
      <BCol>
        <input-password
          id="new-password-input-field"
          v-model="password"
          :rules="{
            required: true,
            containsLowercaseCharacter: true,
            containsUppercaseCharacter: true,
            containsNumericCharacter: true,
            atLeastEightCharacters: true,
            atLeastOneSpecialCharater: true,
            noWhitespaceCharacters: true,
          }"
          :label="register ? $t('form.password') : $t('form.password_new')"
          :show-all-errors="true"
          :immediate="true"
          :name="createId(register ? $t('form.password') : $t('form.password_new'))"
          :placeholder="register ? $t('form.password') : $t('form.password_new')"
        ></input-password>
      </BCol>
    </BRow>
    <BRow class="mb-2">
      <BCol>
        <input-password
          id="repeat-new-password-input-field"
          v-model="passwordRepeat"
          :rules="{
            required: true,
            samePassword: value.password,
          }"
          :label="register ? $t('form.passwordRepeat') : $t('form.password_new_repeat')"
          :immediate="true"
          :name="createId(register ? $t('form.passwordRepeat') : $t('form.password_new_repeat'))"
          :placeholder="register ? $t('form.passwordRepeat') : $t('form.password_new_repeat')"
        ></input-password>
      </BCol>
    </BRow>
  </div>
</template>
<script>
import InputPassword from './InputPassword'

export default {
  name: 'InputPasswordConfirm',
  components: {
    InputPassword,
  },
  props: {
    value: {
      type: Object,
      required: true,
    },
    register: {
      type: Boolean,
      required: false,
    },
  },
  data() {
    return {
      password: '',
      passwordRepeat: '',
    }
  },
  computed: {
    passwordObject() {
      return { password: this.password, passwordRepeat: this.passwordRepeat }
    },
  },
  watch: {
    password() {
      this.$emit('input', this.passwordObject)
    },
    passwordRepeat() {
      this.$emit('input', this.passwordObject)
    },
  },
  methods: {
    createId(text) {
      return text.replace(/ +/g, '-')
    },
  },
}
</script>
