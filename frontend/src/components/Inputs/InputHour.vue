<template>
  <!--  <div class="input-hour">-->
  <!--    <validation-provider-->
  <!--      tag="div"-->
  <!--      :rules="rules"-->
  <!--      :name="name"-->
  <!--      v-slot="{ valid, validated, ariaInput }"-->
  <!--    >-->
  <!--      <b-form-group :label="label" :label-for="labelFor">-->
  <!--        <b-form-input-->
  <!--          v-model="currentValue"-->
  <!--          v-bind="ariaInput"-->
  <!--          :id="labelFor"-->
  <!--          :name="name"-->
  <!--          :placeholder="placeholder"-->
  <!--          type="number"-->
  <!--          :state="validated ? valid : false"-->
  <!--          step="0.25"-->
  <!--          min="0"-->
  <!--          :max="validMaxTime"-->
  <!--          class="bg-248"-->
  <!--        ></b-form-input>-->
  <!--      </b-form-group>-->
  <!--    </validation-provider>-->
  <!--  </div>-->
  <div class="input-hour">
    <BFormGroup :label="label" :label-for="labelFor">
      <BFormInput
        :model-value="currentValue"
        @update:modelValue="currentValue"
        v-bind="ariaInput"
        :id="labelFor"
        :name="name"
        :placeholder="placeholder"
        type="number"
        :state="meta.valid"
        step="0.25"
        min="0"
        :max="validMaxTime"
        class="bg-248"
      />
    </BFormGroup>
  </div>
</template>
<!--<script>-->
<!--export default {-->
<!--  name: 'InputHour',-->
<!--  props: {-->
<!--    rules: {-->
<!--      type: Object,-->
<!--      default: () => {},-->
<!--    },-->
<!--    name: { type: String, required: true },-->
<!--    label: { type: String, required: true },-->
<!--    placeholder: { type: String, required: true },-->
<!--    value: { type: Number, required: true, default: 0 },-->
<!--    validMaxTime: { type: Number, required: true },-->
<!--  },-->
<!--  data() {-->
<!--    return {-->
<!--      currentValue: 0,-->
<!--    }-->
<!--  },-->
<!--  computed: {-->
<!--    labelFor() {-->
<!--      return this.name + '-input-field'-->
<!--    },-->
<!--  },-->
<!--  watch: {-->
<!--    currentValue() {-->
<!--      this.$emit('input', Number(this.currentValue))-->
<!--    },-->
<!--    value() {-->
<!--      if (this.value !== this.currentValue) this.currentValue = this.value-->
<!--      this.$emit('updateAmount', this.currentValue)-->
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
    type: Number,
    required: true,
    default: 0,
  },
  validMaxTime: {
    type: Number,
    required: true,
  },
})

// Emits
const emit = defineEmits(['update:modelValue', 'updateAmount'])

// Use vee-validate's useField
const { value: currentValue, meta } = useField(props.name, props.rules, {
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
      emit('updateAmount', newValue)
    }
  },
)

// Watch for internal value changes
watch(currentValue, (newValue) => {
  emit('update:modelValue', Number(newValue))
  emit('updateAmount', Number(newValue))
})
</script>
