<template>
  <div class="auth-template">
    <div class="h-100 align-middle">
      <auth-navbar class="index10" />

      <div class="left-content-box position-fixed d-none d-lg-block">
        <div v-if="isDesktop" class="bg-img-box position-absolute w-100">
          <auth-carousel class="carousel" />
        </div>
        <div class="bg-txt-box position-relative d-none d-lg-block text-center align-self-center">
          <BLink :href="`https://gradido.net/${$i18n.locale}`" target="_blank">
            <BButton variant="gradido">
              {{ $t('auth.left.learnMore') }}
            </BButton>
          </BLink>
        </div>
      </div>
      <BRow class="justify-content-md-center justify-content-lg-end">
        <BCol sm="12" md="8" lg="6" class="zindex1000">
          <div class="ms-3 ms-sm-4 me-3 me-sm-4">
            <BRow class="d-none d-md-block d-lg-none">
              <BCol>
                <auth-navbar-small />
              </BCol>
            </BRow>
            <BRow v-if="projectBannerResult || projectBannerLoading" class="d-none d-md-block">
              <BCol>
                <BImg
                  v-if="projectBannerResult"
                  :src="projectBannerResult.projectBrandingBanner"
                  class="img-fluid rounded-like-card"
                  alt="project banner"
                />
              </BCol>
            </BRow>
            <BRow v-else class="mt-0 mt-md-5 ps-2 ps-md-0 ps-lg-0">
              <BCol lg="9" md="9" sm="12">
                <div class="mb--2">{{ $t('welcome') }}</div>
                <div class="h1 mb-0">{{ communityName }}</div>
                <div class="mb-0">{{ $t('1000thanks') }}</div>
              </BCol>
              <BCol cols="3" class="text-end d-none d-sm-none d-md-inline">
                <BAvatar src="/img/brand/gradido_coin_128x128.png" size="6rem" />
              </BCol>
            </BRow>
            <BCard no-body class="border-0 mt-4 gradido-custom-background page-font-size">
              <BRow class="p-4">
                <BCol cols="10">
                  <language-switch-2 class="ms-3" />
                </BCol>
                <BCol cols="2" class="text-end">
                  <div id="popover-target-1" class="pointer">
                    <BImg src="/img/svg/type.svg" width="19" class="svg-type"></BImg>
                  </div>
                  <BPopover
                    target="popover-target-1"
                    triggers="click"
                    placement="top"
                    variant="dark"
                    custom-class="login-size-controller"
                  >
                    <div class="text-light">
                      <span class="pointer" @click="setTextSize(0.85)">{{ $t('85') }}</span>
                      {{ $t('|') }}
                      <span class="pointer" @click="setTextSize(1)">{{ $t('100') }}</span>
                      {{ $t('|') }}
                      <span class="pointer" @click="setTextSize(1.25)">{{ $t('125') }}</span>
                    </div>
                  </BPopover>
                </BCol>
              </BRow>
              <BRow class="d-inline d-sm-inline d-md-none d-lg-none mb-3">
                <BCol class="text-center">
                  <BImg
                    v-if="projectBannerResult"
                    :src="projectBannerResult.projectBrandingBanner"
                    class="img-fluid ms-1 me-1 col-10 col-sm-10 rounded-20"
                    alt="project banner"
                  />
                  <BAvatar
                    v-else
                    src="/img/brand/gradido_coin_128x128.png"
                    size="6rem"
                    bg-variant="transparent"
                  ></BAvatar>
                  <BRow>
                    <BCol class="zindex1000 d-flex justify-content-center">
                      <auth-navbar-small />
                    </BCol>
                  </BRow>
                </BCol>
              </BRow>
              <BCardBody class="">
                <router-view></router-view>
              </BCardBody>
            </BCard>
          </div>
          <auth-footer v-if="!$route.meta.hideFooter" class="pe-5 mb-5"></auth-footer>
        </BCol>
      </BRow>
    </div>
  </div>
</template>

<script setup>
import { onBeforeMount, computed, watchEffect } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { projectBrandingBanner } from '@/graphql/projectBranding.graphql'
import AuthNavbar from '@/components/Auth/AuthNavbar'
import AuthNavbarSmall from '@/components/Auth/AuthNavbarSmall'
import AuthCarousel from '@/components/Auth/AuthCarousel'
import AuthFooter from '@/components/Auth/AuthFooter'
import CONFIG from '@/config'
import { useStore } from 'vuex'

const communityName = CONFIG.COMMUNITY_NAME
const store = useStore()
const project = computed(() => {
  const urlParams = new URLSearchParams(window.location.search)
  return urlParams.get('project')
})

const setTextSize = (size) => {
  document.querySelector('.page-font-size').style.fontSize = size + 'rem'
}

const { result: projectBannerResult, loading: projectBannerLoading } = useQuery(
  projectBrandingBanner,
  { project: project.value },
  { enabled: !!project.value },
)

onBeforeMount(() => {
  // clear state
  store.commit('project', null)
})
const isDesktop = computed(() => window.innerWidth > 768)

// put project value into store, if projectBrandingBanner query don't throw an error, so project exists
watchEffect(() => {
  if (projectBannerResult.value) {
    store.commit('project', project.value)
  }
})
</script>

<style lang="scss" scoped>
/* left  */
.left-content-box {
  width: 40%;
  top: 0;
  bottom: 0;
}

.bg-img-box {
  top: 0;
  bottom: 0;
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
  text-shadow: 2px 2px 8px #000;
  max-width: 733px;
}

.bg-img {
  border-radius: 0% 50% 70% 0% / 50% 70% 70% 50%;
  overflow: hidden;
}

.svg-type:hover {
  filter: invert(38%) sepia(18%) saturate(5307%) hue-rotate(179deg) brightness(89%) contrast(89%);
}

@media screen and (width >= 2000px) {
  .right-content-box {
    max-width: 60%;
    font-size: xx-large;
  }
}

.login-size-controller {
  background-color: #212529;
}

:deep(.b-avatar.text-bg-secondary) {
  background-color: transparent !important;
}

:deep(.popover-body) {
  background-color: #383838;
}

:deep(.popover-arrow::after),
:deep(.popover-arrow::before) {
  border-top-color: #383838;
}
</style>
