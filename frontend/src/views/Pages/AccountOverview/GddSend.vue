<template>
  <div class="gdd-send">
    <transaction-form
      v-if="showTransactionList"
      :balance="balance"
      @set-transaction="setTransaction"
    ></transaction-form>
    <b-row v-show="row_check">
      <b-col>
        <div class="display-4 p-4">{{ $t('form.send_check') }}</div>

        <b-list-group>
          <b-list-group-item class="d-flex justify-content-between align-items-center">
            {{ ajaxCreateData.email }}
            <b-badge variant="primary" pill>{{ $t('form.receiver') }}</b-badge>
          </b-list-group-item>

          <b-list-group-item class="d-flex justify-content-between align-items-center">
            {{ ajaxCreateData.amount }} GDD
            <b-badge variant="primary" pill>{{ $t('form.amount') }}</b-badge>
          </b-list-group-item>

          <b-list-group-item class="d-flex justify-content-between align-items-center">
            {{ ajaxCreateData.memo ? ajaxCreateData.memo : '-' }}
            <b-badge variant="primary" pill>{{ $t('form.message') }}</b-badge>
          </b-list-group-item>
          <b-list-group-item class="d-flex justify-content-between align-items-center">
            {{ $moment(ajaxCreateData.target_date).format('DD.MM.YYYY - HH:mm:ss') }}
            <b-badge variant="primary" pill>{{ $t('form.date') }}</b-badge>
          </b-list-group-item>
        </b-list-group>
        <hr />
        <b-row>
          <b-col>
            <b-button @click="onReset">{{ $t('form.cancel') }}</b-button>
          </b-col>
          <b-col class="text-right">
            <b-button variant="success" @click="sendTransaction">
              {{ $t('form.send_now') }}
            </b-button>
          </b-col>
        </b-row>
      </b-col>
    </b-row>
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
import communityAPI from '../../../apis/communityAPI.js'

export default {
  name: 'GddSend',
  components: {
    // QrcodeDropZone,
    TransactionForm,
    //    QrCode,
  },
  props: {
    balance: { type: Number, default: 0 },
    showTransactionList: { type: Boolean, default: true },
  },
  data() {
    return {
      ajaxCreateData: {
        email: '',
        amount: 0,
        target_date: '',
        memo: '',
        auto_sign: true,
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
        this.ajaxCreateData.email,
        this.ajaxCreateData.amount,
        this.ajaxCreateData.memo,
        this.ajaxCreateData.target_date,
      )
      if (result.success) {
        this.$emit('toggle-show-list', false)
        this.row_check = false
        this.row_thx = true
        this.row_error = false
        this.$emit('update-balance', { ammount: this.ajaxCreateData.amount })
      } else {
        this.$emit('toggle-show-list', true)
        this.row_check = false
        this.row_thx = false
        this.row_error = true
      }
    },
    onReset(event) {
      event.preventDefault()
      this.$emit('toggle-show-list', true)
      this.row_check = false
      this.row_thx = false
      this.row_error = false
    },
    setTransaction(data) {
      this.ajaxCreateData.email = data.email
      this.ajaxCreateData.amount = data.amount
      this.ajaxCreateData.memo = data.memo
      this.ajaxCreateData.target_date = new Date(Date.now()).toISOString()
      this.onSubmit()
    },
  },
}
</script>
<style>
span.errors {
  color: red;
}
</style>
