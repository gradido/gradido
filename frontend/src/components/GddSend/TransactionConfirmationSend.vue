<template>
  <div class="transaction-confirm-send">
    <div class="bg-white appBoxShadow gradido-border-radius p-3">
      <div class="h3 mb-4">{{ $t('form.send_check') }}</div>
      <b-row class="mt-5">
        <b-col cols="2">
          <b-avatar :text="avatarText" variant="success" size="3em"></b-avatar>
        </b-col>
        <b-col>
          <div class="h4">
            {{ email }}
          </div>
          <div class="mt-3 h5">{{ $t('form.memo') }}</div>
          <div>{{ memo }}</div>
        </b-col>
        <b-col cols="3">
          <div class="small">{{ $t('send_gdd') }}</div>
          <div>{{ amount | GDD }}</div>
        </b-col>
      </b-row>

      <b-row class="mt-5 pr-3 text-color-gdd-yellow h3">
        <b-col cols="2" class="text-right">
          <b-icon class="text-color-gdd-yellow" icon="droplet-half"></b-icon>
        </b-col>
        <b-col>{{ $t('advanced-calculation') }}</b-col>
      </b-row>
      <b-row class="pr-3" offset="2">
        <b-col offset="2">{{ $t('form.current_balance') }}</b-col>
        <b-col>{{ balance | GDD }}</b-col>
      </b-row>
      <b-row class="pr-3">
        <b-col offset="2">
          <strong>{{ $t('form.your_amount') }}</strong>
        </b-col>
        <b-col class="borderbottom">
          <strong>{{ (amount * -1) | GDD }}</strong>
        </b-col>
      </b-row>
      <b-row class="pr-3">
        <b-col offset="2">{{ $t('form.new_balance') }}</b-col>
        <b-col>{{ (balance - amount) | GDD }}</b-col>
      </b-row>
      <b-row class="mt-5 p-5">
        <b-col>
          <b-button @click="$emit('on-reset')">{{ $t('back') }}</b-button>
        </b-col>
        <b-col class="text-right">
          <b-button
            variant="gradido"
            :disabled="disabled"
            @click="$emit('send-transaction'), (disabled = true)"
          >
            {{ $t('form.send_now') }}
          </b-button>
        </b-col>
      </b-row>
    </div>

    <!-- <b-row class="confirm-box-send">
      <b-col>
        <div class="display-4 pb-4">{{ $t('form.send_check') }}</div>
        <b-list-group class="">
          <label class="input-1" for="input-1">{{ $t('form.recipient') }}</label>
          <b-input-group id="input-group-1" class="borderbottom" size="lg">
            <b-input-group-prepend class="d-none d-md-block gray-background">
              <b-icon icon="envelope" class="display-4 m-3"></b-icon>
            </b-input-group-prepend>
            <div class="p-3">{{ email }}</div>
          </b-input-group>
          <br />
          <label class="input-2" for="input-2">{{ $t('form.amount') }}</label>
          <b-input-group id="input-group-2" class="borderbottom" size="lg">
            <b-input-group-prepend class="p-2 d-none d-md-block gray-background">
              <div class="m-1 mt-2">{{ $t('GDD') }}</div>
            </b-input-group-prepend>

            <div class="p-3">{{ amount | GDD }}</div>
          </b-input-group>

          <br />
          <label class="input-3" for="input-3">{{ $t('form.message') }}</label>
          <b-input-group id="input-group-3" class="borderbottom">
            <b-input-group-prepend class="d-none d-md-block gray-background">
              <b-icon icon="chat-right-text" class="display-4 m-3 mt-4"></b-icon>
            </b-input-group-prepend>
            <div class="p-3">{{ memo ? memo : $t('em-dash') }}</div>
          </b-input-group>
        </b-list-group>
      </b-col>
    </b-row> -->

    <!-- <b-container class="bv-example-row mt-5 mb-5">
      <div class="alert-heading text-left h3">{{ $t('advanced-calculation') }}</div>
      <b-row class="pr-3">
        <b-col class="text-right">{{ $t('form.current_balance') }}</b-col>
        <b-col class="text-right">{{ balance | GDD }}</b-col>
      </b-row>
      <b-row class="pr-3">
        <b-col class="text-right">
          <strong>{{ $t('form.your_amount') }}</strong>
        </b-col>
        <b-col class="text-right borderbottom">
          <strong>{{ (amount * -1) | GDD }}</strong>
        </b-col>
      </b-row>
      <b-row class="pr-3">
        <b-col class="text-right">{{ $t('form.new_balance') }}</b-col>
        <b-col class="text-right">{{ (balance - amount) | GDD }}</b-col>
      </b-row>
    </b-container> -->
  </div>
</template>
<script>
export default {
  name: 'TransactionConfirmationSend',
  props: {
    balance: { type: Number, required: true },
    email: { type: String, required: false, default: '' },
    amount: { type: Number, required: true },
    memo: { type: String, required: true },
  },
  data() {
    return {
      disabled: false,
    }
  },
}
</script>
<style>
.gray-background {
  background-color: #ecebe6a3 !important;
}
.borderbottom {
  border-bottom: 1px solid rgb(70, 65, 65);
  border-bottom-style: double;
}
</style>
