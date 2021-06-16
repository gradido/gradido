<template>
  <validation-provider tag="div" :rules="rules" :name="name" v-slot="{ errors, valid, validated }">
    <b-form-group :label="label" :label-for="labelFor">
      <b-input-group>
        <b-form-input
          v-model="currentValue"
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
        <b-form-invalid-feedback>
          {{ errors[0] }}
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
        required: true
      },
    },
    name: { default: '' },
    label: { default: 'Password' },
    placeholder: { default: 'Password' },
    model: { required: true, type: String },
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
      console.log('toggleShowPassword', this.placeholder)
      this.showPassword = !this.showPassword
    },
  },
  watch: {
    currentValue(val) {
      console.log('currentValue', val)
      this.$emit('input', val)
    },
  },
}
</script>
