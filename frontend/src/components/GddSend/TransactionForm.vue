<template>
  <b-row class="transaction-form">
    <b-col xl="12" md="12" class="p-0">
      <b-card class="p-0 m-0 gradido-custom-background">
        <validation-observer v-slot="{ handleSubmit }" ref="formValidator">
          <b-form role="form" @submit.prevent="handleSubmit(onSubmit)" @reset="onReset">
            <b-row>
              <b-col>
                <b-form-radio
                  v-model="radioSelected"
                  name="radios"
                  :value="sendTypes.send"
                  size="lg"
                >
                  {{ $t('send_gdd') }}
                </b-form-radio>
              </b-col>
              <b-col>
                <b-form-radio
                  v-model="radioSelected"
                  name="radios"
                  :value="sendTypes.link"
                  size="lg"
                >
                  {{ $t('send_per_link') }}
                </b-form-radio>
              </b-col>
            </b-row>
            <div class="mt-4" v-if="radioSelected === sendTypes.link">
              <h2 class="alert-heading">{{ $t('gdd_per_link.header') }}</h2>
              <div>
                {{ $t('gdd_per_link.choose-amount') }}
              </div>
            </div>

            <div v-if="radioSelected === sendTypes.send" class="mt-5">
              <input-email
                :name="$t('form.recipient')"
                :label="$t('form.recipient')"
                :placeholder="$t('form.email')"
                v-model="form.email"
              />
            </div>

            <div class="mt-4 mb-4">
              <input-amount
                v-model="form.amount"
                :name="$t('form.amount')"
                :label="$t('form.amount')"
                :placeholder="'0.01'"
                :rules="{ required: true, gddSendAmount: [0.01, balance] }"
                typ="TransactionForm"
              ></input-amount>
            </div>

            <div class="mb-4 mb-5">
              <input-textarea
                v-model="form.memo"
                :name="$t('form.message')"
                :label="$t('form.message')"
                :placeholder="$t('form.message')"
                :rules="{ required: true, min: 5, max: 255 }"
              />
            </div>

            <div v-if="!!isBalanceDisabled" class="text-danger">
              {{ $t('form.no_gdd_available') }}
            </div>
            <b-row v-else class="test-buttons">
              <b-col>
                <b-button type="reset" variant="secondary">
                  {{ $t('form.cancel') }}
                </b-button>
              </b-col>
              <b-col class="text-right">
                <b-button type="submit" variant="primary">
                  {{ $t('form.check_now') }}
                </b-button>
              </b-col>
            </b-row>
            <br />
          </b-form>
        </validation-observer>
      </b-card>
    </b-col>
  </b-row>
</template>
<script>
import { SEND_TYPES } from '@/pages/Send.vue'
import InputEmail from '@/components/Inputs/InputEmail.vue'
import InputAmount from '@/components/Inputs/InputAmount.vue'
import InputTextarea from '@/components/Inputs/InputTextarea.vue'

export default {
  name: 'TransactionForm',
  components: {
    InputAmount,
    InputEmail,
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
      form: {
        email: this.email,
        amount: this.amount ? String(this.amount) : '',
        memo: this.memo,
      },
      radioSelected: this.selected,
    }
  },
  methods: {
    onSubmit() {
      this.$emit('set-transaction', {
        selected: this.radioSelected,
        email: this.form.email,
        amount: this.form.amount,
        memo: this.form.memo,
      })
    },
    onReset(event) {
      event.preventDefault()
      this.form.email = ''
      this.form.amount = ''
      this.form.memo = ''
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
    this.form.email = this.recipientEmail ? this.recipientEmail : this.form.email
  },
}
</script>
