<template>
  <div class="gdd-send">
    <transaction-form
      v-if="showTransactionList"
      :balance="balance"
      @set-transaction="setTransaction"
    ></transaction-form>
    <transaction-confirmation
      v-if="row_check"
      :email="transactionData.email"
      :amount="transactionData.amount"
      :memo="transactionData.memo"
      :date="transactionData.target_date"
      @send-transaction="sendTransaction"
      @on-reset="onReset"
    ></transaction-confirmation>
    <b-row v-show="row_thx">
      <b-col>
        <b-card class="p-0 p-md-3" style="background-color: #ebebeba3 !important">
          <div class="display-2 p-4">
            {{ $t('form.thx') }}
            <hr />
            {{ $t('form.send_transaction_success') }}
          </div>

          <p class="text-center">
            <b-button variant="success" @click="onReset">{{ $t('form.close') }}</b-button>
          </p>
        </b-card>
      </b-col>
    </b-row>
    <b-row v-show="row_error">
      <b-col>
        <b-card class="p-0 p-md-3" style="background-color: #ebebeba3 !important">
          <div class="display-2 p-4">
            {{ $t('form.sorry') }}
            <hr />
            {{ $t('form.send_transaction_error') }}
          </div>
          <p class="text-center">
            <b-button variant="success" @click="onReset">{{ $t('form.close') }}</b-button>
          </p>
        </b-card>
      </b-col>
    </b-row>
  </div>
</template>

<script>
// import { QrcodeDropZone } from 'vue-qrcode-reader'
import TransactionForm from './GddSend/TransactionForm.vue'
import TransactionConfirmation from './GddSend/TransactionConfirmation.vue'
import communityAPI from '../../../apis/communityAPI.js'

export default {
  name: 'GddSend',
  components: {
    // QrcodeDropZone,
    TransactionForm,
    TransactionConfirmation,
    //    QrCode,
  },
  props: {
    balance: { type: Number, default: 0 },
    showTransactionList: { type: Boolean, default: true },
  },
  data() {
    return {
      transactionData: {
        email: '',
        amount: 0,
        target_date: '',
        memo: '',
      },
      send: false,
      row_check: false,
      row_thx: false,
      row_error: false,
    }
  },
  methods: {
    async onSubmit() {
      this.$emit('toggle-show-list', false)
      this.row_check = true
      this.row_thx = false
      this.row_error = false
    },
    async sendTransaction() {
      const result = await communityAPI.send(
        this.$store.state.sessionId,
        this.transactionData.email,
        this.transactionData.amount,
        this.transactionData.memo,
        this.transactionData.target_date,
      )
      if (result.success) {
        this.$emit('toggle-show-list', false)
        this.row_check = false
        this.row_thx = true
        this.row_error = false
        this.$emit('update-balance', { ammount: this.transactionData.amount })
      } else {
        this.$emit('toggle-show-list', true)
        this.row_check = false
        this.row_thx = false
        this.row_error = true
      }
    },
    onReset() {
      this.$emit('toggle-show-list', true)
      this.row_check = false
      this.row_thx = false
      this.row_error = false
    },
    setTransaction(data) {
      this.transactionData.email = data.email
      this.transactionData.amount = data.amount
      this.transactionData.memo = data.memo
      this.transactionData.target_date = new Date(Date.now()).toISOString()
      this.onSubmit()
    },
  },
}
</script>
