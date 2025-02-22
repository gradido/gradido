<template>
  <div>
    <BFormGroup :label="label" :label-for="labelFor" data-test="input-textarea">
      <BFormTextarea
        :id="labelFor"
        :model-value="currentValue"
        class="bg-248"
        :name="name"
        :placeholder="placeholder"
        :state="meta.valid"
        trim
        :rows="4"
        :max-rows="4"
        :disabled="disabled"
        no-resize
        @update:modelValue="currentValue = $event"
      />
      <BFormInvalidFeedback v-if="errorMessage">
        {{ translatedErrorString }}
      </BFormInvalidFeedback>
    </BFormGroup>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useField } from 'vee-validate'
import { useI18n } from 'vue-i18n'
import { translateYupErrorString } from '@/validationSchemas'

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
  disabled: {
    type: Boolean,
    default: false,
  },
})

const { value: currentValue, errorMessage, meta } = useField(props.name, props.rules)
const { t } = useI18n()
const translatedErrorString = computed(() => translateYupErrorString(errorMessage, t))
const labelFor = computed(() => `${props.name}-input-field`)
</script>

<style lang="scss" scoped>
:deep(.form-control) {
  height: unset;
}
</style>
