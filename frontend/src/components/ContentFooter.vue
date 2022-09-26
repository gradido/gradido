<template>
  <footer class="footer m-4 p-4 bg-transparent">
    <b-row align-v="center" class="mt-4 justify-content-lg-between">
      <b-col>
        <div class="copyright text-center text-lg-center text-muted">
          {{ $t('footer.copyright.year', { year }) }}
          <a
            :href="`https://gradido.net/${$i18n.locale}`"
            class="font-weight-bold ml-1"
            target="_blank"
          >
            {{ $t('footer.copyright.link') }}
          </a>
          {{ $t('math.pipe') }}
          <a href="https://github.com/gradido/gradido/releases/latest" target="_blank">
            {{ $t('footer.app_version', { version }) }}
          </a>
          <a
            v-if="hash"
            :href="'https://github.com/gradido/gradido/commit/' + hash"
            target="_blank"
          >
            {{ $t('footer.short_hash', { shortHash }) }}
          </a>
        </div>
      </b-col>
    </b-row>
    <b-row align-v="center" class="justify-content-lg-between">
      <b-col>
        <b-nav class="nav-footer justify-content-center">
          <b-nav-item :href="`https://gradido.net/${$i18n.locale}/impressum/`" target="_blank">
            {{ $t('footer.imprint') }}
          </b-nav-item>
          <b-nav-item :href="`https://gradido.net/${$i18n.locale}/datenschutz/`" target="_blank">
            {{ $t('footer.privacy_policy') }}
          </b-nav-item>
          <b-nav-item
            :href="
              $i18n.locale === 'de'
                ? 'https://docs.google.com/document/d/1jZp-DiiMPI9ZPNXmjsvOQ1BtnfDFfx8BX7CDmA8KKjY/edit?usp=sharing'
                : 'https://docs.google.com/document/d/1kcX1guOi6tDgnFHD9tf7fB_MneKTx-0nHJxzdN8ygNs/edit?usp=sharing'
            "
            target="_blank"
          >
            {{ $t('footer.whitepaper') }}
          </b-nav-item>
          <b-nav-item :href="`https://gradido.net/${$i18n.locale}/contact/`" target="_blank">
            {{ $t('navigation.support') }}
          </b-nav-item>
        </b-nav>
      </b-col>
    </b-row>
  </footer>
</template>
<script>
import CONFIG from '@/config'

export default {
  data() {
    return {
      year: new Date().getFullYear(),
      version: CONFIG.APP_VERSION,
      hash: CONFIG.BUILD_COMMIT,
      shortHash: CONFIG.BUILD_COMMIT_SHORT,
    }
  },
}
</script>
