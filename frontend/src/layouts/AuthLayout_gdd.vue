<template>
  <div class="auth-template" ref="pageFontSize">
    <div v-if="mobilStart" class="mobil-start-box d-inline d-sm-inline d-md-inline d-lg-none">
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
        <b-button variant="gradido" to="/register" @click="mobilStart = false">
          {{ $t('signup') }}
        </b-button>
        <div class="mt-3 h3 text-white">
          {{ $t('auth.left.hasAccount') }}
          <b-link
            to="/login"
            class="text-gradido gradido-global-color-blue"
            @click="mobilStart = false"
          >
            {{ $t('auth.left.hereLogin') }}
          </b-link>
        </div>
      </div>
    </div>

    <div>
      <auth-header class="auth-header" />
      <b-row class="auth-template-content ml-1 mr-1 mr-md-0 ml-md-0">
        <b-col lg="6" md="none" sm="none">
          <div class="bg-img-box d-none d-lg-block">
            <carousel class="d-block w-100 h-100" />
          </div>
          <div class="w-100 bg-txt-box d-none d-lg-block text-center align-self-center">
            <div class="h0">{{ $t('auth.left.gratitude') }}</div>
            <div class="h1">{{ $t('auth.left.newCurrency') }}</div>
            <div class="h2 text-uppercase">{{ $t('auth.left.oneAnotherNature') }}</div>
            <b-button variant="gradido">{{ $t('auth.left.learnMore') }}</b-button>
          </div>
        </b-col>
        <b-col
          lg="6"
          md="12"
          sm="12"
          class="ml-2 ml-md-0 ml-lg-0 pl-2 pl-md-5 pr-2 pr-md-5 pr-md-5"
        >
          <b-row class="mt-5 pl-2 pl-md-0 pl-lg-0">
            <b-col>
              <div class="h1">{{ $t('welcome') }}</div>
              <div class="h1">{{ $t('communitiesWorldWide') }}</div>
              <div>{{ $t('1000thanks') }}</div>
            </b-col>
            <b-col class="text-right d-none d-sm-none d-md-inline">
              <b-avatar src="img/brand/gradido_coin●.png" size="6rem"></b-avatar>
            </b-col>
          </b-row>
          <b-card no-body class="border-0 mt-4 gradido-custom-background">
            <b-row class="p-4">
              <b-col cols="10">
                <language-switch />
              </b-col>
              <b-col cols="2" class="text-right">
                <div id="popover-target-1" class="pointer">
                  <b-img src="img/svg/type.svg" width="19" class="svg"></b-img>
                </div>
                <b-popover
                  target="popover-target-1"
                  triggers="click"
                  placement="top"
                  variant="dark"
                >
                  <div class="text-light">
                    <span class="pointer" @click="setTextSize(0.85)">{{ $t('85') }}</span>
                    {{ $t('|') }}
                    <span class="pointer" @click="setTextSize(1)">{{ $t('100') }}</span>
                    {{ $t('|') }}
                    <span class="pointer" @click="setTextSize(1.25)">{{ $t('125') }}</span>
                  </div>
                </b-popover>
              </b-col>
            </b-row>
            <b-row class="d-inline d-sm-inline d-md-none d-lg-none mb-3">
              <b-col class="text-center">
                <b-avatar src="img/brand/gradido_coin●.png" size="6rem"></b-avatar>
                <div>
                  <span>
                    <router-link to="login">{{ $t('signup') }}</router-link>
                  </span>
                  {{ $t('|') }}
                  <span>
                    <router-link to="register">{{ $t('signin') }}</router-link>
                  </span>
                </div>
              </b-col>
            </b-row>
            <b-card-body class="">
              <router-view></router-view>
            </b-card-body>
          </b-card>
          <auth-footer v-if="!$route.meta.hideFooter"></auth-footer>
        </b-col>
      </b-row>
      <!-- <auth-layout-gdd />-->
    </div>
  </div>
</template>
<script>
import AuthHeader from '@/components/Auth/Header.vue'
import Carousel from '@/components/Auth/Carousel.vue'
import LanguageSwitch from '@/components/LanguageSwitch2'
import AuthFooter from '@/components/Auth/Footer.vue'

export default {
  name: 'AuthTemplate',
  components: {
    AuthHeader,
    Carousel,
    LanguageSwitch,
    AuthFooter,
  },
  data() {
    return {
      mobilStart: true,
    }
  },
  methods: {
    setTextSize(size) {
      this.$refs.pageFontSize.style.fontSize = size + 'rem'
    },
  },
}
</script>
<style lang="scss">
.page-font-size {
  font-size: 1rem;
}
.auth-template {
  overflow-x: hidden;
}
.auth-template,
.auth-template-content {
  height: 100%;
}
.auth-header {
  z-index: 999;
}
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
.mobil-start-box #img1 {
  position: absolute;
  overflow: hidden;
  height: 100%;
  width: 100%;
  z-index: 10;
}
.mobil-start-box #img0 {
  position: absolute;
  z-index: 1000;
  width: 33%;
}
.mobil-start-box #img2 {
  position: absolute;
  width: 49%;
  height: 14%;
  z-index: 1;
}
.mobil-start-box #img3 {
  width: 115%;
  position: relative;
}

.bg-img-box {
  margin-top: -308px;
  margin-left: -118px;
  position: absolute;
  top: 33px;
  bottom: -228px;
  min-width: 86%;
  max-width: 800px;
  /* background-color: bisque; */
  /* border-radius: 0% 48% 74% 0%/59% 70% 73% 47%; */
}
.bg-txt-box {
  position: relative;
  margin-top: 317px;
  /* padding-bottom: 20px; */
  text-shadow: 2px 2px 8px #000000;
  max-width: 733px;
}
.bg-txt-box > .h0 {
  font-size: 4em;
  color: white;
  text-shadow: -2px -2px -8px #e4a907;
}

.bg-txt-box .h1,
.bg-txt-box .h2 {
  font-size: 1.5em;
  color: white;
  text-shadow: -2px -2px -8px #e4a907;
}

.bg-img {
  width: 100%;
  border-radius: 0% 50% 70% 0% / 50% 70% 70% 50%;
  overflow: hidden;
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
