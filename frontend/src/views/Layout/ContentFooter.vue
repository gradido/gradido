<template>
  <footer class="footer px-4 bg-transparent">
    <b-row align-v="center" class="justify-content-lg-between">
      <b-col>
        <div class="copyright text-center text-lg-center text-muted">
          © {{ year }}
          <a href="/login" class="font-weight-bold ml-1">Gradido-Akademie</a>
          |
          <a href="https://github.com/gradido/gradido/releases/latest" target="_blank">
            App Verion {{ version }}
          </a>
        </div>
      </b-col>
    </b-row>
    <b-row align-v="center" class="justify-content-lg-between">
      <b-col>
        <b-nav class="nav-footer justify-content-center">
          <b-nav-item :href="`https://gradido.net/${$i18n.locale}`" target="_blank">
            Gradido
          </b-nav-item>
          <b-nav-item :href="`https://gradido.net/${$i18n.locale}/impressum/`" target="_blank">
            {{ $t('imprint') }}
          </b-nav-item>
          <b-nav-item :href="`https://gradido.net/${$i18n.locale}/datenschutz/`" target="_blank">
            {{ $t('privacy_policy') }}
          </b-nav-item>
          <b-nav-item
            :href="`https://elopage.com/s/gradido/sign_in?locale=${$i18n.locale}`"
            target="_blank"
          >
            {{ $t('members_area') }}
          </b-nav-item>
        </b-nav>
      </b-col>
    </b-row>
  </footer>
</template>
<script>
import CONFIG from '../../config'

export default {
  data() {
    return {
      year: new Date().getFullYear(),
      version: CONFIG.APP_VERSION,
    }
  },
}
</script>
<style></style>
