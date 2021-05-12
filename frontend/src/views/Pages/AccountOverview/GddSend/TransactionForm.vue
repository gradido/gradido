<template>
  <b-row>
    <b-col xl="12" md="12">
      <b-alert show dismissible variant="default" class="text-center">
        <span class="alert-text h3 text-light" v-html="$t('form.attention')"></span>
      </b-alert>
      <b-card class="p-0 p-md-3" style="background-color: #ebebeba3 !important">
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
                <b-row>
                  <b-col class="text-left p-3 p-sm-1">{{ $t('form.receiver') }}</b-col>
                  <b-col v-if="errors" class="text-right p-3 p-sm-1">
                    <span v-for="error in errors" :key="error" class="errors">{{ error }}</span>
                  </b-col>
                </b-row>
                <b-input-group
                  id="input-group-1"
                  label="Empfänger:"
                  label-for="input-1"
                  description="We'll never share your email with anyone else."
                  size="lg"
                  class="mb-3"
                >
                  <b-input-group-prepend class="p-3 d-none d-md-block">
                    <b-icon icon="envelope" class="display-3"></b-icon>
                  </b-input-group-prepend>
                  <b-form-input
                    id="input-1"
                    v-model="form.email"
                    type="email"
                    placeholder="E-Mail"
                    style="font-size: xx-large; padding-left: 20px"
                  ></b-form-input>
                </b-input-group>
              </validation-provider>
            </div>
            <br />
            <div>
              <validation-provider
                :name="$t('form.amount')"
                :rules="{
                  required: true,
                  double: [2, $i18n.locale === 'de' ? ',' : '.'],
                  between: [0.01, balance],
                }"
                v-slot="{ errors }"
              >
                <b-row>
                  <b-col class="text-left p-3 p-sm-1">{{ $t('form.amount') }}</b-col>
                  <b-col v-if="errors" class="text-right p-3 p-sm-1">
                    <span v-for="error in errors" class="errors" :key="error">{{ error }}</span>
                  </b-col>
                </b-row>
                <b-input-group
                  id="input-group-2"
                  label="Betrag:"
                  label-for="input-2"
                  size="lg"
                  class="mb-3"
                >
                  <b-input-group-prepend class="p-2 d-none d-md-block">
                    <div class="h3 pt-3 pr-3">GDD</div>
                  </b-input-group-prepend>
                  <b-form-input
                    id="input-2"
                    v-model="form.amount"
                    type="number"
                    :lang="$i18n.locale"
                    :placeholder="$n(0.01)"
                    step="0.01"
                    style="font-size: xx-large; padding-left: 20px"
                  ></b-form-input>
                </b-input-group>
                <b-col class="text-left p-3 p-sm-1">{{ $t('form.memo') }}</b-col>
                <b-input-group id="input-group-3">
                  <b-input-group-prepend class="p-3 d-none d-md-block">
                    <b-icon icon="chat-right-text" class="display-3"></b-icon>
                  </b-input-group-prepend>
                  <b-form-textarea
                    rows="3"
                    v-model="form.memo"
                    class="pl-3"
                    style="font-size: x-large"
                  ></b-form-textarea>
                </b-input-group>
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
import { BIcon } from 'bootstrap-vue'

export default {
  name: 'TransactionForm',
  components: {
    BIcon,
    //    QrCode,
  },
  props: {
    balance: { type: Number, default: 0 },
  },
  data() {
    return {
      form: {
        email: '',
        amount: '',
        memo: '',
      },
    }
  },
  methods: {
    onSubmit() {
      this.$emit('set-transaction', {
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
    setTransaction(data) {
      this.form.email = data.email
      this.form.amount = data.amount
    },
  },
}
</script>
<style>
span.errors {
  color: red;
}
</style>
