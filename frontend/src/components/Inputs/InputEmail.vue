<template>
  <validation-provider
    tag="div"
    :rules="rules"
    :name="name"
    v-slot="{ errors, valid, validated, ariaInput, ariaMsg }"
  >
    <b-form-group :label="label" :label-for="labelFor">
      <b-form-input
        v-model="currentValue"
        v-bind="ariaInput"
        :id="labelFor"
        :name="name"
        :placeholder="placeholder"
        type="email"
        :state="validated ? valid : false"
        trim
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
    name: { type: String, default: 'Email' },
    label: { type: String, default: 'Email' },
    placeholder: { type: String, default: 'Email' },
    value: { required: true, type: String, default: '' },
  },
  data() {
    return {
      currentValue: this.value,
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
}
</script>
