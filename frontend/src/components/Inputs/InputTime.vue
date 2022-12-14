<template>
  <div class="input-time">
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
          type="number"
          :state="validated ? valid : false"
        ></b-form-input>
        <b-form-invalid-feedback v-bind="ariaMsg">
          {{ errors[0] }}
        </b-form-invalid-feedback>
      </b-form-group>
    </validation-provider>
  </div>
</template>
<script>
export default {
  name: 'InputTime',
  props: {
    rules: {
      type: Object,
      default: () => {},
    },
    name: { type: String, required: true, default: 'Time' },
    label: { type: String, required: true, default: 'Time' },
    placeholder: { type: String, required: true, default: 'Time' },
    value: { type: Number, required: true, default: 0 },
  },
  data() {
    return {
      currentValue: 0,
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
      console.log('value', this.value)
      console.log('value !== currentValue', this.value !== this.currentValue)
      // this.value = Number(this.value)
      if (Number(this.value) !== this.currentValue) this.currentValue = this.value
      this.currentValue = Number(this.currentValue)
      // this.value = Number(this.value)
      console.log('value', typeof(this.value))
      console.log('currentValue', typeof(this.currentValue))
    },
  },
  methods: {
    // normalizeTime(isValid) {
    //   this.timeFocused = false
    //   if (!isValid) return
    //   // this.timeValue = Number(this.currentValue.replace(',', '.'))
    //   this.currentValue = this.timeValue
    // },
  },
}
</script>
