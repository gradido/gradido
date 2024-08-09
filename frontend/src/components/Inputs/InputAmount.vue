<template>
  <div class="input-amount">
    <template v-if="typ === 'TransactionForm'">
      <BFormGroup :label="label" :label-for="labelFor" data-test="input-amount">
        <BFormInput
          :id="labelFor"
          v-focus="amountFocused"
          :model-value="value"
          :class="$route.path === '/send' ? 'bg-248' : ''"
          :name="name"
          :placeholder="placeholder"
          type="text"
          :state="meta.valid"
          trim
          :disabled="disabled"
          autocomplete="off"
          @update:model-value="normalizeAmount($event)"
          @focus="amountFocused = true"
          @blur="normalizeAmount($event)"
        />
        <BFormInvalidFeedback v-if="errorMessage">
          {{ errorMessage }}
        </BFormInvalidFeedback>
      </BFormGroup>
    </template>
    <BInputGroup v-else append="GDD" :label="label" :label-for="labelFor">
      <BFormInput
        :id="labelFor"
        v-focus="amountFocused"
        :model-value="value"
        :name="name"
        :placeholder="placeholder"
        type="text"
        readonly
        trim
      />
    </BInputGroup>
  </div>
</template>
<!--<script>-->

<!--export default {-->
<!--  name: 'InputAmount',-->
<!--  props: {-->
<!--    rules: {-->
<!--      type: Object,-->
<!--      default: () => {},-->
<!--    },-->
<!--    typ: { type: String, default: 'TransactionForm' },-->
<!--    name: { type: String, required: true, default: 'Amount' },-->
<!--    label: { type: String, required: true, default: 'Amount' },-->
<!--    placeholder: { type: String, required: true, default: 'Amount' },-->
<!--    value: { type: String, required: true },-->
<!--    balance: { type: Number, default: 0.0 },-->
<!--    disabled: { required: false, type: Boolean, default: false },-->
<!--  },-->
<!--  data() {-->
<!--    return {-->
<!--      currentValue: this.value,-->
<!--      amountValue: 0.0,-->
<!--      amountFocused: false,-->
<!--    }-->
<!--  },-->
<!--  computed: {-->
<!--    errorMessages() {-->
<!--      return errorMessages-->
<!--    },-->
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
<!--  methods: {-->
<!--    normalizeAmount(isValid) {-->
<!--      this.amountFocused = false-->
<!--      if (!isValid) return-->
<!--      this.amountValue = this.currentValue.replace(',', '.')-->
<!--      this.currentValue = this.$n(this.amountValue, 'ungroupedDecimal')-->
<!--    },-->
<!--  },-->
<!--  mounted() {-->
<!--    if (this.value !== '') this.normalizeAmount(true)-->
<!--  },-->
<!--}-->
<!--</script>-->
<script setup>
import { ref, computed, watch } from 'vue'
import { useField } from 'vee-validate'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  rules: {
    type: Object,
    default: () => ({}),
  },
  typ: { type: String, default: 'TransactionForm' },
  name: { type: String, required: true, default: 'Amount' },
  label: { type: String, required: true, default: 'Amount' },
  placeholder: { type: String, required: true, default: 'Amount' },
  balance: { type: Number, default: 0.0 },
  disabled: { required: false, type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const route = useRoute()

const { n } = useI18n()

const { value, meta, errorMessage } = useField(props.name, props.rules)

const amountFocused = ref(false)
const amountValue = ref(0.0)

const labelFor = computed(() => props.name + '-input-field')

watch(value, (newValue) => {
  emit('update:modelValue', newValue)
})

watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== value.value) value.value = newValue
  },
)

const normalizeAmount = (inputValue) => {
  const oldValue = value.value
  const amountPattern = /^\d+([,.]\d{1,2})?$/
  amountFocused.value = false
  // if (!meta.valid) return
  // if (!amountPattern.test(inputValue)) {
  //   value.value = oldValue
  // } else {
  value.value = inputValue.replace(',', '.')
  // }
}
</script>
