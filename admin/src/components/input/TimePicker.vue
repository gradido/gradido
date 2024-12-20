<template>
  <div>
    <input
      v-model="timeValue"
      class="timer-input"
      type="text"
      placeholder="hh:mm"
      @input="updateValues"
      @blur="validateAndCorrect"
    />
  </div>
</template>

<script>
export default {
  // Code written from chatGPT 3.5
  name: 'TimePicker',
  props: {
    modelValue: {
      type: String,
      default: '00:00',
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      timeValue: this.modelValue,
    }
  },
  methods: {
    updateValues(event) {
      // Allow only numbers and ":"
      const inputValue = event.target.value.replace(/[^0-9:]/g, '')
      this.timeValue = inputValue
      this.$emit('update:modelValue', inputValue)
    },
    validateAndCorrect() {
      let [hours, minutes] = this.timeValue.split(':')

      // Validate hours and minutes
      hours = Math.min(parseInt(hours) || 0, 23)
      minutes = Math.min(parseInt(minutes) || 0, 59)

      // Update the value with correct format
      this.timeValue = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      this.$emit('update:modelValue', this.timeValue)
    },
  },
}
</script>

<style scoped>
.timer-input {
  border: 1px solid rgb(222 226 230);
  border-radius: 6px;
  padding: 6px 12px;
}
</style>
