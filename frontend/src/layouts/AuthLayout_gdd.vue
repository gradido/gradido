<template>
  <div class="auth-template" ref="pageFontSize">
    <mobile-start v-if="mobileStart" class="d-inline d-lg-none" @is-mobile-start="isMobileStart" />
    <div>
      <auth-header class="auth-header" />

      <div class="left-content-box">
        <div class="bg-img-box d-none d-lg-block">
          <carousel class="d-block w-100 h-100" />
        </div>
        <div class="w-100 bg-txt-box d-none d-lg-block text-center align-self-center">
          <div class="h0">{{ $t('auth.left.gratitude') }}</div>
          <div class="h1">{{ $t('auth.left.newCurrency') }}</div>
          <div class="h2 text-uppercase">{{ $t('auth.left.oneAnotherNature') }}</div>
          <b-button variant="gradido">{{ $t('auth.left.learnMore') }}</b-button>
        </div>
      </div>

      <b-row>
        <b-col lg="6" offset-lg="6" md="12" sm="12">
          <div class="right-content-box">
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
          </div>
          <auth-footer v-if="!$route.meta.hideFooter" class="pr-5"></auth-footer>
        </b-col>
      </b-row>
      <!-- <auth-layout-gdd />-->
    </div>
  </div>
</template>
<script>
import MobileStart from '@/components/Auth/MobileStart.vue'
import AuthHeader from '@/components/Auth/Header.vue'
import Carousel from '@/components/Auth/Carousel.vue'
import LanguageSwitch from '@/components/LanguageSwitch2'
import AuthFooter from '@/components/Auth/Footer.vue'

export default {
  name: 'AuthTemplate',
  components: {
    MobileStart,
    AuthHeader,
    Carousel,
    LanguageSwitch,
    AuthFooter,
  },
  data() {
    return {
      mobileStart: true,
    }
  },
  methods: {
    isMobileStart(boolean) {
      this.mobileStart = boolean
    },
    setTextSize(size) {
      this.$refs.pageFontSize.style.fontSize = size + 'rem'
    },
  },
}
</script>
<style lang="scss">
.left-content-box {
  position: fixed;
  max-width: 484px;
  background-color: aquamarine;
  top: 0px;
  bottom: 0px;
}
.right-content-box {
  max-width: 640px;
}
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
</style>
