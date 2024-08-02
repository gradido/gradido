<template>
  <!--  <validation-provider-->
  <!--    tag="div"-->
  <!--    :rules="rules"-->
  <!--    :name="name"-->
  <!--    v-slot="{ errors, valid, validated, ariaInput, ariaMsg }"-->
  <!--  >-->
  <!--    <b-form-group :label="label" :label-for="labelFor" data-test="input-textarea">-->
  <!--      <b-form-textarea-->
  <!--        v-model="currentValue"-->
  <!--        v-bind="ariaInput"-->
  <!--        :id="labelFor"-->
  <!--        class="bg-248"-->
  <!--        :name="name"-->
  <!--        :placeholder="placeholder"-->
  <!--        :state="validated ? valid : false"-->
  <!--        trim-->
  <!--        rows="4"-->
  <!--        max-rows="4"-->
  <!--        :disabled="disabled"-->
  <!--        no-resize-->
  <!--      ></b-form-textarea>-->
  <!--      <b-form-invalid-feedback v-bind="ariaMsg">-->
  <!--        {{ errors[0] }}-->
  <!--      </b-form-invalid-feedback>-->
  <!--    </b-form-group>-->
  <!--  </validation-provider>-->
  <div>
    <BFormGroup :label="label" :label-for="labelFor" data-test="input-textarea">
      <BFormTextarea
        :model-value="currentValue"
        @update:modelValue="currentValue = $event"
        v-bind="ariaInput"
        :id="labelFor"
        class="bg-248"
        :name="name"
        :placeholder="placeholder"
        :state="meta.valid"
        trim
        rows="4"
        max-rows="4"
        :disabled="disabled"
        no-resize
      ></BFormTextarea>
      <BFormInvalidFeedback v-bind="ariaMsg">
        {{ errorMessage }}
      </BFormInvalidFeedback>
    </BFormGroup>
  </div>
</template>
<!--<script>-->
<!--export default {-->
<!--  name: 'InputTextarea',-->
<!--  props: {-->
<!--    rules: {-->
<!--      type: Object,-->
<!--      default: () => {},-->
<!--    },-->
<!--    name: { type: String, required: true },-->
<!--    label: { type: String, required: true },-->
<!--    placeholder: { type: String, required: true },-->
<!--    value: { type: String, required: true },-->
<!--    disabled: { required: false, type: Boolean, default: false },-->
<!--  },-->
<!--  data() {-->
<!--    return {-->
<!--      currentValue: this.value,-->
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
<!--    value() {-->
<!--      if (this.value !== this.currentValue) this.currentValue = this.value-->
<!--    },-->
<!--  },-->
<!--}-->
<!--</script>-->

<script setup>
import { ref, computed, watch } from 'vue'
import { useField } from 'vee-validate'

// Props
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
  modelValue: {
    type: String,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

// Emits
const emit = defineEmits(['update:modelValue'])

// Use vee-validate's useField
const { value: currentValue, errorMessage, meta } = useField(props.name, props.rules, {
  initialValue: props.modelValue,
})

// Computed
const labelFor = computed(() => `${props.name}-input-field`)

// Watch for external value changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== currentValue.value) {
      currentValue.value = newValue
    }
  },
)

// Watch for internal value changes
watch(currentValue, (newValue) => {
  emit('update:modelValue', newValue)
})
</script>
