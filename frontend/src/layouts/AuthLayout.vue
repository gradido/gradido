<template>
  <div class="auth-template">
    <div class="h-100 align-middle">
      <auth-navbar class="zindex10" />

      <div class="left-content-box position-fixed d-none d-lg-block">
        <div class="bg-img-box position-absolute w-100">
          <auth-carousel class="carousel" />
        </div>
        <div class="bg-txt-box position-relative d-none d-lg-block text-center align-self-center">
          <b-link :href="`https://gradido.net/${$i18n.locale}`" target="_blank">
            <b-button variant="gradido">
              {{ $t('auth.left.learnMore') }}
            </b-button>
          </b-link>
        </div>
      </div>
      <b-row class="justify-content-md-center justify-content-lg-end">
        <b-col sm="12" md="8" lg="6" class="zindex1000">
          <div class="ml-3 ml-sm-4 mr-3 mr-sm-4">
            <b-row class="d-none d-md-block d-lg-none">
              <b-col class="mb--4">
                <auth-navbar-small />
              </b-col>
            </b-row>
            <b-row class="mt-0 mt-md-5 pl-2 pl-md-0 pl-lg-0">
              <b-col lg="9" md="9" sm="12">
                <div class="mb--2">{{ $t('welcome') }}</div>
                <div class="h1 mb-0">{{ communityName }}</div>
                <div class="mb-0">{{ $t('1000thanks') }}</div>
              </b-col>
              <b-col cols="3" class="text-right d-none d-sm-none d-md-inline">
                <b-avatar src="/img/brand/gradido_coin●.png" size="6rem"></b-avatar>
              </b-col>
            </b-row>
            <b-card no-body ref="pageFontSize" class="border-0 mt-4 gradido-custom-background">
              <b-row class="p-4">
                <b-col cols="10">
                  <language-switch class="ml-3" />
                </b-col>
                <b-col cols="2" class="text-right">
                  <div id="popover-target-1" class="pointer">
                    <b-img src="/img/svg/type.svg" width="19" class="svgType"></b-img>
                  </div>
                  <b-popover
                    target="popover-target-1"
                    triggers="click"
                    placement="top"
                    variant="dark"
                  >
                    <div class="text-light">
                      <span class="pointer" @click="setTextSize(0.85)">{{ $t('85') }}</span>
                      {{ $t('math.pipe') }}
                      <span class="pointer" @click="setTextSize(1)">{{ $t('100') }}</span>
                      {{ $t('math.pipe') }}
                      <span class="pointer" @click="setTextSize(1.25)">{{ $t('125') }}</span>
                    </div>
                  </b-popover>
                </b-col>
              </b-row>
              <b-row class="d-inline d-sm-inline d-md-none d-lg-none mb-3">
                <b-col class="text-center">
                  <b-avatar src="/img/brand/gradido_coin●.png" size="6rem"></b-avatar>
                  <b-row>
                    <b-col class="zindex1000 d-flex justify-content-center">
                      <auth-navbar-small />
                    </b-col>
                  </b-row>
                </b-col>
              </b-row>
              <b-card-body class="">
                <router-view></router-view>
              </b-card-body>
            </b-card>
          </div>
          <auth-footer v-if="!$route.meta.hideFooter" class="pr-5 mb-5"></auth-footer>
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script>
import AuthNavbar from '@/components/Auth/AuthNavbar.vue'
import AuthNavbarSmall from '@/components/Auth/AuthNavbarSmall.vue'
import AuthCarousel from '@/components/Auth/AuthCarousel.vue'
import LanguageSwitch from '@/components/LanguageSwitch2'
import AuthFooter from '@/components/Auth/AuthFooter.vue'
import CONFIG from '@/config'

export default {
  name: 'AuthLayout',
  components: {
    AuthNavbar,
    AuthNavbarSmall,
    AuthCarousel,
    LanguageSwitch,
    AuthFooter,
  },
  data() {
    return {
      communityName: CONFIG.COMMUNITY_NAME,
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
  margin-top: 520px;
  text-shadow: 2px 2px 8px #000000;
  max-width: 733px;
}

.bg-img {
  border-radius: 0% 50% 70% 0% / 50% 70% 70% 50%;
  overflow: hidden;
}

.svgType:hover {
  filter: invert(38%) sepia(18%) saturate(5307%) hue-rotate(179deg) brightness(89%) contrast(89%);
}
@media screen and (min-width: 2000px) {
  .right-content-box {
    max-width: 60%;
    font-size: xx-large;
  }
}
</style>
