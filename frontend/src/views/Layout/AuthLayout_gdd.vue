<template>
  <div class="main-content bg-default">    
    <template>
      <div class="main-content">
        <router-view></router-view>    
      </div>
      <footer class="py-5" id="footer-main">
        <b-container >
          <b-row align-v="center" class="justify-content-xl-between">
            <b-col xl="6">
              <div class="copyright text-center text-xl-left text-muted">
                © {{year}} <a href="https://gradido.net/" class="font-weight-bold ml-1" target="_blank">Gradido Wallet</a>
              </div>
            </b-col>
            <b-col xl="6" class="col-xl-6">
              <b-nav class="nav-footer justify-content-center justify-content-xl-end">
                <b-nav-item ref="https://www.creative-tim.com" target="_blank">
                  Gradido
                </b-nav-item>
                <b-nav-item href="https://www.creative-tim.com/presentation" target="_blank">
                {{$t('imprint')}}
                </b-nav-item>
                <b-nav-item href="http://blog.creative-tim.com" target="_blank">
                  {{$t('privacy_policy')}}
                </b-nav-item>
                <b-nav-item href="https://www.creative-tim.com/license" target="_blank">
                  {{$t('license')}}
                </b-nav-item>
              </b-nav>
            </b-col>
          </b-row>
          <br>
          <br>
          <b-row >           
            <b-col class="nav-link text-center"  @click.prevent="setLocale('en')">{{ $t('languages.en') }}</b-col>
            <b-col class="nav-link text-center" @click.prevent="setLocale('de')">{{ $t('languages.de') }}</b-col>
          </b-row>
        </b-container>
      </footer>
    </template>
  </div>
</template>
<script>
  import { BaseNav } from '@/components';
  import { ZoomCenterTransition } from 'vue2-transitions';

  export default {
    components: {
      //BaseNav,
      //ZoomCenterTransition
    },
    props: {
      backgroundColor: {
        type: String,
        default: 'black'
      }
    },
    data() {
      return {
        showMenu: false,
        menuTransitionDuration: 250,
        pageTransitionDuration: 200,
        year: new Date().getFullYear(),
        pageClass: 'login-page'
      };
    },
    computed: {
      title() {
        return `${this.$route.name} Page`;
      }
    },
    methods: {
      setLocale(locale) {
        this.$i18n.locale = locale
        //this.$router.push({
        //  params: { lang: locale }
        //})
        //this.hideDropdown()
      },
      toggleNavbar() {
        document.body.classList.toggle('nav-open');
        this.showMenu = !this.showMenu;
      },
      closeMenu() {
        document.body.classList.remove('nav-open');
        this.showMenu = false;
      },
      setBackgroundColor() {
        document.body.classList.add('bg-default');
      },
      removeBackgroundColor() {
        document.body.classList.remove('bg-default');
      },
      updateBackground() {
        if (!this.$route.meta.noBodyBackground) {
          this.setBackgroundColor();
        } else {
          this.removeBackgroundColor()
        }
      }
    },
    beforeDestroy() {
      this.removeBackgroundColor();
    },
    beforeRouteUpdate(to, from, next) {
      // Close the mobile menu first then transition to next page
      if (this.showMenu) {
        this.closeMenu();
        setTimeout(() => {
          next();
        }, this.menuTransitionDuration);
      } else {
        next();
      }
    },
    watch: {
      $route: {
        immediate: true,
        handler: function () {
          this.updateBackground()
        }
      }
    }
  };
</script>
<style lang="scss">
  $scaleSize: 0.8;
  @keyframes zoomIn8 {
    from {
      opacity: 0;
      transform: scale3d($scaleSize, $scaleSize, $scaleSize);
    }
    100% {
      opacity: 1;
    }
  }

  .main-content .zoomIn {
    animation-name: zoomIn8;
  }

  @keyframes zoomOut8 {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
      transform: scale3d($scaleSize, $scaleSize, $scaleSize);
    }
  }

  .main-content .zoomOut {
    animation-name: zoomOut8;
  }
</style>
