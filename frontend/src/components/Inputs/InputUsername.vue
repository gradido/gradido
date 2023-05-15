<template>
  <validation-provider
    tag="div"
    :rules="rules"
    :name="name"
    :bails="!showAllErrors"
    :immediate="immediate"
    v-slot="{ errors, valid, validated, ariaInput, ariaMsg }"
  >
    <b-form-group :label-for="labelFor">
      <b-input-group>
        <b-form-input
          v-model="currentValue"
          v-bind="ariaInput"
          :id="labelFor"
          :name="name"
          :placeholder="placeholder"
          type="text"
          :state="validated ? valid : false"
        ></b-form-input>
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
          min: 3,
          max: 20,
        }
      },
    },
    name: { type: String, default: 'username' },
    label: { type: String, default: 'Username' },
    placeholder: { type: String, default: 'Username' },
    value: { required: true, type: String },
    showAllErrors: { type: Boolean, default: false },
    immediate: { type: Boolean, default: false },
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
  },
}
</script>
