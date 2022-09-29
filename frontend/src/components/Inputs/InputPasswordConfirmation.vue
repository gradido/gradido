<template>
  <div>
    <b-row class="mb-2">
      <b-col>
        <input-password
          :rules="{
            required: true,
            containsLowercaseCharacter: true,
            containsUppercaseCharacter: true,
            containsNumericCharacter: true,
            atLeastEightCharactera: true,
            atLeastOneSpecialCharater: true,
            noWhitespaceCharacters: true,
          }"
          id="new-password-input-field"
          :label="register ? $t('form.password') : $t('form.password_new')"
          :showAllErrors="true"
          :immediate="true"
          :name="createId(register ? $t('form.password') : $t('form.password_new'))"
          :placeholder="register ? $t('form.password') : $t('form.password_new')"
          v-model="password"
        ></input-password>
      </b-col>
    </b-row>
    <b-row class="mb-2">
      <b-col>
        <input-password
          :rules="{
            required: true,
            samePassword: value.password,
          }"
          id="repeat-new-password-input-field"
          :label="register ? $t('form.passwordRepeat') : $t('form.password_new_repeat')"
          :immediate="true"
          :name="createId(register ? $t('form.passwordRepeat') : $t('form.password_new_repeat'))"
          :placeholder="register ? $t('form.passwordRepeat') : $t('form.password_new_repeat')"
          v-model="passwordRepeat"
        ></input-password>
      </b-col>
    </b-row>
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
  methods: {
    createId(text) {
      return text.replace(/ +/g, '-')
    },
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
}
</script>
