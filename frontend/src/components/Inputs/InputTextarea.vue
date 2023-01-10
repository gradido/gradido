<template>
  <validation-provider
    tag="div"
    :rules="rules"
    :name="name"
    v-slot="{ errors, valid, validated, ariaInput, ariaMsg }"
  >
    <b-form-group :label="label" :label-for="labelFor" data-test="input-textarea">
      <b-form-textarea
        v-model="currentValue"
        v-bind="ariaInput"
        :id="labelFor"
        class="bg-248"
        :name="name"
        :placeholder="placeholder"
        :state="validated ? valid : false"
        trim
        rows="4"
        max-rows="4"
        :disabled="disabled"
      ></b-form-textarea>
      <b-form-invalid-feedback v-bind="ariaMsg">
        {{ errors[0] }}
      </b-form-invalid-feedback>
    </b-form-group>
  </validation-provider>
</template>
<script>
export default {
  name: 'InputTextarea',
  props: {
    rules: {
      type: Object,
      default: () => {},
    },
    name: { type: String, required: true },
    label: { type: String, required: true },
    placeholder: { type: String, required: true },
    value: { type: String, required: true },
    disabled: { required: false, type: Boolean, default: false },
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
