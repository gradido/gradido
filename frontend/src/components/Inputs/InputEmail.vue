<template>
  <validation-provider
    tag="div"
    :rules="rules"
    :name="name"
    v-slot="{ errors, valid, validated, ariaInput, ariaMsg }"
  >
    <b-form-group :label="label" :label-for="labelFor" data-test="input-email">
      <b-form-input
        v-model="currentValue"
        v-bind="ariaInput"
        data-test="input-email"
        :id="labelFor"
        :name="name"
        :placeholder="placeholder"
        type="email"
        :state="validated ? valid : false"
        trim
        :class="$route.path === '/send' ? 'bg-248' : ''"
        v-focus="emailFocused"
        @focus="emailFocused = true"
        @blur="normalizeEmail()"
        :disabled="disabled"
      ></b-form-input>
      <b-form-invalid-feedback v-bind="ariaMsg">
        {{ errors[0] }}
      </b-form-invalid-feedback>
    </b-form-group>
  </validation-provider>
</template>
<script>
export default {
  name: 'InputEmail',
  props: {
    rules: {
      default: () => {
        return {
          required: true,
          email: true,
        }
      },
    },
    name: { type: String, required: true },
    label: { type: String, required: true },
    placeholder: { type: String, required: true },
    value: { type: String, required: true },
    disabled: { type: Boolean, required: false, default: false },
  },
  data() {
    return {
      currentValue: this.value,
      emailFocused: false,
    }
  },
  computed: {
    labelFor() {
      return this.name + '-input-field'
    },
  },
  watch: {
    currentValue() {
      this.$emit('input', this.currentValue)
    },
    value() {
      if (this.value !== this.currentValue) this.currentValue = this.value
    },
  },
  methods: {
    normalizeEmail() {
      this.emailFocused = false
      this.currentValue = this.currentValue.trim()
    },
  },
}
</script>
