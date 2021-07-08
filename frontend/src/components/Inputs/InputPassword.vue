<template>
  <validation-provider
    tag="div"
    :rules="rules"
    :name="name"
    :bails="!showAllErrors"
    :immediate="immediate"
    v-slot="{ errors, valid, validated, ariaInput, ariaMsg }"
  >
    <b-form-group :label="label" :label-for="labelFor">
      <b-input-group>
        <b-form-input
          v-model="currentValue"
          v-bind="ariaInput"
          :id="labelFor"
          :name="name"
          :placeholder="placeholder"
          :type="showPassword ? 'text' : 'password'"
          :state="validated ? valid : false"
        ></b-form-input>
        <b-input-group-append>
          <b-button variant="outline-primary" @click="toggleShowPassword">
            <b-icon :icon="showPassword ? 'eye' : 'eye-slash'" />
          </b-button>
        </b-input-group-append>
        <b-form-invalid-feedback v-bind="ariaMsg">
          <div v-if="showAllErrors">
            <span v-for="error in errors" :key="error">
              {{ error }}
              <br />
            </span>
          </div>
          <div v-else>
            {{ errors[0] }}
          </div>
        </b-form-invalid-feedback>
      </b-input-group>
    </b-form-group>
  </validation-provider>
</template>
<script>
export default {
  name: 'InputPassword',
  props: {
    rules: {
      default: () => {
        return {
          required: true,
        }
      },
    },
    name: { type: String, default: 'password' },
    label: { type: String, default: 'Password' },
    placeholder: { type: String, default: 'Password' },
    value: { required: true, type: String },
    showAllErrors: { type: Boolean, default: false },
    immediate: { type: Boolean, default: false },
  },
  data() {
    return {
      currentValue: '',
      showPassword: false,
    }
  },
  computed: {
    labelFor() {
      return this.name + '-input-field'
    },
  },
  methods: {
    toggleShowPassword() {
      this.showPassword = !this.showPassword
    },
  },
  watch: {
    currentValue() {
      this.$emit('input', this.currentValue)
    },
  },
}
</script>
