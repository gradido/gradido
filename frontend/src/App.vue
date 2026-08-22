<template>
  <div id="app" ref="app" :class="darkMode ? 'dark-mode' : ''">
    <BToastOrchestrator />
    <app-outdated-bar />
    <div :class="$route.meta.requiresAuth ? 'app-content' : ''">
      <component :is="$route.meta.requiresAuth ? 'DashboardLayout' : 'AuthLayout'" />
      <div class="goldrand position-fixed fixed-bottom zindex1000"></div>
    </div>
  </div>
</template>

<script>
import DashboardLayout from '@/layouts/DashboardLayout'
import AuthLayout from '@/layouts/AuthLayout'
import AppOutdatedBar from '@/components/AppOutdatedBar'

export default {
  name: 'App',
  components: {
    DashboardLayout,
    AuthLayout,
    AppOutdatedBar,
  },
  computed: {
    darkMode() {
      return this.$store.state.darkMode
    },
  },
  watch: {
    // Teleported UI (modals, toasts) renders on <body>, outside #app, so mirror
    // the dark-mode class and Bootstrap's color-mode attribute there too. The
    // data-bs-theme attribute drives Bootstrap's native dark variables; light
    // mode carries no attribute so it stays a pure :root fallback.
    darkMode: {
      immediate: true,
      handler(val) {
        document.body.classList.toggle('dark-mode', val)
        if (val) {
          document.body.setAttribute('data-bs-theme', 'dark')
        } else {
          document.body.removeAttribute('data-bs-theme')
        }
        this.syncThemeColor()
      },
    },
  },
  methods: {
    /**
     * Keeps <meta name="theme-color"> on the page background. Installed on a home screen
     * that colour is the status bar, so switching light/dark has to move it too --
     * index.html only gets the first paint right.
     *
     * ⚠️ The value is READ from the --bg token rather than written again here. Two literals
     * in a second file are two chances to drift, and this way the bar cannot disagree with
     * the page by construction. Reading after the class toggle above is what makes it the
     * new value: a class change is live in the CSSOM at once.
     *
     * ⛔ No fallback colour when the token comes back empty (dev, before the injected
     * stylesheet lands). Doing nothing is not a gap -- the tag in index.html already carries
     * the right value from before first paint, and a guessed literal here could only be
     * wrong.
     */
    syncThemeColor() {
      const meta = document.querySelector('meta[name="theme-color"]')
      if (!meta) return
      const bg = getComputedStyle(document.body).getPropertyValue('--bg').trim()
      if (bg) meta.setAttribute('content', bg)
    },
  },
  created() {
    // Keep following the OS while themeMode is 'system' (re-evaluate on OS
    // light/dark change). The initial apply happens in main.js before mount.
    if (!window.matchMedia) return
    this.themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.themeMediaListener = () => this.$store.dispatch('applyTheme')
    this.themeMediaQuery.addEventListener('change', this.themeMediaListener)
  },
  beforeUnmount() {
    this.themeMediaQuery?.removeEventListener('change', this.themeMediaListener)
  },
}
</script>

<style>
@font-face {
  font-family: WorkSans, sans-serif !important;
  src: url('./assets/scss/fonts/WorkSans-VariableFont_wght.ttf') format('truetype');
}

#app {
  font-size: 1rem;
  font-family: WorkSans, sans-serif !important;
}

.app-content {
  min-width: 330px;
  max-width: 1320px;
  margin-right: auto;
  margin-left: auto;
}

@media screen and (width <= 500px) {
  #app {
    font-size: 0.85rem;
  }
}

@media screen and (width <= 1024px) {
  #app {
    padding-left: 15px;
    padding-right: 15px;
  }
}

.goldrand {
  background: linear-gradient(
    90deg,
    rgb(197 141 56 / 100%) 6%,
    rgb(243 205 124 / 100%) 30%,
    rgb(219 176 86 / 100%) 54%,
    rgb(238 192 95 / 100%) 63%,
    rgb(204 157 61 / 100%) 88%
  );
  height: 13px;
}

.dropdown > .dropdown-toggle {
  border-radius: 17px;
  height: 50px;
  text-align: left;
}

.dropdown-toggle::after {
  float: right;
  top: 50%;
  transform: translateY(-50%);
  position: relative;
}
</style>
