<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- The same shell and the same id as the main menu on purpose: the dark-mode rules for
       menu text hang off #component-sidebar (gradido-template-dark.scss), and the two never
       stand side by side -- the layout column shows one or the other. -->
  <div id="component-sidebar">
    <div
      id="side-menu"
      class="gradido-border-radius pt-2 bg-white"
      :class="shadow ? 'app-box-shadow' : ''"
    >
      <div class="mb-3 mt-3">
        <!-- ⛔ By PATH, not by name: the route at /overview carries no name -- `name: 'Overview'`
             in Overview.vue is the component's name and has nothing to do with routing -- and the
             named form throws. Every other link to the overview in this wallet is written this way. -->
        <router-link to="/overview" class="settings-back" data-test="settings-back-to-account">
          <i-mdi-arrow-left class="svg-icon" />
          <span class="ms-2">{{ $t('navigation.back-to-account') }}</span>
        </router-link>
        <hr class="m-3" />

        <settings-menu />

        <!-- ⛔ The one item of the main menu that has to come along. While a settings route is
             open this menu stands in the main one's place, so everything it offered is out of
             reach until one goes back -- acceptable for "overview", which is one arrow away,
             and not acceptable for signing out. Found by the end-to-end test. -->
        <hr class="m-3" />
        <!-- ⚠️ A button, not an anchor without an href: signing out is an action, and an
             anchor with nothing to point at is neither reachable by keyboard nor announced
             as something one can press. -->
        <button
          type="button"
          class="settings-logout"
          data-test="logout-menu"
          @click="$emit('logout')"
        >
          <i-humbleicons-logout class="svg-icon" />
          <span class="ms-2">{{ $t('navigation.logout') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
<script setup>
import SettingsMenu from './SettingsMenu.vue'

defineProps({
  shadow: { type: Boolean, default: true },
})

defineEmits(['logout'])
</script>
<style scoped>
/**
 * ⚠️ `var(--text)`, not the literal the main menu uses. Copying `rgb(56 56 56) !important`
 * from Sidebar.vue took the dark-mode fix with it only in appearance: that fix keys off
 * `#component-sidebar .nav-item > a`, and this link is not a nav item -- so in dark mode it
 * stayed nearly black on nearly black. The token is the same colour in light mode and the
 * right one in dark. (Bernd found it at the device, 22.08.2026.)
 */
.settings-back,
.settings-logout {
  display: flex;
  align-items: center;
  padding: 4px 16px;
  font-weight: bold;
  color: var(--text) !important;
}

.settings-logout {
  width: 100%;
  border: 0;
  background: none;
  color: #cd5556 !important;
  cursor: pointer;
  text-align: left;
}

#component-sidebar {
  min-width: 200px;
}
</style>
