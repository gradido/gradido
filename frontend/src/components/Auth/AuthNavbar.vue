<template>
  <div class="auth-header position-sticky">
    <BNavbar :toggleable="false" :container="false" class="d-flex">
      <BNavbarBrand class="d-none d-lg-block">
        <BImg class="position-absolute p-2" :src="logo" width="200" alt="Logo" />
        <BImg :src="backgroundHeader" width="230" alt="Background Image"></BImg>
      </BNavbarBrand>
      <!-- Below lg no picture stands beside the form, so the logo needs no blob to stand on:
           it stands on the page, top left, where the leaves used to be. The links keep the
           place they have on the desk, top right, and the coin that stood in the card with
           them is gone -- the logo carries it. (Bernd, 21.09.2026) -->
      <BImg class="auth-logo-small d-lg-none" :src="logo" alt="Logo" data-test="auth-logo-small" />
      <BCollapse id="nav-collapse" is-nav>
        <BNavbarNav class="auth-links ms-auto me-lg-4" right>
          <NavItem :to="routeWithParamsAndQuery('Register')" class="auth-navbar ms-lg-5">
            {{ $t('signup') }}
          </NavItem>
          <NavItem :to="routeWithParamsAndQuery('Login')" class="auth-navbar separator-start">
            {{ $t('signin') }}
          </NavItem>
        </BNavbarNav>
      </BCollapse>
    </BNavbar>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useAuthLinks } from '@/composables/useAuthLinks'
import NavItem from '../Menu/NavItem.vue'

const { routeWithParamsAndQuery } = useAuthLinks()
const store = useStore()

const backgroundHeader = '/img/template/gradido_background_header.png'
// Dark mode uses a transparent, light-inked logo so it reads on the darkened
// header blob; light mode keeps the original, in the 500px file the menu of the
// logged-in wallet uses: below lg the logo also stands without the blob, 109px wide on a
// phone, and a 3x screen asks 327 pixels of a file that had 200.
const logo = computed(() =>
  store.state.darkMode ? '/img/brand/gradido-logo-white.png' : '/img/brand/gradido-logo.png',
)
</script>

<style scoped lang="scss">
.auth-navbar {
  display: flex;
  align-content: center;
}

.auth-header {
  font-family: 'Open Sans', sans-serif !important;
  height: 150px;
  z-index: 1;
}

.auth-header > nav {
  padding: 0 !important;
}

.auth-header > nav > :deep(.navbar-brand) {
  padding: 0 !important;
}

:deep(#nav-collapse) {
  justify-content: flex-end;
}

/*
  Below lg: the logo on the line the greeting and the card's text start on, the links
  ending on the line the card's text ends on. The links are 44px high each, the height of
  a finger. From md up they stand beside the logo; on a phone they take the row below it
  (see the last block).
*/
@media screen and (width <= 1024.98px) {
  .auth-header {
    height: auto;
    padding: 10px var(--page-text-inset, 24px);
  }

  .auth-header > nav {
    flex-wrap: wrap;
    gap: 4px 12px;
  }

  /* The desk's 200px wherever the width has room for it; smaller on a phone (below). */
  .auth-logo-small {
    width: 200px;
    height: auto;
  }

  .auth-links :deep(.nav-link) {
    padding: 12px;
  }

  .auth-links > :first-child :deep(.nav-link) {
    padding-left: 0;
  }

  .auth-links > :last-child :deep(.nav-link) {
    padding-right: 0;
  }
}

/*
  On a phone the logo is 45px high, 153px wide: halfway between the 109px it had here and
  the desk's 200px (Bernd, 22.09.2026 -- it had become too small). The two words take the
  row below it, still on the right, on every phone and in every language alike. Beside the
  larger logo they would fit only on the wider phones (German from 391px), and the top of
  the page would change from one phone to the next -- as it did before, when they went down
  only where they did not fit: at 320px in seven languages, in Russian below 390px.
*/
@media screen and (width <= 767.98px) {
  .auth-logo-small {
    width: auto;
    height: 45px;
  }

  :deep(#nav-collapse) {
    flex-basis: 100%;
  }
}
</style>
