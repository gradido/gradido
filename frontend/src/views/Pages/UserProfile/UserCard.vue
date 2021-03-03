<template>
  <b-card no-body class="card-profile" alt="Image placeholder" img-top>
    <b-row class="justify-content-center">
      <b-col lg="3" class="order-lg-2">
        <div class="card-profile-image">
          <a href="#">
            <vue-qrcode :value="$store.state.email" />
          </a>
        </div>
      </b-col>
    </b-row>

    <b-card-header class="text-center border-0 pt-8 pt-md-4 pb-0 pb-md-4">
      <div class="d-flex justify-content-between">
       <br>
      </div>
    </b-card-header>

    <b-card-body class="pt-0">
      <b-row>
        <b-col >
          <div class="card-profile-stats d-flex justify-content-center mt-md-5">
            <div>
              <span class="heading">22</span>
              <span class="description">Transactions</span>
            </div>
            <div>
              <span class="heading">10</span>
              <span class="description">Community</span>
            </div>
            <div>
              <span class="heading"> {{ setComma(this.$store.state.user.balance) }} </span>
              <span class="description">GDD</span>
            </div>
          </div>
        </b-col>
      </b-row>
      <div class="text-center">
        <h5 class="h3">
         {{this.$store.state.email}}<span class="font-weight-light"></span>
        </h5>
        <div class="h5 font-weight-300">
          <i class="ni location_pin mr-2"></i>Bucharest, Romania
        </div>
        <div class="h5 mt-4">
          <i class="ni business_briefcase-24 mr-2"></i>Solution Manager - Creative Tim Officer
        </div>
        <div>
          <i class="ni education_hat mr-2"></i>University of Computer Science
        </div>
        <hr class="my-4">
        <p>Ryan — the name taken by Melbourne-raised, Brooklyn-based Nick Murphy — writes, performs and records all of his own music.</p>
        <a href="#">Show more</a>

      </div>
    </b-card-body>
  </b-card>
</template>
<script>
import VueQrcode from 'vue-qrcode'

export default {
  name: "profilecard",
   components: {
    VueQrcode,
  },
  methods: {    
        setComma(int){
          console.log("setComma", int)
          return int / 10000
        }
      } 
};
</script>
<style></style>
