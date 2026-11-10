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
               one rather than starting the second.
               Below the desktop layout (`lg`, 1025px) the version always takes a line of its own
               and the bar goes (Bernd, 10.11.2026): on the phone the line broke inside the
               version, its number alone on the next line. -->
          <a :href="`https://gradido.net/${$i18n.locale}`" class="fw-bold ms-1" target="_blank">
            <span class="text-nowrap">{{ $t('footer.copyright.link') }}</span>
          </a>
          <span class="separator-start ms-2 ps-2 d-none d-lg-inline" aria-hidden="true" />
          <wbr />
          <span class="copyright-version d-block d-lg-inline">
            <a :href="'https://github.com/gradido/gradido/commit/' + hash" target="_blank">
              {{ $t('footer.app_version', { version }) }}
            </a>
          </span>
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
<script setup>
import CONFIG from '@/config'

const dltActive = CONFIG.DLT_ACTIVE
const communityUrl = CONFIG.COMMUNITY_URL
const year = new Date().getFullYear()
const version = CONFIG.APP_VERSION
const hash = CONFIG.BUILD_COMMIT
const shortHash = CONFIG.BUILD_COMMIT_SHORT
const supportEmail = CONFIG.COMMUNITY_SUPPORT_MAIL
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

/* Where even a line of its own is too narrow for the version (measured 10.11.2026: Russian at
   360px and below, French below 300px, Greek and Turkish at 260px), its words go over two lines
   of about the same length, so that the number does not stand alone on the second one. A
   browser that does not know the value wraps as before. */
.copyright-version {
  text-wrap: balance;
}
</style>
