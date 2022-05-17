<template>
  <div class="auth-template">
    <mobile-start v-if="mobileStart" class="d-inline d-lg-none" @is-mobile-start="setMobileStart" />
    <div v-else class="h-100 align-middle">
      <navbar class="zindex10" />

      <div class="left-content-box position-fixed d-none d-lg-block">
        <div class="bg-img-box position-absolute w-100">
          <carousel class="carousel" />
        </div>
        <div class="bg-txt-box position-relative d-none d-lg-block text-center align-self-center">
          <div class="h0 text-white">{{ $t('auth.left.gratitude') }}</div>
          <div class="h1 text-white">{{ $t('auth.left.newCurrency') }}</div>
          <div class="h2 text-uppercase text-white">{{ $t('auth.left.oneAnotherNature') }}</div>
          <b-button variant="gradido">{{ $t('auth.left.learnMore') }}</b-button>
        </div>
      </div>
      <b-row class="justify-content-md-center">
        <b-col sm="12" md="8" offset-lg="6" lg="6">
          <div class="right-content-box ml-2 ml-sm-4 mr-2 mr-sm-4">
            <b-row class="d-none d-md-block d-lg-none mt-3">
              <b-col class="mb--4">
                <navbar-small class="zindex10" />
              </b-col>
            </b-row>
            <b-row class="mt-5 pl-2 pl-md-0 pl-lg-0">
              <b-col cols="9">
                <div class="h1 mb--2">{{ $t('welcome') }}</div>
                <div class="h1 mb-0">{{ $t('communitiesWorldWide') }}</div>
                <div class="mb-0">{{ $t('1000thanks') }}</div>
              </b-col>
              <b-col cols="3" class="text-right d-none d-sm-none d-md-inline">
                <b-avatar src="img/brand/gradido_coin●.png" size="6rem"></b-avatar>
              </b-col>
            </b-row>
            <b-card no-body ref="pageFontSize" class="border-0 mt-4 gradido-custom-background">
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
                  <b-row class="mt-4">
                    <b-col class="zindex1000 mb--4">
                      <navbar-small />
                    </b-col>
                  </b-row>
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
import Navbar from '@/components/Auth/Navbar.vue'
import NavbarSmall from '@/components/Auth/NavbarSmall.vue'
import Carousel from '@/components/Auth/Carousel.vue'
import LanguageSwitch from '@/components/LanguageSwitch2'
import AuthFooter from '@/components/Auth/Footer.vue'

export default {
  name: 'AuthTemplate',
  components: {
    MobileStart,
    Navbar,
    NavbarSmall,
    Carousel,
    LanguageSwitch,
    AuthFooter,
  },
  data() {
    return {
      lg: 1025,
      mobileStart: window.innerWidth < this.lg,
      windowWidth: window.innerWidth,
    }
  },
  methods: {
    setMobileStart(boolean) {
      this.mobileStart = boolean
    },
    setTextSize(size) {
      this.$refs.pageFontSize.style.fontSize = size + 'rem'
    },
    onResize() {
      this.mobileStart = window.innerWidth < this.lg
    },
  },
  mounted() {
    this.$nextTick(() => {
      window.addEventListener('resize', this.onResize)
    })
  },
  watch: {
    windowWidth() {
      window.addEventListener('resize', this.onResize)
    },
  },
}
</script>

<style lang="scss">
/* left  */
.left-content-box {
  width: 40%;
  top: 0px;
  bottom: 0px;
}

.bg-img-box {
  top: 0px;
  bottom: 0px;
}

/* right */
.right-content-box {
  max-width: 640px;
}
.page-font-size {
  font-size: 1rem;
}
.auth-template {
  overflow-x: hidden;
}

.bg-txt-box {
  margin-top: 317px;
  text-shadow: 2px 2px 8px #000000;
  max-width: 733px;
}
.bg-txt-box > .h0 {
  font-size: 4em;
  text-shadow: -2px -2px -8px #e4a907;
}

.bg-txt-box .h1,
.bg-txt-box .h2 {
  font-size: 1.5em;
  text-shadow: -2px -2px -8px #e4a907;
}

.bg-img {
  border-radius: 0% 50% 70% 0% / 50% 70% 70% 50%;
  overflow: hidden;
}

@media screen and (min-width: 2000px) {
  .right-content-box {
    max-width: 60%;
    font-size: xx-large;
  }
}
</style>
