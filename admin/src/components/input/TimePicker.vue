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

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: '00:00',
  },
})

const emit = defineEmits(['update:modelValue'])

// reactive state
const timeValue = ref(props.modelValue)

// watch for prop changes
watch(
  () => props.modelValue,
  (newVal) => {
    timeValue.value = newVal
  },
)

const updateValues = (event) => {
  // Allow only numbers and ":"
  const inputValue = event.target.value.replace(/[^0-9:]/g, '')
  timeValue.value = inputValue
  emit('update:modelValue', inputValue)
}

const validateAndCorrect = () => {
  let [hours, minutes] = timeValue.value.split(':')

  // Validate hours and minutes
  hours = Math.min(parseInt(hours) || 0, 23)
  minutes = Math.min(parseInt(minutes) || 0, 59)

  // Update the value with correct format
  timeValue.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  emit('update:modelValue', timeValue.value)
}
</script>

<style scoped>
.timer-input {
  border: 1px solid rgb(222 226 230);
  border-radius: 6px;
  padding: 6px 12px;
}
</style>
