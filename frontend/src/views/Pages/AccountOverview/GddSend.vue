<template>
  <div class="gdd-send">
    <b-row v-show="showTransactionList">
      <b-col xl="12" md="12">
        <b-alert show dismissible variant="warning" class="text-center">
          <span class="alert-text" v-html="$t('form.attention')"></span>
        </b-alert>
        <b-card class="p-0 p-md-3" style="background-color: #ebebeba3 !important">
          <b-alert show variant="secondary">
            <span class="alert-text" v-html="$t('form.scann_code')"></span>
            <b-col v-show="!scan" lg="12" class="text-right">
              <a @click="toggle" class="nav-link pointer">
                <img src="img/icons/gradido/qr-scan-pure.png" height="50" />
              </a>
            </b-col>

            <div v-if="scan">
              <!-- <b-row>                                          
                   <qrcode-capture @detect="onDetect"  capture="user" ></qrcode-capture>                     
                   </b-row> -->

              <qrcode-stream class="mt-3" @decode="onDecode" @detect="onDetect"></qrcode-stream>

              <b-container>
                <b-row>
                  <b-col lg="8">
                    <b-alert show variant="secondary">
                      <span class="alert-text" v-html="$t('form.scann_code')"></span>
                    </b-alert>
                  </b-col>
                </b-row>
              </b-container>
            </div>
            <div @click="toggle">
              <b-alert v-show="scan" show variant="primary" class="pointer text-center">
                <span class="alert-text">
                  <strong>{{ $t('form.cancel') }}</strong>
                </span>
              </b-alert>
            </div>
          </b-alert>

          <validation-observer v-slot="{ handleSubmit }" ref="formValidator">
            <b-form
              role="form"
              @submit.prevent="handleSubmit(onSubmit)"
              @reset="onReset"
              v-if="show"
            >
              <br />
              <div>
                <qrcode-drop-zone id="input-0" v-model="form.img"></qrcode-drop-zone>
              </div>
              <br />
              <div>
                <b-col class="text-left p-3 p-sm-1">{{ $t('form.receiver') }}</b-col>

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
                    :rules="{ required: true, email: true }"
                    required
                    style="font-size: xx-large; padding-left: 20px"
                  ></b-form-input>
                </b-input-group>
              </div>
              <br />
              <div>
                <b-col class="text-left p-3 p-sm-1">{{ $t('form.amount') }}</b-col>
                <b-col v-if="balance == form.amount" class="text-right">
                  <b-badge variant="primary">{{ $t('form.max_gdd_info') }}</b-badge>
                </b-col>
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
                    placeholder="0.01"
                    step="0.01"
                    min="0.01"
                    :max="balance"
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
            {{ ajaxCreateData.memo }}
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
        <div class="display-1 p-4">
          {{ $t('form.thx') }}
          <hr />
          {{ $t('form.send_success') }}
        </div>

        <b-button variant="success" @click="onReset">{{ $t('form.close') }}</b-button>
        <hr />
      </b-col>
    </b-row>
  </div>
</template>

<script>
import { QrcodeStream, QrcodeDropZone } from 'vue-qrcode-reader'
import { BIcon } from 'bootstrap-vue'
import communityAPI from '../../../apis/communityAPI.js'

export default {
  name: 'GddSent',
  components: {
    QrcodeStream,
    QrcodeDropZone,
    BIcon,
  },
  props: {
    balance: { type: Number, default: 0 },
    showTransactionList: { type: Boolean, default: true },
  },
  data() {
    return {
      scan: false,
      show: true,
      form: {
        img: '',
        email: '',
        amount: '',
        memo: '',
      },
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
    }
  },
  computed: {},
  methods: {
    toggle() {
      this.scan = !this.scan
    },
    async onDecode(decodedString) {
      const arr = JSON.parse(decodedString)
      this.form.email = arr[0].email
      this.form.amount = arr[0].amount
      this.scan = false
    },
    async onSubmit() {
      //event.preventDefault()
      this.ajaxCreateData.email = this.form.email
      this.ajaxCreateData.amount = this.form.amount
      const now = new Date(Date.now()).toISOString()
      this.ajaxCreateData.target_date = now
      this.ajaxCreateData.memo = this.form.memo
      this.$emit('toggle-show-list', false)
      this.row_check = true
      this.row_thx = false
    },
    async sendTransaction() {
      const result = await communityAPI.send(
        this.$store.state.session_id,
        this.ajaxCreateData.email,
        // better to send the user's input here?
        this.ajaxCreateData.amount,
        this.ajaxCreateData.memo,
        this.ajaxCreateData.target_date,
      )
      if (result.success) {
        this.$emit('toggle-show-list', false)
        this.row_check = false
        this.row_thx = true
        this.$emit('update-balance', { ammount: this.ajaxCreateData.amount })
      } else {
        alert('error')
        this.$emit('toggle-show-list', true)
        this.row_check = false
        this.row_thx = false
      }
    },
    onReset(event) {
      event.preventDefault()
      this.form.email = ''
      this.form.amount = ''
      this.form.memo = ''
      this.show = false
      this.$emit('toggle-show-list', true)
      this.row_check = false
      this.row_thx = false
      this.$nextTick(() => {
        this.show = true
      })
    },
  },
}
</script>
<style>
.pointer {
  cursor: pointer;
}
video {
  max-height: 665px;
  max-width: 665px;
}
</style>
