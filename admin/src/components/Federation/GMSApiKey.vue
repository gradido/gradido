<template>
  <b-form-group :label="$t('federation.gmsApiKey')" label-for="home-community-api-key">
    <b-form-input id="home-community-api-key" v-model="inputValue" @input="updateValue" />
  </b-form-group>
</template>

<script>
export default {
  // Code written from chatGPT 3.5
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
    }
  },
  methods: {
    updateValue(value) {
      this.inputValue = value
      if (this.$parent.valueChanged) {
        this.$parent.valueChanged()
      }
      this.$emit('input', this.inputValue)
    },
  },
}
</script>
