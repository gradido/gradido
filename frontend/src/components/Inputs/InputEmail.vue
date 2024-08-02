<!--<template>-->
<!--  <validation-provider-->
<!--    tag="div"-->
<!--    :rules="rules"-->
<!--    :name="name"-->
<!--    v-slot="{ errors, valid, validated, ariaInput, ariaMsg }"-->
<!--  >-->
<!--    <BFormGroup :label="label" :label-for="labelFor" data-test="input-email">-->
<!--      <BFormInput-->
<!--        v-model="currentValue"-->
<!--        v-bind="ariaInput"-->
<!--        data-test="input-email"-->
<!--        :id="labelFor"-->
<!--        :name="name"-->
<!--        :placeholder="placeholder"-->
<!--        type="email"-->
<!--        :state="validated ? valid : false"-->
<!--        trim-->
<!--        :class="$route.path === '/send' ? 'bg-248' : ''"-->
<!--        v-focus="emailFocused"-->
<!--        @focus="emailFocused = true"-->
<!--        @blur="normalizeEmail()"-->
<!--        :disabled="disabled"-->
<!--        autocomplete="off"-->
<!--      />-->
<!--      <BFormInvalidFeedback v-bind="ariaMsg">-->
<!--        {{ errors[0] }}-->
<!--      </BFormInvalidFeedback>-->
<!--    </BFormGroup>-->
<!--  </validation-provider>-->
<!--</template>-->
<template>
  <div>
    <BFormGroup :label="defaultTranslations.label" :label-for="labelFor" data-test="input-email">
      <BFormInput
        :model-value="value"
        @update:modelValue="normalizeEmail($event)"
        v-bind="ariaInput"
        :state="meta.valid"
        data-test="input-email"
        :id="labelFor"
        :name="name"
        :placeholder="defaultTranslations.placeholder"
        type="email"
        trim
        :class="$route.path === '/send' ? 'bg-248' : ''"
        :disabled="disabled"
        autocomplete="off"
      />
      <BFormInvalidFeedback v-bind="ariaMsg">
        {{ errorMessage }}
      </BFormInvalidFeedback>
    </BFormGroup>
  </div>
</template>
<!--<script>-->
<!--export default {-->
<!--  name: 'InputEmail',-->
<!--  props: {-->
<!--    rules: {-->
<!--      default: () => {-->
<!--        return {-->
<!--          required: true,-->
<!--          email: true,-->
<!--        }-->
<!--      },-->
<!--    },-->
<!--    name: { type: String, required: true },-->
<!--    label: { type: String, required: true },-->
<!--    placeholder: { type: String, required: true },-->
<!--    modelValue: { type: String, required: true },-->
<!--    disabled: { type: Boolean, required: false, default: false },-->
<!--  },-->
<!--  data() {-->
<!--    return {-->
<!--      currentValue: this.modelValue,-->
<!--      emailFocused: false,-->
<!--    }-->
<!--  },-->
<!--  computed: {-->
<!--    labelFor() {-->
<!--      return this.name + '-input-field'-->
<!--    },-->
<!--  },-->
<!--  watch: {-->
<!--    currentValue() {-->
<!--      this.$emit('input', this.currentValue)-->
<!--    },-->
<!--    modelValue() {-->
<!--      if (this.modelValue !== this.currentValue) {-->
<!--        this.currentValue = this.modelValue-->
<!--      }-->
<!--      this.$emit('onValidation')-->
<!--    },-->
<!--  },-->
<!--  methods: {-->
<!--    normalizeEmail() {-->
<!--      this.emailFocused = false-->
<!--      this.currentValue = this.currentValue.trim()-->
<!--    },-->
<!--  },-->
<!--}-->
<!--</script>-->

<script setup>
import { ref, watch, computed, defineProps, defineEmits } from 'vue'
import { useField } from 'vee-validate'
import { useI18n } from 'vue-i18n'
import * as yup from 'yup'

// rules: {
//   type: [String, Object, Function],
// default: () => ({
//     required: true,
//     email: true,
//   }),
// },

// Define props with default values
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

// Use the useField hook for validation
const { value, errorMessage, errors, validate, meta } = useField(() => props.name, 'required|email')

const { t } = useI18n()

// const emailFocused = ref(false)

const defaultTranslations = computed(() => ({
  label: props.label ?? t('form.email'),
  placeholder: props.placeholder ?? t('form.email'),
}))

const normalizeEmail = (emailAddress) => {
  //TODO trigger blur on bootstrap input
  // emailFocused.value = false
  value.value = emailAddress.trim()
  validate()
}

// Computed properties for ARIA attributes and labelFor
const ariaInput = computed(() => ({
  'aria-invalid': errorMessage ? 'true' : false,
  'aria-describedby': `${props.name}-feedback`,
}))

const ariaMsg = computed(() => ({
  id: `${props.name}-feedback`,
}))

const labelFor = computed(() => `${props.name}-input-field`)
</script>
