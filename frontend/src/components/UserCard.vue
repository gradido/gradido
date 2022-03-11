<template>
  <div class="userdata-card">
    <b-card class="bg-transparent border-0">
      <div class="w-100 text-center">
        <vue-qrcode
          v-if="$store.state.email"
          :value="$store.state.email"
          type="image/png"
        ></vue-qrcode>
      </div>

      <b-container class="d-flex justify-content-center mt-md-5">
        <b-row>
          <b-col>
            <div class="text-center font-weight-bold">
              {{ $n(balance, 'decimal') }}
            </div>
            <div class="text-center">GDD</div>
          </b-col>
          <b-col>
            <div class="text-center font-weight-bold">
              {{ transactionCount }}
            </div>
            <div class="text-center">
              {{ $t('transactions') }}
            </div>
          </b-col>
          <b-col>
            <div class="text-center font-weight-bold">--</div>
            <div class="text-center">
              {{ $t('community.community') }}
            </div>
          </b-col>
        </b-row>
      </b-container>
    </b-card>
  </div>
</template>
<script>
import VueQrcode from 'vue-qrcode'

export default {
  name: 'UserCard',
  components: {
    VueQrcode,
  },
  props: {
    balance: { type: Number, default: 0 },
    transactionCount: { type: Number, default: 0 },
  },
}
</script>
<style></style>
