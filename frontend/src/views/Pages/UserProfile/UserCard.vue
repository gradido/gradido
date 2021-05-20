<template>

  <b-card class="bg-transparent">
   <div class="w-100 text-center" ><vue-qrcode :value="$store.state.email" type="image/png"></vue-qrcode></div>
            
     
      
   

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
                {{ $n(balance) }}
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
