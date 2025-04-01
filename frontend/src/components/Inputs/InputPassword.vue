<template>
  <div>
    <BFormGroup :label="defaultTranslations.label" :label-for="labelFor">
      <BInputGroup>
        <BFormInput
          :id="labelFor"
          :model-value="value"
          :name="name"
          :placeholder="defaultTranslations.placeholder"
          :type="showPassword ? 'text' : 'password'"
          :state="meta.valid"
          data-test="password-input-field"
          v-bind="ariaInput"
          @update:modelValue="value = $event"
        />
        <template #append>
          <BButton
            variant="outline-light"
            class="border-start-0 rounded-end"
            tabindex="-1"
            @click="toggleShowPassword"
          >
            <IBiEye v-if="showPassword" />
            <IBiEyeSlash v-else />
          </BButton>
        </template>
      </BInputGroup>
      <BFormInvalidFeedback v-if="errorMessage || errors.length" force-show v-bind="ariaMsg">
        <template #default>
          <div v-if="allowFullValidation">
            <span v-for="error in errors" :key="error">
              {{ error }}
              <br />
            </span>
          </div>
          <template v-else>{{ errorMessage }}</template>
        </template>
      </BFormInvalidFeedback>
    </BFormGroup>
  </div>
</template>

<script setup>
import { ref, computed, watch, defineProps, defineEmits, toRef, onMounted, nextTick } from 'vue'
import { useField } from 'vee-validate'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  name: {
    type: String,
    default: 'password',
  },
  immediate: {
    type: Boolean,
    default: false,
  },
  rules: {
    type: Object || String,
    default: 'required',
  },
  allowFullValidation: {
    type: Boolean,
    default: false,
  },
})

const name = toRef(props, 'name')
const { value, errorMessage, meta, errors, validate } = useField(name, props.rules, {
  bails: !props.allowFullValidation,
  validateOnMount: props.immediate,
})

const { t } = useI18n()

const defaultTranslations = computed(() => ({
  label: t('form.password'),
  placeholder: t('form.password'),
}))

const showPassword = ref(false)

const toggleShowPassword = () => {
  showPassword.value = !showPassword.value
}

const ariaInput = computed(() => ({
  'aria-invalid': meta.valid ? false : 'true',
  'aria-describedby': `${props.name}-feedback`,
}))

const ariaMsg = computed(() => ({
  id: `${props.name}-feedback`,
}))

const labelFor = computed(() => `${props.name}-input-field`)
</script>

<style scoped>
input {
  border-radius: 17px 0 0 17px;
}
</style>
