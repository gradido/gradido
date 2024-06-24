<template>
  <b-form-group :label="label" :label-for="idName">
    <b-form-input :id="idName" v-model="inputValue" @input="updateValue" />
  </b-form-group>
</template>

<script>
export default {
  name: 'EditableGroupableLabel',
  props: {
    value: {
      type: String,
      required: false,
      default: null,
    },
    label: {
      type: String,
      required: true,
    },
    idName: {
      type: String,
      required: true,
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
