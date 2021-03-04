<template>
  <footer class="footer px-4">
    <b-row align-v="center" class="justify-content-lg-between">
      <b-col lg="6">
        <div class="copyright text-center text-lg-left text-muted">
          © {{year}} <a href="https://gradido.net/" class="font-weight-bold ml-1" target="_blank">Gradido Wallet</a>
        </div>
      </b-col>
      <b-col lg="6">
        <b-nav class="nav-footer justify-content-center justify-content-lg-end">
          <b-nav-item ref="https://gradido.net/" target="_blank">
            Gradido
          </b-nav-item>
          <b-nav-item href="https://gradido.net/" target="_blank">
           Impressum
          </b-nav-item>
          <b-nav-item href="https://gradido.net/" target="_blank">
            Datenschutzerklärung
          </b-nav-item>
          <b-nav-item href="https://gradido.net/" target="_blank">
            License
          </b-nav-item>
        </b-nav>
      </b-col>
    </b-row>
  </footer>
</template>
<script>
export default {
  data() {
    return {
      year: new Date().getFullYear()
    };
  }
};
</script>
<style></style>
