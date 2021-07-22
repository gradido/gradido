<template>
  <div>
    <b-row class="mb-2">
      <b-col>
        <input-password
           id="inputPassword"
          :rules="{
            required: true,
            containsLowercaseCharacter: true,
            containsUppercaseCharacter: true,
            containsNumericCharacter: true,
            atLeastEightCharactera: true,
          }"
          :label="register ? $t('form.password') : $t('form.password_new')"
          :showAllErrors="true"
          :immediate="true"
          :name="register ? $t('form.password') : $t('form.password_new')"
          :placeholder="register ? $t('form.password') : $t('form.password_new')"
          v-model="password"
        ></input-password>
      </b-col>
    </b-row>
    <b-row class="mb-2">
      <b-col>
        <input-password
          id="inputPasswordRepeat"
          :rules="{ samePassword: value.password }"
          :label="register ? $t('form.passwordRepeat') : $t('form.password_new_repeat')"
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
    }
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
}
</script>
