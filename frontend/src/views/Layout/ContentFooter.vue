<template>
  <footer class="footer px-4 bg-transparent">
    <b-row align-v="center" class="justify-content-lg-between">
      <b-col>
        <div class="copyright text-center text-lg-center text-muted">
          © {{year}} <a href="https://gradido.net/" class="font-weight-bold ml-1" target="_blank">Gradido-Akademie</a>
        </div>
      </b-col>
      <b-col>
        <b-nav class="nav-footer justify-content-center">
          <b-nav-item ref="https://gradido.net/" target="_blank">
            Gradido
          </b-nav-item>
          <b-nav-item href="https://gradido.net/de/impressum/" target="_blank">
           {{$t('imprint')}}
          </b-nav-item>
          <b-nav-item href="https://gradido.net/de/datenschutz/" target="_blank">
            {{$t('privacy_policy')}}
          </b-nav-item>
          <!--<b-nav-item href="#!" to="/explorer" >
            GDD-Explorer
          </b-nav-item> -->
        </b-nav>
      </b-col>
    </b-row>
    <!--
    <br>
    <br>
    <b-row >
      <b-col class="nav-link text-center"  @click.prevent="setLocale('en')">{{ $t('languages.en') }}</b-col>
      <b-col class="nav-link text-center" @click.prevent="setLocale('de')">{{ $t('languages.de') }}</b-col>
    </b-row>
    -->
  </footer>
</template>
<script>
export default {
  data() {
    return {
      year: new Date().getFullYear(),
    };
  }
};
</script>
<style></style>
