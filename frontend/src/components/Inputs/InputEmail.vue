<template>
  <div>
    <BFormGroup :label="defaultTranslations.label" :label-for="labelFor" data-test="input-email">
      <BFormInput
        v-bind="ariaInput"
        :id="labelFor"
        :model-value="value"
        :state="shownState"
        data-test="input-email"
        :name="name"
        :placeholder="defaultTranslations.placeholder"
        type="email"
        trim
        class="rounded-input"
        :class="$route.path === '/send' ? 'bg-248' : ''"
        :disabled="disabled"
        autocomplete="off"
        @update:modelValue="normalizeEmail($event)"
        @blur="handleBlur($event, true)"
      />
      <BFormInvalidFeedback v-bind="ariaMsg">
        {{ errorMessage }}
      </BFormInvalidFeedback>
    </BFormGroup>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits } from 'vue'
import { useField } from 'vee-validate'
import { useI18n } from 'vue-i18n'
import { shownValidState } from '@/validation-rules'

const props = defineProps({
  name: {
    type: String,
    default: 'email',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['onValidation'])

const { value, errorMessage, validate, meta, handleBlur } = useField(
  () => props.name,
  'required|email',
)

// Nothing red before the field has been left once (see shownValidState).
const shownState = computed(() => shownValidState(meta))

const { t } = useI18n()

const defaultTranslations = computed(() => ({
  label: t('form.email'),
  placeholder: t('form.email'),
}))

const normalizeEmail = (emailAddress) => {
  value.value = emailAddress.trim()
  validate()
}

const ariaInput = computed(() => ({
  'aria-invalid': shownState.value === false ? 'true' : false,
  'aria-describedby': `${props.name}-feedback`,
}))

const ariaMsg = computed(() => ({
  id: `${props.name}-feedback`,
}))

const labelFor = computed(() => `${props.name}-input-field`)
</script>
