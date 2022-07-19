<template>
  <div
    class="mobil-start-box position-fixed h-100 d-inline d-sm-inline d-md-inline d-lg-none zindex1000"
  >
    <div class="position-absolute h1 text-white zindex1000 w-100 text-center mt-8">
      {{ $t('auth.left.gratitude') }}
    </div>
    <div class="position-absolute h2 text-white zindex1000 w-100 text-center mt-9">
      {{ $t('auth.left.oneGratitude') }}
    </div>
    <img
      src="/img/template/Blaetter.png"
      class="sheet-img position-absolute d-block d-lg-none zindex1000"
    />
    <b-img
      id="img0"
      class="position-absolute zindex1000"
      src="/img/template/logo-header.png"
      alt="start background image"
    ></b-img>
    <b-img
      fluid
      id="img1"
      class="position-absolute h-100 w-100 overflow-hidden zindex100"
      src="/img/template/gold_03.png"
      alt="start background image"
    ></b-img>
    <b-img
      id="img2"
      class="position-absolute zindex100"
      src="/img/template/gradido_background_header.png"
      alt="start background image"
    ></b-img>
    <b-img
      id="img3"
      class="position-relative zindex10"
      src="/img/template/Foto_01.jpg"
      alt="start background image"
    ></b-img>
    <div class="mobil-start-box-text position-fixed w-100 text-center zindex1000">
      <b-button variant="gradido" to="/register" @click="$emit('set-mobile-start', false)">
        {{ $t('signup') }}
      </b-button>
      <div class="mt-3 h3 text-white">
        {{ $t('auth.left.hasAccount') }}
        <b-link
          to="/login"
          class="text-gradido gradido-global-color-blue"
          @click="$emit('set-mobile-start', false)"
        >
          {{ $t('auth.left.hereLogin') }}
        </b-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AuthMobileStart',
  props: {
    mobileStart: { type: Boolean, default: false },
  },
}
</script>

<style>
.mobil-start-box-text {
  bottom: 65px;
}

/* logo */
.mobil-start-box #img0 {
  width: 200px;
}

/* background logo */
.mobil-start-box #img2 {
  width: 230px;
}

/* background maske */
@media screen and (max-width: 1024px) {
  .mobil-start-box #img3 {
    width: 100%;
    top: -100px;
  }
}

@media screen and (max-width: 991px) {
  .mobil-start-box #img3 {
    width: 100%;
    top: -148px;
  }
}

@media screen and (max-height: 740px) {
  .mobil-start-box #img3 {
    width: 115%;
  }
}

@media screen and (max-width: 650px) {
  .mobil-start-box #img3 {
    width: 115%;
    top: 66px;
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

@media screen and (max-width: 310px) {
  .mobil-start-box #img3 {
    width: 145%;
    left: -94px;
    top: 24px;
    min-width: 360px;
  }
}

@media screen and (max-height: 700px) {
  .mobil-start-box #img3 {
    top: -104px;
  }
}
</style>
