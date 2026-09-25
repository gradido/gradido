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

/* ⛔ No `min-width`. There was one since 2022 (500px, then 360px, then 330px), from when a
   floor made a narrower screen scroll sideways to the rest. Under the clip below it could
   only cut the rest off: at 320px wide (the first iPhone SE) the column stood 330px wide
   from the 6px edge, and the right 16px of every card lay behind the screen. */
.app-content {
  max-width: 1320px;
  margin-right: auto;
  margin-left: auto;
}

/* ⚠️ `clip`, on every width: the grid assumes 12px of room at the edge -- every row reaches
   half a gutter past its parent and its columns pad it back. On a phone the page edge is
   6px (below), so the rows' empty padding stood 6px off the screen; on the desk the page
   has no edge at all, and from 1025px until `.app-content` stops at 1320px and centres
   (about 1344px) the rows stood 12px off the right edge. Either way the page could be
   pushed sideways, and nothing that is drawn lies out there.
   `clip`, not `hidden`: it opens no scroll container, so the sticky headers keep sticking.
   It also means a page that really is too wide gets cut at the edge instead of scrolling,
   so the document's `scrollWidth` no longer shows it: measure the elements against the
   viewport (getBoundingClientRect) instead. */
#app > #app {
  overflow-x: clip;
}

@media screen and (width <= 500px) {
  #app {
    font-size: 0.85rem;
  }
}

/* The page edge below the desk layout: 6px, the measure the map had already found for
   itself. Boxes reach that far, and their text keeps its distance through their own
   padding, so a phone gives its width to the fields instead of to the margin (Bernd,
   21.09.2026: "Auf dem Handy verschenken wir seitlich immer noch viel zu viel Platz").

   ⛔ Once, on App.vue's root. index.html's mount point is an #app as well, so a bare
   `#app` here reached both and every page stood 30px in from the edge -- twice the
   15px anyone had written.

   `page-text` is for what stands on the page rather than in a box -- a section label, an
   empty list's sentence, a count above a list. It takes the 24px a box would have given
   it, so it lines up with the text inside the boxes instead of sitting 6px from the bezel.
   Boxes and fields are not given it: they reach the edge, their padding does the rest.
   Nothing above this width, where the page has no edge of its own to make up for. */
@media screen and (width <= 1024.98px) {
  #app > #app {
    --page-text-inset: 24px;

    padding-left: 6px;
    padding-right: 6px;
  }

  .page-text {
    padding-left: var(--page-text-inset);
    padding-right: var(--page-text-inset);
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
