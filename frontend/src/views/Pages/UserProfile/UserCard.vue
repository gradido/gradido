<template>
  <b-card class="bg-transparent border-0">
    <div class="w-100 text-center">
      <vue-qrcode
        v-if="$store.state.email"
        :value="$store.state.email"
        type="image/png"
      ></vue-qrcode>
    </div>

    <div class="card-profile-stats d-flex justify-content-center mt-md-5">
      <div>
        <span class="heading">
          {{ $n(balance, 'decimal') }}
        </span>
        <span class="description">GDD</span>
      </div>
      <div>
        <span class="heading">{{ transactionCount }}</span>
        <span class="description">{{ $t('transactions') }}</span>
      </div>
      <div>
        <span class="heading">--</span>
        <span class="description">{{ $t('community') }}</span>
      </div>
    </div>
  </b-card>
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
