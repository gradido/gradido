<template>
  <footer class="footer m-4 p-4 bg-transparent">
    <BRow align-v="center" class="mt-4 justify-content-lg-between">
      <BCol>
        <div class="copyright text-center text-lg-center text-muted">
          {{ $t('footer.copyright.year', { year }) }}
          <!-- ⛔ The name is never broken at its hyphen: at 320px the line broke "Gradido-" over
               "Akademie", in Turkish already at 360px. Vue drops the white space between these
               elements, so between the name and the version the line had no place to break but
               the name's own hyphen; `<wbr>` gives it one after the bar. The bar is an element
               of its own for that: where the version takes the next line, the bar ends the first
               one rather than starting the second. -->
          <a :href="`https://gradido.net/${$i18n.locale}`" class="fw-bold ms-1" target="_blank">
            <span class="text-nowrap">{{ $t('footer.copyright.link') }}</span>
          </a>
          <span class="separator-start ms-2 ps-2" aria-hidden="true" />
          <wbr />
          <a :href="'https://github.com/gradido/gradido/commit/' + hash" target="_blank">
            {{ $t('footer.app_version', { version }) }}
          </a>
        </div>
      </BCol>
    </BRow>
    <BRow align-v="center" class="justify-content-lg-between">
      <BCol>
        <BNav class="nav-footer justify-content-center">
          <BNavItem :href="`https://gradido.net/${$i18n.locale}/impressum/`" target="_blank">
            {{ $t('footer.imprint') }}
          </BNavItem>
          <BNavItem :href="`https://gradido.net/${$i18n.locale}/datenschutz/`" target="_blank">
            {{ $t('footer.privacy_policy') }}
          </BNavItem>
          <BNavItem
            :href="
              $i18n.locale === 'de'
                ? 'https://docs.google.com/document/d/1jZp-DiiMPI9ZPNXmjsvOQ1BtnfDFfx8BX7CDmA8KKjY/edit?usp=sharing'
                : 'https://docs.google.com/document/d/1kcX1guOi6tDgnFHD9tf7fB_MneKTx-0nHJxzdN8ygNs/edit?usp=sharing'
            "
            target="_blank"
          >
            {{ $t('footer.whitepaper') }}
          </BNavItem>
          <BNavItem :href="`mailto:${supportEmail}`" target="_blank">
            {{ $t('navigation.support') }}
          </BNavItem>
          <BNavItem v-if="dltActive" :href="`${communityUrl}/inspector`" target="_blank">
            {{ $t('footer.inspector') }}
          </BNavItem>
        </BNav>
      </BCol>
    </BRow>
  </footer>
</template>
<script>
import CONFIG from '@/config'

export default {
  data() {
    return {
      dltActive: CONFIG.DLT_ACTIVE,
      communityUrl: CONFIG.COMMUNITY_URL,
      year: new Date().getFullYear(),
      version: CONFIG.APP_VERSION,
      hash: CONFIG.BUILD_COMMIT,
      shortHash: CONFIG.BUILD_COMMIT_SHORT,
      supportEmail: CONFIG.COMMUNITY_SUPPORT_MAIL,
    }
  },
}
</script>

<style scoped>
:deep(a.nav-link) {
  color: #383838 !important;
}

/* The bar mixes its colour from `currentcolor`; it used to be the version link's own border
   and so took the link colour, and it keeps that colour as an element of its own. */
.copyright .separator-start {
  color: rgba(var(--bs-link-color-rgb), var(--bs-link-opacity, 1));
}
</style>
