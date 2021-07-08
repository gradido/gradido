<template>
  <validation-provider
    tag="div"
    :rules="rules"
    :name="name"
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
          type="email"
          :state="validated ? valid : false"
          trim
          class="email-form-input"
        ></b-form-input>
        <b-form-invalid-feedback v-bind="ariaMsg">
          {{ errors[0] }}
        </b-form-invalid-feedback>
      </b-input-group>
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
    value: { required: true, type: String },
  },
  data() {
    return {
      currentValue: '',
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
<style>
.email-form-input {
  border-right-style: solid !important;
  border-right-width: 1px !important;
  padding-right: 12px !important;
  border-top-right-radius: 6px !important;
  border-bottom-right-radius: 6px !important;
}
</style>
