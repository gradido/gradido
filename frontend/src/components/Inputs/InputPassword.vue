<template>
  <div>
    <BFormGroup :label="defaultTranslations.label" :label-for="labelFor">
      <!-- The eye stands inside the field, as the warning sign does in the e-mail field:
           one field, one rounded frame. As a box of its own beside the input it had no frame
           at all -- its variant, outline-light, is one this template does not build, and all
           it drew was the buttons' dark shadow, which the dark card swallows (Bernd,
           21.09.2026). Inside, the frame's colour, the focus ring and a browser's autofill
           ground are the field's own. -->
      <div class="password-field position-relative">
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
          class="password-eye"
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
    type: Object || String,
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

const name = toRef(props, 'name')
const { value, errorMessage, meta, errors, validate } = useField(name, props.rules, {
  bails: !props.allowFullValidation,
  validateOnMount: props.immediate,
})

const { t } = useI18n()

const defaultTranslations = computed(() => ({
  label: props.label || t('form.password'),
  placeholder: props.placeholder || t('form.password'),
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
/* The eye takes the field's right end, a finger wide and the field's full height, and its
   corners, so that the focus ring below follows them. */
.password-eye {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: var(--password-eye);
  padding: 0;
  border: 0;
  border-radius: 0 17px 17px 0;
  background: transparent;
  box-shadow: none;
}

/* Without a variant the button has no focus ring of its own; this one stays inside the field. */
.password-eye:focus-visible {
  outline: 2px solid var(--success, #047006);
  outline-offset: -6px;
}

.password-field {
  --password-eye: 3rem;
}

.password-input {
  padding-right: var(--password-eye);
}

/* Bootstrap draws the warning and the check sign where the eye stands now; they move in by
   its width, and the text stops before both. */
.password-input.is-valid,
.password-input.is-invalid {
  padding-right: calc(1.5em + 0.75rem + var(--password-eye));
  background-position: right calc(0.375em + 0.1875rem + var(--password-eye)) center;
}
</style>
