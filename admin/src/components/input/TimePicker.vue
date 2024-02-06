<template>
  <div>
    <input
      type="text"
      v-model="timeValue"
      @input="updateValues"
      @blur="validateAndCorrect"
      placeholder="hh:mm"
    />
  </div>
</template>

<script>
export default {
  // Code written from chatGPT 3.5
  name: 'TimePicker',
  props: {
    value: {
      type: String,
      default: '00:00',
    },
  },
  data() {
    return {
      timeValue: this.value,
    }
  },
  methods: {
    updateValues(event) {
      // Allow only numbers and ":"
      const inputValue = event.target.value.replace(/[^0-9:]/g, '')
      this.timeValue = inputValue
      this.$emit('input', inputValue)
    },
    validateAndCorrect() {
      let [hours, minutes] = this.timeValue.split(':')

      // Validate hours and minutes
      hours = Math.min(parseInt(hours) || 0, 23)
      minutes = Math.min(parseInt(minutes) || 0, 59)

      // Update the value with correct format
      this.timeValue = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      this.$emit('input', this.timeValue)
    },
  },
}
</script>
