<template>
  <div class="input-amount">
    <validation-provider
      v-if="typ === 'TransactionsForm'"
      tag="div"
      :rules="rules"
      :name="name"
      v-slot="{ errors, valid, validated, ariaInput, ariaMsg }"
    >
      <b-form-group :label="label" :label-for="labelFor">
        <b-form-input
          v-model="currentValue"
          v-bind="ariaInput"
          :id="labelFor"
          :name="name"
          :placeholder="placeholder"
          type="text"
          :state="validated ? valid : false"
          trim
          v-focus="amountFocused"
          @focus="amountFocused = true"
          @blur="normalizeAmount(valid)"
        ></b-form-input>

        <b-form-invalid-feedback v-bind="ariaMsg">
          {{ errors[0] }}
        </b-form-invalid-feedback>
      </b-form-group>
    </validation-provider>
    <b-input-group v-else append="GDD" :label="label" :label-for="labelFor">
      <b-form-input
        v-model="currentValue"
        :id="labelFor"
        :name="name"
        :placeholder="placeholder"
        type="text"
        readonly
        trim
      ></b-form-input>
    </b-input-group>
  </div>
</template>
<script>
export default {
  name: 'InputAmount',
  props: {
    rules: {
      type: Object,
      default: () => {},
    },
    typ: { type: String, default: 'TransactionForm' },
    name: { type: String, required: true, default: 'Amount' },
    label: { type: String, required: true, default: 'Amount' },
    placeholder: { type: String, required: true, default: 'Amount' },
    value: { type: String, required: true },
    balance: { type: Number, default: 0.0 },
  },
  data() {
    return {
      currentValue: '',
      amountValue: 0.0,
      amountFocused: false,
    }
  },
  computed: {
    labelFor() {
      return this.name + '-input-field'
    },
  },
  watch: {
    currentValue() {
      this.$emit('input', this.currentValue)
    },
    value() {
      if (this.value !== this.currentValue) this.currentValue = this.value
    },
  },
  methods: {
    normalizeAmount(isValid) {
      // console.log('inputAmount normalize')
      this.amountFocused = false
      if (!isValid) return
      this.amountValue = this.currentValue.replace(',', '.')
      if (this.typ === 'TransactionForm') {
        this.currentValue = this.$n(this.amountValue, 'ungroupedDecimal')
      }
      if (this.typ === 'ContributionForm') {
        this.currentValue = this.amountValue.toFixed()
      }
    },
  },
}
</script>
