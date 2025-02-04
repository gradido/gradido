<template>
  <div class="input-hour">
    <BFormGroup :label="label" :label-for="labelFor">
      <BFormInput
        :id="labelFor"
        v-model="currentValue"
        :name="name"
        :placeholder="placeholder"
        type="number"
        :state="meta.valid"
        step="0.01"
        min="0"
        :max="validMaxTime"
        class="bg-248"
      />
      <BFormInvalidFeedback v-if="errorMessage">
        {{ errorMessage }}
      </BFormInvalidFeedback>
    </BFormGroup>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useField } from 'vee-validate'

const props = defineProps({
  rules: {
    type: Object,
    default: () => ({}),
  },
  name: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  placeholder: {
    type: String,
    required: true,
  },
  validMaxTime: {
    type: Number,
    required: true,
  },
})

const { value: currentValue, errorMessage, meta } = useField(props.name, props.rules)

const labelFor = computed(() => `${props.name}-input-field`)
</script>
