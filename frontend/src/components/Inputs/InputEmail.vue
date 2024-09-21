<template>
  <div>
    <BFormGroup :label="defaultTranslations.label" :label-for="labelFor" data-test="input-email">
      <BFormInput
        v-bind="ariaInput"
        :id="labelFor"
        :model-value="value"
        :state="meta.valid"
        data-test="input-email"
        :name="name"
        :placeholder="defaultTranslations.placeholder"
        type="email"
        trim
        :class="$route.path === '/send' ? 'bg-248' : ''"
        :disabled="disabled"
        autocomplete="off"
        @update:modelValue="normalizeEmail($event)"
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

const props = defineProps({
  name: {
    type: String,
    default: 'email',
  },
  label: {
    type: String,
    default: 'Email',
  },
  placeholder: {
    type: String,
    default: 'Email',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['onValidation'])

const { value, errorMessage, validate, meta } = useField(() => props.name, 'required|email')

const { t } = useI18n()

const defaultTranslations = computed(() => ({
  label: props.label ?? t('form.email'),
  placeholder: props.placeholder ?? t('form.email'),
}))

const normalizeEmail = (emailAddress) => {
  value.value = emailAddress.trim()
  validate()
}

const ariaInput = computed(() => ({
  'aria-invalid': errorMessage ? 'true' : false,
  'aria-describedby': `${props.name}-feedback`,
}))

const ariaMsg = computed(() => ({
  id: `${props.name}-feedback`,
}))

const labelFor = computed(() => `${props.name}-input-field`)
</script>
