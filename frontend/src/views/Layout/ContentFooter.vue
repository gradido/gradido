<template>
  <footer class="footer px-4 bg-transparent">
    <b-row align-v="center" class="justify-content-lg-between">
      <b-col lg="6">
        <div class="copyright text-center text-lg-left text-muted">
          © {{year}} <a href="#!" to="/login" class="font-weight-bold ml-1" >Gradido-Akademie</a>
        </div>
      </b-col>
      <b-col lg="6">
        <b-nav class="nav-footer justify-content-center justify-content-lg-end">
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
