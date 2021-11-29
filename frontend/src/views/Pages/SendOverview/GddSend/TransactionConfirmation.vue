<template>
  <div>
    <b-row>
      <b-col>
        <div class="display-4 pb-4">{{ $t('form.send_check') }}</div>
        <b-list-group class="gray-background">
          <b-input-group id="input-group-1" class="border border-default" size="lg">
            <b-input-group-prepend class="d-none d-md-block">
              <b-icon icon="envelope" class="display-4 m-3"></b-icon>
            </b-input-group-prepend>
            <b-form-input
              id="input-1"
              type="text"
              style="font-size: large"
              class="pl-3"
              :readonly="true"
              :value="email"
            ></b-form-input>
          </b-input-group>
          <br />
          <b-input-group id="input-group-2" class="border border-default" size="lg">
            <b-input-group-prepend class="p-2 d-none d-md-block">
              <div class="m-1 mt-2">GDD</div>
            </b-input-group-prepend>

            <b-form-input
              id="input-2"
              :value="$n(amount, 'decimal')"
              type="text"
              style="font-size: large"
              class="pl-3 gray-background"
              :readonly="true"
            ></b-form-input>
          </b-input-group>

          <br />

          <b-input-group id="input-group-3" class="border border-default">
            <b-input-group-prepend class="d-none d-md-block">
              <b-icon icon="chat-right-text" class="display-4 m-3 mt-4"></b-icon>
            </b-input-group-prepend>
            <b-form-textarea
              id="input-3"
              rows="3"
              :value="memo ? memo : '-'"
              class="pl-3 gray-background"
              style="font-size: large"
              :readonly="true"
            ></b-form-textarea>
          </b-input-group>
        </b-list-group>
      </b-col>
    </b-row>
    <b-row class="mt-4">
      <b-col>
        <b-button @click="$emit('on-reset')">{{ $t('form.cancel') }}</b-button>
      </b-col>
      <b-col class="text-right">
        <b-button variant="success" :disabled="loading" @click="$emit('send-transaction')">
          {{ $t('form.send_now') }}
        </b-button>
      </b-col>
    </b-row>
  </div>
</template>
<script>
export default {
  name: 'TransactionConfirmation',
  props: {
    email: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    memo: { type: String, default: '' },
    loading: { type: Boolean, default: false },
  },
}
</script>
<style>
.gray-background {
  background-color: #ebebeba3 !important;
}
</style>
