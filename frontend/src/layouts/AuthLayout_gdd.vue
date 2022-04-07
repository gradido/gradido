<template>
  <div class="auth-template">
    <div v-if="mobilStart" class="mobil-start-box d-inline d-sm-inline d-md-inline d-lg-none">
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
        <b-button variant="gradido" @click="linkRouter('/register')">{{ $t('signup') }}</b-button>
        <div class="mt-3 h3">
          {{ $t('auth.left.hasAccount') }}
          <span @click="mobilStart = false">
            <b-link to="/login" class="text-gradido">{{ $t('auth.left.hereLogin') }}</b-link>
          </span>
        </div>
      </div>
    </div>

    <div>
      <auth-header />
      <b-row class="auth-template-content">
        <b-col lg="6" md="none" sm="none">
          <div class="bg-img-box d-none d-lg-block">
            <!-- <b-img class="bg-img" src="/img/template/Foto_01.jpg"></b-img>-->
            <carousel class="d-block w-100 h-100" />
          </div>
          <div class="w-100 bg-txt-box d-none d-lg-block text-center align-self-center">
            <div class="h0">{{ $t('auth.left.gratitude') }}</div>
            <div class="h1">{{ $t('auth.left.newCurrency') }}</div>
            <div class="h2 text-uppercase">{{ $t('auth.left.oneAnotherNature') }}</div>
            <b-button variant="gradido">{{ $t('auth.left.learnMore') }}</b-button>
          </div>
        </b-col>
        <b-col lg="6" md="12" sm="12" class="pl-2 pr-2 pl-md-5 pr-md-5">
          <b-row class="mt-5 pl-2 pl-md-0">
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
                  <span>{{ $t('A') }}</span>
                  <span class="h1">{{ $t('A') }}</span>
                </div>
                <b-popover
                  target="popover-target-1"
                  triggers="hover"
                  placement="topleft"
                  variant="dark"
                >
                  <div class="text-light">
                    <span class="pointer" @click="setTextSize(85)">{{ $t('85') }}</span>
                    {{ $t('|') }}
                    <span class="pointer" @click="setTextSize(100)">{{ $t('100') }}</span>
                    {{ $t('|') }}
                    <span class="pointer" @click="setTextSize(125)">{{ $t('125') }}</span>
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
          <content-footer v-if="!$route.meta.hideFooter"></content-footer>
        </b-col>
      </b-row>
      <!-- <auth-layout-gdd />-->
    </div>
  </div>
</template>
<script>
import ContentFooter from '@/components/ContentFooter.vue'
import LanguageSwitch from '@/components/LanguageSwitch2'
import AuthHeader from '@/components/Auth/Header.vue'
import Carousel from '@/components/Auth/Carousel.vue'

export default {
  name: 'AuthTemplate',
  components: {
    ContentFooter,
    LanguageSwitch,
    AuthHeader,
    Carousel,
  },
  data() {
    return {
      mobilStart: true,
    }
  },
  methods: {
    setTextSize(size) {
      alert('set page text size of: ' + size + '%')
    },
  },
}
</script>
<style lang="scss">
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

.auth-template {
  height: 92%;
}
.auth-template-content {
  height: 100%;
}
.auth-header {
  z-index: 999;
}

.bg-img-box {
  margin-top: -178px;
  /* margin-left: -80px; */
  position: absolute;
  top: 0px;
  bottom: 0px;
  min-width: 86%;
  /* max-width: 800px; */
  background-color: bisque;
  border-radius: 0% 50% 70% 0%/50% 70% 70% 50%;
}
.bg-txt-box {
  position: relative;
  margin-top: 300px;
  padding-bottom: 20px;

  text-shadow: 2px 2px 8px #000000;
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
