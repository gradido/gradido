<template>
  <BFormGroup :label="label" :label-for="idName">
    <BFormInput :id="idName" :model-value="modelValue" @update:model-value="inputValue = $event" />
  </BFormGroup>
</template>

<script>
export default {
  name: 'EditableGroupableLabel',
  props: {
    modelValue: {
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
  emits: ['update:model-value'],
  data() {
    return {
      inputValue: this.modelValue,
      originalValue: this.modelValue,
    }
  },
  watch: {
    inputValue() {
      this.updateValue()
    },
  },
  methods: {
    updateValue() {
      if (this.inputValue !== this.originalValue) {
        if (this.$parent.valueChanged) {
          this.$parent.valueChanged()
        }
      } else {
        if (this.$parent.invalidValues) {
          this.$parent.invalidValues()
        }
      }
      this.$emit('update:model-value', this.inputValue)
    },
  },
}
</script>
