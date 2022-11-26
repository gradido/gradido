<template>
  <b-row class="transaction-form">
    <b-col xl="12" md="12" class="p-0">
      <b-card class="p-0 m-0 appBoxShadow gradido-border-radius">
        <validation-observer v-slot="{ handleSubmit }" ref="formValidator">
          <b-form role="form" @submit.prevent="handleSubmit(onSubmit)" @reset="onReset">
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
                      <!-- <validation-provider
                        name="Email"
                        :rules="{
                          required: radioSelected === sendTypes.send ? true : false,
                          email: true,
                          is_not: $store.state.email,
                        }"
                        v-slot="{ errors }"
                      >
                        <label class="input-1 mt-4" for="input-1">{{ $t('form.recipient') }}</label>
                        <b-input-group
                          id="input-group-1"
                          class="border border-default border-radius"
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
                            class="pl-3 gradido-font-large"
                            :disabled="isBalanceDisabled"
                          ></b-form-input>
                        </b-input-group>
                        <b-col v-if="errors">
                          <span v-for="error in errors" :key="error" class="errors">
                            {{ error }}
                          </span>
                        </b-col>
                      </validation-provider> -->
                    </div>
                  </b-col>
                  <b-col cols="12">
                    <input-amount
                      v-model="form.amount"
                      :name="$t('form.amount')"
                      :label="$t('form.amount')"
                      :placeholder="'0.01'"
                      :rules="{ required: true, gddSendAmount: [0.01, balance] }"
                      typ="TransactionForm"
                    ></input-amount>

                    <!-- <validation-provider
                      :name="$t('form.amount')"
                      :rules="{
                        required: true,
                        gddSendAmount: [0.01, balance],
                      }"
                      v-slot="{ errors, valid }"
                    >
                      <label class="input-2" for="input-2">{{ $t('form.amount') }}</label>
                      <b-input-group
                        id="input-group-2"
                        class="border border-default border-radius"
                        size="lg"
                      >
                        <b-input-group-prepend class="p-2 d-none d-md-block">
                          <div class="m-1 mt-2">{{ $t('GDD') }}</div>
                        </b-input-group-prepend>

                        <b-form-input
                          id="input-2"
                          v-model="form.amount"
                          type="text"
                          v-focus="amountFocused"
                          @focus="amountFocused = true"
                          @blur="normalizeAmount(valid)"
                          :placeholder="$n(0.01)"
                          class="pl-3 gradido-font-large"
                          :disabled="isBalanceDisabled"
                        ></b-form-input>
                      </b-input-group>
                      <b-col v-if="errors">
                        <span v-for="error in errors" class="errors" :key="error">{{ error }}</span>
                      </b-col>
                    </validation-provider> -->
                  </b-col>
                </b-row>
              </b-col>
              <b-col>
                <div class="h3">{{ $t('sendMethod') }}</div>
                <b-form-radio-group v-model="radioSelected">
                  <b-row>
                    <b-col cols="9">{{ $t('send_gdd') }}</b-col>
                    <b-col cols="3">
                      <b-form-radio
                        name="shipping"
                        size="lg"
                        :value="sendTypes.send"
                        stacked
                      ></b-form-radio>
                    </b-col>
                  </b-row>
                  <b-row>
                    <b-col cols="9">{{ $t('send_per_link') }}</b-col>
                    <b-col cols="3">
                      <b-form-radio
                        name="shipping"
                        :value="sendTypes.link"
                        size="lg"
                      ></b-form-radio>
                    </b-col>
                  </b-row>
                  <div class="mt-4" v-if="radioSelected === sendTypes.link">
                    <h2 class="alert-heading">{{ $t('gdd_per_link.header') }}</h2>
                    <div>
                      {{ $t('gdd_per_link.choose-amount') }}
                    </div>
                  </div>
                </b-form-radio-group>
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
                <!-- <validation-provider
                  :rules="{
                    required: true,
                    min: 5,
                    max: 255,
                  }"
                  :name="$t('form.message')"
                  v-slot="{ errors }"
                >
                  <label class="input-3" for="input-3">{{ $t('form.message') }}</label>
                  <b-input-group id="input-group-3" class="border border-default border-radius">
                    <b-input-group-prepend class="d-none d-md-block">
                      <b-icon icon="chat-right-text" class="display-4 m-3 mt-4"></b-icon>
                    </b-input-group-prepend>
                    <b-form-textarea
                      id="input-3"
                      rows="3"
                      v-model="form.memo"
                      class="pl-3 gradido-font-large"
                      :disabled="isBalanceDisabled"
                    ></b-form-textarea>
                  </b-input-group>
                  <b-col v-if="errors">
                    <span v-for="error in errors" class="errors" :key="error">{{ error }}</span>
                  </b-col>
                </validation-provider> -->
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
</style>
