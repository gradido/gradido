<template>
  <div class="mobil-start-box d-inline d-sm-inline d-md-inline d-lg-none">
    <div class="position-absolute h1 text-white zindex1000 w-100 text-center mt-8">
      {{ $t('auth.left.gratitude') }}
    </div>
    <div class="position-absolute h2 text-white zindex1000 w-100 text-center mt-9">
      {{ $t('auth.left.newCurrency') }}
    </div>
    <img src="img/template/Blaetter.png" class="header-img d-block d-lg-none zindex1000" />
    <b-img id="img0" src="img/template/logo-header.png" alt="start background image"></b-img>
    <b-img
      fluid
      height="100%"
      id="img1"
      src="img/template/background-start-mobil.png"
      alt="start background image"
    ></b-img>
    <b-img
      id="img2"
      src="img/template/gradido_background_header.png"
      alt="start background image"
    ></b-img>
    <b-img id="img3" src="img/template/Foto_01.jpg" alt="start background image"></b-img>
    <div class="mobil-start-box-text text-center">
      <b-button variant="gradido" to="/register" @click="$emit('is-mobile-start', false)">
        {{ $t('signup') }}
      </b-button>
      <div class="mt-3 h3 text-white">
        {{ $t('auth.left.hasAccount') }}
        <b-link
          to="/login"
          class="text-gradido gradido-global-color-blue"
          @click="$emit('is-mobile-start', false)"
        >
          {{ $t('auth.left.hereLogin') }}
        </b-link>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'MobileStart',
}
</script>
<style>
.mobil-start-box {
  position: fixed;
  height: 100%;
  z-index: 1000;
}
.mobil-start-box-text {
  position: fixed;
  z-index: 10000;
  bottom: 65px;
  width: 100%;
}

.mobil-start-box #img0 {
  /* position: absolute;*/
  z-index: 1000;
  /* width: 33%; */
}

.mobil-start-box #img1 {
  /* position: absolute;*/
  overflow: hidden;
  height: 100%;
  /* width: 100%;*/
  z-index: 10;
}

.mobil-start-box #img2 {
  /*position: absolute;*/
  /*width: 49%;*/
  height: 14%;
  z-index: 1;
}
.mobil-start-box #img3 {
  width: 115%;
  /*position: relative;*/
}

@media screen and (min-width: 992px) {
  .mobil-start-box #img3 {
    width: 150%;
    top: -148px;
  }
}

@media screen and (max-width: 991px) {
  .mobil-start-box #img3 {
    width: 100%;
    top: -148px;
  }
}

@media screen and (max-width: 650px) {
  .mobil-start-box #img3 {
    top: 66px;
    width: 115%;
  }
}

@media screen and (max-width: 450px) {
  .mobil-start-box #img3 {
    width: 160%;
    left: -71px;
    top: 35px;
    min-width: 360px;
  }
}

@media screen and (max-height: 740px) {
  .mobil-start-box #img3 {
    width: 115%;
  }
}

@media screen and (max-width: 300px) {
  .mobil-start-box #img3 {
    width: 145%;
    left: -94px;
    top: 24px;
    min-width: 360px;
  }
}
</style>
