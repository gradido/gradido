<template>
  <div>
    <BFormGroup :label="defaultTranslations.label" :label-for="labelFor">
      <!-- The eye stands inside the field, as the warning sign does in the e-mail field:
           one field, one rounded frame. As a box of its own beside the input it had no frame
           at all -- its variant, outline-light, is one this template does not build, and all
           it drew was the buttons' dark shadow, which the dark card swallows (Bernd,
           21.09.2026). Inside, the frame's colour, the focus ring and a browser's autofill
           ground are the field's own. The rules are shared with the thank-you card's PIN
           (assets/scss/_reveal-field.scss). -->
      <div class="reveal-field">
        <BFormInput
          :id="labelFor"
          :model-value="value"
          :name="name"
          :placeholder="defaultTranslations.placeholder"
          :type="showPassword ? 'text' : 'password'"
          :state="meta.valid"
          class="rounded-input password-input"
          data-test="password-input-field"
          v-bind="ariaInput"
          @update:modelValue="value = $event"
        />
        <!-- A control like any other: reachable with the tab key, where a native button turns
             Enter and Space into the click, and named for a screen reader by what it will do. -->
        <BButton
          :variant="null"
          class="reveal-eye"
          :aria-label="showPassword ? $t('form.hidePassword') : $t('form.showPassword')"
          data-test="password-eye"
          @click="toggleShowPassword"
        >
          <IBiEye v-if="showPassword" class="eye-icon" />
          <IBiEyeSlash v-else class="eye-icon" />
        </BButton>
      </div>
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
    type: [Object, String],
    default: 'required',
  },
  allowFullValidation: {
    type: Boolean,
    default: false,
  },
  label: {
    type: String,
    default: null,
  },
  placeholder: {
    type: String,
    default: null,
  },
})

const { t } = useI18n()

const defaultTranslations = computed(() => ({
  label: props.label || t('form.password'),
  placeholder: props.placeholder || t('form.password'),
}))

const name = toRef(props, 'name')
const { value, errorMessage, meta, errors, validate } = useField(name, props.rules, {
  bails: !props.allowFullValidation,
  validateOnMount: props.immediate,
  // The message names the field as the label above it does. The field name alone cannot:
  // `password` is the old password in the settings, `newPassword` reads "Passwort" where
  // an account gets its first one and "Neues Passwort" where it changes it.
  label: () => defaultTranslations.value.label,
})

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
/* The eye, its place and the room it keeps are shared with the thank-you card's PIN
   (assets/scss/_reveal-field.scss). What stays here is the password's own: Bootstrap draws
   the warning and the check sign where the eye stands; they move in by its width, and the
   text stops before both. */
.password-input.is-valid,
.password-input.is-invalid {
  padding-right: calc(1.5em + 0.75rem + var(--reveal-eye));
  background-position: right calc(0.375em + 0.1875rem + var(--reveal-eye)) center;
}
</style>
