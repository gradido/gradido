<template>
  <b-card
    no-body
    class="card-profile"
    alt="Image placeholder"
    img-top
    style="background-color: #ebebeba3 !important"
  >
    <b-row class="justify-content-center">
      <b-col lg="3" class="order-lg-2">
        <div class="card-profile-image">
          <a href="#">
            <vue-qrcode :value="$store.state.email" type="image/png"></vue-qrcode>
          </a>
        </div>
      </b-col>
    </b-row>

    <b-card-header class="text-center border-0 pt-8 pt-md-4 pb-0 pb-md-4">
      <div class="d-flex justify-content-between">
        <br />
      </div>
    </b-card-header>

    <b-card-body class="pt-0">
      <b-row>
        <b-col>
          <div class="card-profile-stats d-flex justify-content-center mt-md-5">
            <div>
              <span class="heading">--</span>
              <span class="description">Transactions</span>
            </div>
            <div>
              <span class="heading">--</span>
              <span class="description">Community</span>
            </div>
            <div>
              <span class="heading">
                {{ $n(balance, 'decimal') }}
              </span>
              <span class="description">GDD</span>
            </div>
          </div>
        </b-col>
      </b-row>
      <div class="text-center">
        <h5 class="h3">
          {{ this.$store.state.email }}
          <span class="font-weight-light"></span>
        </h5>
      </div>
    </b-card-body>
  </b-card>
</template>
<script>
import VueQrcode from 'vue-qrcode'

export default {
  name: 'profilecard',
  components: {
    VueQrcode,
  },
  props: {
    balance: { type: Number, default: 0 },
  },
}
</script>
<style></style>
