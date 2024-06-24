<template>
  <b-form-group :label="$t('federation.gmsApiKey')" label-for="home-community-api-key">
    <b-form-input id="home-community-api-key" v-model="inputValue" @input="updateValue" />
  </b-form-group>
</template>

<script>
export default {
  name: 'GMSApiKey',
  props: {
    value: {
      type: String,
      required: false,
      default: '',
    },
  },
  data() {
    return {
      inputValue: this.value,
      originalValue: this.value,
    }
  },
  methods: {
    updateValue(value) {
      this.inputValue = value
      if (this.inputValue !== this.originalValue) {
        if (this.$parent.valueChanged) {
          this.$parent.valueChanged()
        }
      } else {
        if (this.$parent.invalidValues) {
          this.$parent.invalidValues()
        }
      }
      this.$emit('input', this.inputValue)
    },
  },
}
</script>
