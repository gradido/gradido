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
          :model-value="value"
          @update:modelValue="value = $event"
          :id="labelFor"
          :name="name"
          :placeholder="defaultTranslations.placeholder"
          :type="showPassword ? 'text' : 'password'"
          :state="validated ? valid : false"
          data-test="password-input-field"
          v-bind="ariaInput"
        />
        <template #append>
          <BButton
            variant="outline-light"
            @click="toggleShowPassword"
            class="border-left-0 rounded-right"
            tabindex="-1"
          >
            {{ showPassword ? 'eye' : 'eye-slash' }}
          </BButton>
        </template>
        <BFormInvalidFeedback v-bind="ariaMsg">
          <!--          <div v-if="showAllErrors">-->
          <!--            <span v-for="error in errors" :key="error">-->
          <!--              {{ error }}-->
          <!--              <br />-->
          <!--            </span>-->
          <!--          </div>-->
          <div>
            {{ error }}
          </div>
        </BFormInvalidFeedback>
      </BInputGroup>
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
import { ref, computed, watch, defineProps, defineEmits } from 'vue'
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
  modelValue: {
    type: String,
    required: true,
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

// Use the useField hook for validation
const { value, errorMessage, valid, validated, meta } = useField(() => props.name)

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

// Computed properties for ARIA attributes and labelFor
const ariaInput = computed(() => ({
  'aria-invalid': valid ? false : 'true',
  'aria-describedby': `${props.name}-feedback`,
}))

const ariaMsg = computed(() => ({
  id: `${props.name}-feedback`,
}))

const labelFor = computed(() => `${props.name}-input-field`)
</script>
