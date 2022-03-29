<template>
  <div class="auth-template h-100 w-100">
    <auth-header />
    <b-row class="auth-template-">
      <b-col lg="6" md="none" sm="none">
        <div class="bg-img-box d-none d-lg-block">
          <!-- <b-img class="bg-img" src="/img/template/Foto_01.jpg"></b-img>-->
        </div>
        <div class="w-100 bg-txt-box d-none d-lg-block text-center align-self-center">
          <div class="text-light h0">Dankbarkeit</div>
          <div class="text-light h1">Die neue Währung</div>
          <div class="text-light h2 text-uppercase">Für Einander, Für alle, Für die Natur</div>
          <b-button variant="gradido">Erfahre mehr...</b-button>
        </div>
      </b-col>
      <b-col lg="6" md="12" sm="12">
        <auth-login />
        <auth-register />
      </b-col>
    </b-row>
    <!-- <auth-layout-gdd />-->
  </div>
</template>
<script>
import AuthHeader from '@/components/Auth/Header.vue'
import AuthLogin from '@/components/Auth/Login.vue'
import AuthRegister from '@/components/Auth/Register.vue'
// import AuthLayoutGdd from '@/layouts/AuthLayout_gdd.vue'

export default {
  name: 'AuthTemplate',
  components: {
    AuthHeader,
    AuthLogin,
    AuthRegister,
    // AuthLayoutGdd,
  },
}
</script>
<style lang="scss">
.auth-header {
  z-index: 1000;
}

.bg-img-box {
  margin-top: -178px;
  margin-left: -80px;
  position: absolute;
  top: 0px;
  bottom: 0px;
  min-width: 600px;
  max-width: 800px;
  background-color: bisque;
  border-radius: 0% 50% 70% 0% / 50% 70% 70% 50%;
}
.bg-txt-box {
  position: inherit;
  padding-top: 40%;
  height: auto;
}
.bg-txt-box > .h0 {
  font-size: 4em;
}

.bg-img {
  width: 100%;
  border-radius: 0% 50% 70% 0% / 50% 70% 70% 50%;
  overflow: hidden;
}
</style>
