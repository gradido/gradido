<template>
  <div class="input-hour">
    <validation-provider
      tag="div"
      :rules="rules"
      :name="name"
      v-slot="{ valid, validated, ariaInput }"
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
          step="0.5"
          min="0"
          :max="validMaxTime"
          class="bg-248"
        ></b-form-input>
      </b-form-group>
    </validation-provider>
  </div>
</template>
<script>
export default {
  name: 'InputHour',
  props: {
    rules: {
      type: Object,
      default: () => {},
    },
    name: { type: String, required: true, default: 'Time' },
    label: { type: String, required: true, default: 'Time' },
    placeholder: { type: String, required: true, default: 'Time' },
    value: { type: Number, required: true, default: 0 },
    validMaxTime: { type: Number, required: true, default: 0 },
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
      //   console.log('value', this.value)
      //   console.log('currentValue', this.currentValue)
      //   console.log('value', typeof this.value)
      //   console.log('currentValue', typeof this.currentValue)
      //   console.log('!==', this.value !== this.currentValue)

      if (this.value !== this.currentValue) this.currentValue = this.value
      this.$emit('updateAmount', this.currentValue)
    },
  },
  methods: {
    normalizeTime(isValid) {
      this.timeFocused = false
      if (!isValid) return
      this.timeValue = Number(this.currentValue.replace(',', '.'))
      this.currentValue = this.timeValue
    },
  },
}
</script>
