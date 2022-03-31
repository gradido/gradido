<template>
  <div class="auth-template">
    <div v-if="mobilStart" class="mobil-start-box d-inline d-sm-inline d-md-inline d-lg-none">
      <b-img
        fluid
        height="100%"
        id="img1"
        src="img/template/background-start-mobil.png"
        alt="start background image"
      ></b-img>
      <b-img id="img2" src="img/template/logo-header.png" alt="start background image"></b-img>
      <b-img id="img3" src="img/template/Foto_01.jpg" alt="start background image"></b-img>
      <div class="mobil-start-box-text text-center">
        <b-button variant="gradido" @click="linkRouter('/register')">Registrieren</b-button>
        <div>
          Du hast schon einen Account?
          <router-link @click="linkRouter('/login')">Hier Anmelden</router-link>
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
            <div class="h0">Dankbarkeit</div>
            <div class="h1">Die neue Währung</div>
            <div class="h2 text-uppercase">Für Einander, Für alle, Für die Natur</div>
            <b-button variant="gradido">Erfahre mehr...</b-button>
          </div>
        </b-col>
        <b-col lg="6" md="12" sm="12" class="pl-5 pr-5">
          <b-row class="mt-5">
            <b-col>
              <div class="h1">Willkommen</div>
              <div class="h1">Communities World Wide</div>
              <div>1000 Dank, weil du bei uns bist!</div>
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
            <b-row class="d-inline d-sm-inline d-md-none d-lg-none mb-3">
              <b-col class="text-center">
                <b-avatar src="img/brand/gradido_coin●.png" size="6rem"></b-avatar>
                <div>
                  <span><router-link to="login">Anmelden</router-link></span>
                  |
                  <span><router-link to="register">Registrieren</router-link></span>
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
    linkRouter(to) {
      this.mobilStart = false
      this.$router.push(to)
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
.mobil-start-box #img1 {
  position: absolute;
  overflow: hidden;
  height: 100%;
  width: 100%;
  z-index: 10;
}
.mobil-start-box #img2 {
  width: 61%;
  position: absolute;
  z-index: 2;
}
.mobil-start-box #img3 {
  width: 100%;
}
.mobil-start-box-text {
  position: relative;
  z-index: 10;
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
</style>
