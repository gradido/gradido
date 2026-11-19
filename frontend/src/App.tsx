// AI-GENERATED — not an architecture reference
import { BToastOrchestrator } from 'bootstrap-vue-next'
import { computed, defineComponent, onBeforeUnmount, watch } from 'vue'
import { useRoute } from 'vue-router'
import { AdminWayBackBar } from '@/components/AdminWayBackBar'
import { AppOutdatedBar } from '@/components/AppOutdatedBar'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { useWalletStore } from '@/store/useWalletStore'
import './App.css'

export const App = defineComponent({
  name: 'App',
  setup() {
    const store = useWalletStore()
    const route = useRoute()

    const darkMode = computed(() => store.darkMode)

    /**
     * Keeps <meta name="theme-color"> on the page background. Installed on a home screen
     * that colour is the status bar, so switching light/dark has to move it too --
     * index.html only gets the first paint right.
     *
     * ⚠️ The value is READ from the --bg token rather than written again here. Two literals
     * in a second file are two chances to drift, and this way the bar cannot disagree with
     * the page by construction. Reading after the class toggle below is what makes it the
     * new value: a class change is live in the CSSOM at once.
     *
     * ⛔ No fallback colour when the token comes back empty (dev, before the injected
     * stylesheet lands). Doing nothing is not a gap -- the tag in index.html already carries
     * the right value from before first paint, and a guessed literal here could only be
     * wrong.
     */
    const syncThemeColor = () => {
      const meta = document.querySelector('meta[name="theme-color"]')
      if (!meta) {
        return
      }
      const bg = getComputedStyle(document.body).getPropertyValue('--bg').trim()
      if (bg) {
        meta.setAttribute('content', bg)
      }
    }

    // Teleported UI (modals, toasts) renders on <body>, outside #app, so mirror
    // the dark-mode class and Bootstrap's color-mode attribute there too. The
    // data-bs-theme attribute drives Bootstrap's native dark variables; light
    // mode carries no attribute so it stays a pure :root fallback.
    watch(
      darkMode,
      (val) => {
        document.body.classList.toggle('dark-mode', val)
        if (val) {
          document.body.setAttribute('data-bs-theme', 'dark')
        } else {
          document.body.removeAttribute('data-bs-theme')
        }
        syncThemeColor()
      },
      { immediate: true },
    )

    // Keep following the OS while themeMode is 'system' (re-evaluate on OS
    // light/dark change). The initial apply happens in main.js before mount. The mode this
    // device keeps comes first: the admin interface may have written it since this wallet
    // opened, and the apply writes the mode back.
    let themeMediaQuery: MediaQueryList | undefined
    let themeMediaListener: (() => void) | undefined
    if (window.matchMedia) {
      themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      themeMediaListener = () => {
        store.adoptThemeModeFromDevice()
        store.applyTheme()
      }
      themeMediaQuery.addEventListener('change', themeMediaListener)
    }

    onBeforeUnmount(() => {
      if (themeMediaListener) {
        themeMediaQuery?.removeEventListener('change', themeMediaListener)
      }
    })

    return () => (
      <div id='app' ref='app' class={darkMode.value ? 'dark-mode' : ''}>
        <BToastOrchestrator />
        <AppOutdatedBar />
        <AdminWayBackBar />
        <div class={route.meta.requiresAuth ? 'app-content' : ''}>
          {route.meta.requiresAuth ? <DashboardLayout /> : <AuthLayout />}
          <div class='goldrand position-fixed fixed-bottom zindex1000'></div>
        </div>
      </div>
    )
  },
})
