<template>
  <div class="auth-template">
    <auth-header />
    <b-row class="auth-template-content">
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
      <b-col lg="6" md="12" sm="12" class="pr-5">
        <b-row class="mt-5">
          <b-col>
            <div class="h1">Willkommen</div>
            <div class="h1">Communities World Wide</div>
            <div>1000 Dank, weil du bei uns bist!</div>
          </b-col>
          <b-col class="text-right">
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
                <span>A</span>
                <span class="h1">A</span>
              </div>
              <b-popover
                target="popover-target-1"
                triggers="hover"
                placement="topleft"
                variant="dark"
              >
                <div class="text-light">
                  <span class="pointer" @click="setTextSize(85)">85%</span>
                  |
                  <span class="pointer" @click="setTextSize(100)">100%</span>
                  |
                  <span class="pointer" @click="setTextSize(125)">125%</span>
                </div>
              </b-popover>
            </b-col>
          </b-row>

          <b-card-body class="p-4">
            <router-view></router-view>
          </b-card-body>
        </b-card>
        <content-footer v-if="!$route.meta.hideFooter"></content-footer>
      </b-col>
    </b-row>
    <!-- <auth-layout-gdd />-->
  </div>
</template>
<script>
import ContentFooter from '@/components/ContentFooter.vue'
import LanguageSwitch from '@/components/LanguageSwitch2'
import AuthHeader from '@/components/Auth/Header.vue'
export default {
  name: 'AuthTemplate',
  components: {
    ContentFooter,
    LanguageSwitch,
    AuthHeader,
  },
  methods: {
    setTextSize(size) {
      alert('set page text size of: ' + size + '%')
    },
  },
}
</script>
<style lang="scss">
.auth-template {
  height: 92%;
}
.auth-template-content {
  height: 100%;
}
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
  padding-top: 30%;
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
