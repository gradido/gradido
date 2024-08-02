<template>
  <div class="transaction-form">
    <BRow>
      <BCol cols="12">
        <BCard class="appBoxShadow gradido-border-radius" body-class="p-4">
          <validation-observer v-slot="{ handleSubmit }" ref="formValidator">
            <BForm role="form" @submit.prevent="handleSubmit(onSubmit)" @reset="onReset">
              <BFormRadioGroup v-model="radioSelected">
                <BRow class="mb-4">
                  <BCol cols="12" lg="6">
                    <BRow class="bg-248 gradido-border-radius pt-lg-2 mr-lg-2">
                      <BCol cols="10" @click="radioSelected = sendTypes.send" class="pointer">
                        {{ $t('send_gdd') }}
                      </BCol>
                      <BCol cols="2">
                        <b-form-radio
                          name="shipping"
                          size="lg"
                          :value="sendTypes.send"
                          stacked
                          class="custom-radio-button pointer"
                        ></b-form-radio>
                      </BCol>
                    </BRow>
                  </BCol>
                  <BCol>
                    <BRow class="bg-248 gradido-border-radius pt-lg-2 ml-lg-2 mt-2 mt-lg-0">
                      <BCol cols="10" @click="radioSelected = sendTypes.link" class="pointer">
                        {{ $t('send_per_link') }}
                      </BCol>
                      <BCol cols="2" class="pointer">
                        <BFormRadio
                          name="shipping"
                          :value="sendTypes.link"
                          size="lg"
                          class="custom-radio-button"
                        />
                      </BCol>
                    </BRow>
                  </BCol>
                </BRow>
              </BFormRadioGroup>
              <div class="mt-4 mb-4" v-if="radioSelected === sendTypes.link">
                <h2 class="alert-heading">{{ $t('gdd_per_link.header') }}</h2>
                <div>
                  {{ $t('gdd_per_link.choose-amount') }}
                </div>
              </div>
              <BRow>
                <BCol>
                  <BRow>
                    <BCol class="mb-4" cols="12" v-if="radioSelected === sendTypes.send">
                      <BRow>
                        <BCol>{{ $t('form.recipientCommunity') }}</BCol>
                      </BRow>
                      <BRow>
                        <BCol class="font-weight-bold">
                          <community-switch
                            v-model="form.targetCommunity"
                            :disabled="isBalanceDisabled"
                          />
                        </BCol>
                      </BRow>
                    </BCol>
                    <BCol cols="12" v-if="radioSelected === sendTypes.send">
                      <div v-if="!userIdentifier">
                        <input-identifier
                          :name="$t('form.recipient')"
                          :label="$t('form.recipient')"
                          :placeholder="$t('form.identifier')"
                          v-model="form.identifier"
                          :disabled="isBalanceDisabled"
                          @onValidation="onValidation"
                        />
                      </div>
                      <div v-else class="mb-4">
                        <BRow>
                          <BCol>{{ $t('form.recipient') }}</BCol>
                        </BRow>
                        <BRow>
                          <BCol class="font-weight-bold">{{ userName }}</BCol>
                        </BRow>
                      </div>
                    </BCol>
                    <BCol cols="12" lg="6">
                      <input-amount
                        v-model="form.amount"
                        :name="$t('form.amount')"
                        :label="$t('form.amount')"
                        :placeholder="'0.01'"
                        :rules="{ required: true, gddSendAmount: [0.01, balance] }"
                        typ="TransactionForm"
                        :disabled="isBalanceDisabled"
                      ></input-amount>
                    </BCol>
                  </BRow>
                </BCol>
              </BRow>

              <BRow>
                <BCol>
                  <input-textarea
                    v-model="form.memo"
                    :name="$t('form.message')"
                    :label="$t('form.message')"
                    :placeholder="$t('form.message')"
                    :rules="{ required: true, min: 5, max: 255 }"
                    :disabled="isBalanceDisabled"
                  />
                </BCol>
              </BRow>
              <div v-if="!!isBalanceDisabled" class="text-danger mt-5">
                {{ $t('form.no_gdd_available') }}
              </div>
              <BRow v-else class="test-buttons mt-3">
                <BCol cols="12" md="6" lg="6">
                  <b-button
                    block
                    type="reset"
                    variant="secondary"
                    @click="onReset"
                    class="mb-3 mb-md-0 mb-lg-0"
                  >
                    {{ $t('form.reset') }}
                  </b-button>
                </BCol>
                <BCol cols="12" md="6" lg="6" class="text-lg-right">
                  <b-button block type="submit" variant="gradido">
                    {{ $t('form.check_now') }}
                  </b-button>
                </BCol>
              </BRow>
            </BForm>
          </validation-observer>
        </BCard>
      </BCol>
    </BRow>
  </div>
</template>
<script>
import { SEND_TYPES } from '@/pages/Send'
import InputIdentifier from '@/components/Inputs/InputIdentifier'
import InputAmount from '@/components/Inputs/InputAmount'
import InputTextarea from '@/components/Inputs/InputTextarea'
import CommunitySwitch from '@/components/CommunitySwitch.vue'
import { user } from '@/graphql/queries'
import CONFIG from '@/config'

export default {
  name: 'TransactionForm',
  components: {
    InputIdentifier,
    InputAmount,
    InputTextarea,
    CommunitySwitch,
  },
  props: {
    balance: { type: Number, default: 0 },
    identifier: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    memo: { type: String, default: '' },
    selected: { type: String, default: 'send' },
    targetCommunity: {
      type: Object,
      default: function () {
        return { uuid: '', name: CONFIG.COMMUNITY_NAME }
      },
    },
  },
  data() {
    return {
      form: {
        identifier: this.identifier,
        amount: this.amount ? String(this.amount) : '',
        memo: this.memo,
        targetCommunity: this.targetCommunity,
      },
      radioSelected: this.selected,
      userName: '',
      recipientCommunity: { uuid: '', name: '' },
    }
  },
  methods: {
    onValidation() {
      this.$refs.formValidator.validate()
    },
    onSubmit() {
      if (this.userIdentifier) this.form.identifier = this.userIdentifier.identifier
      this.$emit('set-transaction', {
        selected: this.radioSelected,
        identifier: this.form.identifier,
        amount: Number(this.form.amount.replace(',', '.')),
        memo: this.form.memo,
        userName: this.userName,
        targetCommunity: this.form.targetCommunity,
      })
    },
    onReset(event) {
      event.preventDefault()
      this.form.identifier = ''
      this.form.amount = ''
      this.form.memo = ''
      this.form.targetCommunity = { uuid: '', name: COMMUNITY_NAME }
      this.$refs.formValidator.validate()
      this.$router.replace('/send')
    },
  },
  apollo: {
    UserName: {
      query() {
        return user
      },
      fetchPolicy: 'network-only',
      variables() {
        return this.userIdentifier
      },
      skip() {
        return !this.userIdentifier
      },
      update({ user }) {
        this.userName = `${user.firstName} ${user.lastName}`
      },
      error({ message }) {
        this.toastError(message)
      },
    },
  },
  computed: {
    disabled() {
      if (
        this.form.identifier.length > 5 &&
        parseInt(this.form.amount) <= parseInt(this.balance) &&
        this.form.memo.length > 5 &&
        this.form.memo.length <= 255
      ) {
        return false
      }
      return true
    },
    isBalanceDisabled() {
      return this.balance <= 0 ? 'disabled' : false
    },
    sendTypes() {
      return SEND_TYPES
    },
    userIdentifier() {
      if (
        this.$route.params &&
        this.$route.params.userIdentifier &&
        this.$route.params.communityIdentifier
      ) {
        return {
          identifier: this.$route.params.userIdentifier,
          communityIdentifier: this.$route.params.communityIdentifier,
        }
      }
      return null
    },
  },
  mounted() {
    if (this.form.identifier !== '') this.$refs.formValidator.validate()
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
