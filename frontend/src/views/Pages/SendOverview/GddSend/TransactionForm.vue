<template>
  <b-row class="transaction-form">
    <b-col xl="12" md="12" class="p-0">
      <b-card class="p-0 m-0" style="background-color: #ebebeba3 !important">
        <!-- -<QrCode @set-transaction="setTransaction"></QrCode> -->
        <validation-observer v-slot="{ handleSubmit }" ref="formValidator">
          <b-form role="form" @submit.prevent="handleSubmit(onSubmit)" @reset="onReset">
            <!-- <div>
                 <qrcode-drop-zone id="input-0" v-model="form.img"></qrcode-drop-zone>
                 </div>
                 <br />
            -->

            <div>
              <validation-provider
                name="Email"
                :rules="{
                  required: true,
                  email: true,
                  is_not: $store.state.email,
                }"
                v-slot="{ errors }"
              >
                <label class="input-1" for="input-1">{{ $t('form.recipient') }}</label>
                <b-input-group
                  id="input-group-1"
                  class="border border-default"
                  description="We'll never share your email with anyone else."
                  size="lg"
                >
                  <b-input-group-prepend class="d-none d-md-block">
                    <b-icon icon="envelope" class="display-4 m-3"></b-icon>
                  </b-input-group-prepend>
                  <b-form-input
                    id="input-1"
                    v-model="form.email"
                    v-focus="emailFocused"
                    @focus="emailFocused = true"
                    @blur="normalizeEmail()"
                    type="email"
                    placeholder="E-Mail"
                    style="font-size: large"
                    class="pl-3"
                  ></b-form-input>
                </b-input-group>
                <b-col v-if="errors">
                  <span v-for="error in errors" :key="error" class="errors">{{ error }}</span>
                </b-col>
              </validation-provider>
            </div>

            <br />

            <div>
              <validation-provider
                :name="$t('form.amount')"
                :rules="{
                  required: true,
                  gddSendAmount: [0.01, balance],
                }"
                v-slot="{ errors, valid }"
              >
                <label class="input-2" for="input-2">{{ $t('form.amount') }}</label>
                <b-input-group id="input-group-2" class="border border-default" size="lg">
                  <b-input-group-prepend class="p-2 d-none d-md-block">
                    <div class="m-1 mt-2">GDD</div>
                  </b-input-group-prepend>

                  <b-form-input
                    id="input-2"
                    v-model="form.amount"
                    type="text"
                    v-focus="amountFocused"
                    @focus="amountFocused = true"
                    @blur="normalizeAmount(valid)"
                    :placeholder="$n(0.01)"
                    style="font-size: large"
                    class="pl-3"
                  ></b-form-input>
                </b-input-group>
                <b-col v-if="errors">
                  <span v-for="error in errors" class="errors" :key="error">{{ error }}</span>
                </b-col>
              </validation-provider>
            </div>

            <div class="mt-4">
              <validation-provider
                :rules="{
                  required: true,
                  min: 5,
                  max: 150,
                }"
                :name="$t('form.message')"
                v-slot="{ errors }"
              >
                <label class="input-3" for="input-3">{{ $t('form.message') }}</label>
                <b-input-group id="input-group-3" class="border border-default">
                  <b-input-group-prepend class="d-none d-md-block">
                    <b-icon icon="chat-right-text" class="display-4 m-3 mt-4"></b-icon>
                  </b-input-group-prepend>
                  <b-form-textarea
                    id="input-3"
                    rows="3"
                    v-model="form.memo"
                    class="pl-3"
                    style="font-size: large"
                  ></b-form-textarea>
                </b-input-group>
                <b-col v-if="errors">
                  <span v-for="error in errors" class="errors" :key="error">{{ error }}</span>
                </b-col>
              </validation-provider>
            </div>

            <br />
            <b-row>
              <b-col>
                <b-button type="reset" variant="secondary" @click="onReset">
                  {{ $t('form.reset') }}
                </b-button>
              </b-col>
              <b-col class="text-right">
                <b-button type="submit" variant="success">
                  {{ $t('form.send_now') }}
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
// import QrCode from './QrCode'
// import { QrcodeDropZone } from 'vue-qrcode-reader'
import { BIcon } from 'bootstrap-vue'

export default {
  name: 'TransactionForm',
  components: {
    BIcon,
    //    QrCode,
    // QrcodeDropZone,
  },
  props: {
    balance: { type: Number, default: 0 },
  },
  data() {
    return {
      amountFocused: false,
      emailFocused: false,
      form: {
        email: '',
        amount: '',
        memo: '',
        amountValue: 0.0,
      },
    }
  },
  methods: {
    onSubmit() {
      this.normalizeAmount(true)
      this.$emit('set-transaction', {
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
    /*
     setTransaction(data) {
       this.form.email = data.email
       this.form.amount = data.amount
     }, */
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
</style>
