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
    name: { type: String, required: true },
    label: { type: String, required: true },
    placeholder: { type: String, required: true },
    value: { type: Number, required: true, default: 0 },
    validMaxTime: { type: Number, required: true },
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
      this.$emit('input', Number(this.currentValue))
    },
    value() {
      if (this.value !== this.currentValue) this.currentValue = this.value
      this.$emit('updateAmount', this.currentValue)
    },
  },
}
</script>
