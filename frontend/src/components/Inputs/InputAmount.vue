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
  amountFocused.value = false
  value.value = inputValue.replace(',', '.')
}
</script>
