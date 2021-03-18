<template>
  <div class="main-content">    
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
              <b-nav class="nav-footer justify-content-center justify-content-lg-end">
                <b-nav-item ref="https://gradido.net/" target="_blank">
                  Gradido
                </b-nav-item>
                <b-nav-item href="https://gradido.net/" target="_blank">
                {{$t('imprint')}}
                </b-nav-item>
                <b-nav-item href="https://gradido.net/" target="_blank">
                  {{$t('privacy_policy')}}
                </b-nav-item>
                <b-nav-item href="https://gradido.net/" target="_blank">
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

  export default { 
    data() {
      return {
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
      }
    }
  };
</script>
<style lang="scss">
   
</style>
