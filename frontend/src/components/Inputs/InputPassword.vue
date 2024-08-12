<!--<template>-->
<!--  <validation-provider-->
<!--    tag="div"-->
<!--    :rules="rules"-->
<!--    :name="name"-->
<!--    :bails="!props.showAllErrors"-->
<!--    :immediate="props.immediate"-->
<!--    v-slot="{ errors, valid, validated, ariaInput, ariaMsg }"-->
<!--  >-->
<!--    <BFormGroup :label="label" :label-for="labelFor">-->
<!--      <BInputGroup>-->
<!--        <BFormInput-->
<!--          v-model="currentValue"-->
<!--          v-bind="ariaInput"-->
<!--          :id="labelFor"-->
<!--          :name="name"-->
<!--          :placeholder="props.placeholder"-->
<!--          :type="showPassword ? 'text' : 'password'"-->
<!--          :state="validated ? valid : false"-->
<!--          data-test="password-input-field"-->
<!--        ></BFormInput>-->
<!--        <template #append>-->
<!--          <BButton-->
<!--            variant="outline-light"-->
<!--            @click="toggleShowPassword"-->
<!--            class="border-left-0 rounded-right"-->
<!--            tabindex="-1"-->
<!--          >-->
<!--            &lt;!&ndash;            <b-icon :icon="showPassword ? 'eye' : 'eye-slash'" />&ndash;&gt;-->
<!--            {{ showPassword ? 'eye' : 'eye-slash' }}-->
<!--          </BButton>-->
<!--        </template>-->
<!--        <BFormInvalidFeedback v-bind="ariaMsg">-->
<!--          <div v-if="props.showAllErrors">-->
<!--            <span v-for="error in errors" :key="error">-->
<!--              {{ error }}-->
<!--              <br />-->
<!--            </span>-->
<!--          </div>-->
<!--          <div v-else>-->
<!--            {{ errors[0] }}-->
<!--          </div>-->
<!--        </BFormInvalidFeedback>-->
<!--      </BInputGroup>-->
<!--    </BFormGroup>-->
<!--  </validation-provider>-->
<!--</template>-->
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
            class="border-left-0 rounded-right"
            tabindex="-1"
            @click="toggleShowPassword"
          >
            <IBiEye v-if="showPassword" />
            <IBiEyeSlash v-else />
          </BButton>
        </template>
      </BInputGroup>
      <BFormInvalidFeedback v-bind="ariaMsg">
        <!--        <div v-if="showAllErrors">-->
        <!--          <span v-for="error in errors" :key="error">-->
        <!--            {{ error }}-->
        <!--            <br />-->
        <!--          </span>-->
        <!--        </div>-->
        {{ errorMessage }}
      </BFormInvalidFeedback>
    </BFormGroup>
  </div>
</template>
<!--<script>-->
<!--export default {-->
<!--  name: 'InputPassword',-->
<!--  props: {-->
<!--    rules: {-->
<!--      default: () => {-->
<!--        return {-->
<!--          required: true,-->
<!--        }-->
<!--      },-->
<!--    },-->
<!--    name: { type: String, default: 'password' },-->
<!--    label: { type: String, default: 'Password' },-->
<!--    placeholder: { type: String, default: 'Password' },-->
<!--    value: { required: true, type: String },-->
<!--    showAllErrors: { type: Boolean, default: false },-->
<!--    immediate: { type: Boolean, default: false },-->
<!--  },-->
<!--  data() {-->
<!--    return {-->
<!--      currentValue: '',-->
<!--      showPassword: false,-->
<!--    }-->
<!--  },-->
<!--  computed: {-->
<!--    labelFor() {-->
<!--      return this.name + '-input-field'-->
<!--    },-->
<!--  },-->
<!--  methods: {-->
<!--    toggleShowPassword() {-->
<!--      this.showPassword = !this.showPassword-->
<!--    },-->
<!--  },-->
<!--  watch: {-->
<!--    currentValue() {-->
<!--      this.$emit('input', this.currentValue)-->
<!--    },-->
<!--  },-->
<!--}-->
<!--</script>-->

<script setup>
import { ref, computed, watch, defineProps, defineEmits, toRef } from 'vue'
import { useField } from 'vee-validate'
import { useI18n } from 'vue-i18n'

// Define props with default values
const props = defineProps({
  name: {
    type: String,
    default: 'password',
  },
  label: {
    type: String,
    default: 'Password',
  },
  placeholder: {
    type: String,
    default: 'Password',
  },
  showAllErrors: {
    type: Boolean,
    default: false,
  },
  immediate: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const name = toRef(props, 'name')
// Use the useField hook for validation
const { value, errorMessage, meta } = useField(name, 'required')

const { t } = useI18n()

const defaultTranslations = computed(() => ({
  label: props.label ?? t('form.password'),
  placeholder: props.placeholder ?? t('form.password'),
}))

// Local state
const showPassword = ref(false)

// Toggle password visibility
const toggleShowPassword = () => {
  showPassword.value = !showPassword.value
}

const createId = (text) => {
  return text.replace(/ +/g, '-')
}

const labelId = computed(() => {
  return createId(props.label)
})

// Computed properties for ARIA attributes and labelFor
const ariaInput = computed(() => ({
  'aria-invalid': meta.valid ? false : 'true',
  'aria-describedby': `${labelId.value}-feedback`,
}))

const ariaMsg = computed(() => ({
  id: `${labelId.value}-feedback`,
}))

const labelFor = computed(() => `${labelId.value}-input-field`)
</script>
