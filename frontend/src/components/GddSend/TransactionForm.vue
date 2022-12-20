<template>
  <b-row class="transaction-form">
    <b-col xl="12" md="12" class="p-0">
      <b-card class="p-0 m-0 appBoxShadow gradido-border-radius">
        <validation-observer v-slot="{ handleSubmit }" ref="formValidator">
          <b-form role="form" @submit.prevent="handleSubmit(onSubmit)" @reset="onReset">
            <b-form-radio-group v-model="radioSelected">
              <b-row class="mb-4">
                <b-col>
                  <b-row class="bg-f5 gradido-border-radius pt-2">
                    <b-col cols="10" @click="radioSelected = sendTypes.send" class="pointer">
                      {{ $t('send_gdd') }}
                    </b-col>
                    <b-col cols="2">
                      <b-form-radio
                        name="shipping"
                        size="lg"
                        :value="sendTypes.send"
                        stacked
                        class="custom-radio-button"
                      ></b-form-radio>
                    </b-col>
                  </b-row>
                </b-col>
                <b-col>
                  <b-row class="bg-f5 gradido-border-radius pt-2">
                    <b-col cols="10" @click="radioSelected = sendTypes.link" class="pointer">
                      {{ $t('send_per_link') }}
                    </b-col>
                    <b-col cols="2">
                      <b-form-radio
                        name="shipping"
                        :value="sendTypes.link"
                        size="lg"
                        class="custom-radio-button"
                      ></b-form-radio>
                    </b-col>
                  </b-row>
                </b-col>
              </b-row>

              <div class="mt-4 mb-4" v-if="radioSelected === sendTypes.link">
                <h2 class="alert-heading">{{ $t('gdd_per_link.header') }}</h2>
                <div>
                  {{ $t('gdd_per_link.choose-amount') }}
                </div>
              </div>
            </b-form-radio-group>
            <b-row>
              <b-col>
                <b-row>
                  <b-col cols="12">
                    <div v-if="radioSelected === sendTypes.send">
                      <input-email
                        :name="$t('form.recipient')"
                        :label="$t('form.recipient')"
                        :placeholder="$t('form.email')"
                        v-model="form.email"
                      />
                    </div>
                  </b-col>
                  <b-col cols="6">
                    <input-amount
                      v-model="form.amount"
                      :name="$t('form.amount')"
                      :label="$t('form.amount')"
                      :placeholder="'0.01'"
                      :rules="{ required: true, gddSendAmount: [0.01, balance] }"
                      typ="TransactionForm"
                    ></input-amount>
                  </b-col>
                </b-row>
              </b-col>
            </b-row>

            <b-row>
              <b-col>
                <input-textarea
                  v-model="form.memo"
                  :name="$t('form.message')"
                  :label="$t('form.message')"
                  :placeholder="$t('form.message')"
                  :rules="{ required: true, min: 5, max: 255 }"
                />
              </b-col>
            </b-row>
            <div v-if="!!isBalanceDisabled" class="text-danger mt-5">
              {{ $t('form.no_gdd_available') }}
            </div>
            <b-row v-else class="test-buttons mt-5">
              <b-col>
                <b-button type="reset" variant="secondary" @click="onReset">
                  {{ $t('form.cancel') }}
                </b-button>
              </b-col>
              <b-col class="text-right">
                <b-button type="submit" variant="primary">
                  {{ $t('form.check_now') }}
                </b-button>
              </b-col>
            </b-row>
          </b-form>
        </validation-observer>
      </b-card>
    </b-col>
  </b-row>
</template>
<script>
// import { BIcon } from 'bootstrap-vue'
import { SEND_TYPES } from '@/pages/Send.vue'
import InputEmail from '@/components/Inputs/InputEmail.vue'
import InputAmount from '@/components/Inputs/InputAmount.vue'
import InputTextarea from '@/components/Inputs/InputTextarea.vue'

export default {
  name: 'TransactionForm',
  components: {
    // BIcon,
    InputEmail,
    InputAmount,
    InputTextarea,
  },
  props: {
    balance: { type: Number, default: 0 },
    email: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    memo: { type: String, default: '' },
    selected: { type: String, default: 'send' },
  },
  inject: ['getTunneledEmail'],
  data() {
    return {
      amountFocused: false,
      emailFocused: false,
      form: {
        email: this.email,
        amount: this.amount ? String(this.amount) : '',
        memo: this.memo,
        amountValue: 0.0,
      },
      radioSelected: this.selected,
    }
  },
  methods: {
    onSubmit() {
      this.normalizeAmount(true)
      this.$emit('set-transaction', {
        selected: this.radioSelected,
        email: this.form.email,
        amount: this.form.amountValue,
        memo: this.form.memo,
      })
    },
    onReset(event) {
      event.preventDefault()
      this.form.email = ''
      this.form.amount = ''
      this.form.memo = ''
    },
    normalizeAmount(isValid) {
      this.amountFocused = false
      if (!isValid) return
      this.form.amountValue = Number(this.form.amount.replace(',', '.'))
      this.form.amount = this.$n(this.form.amountValue, 'ungroupedDecimal')
    },
    normalizeEmail() {
      this.emailFocused = false
      this.form.email = this.form.email.trim()
    },
    setNewRecipientEmail() {
      this.form.email = this.recipientEmail ? this.recipientEmail : this.form.email
    },
  },
  watch: {
    recipientEmail() {
      this.setNewRecipientEmail()
    },
  },
  computed: {
    isBalanceDisabled() {
      return this.balance <= 0 ? 'disabled' : false
    },
    sendTypes() {
      return SEND_TYPES
    },
    recipientEmail() {
      return this.getTunneledEmail()
    },
  },
  created() {
    this.setNewRecipientEmail()
  },
}
</script>
<style>
span.errors {
  color: red;
}
#input-1:focus,
#input-2:focus,
#input-3:focus {
  font-weight: bold;
}
.border-radius {
  border-radius: 10px;
}

label {
  display: block;
  margin-bottom: 10px;
}

.custom-control-input:checked ~ .custom-control-label::before {
  color: #678000;
  border-color: #678000;
  background-color: #f1f2ec;
}

.custom-radio .custom-control-input:checked ~ .custom-control-label::after {
  content: '\2714';
  margin-left: 5px;
  color: #678000;
}
</style>
