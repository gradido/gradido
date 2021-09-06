<template>
  <footer class="footer px-4 bg-transparent">
    <b-row align-v="center" class="justify-content-lg-between">
      <b-col>
        <div class="copyright text-center text-lg-center text-muted">
          © {{ year }}
          <a
            :href="`https://gradido.net/${$i18n.locale}`"
            class="font-weight-bold ml-1"
            target="_blank"
          >
            Gradido-Akademie
          </a>
          |
          <a href="https://github.com/gradido/gradido/releases/latest" target="_blank">
            App version {{ version }}
          </a>
          <a :href="'https://github.com/gradido/gradido/commit/' + hash" target="_blank">
            {{ shortHash }}
          </a>
        </div>
      </b-col>
    </b-row>
    <b-row align-v="center" class="justify-content-lg-between">
      <b-col>
        <b-nav class="nav-footer justify-content-center">
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
          <b-nav-item
            :href="
              $i18n.locale === 'de'
                ? 'https://docs.google.com/document/d/1jZp-DiiMPI9ZPNXmjsvOQ1BtnfDFfx8BX7CDmA8KKjY/edit?usp=sharing'
                : 'https://docs.google.com/document/d/1kcX1guOi6tDgnFHD9tf7fB_MneKTx-0nHJxzdN8ygNs/edit?usp=sharing'
            "
            target="_blank"
          >
            {{ $t('whitepaper') }}
          </b-nav-item>
          <b-nav-item :href="`https://gradido.net/${$i18n.locale}/contact/`" target="_blank">
            {{ $t('site.navbar.support') }}
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
      hash: process.env.VUE_APP_BUILD_COMMIT,
      shortHash: process.env.VUE_APP_BUILD_COMMIT.substr(0, 8),
    }
  },
}
</script>
<style></style>
