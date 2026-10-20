import { defineComponent, ref, watch } from 'vue'
import classes from './TimePicker.module.css'

export const TimePicker = defineComponent({
  name: 'TimePicker',
  props: {
    modelValue: {
      type: String,
      default: '00:00',
    },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    // reactive state
    const timeValue = ref(props.modelValue)

    // watch for prop changes
    watch(
      () => props.modelValue,
      (newVal) => {
        timeValue.value = newVal
      },
    )

    const updateValues = (event: Event) => {
      // Allow only numbers and ":"
      const inputValue = (event.target as HTMLInputElement).value.replace(/[^0-9:]/g, '')
      timeValue.value = inputValue
      emit('update:modelValue', inputValue)
    }

    const validateAndCorrect = () => {
      const [hourText, minuteText] = timeValue.value.split(':')

      // Validate hours and minutes
      const hours = Math.min(parseInt(hourText) || 0, 23)
      const minutes = Math.min(parseInt(minuteText) || 0, 59)

      // Update the value with correct format
      timeValue.value = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      emit('update:modelValue', timeValue.value)
    }

    // ⚠️ v-model and not value={…}: when the filter in updateValues leaves the value the field
    // already had, nothing reactive changes, and only v-model still writes the field back.
    return () => (
      <div>
        <input
          v-model={timeValue.value}
          class={classes.timerInput}
          type='text'
          placeholder='hh:mm'
          onInput={updateValues}
          onBlur={validateAndCorrect}
        />
      </div>
    )
  },
})
