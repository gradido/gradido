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
          }"
          :label="$t('form.password_new')"
          :showAllErrors="true"
          :immediate="true"
          :name="$t('form.password_new')"
          :placeholder="$t('form.password_new')"
          v-model="password"
        ></input-password>
      </b-col>
    </b-row>
    <b-row class="mb-2">
      <b-col>
        <input-password
          :rules="{ samePassword: value.password }"
          :label="$t('form.password_new_repeat')"
          :placeholder="$t('form.password_new_repeat')"
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
