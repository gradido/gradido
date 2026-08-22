<!-- AI-GENERATED — not an architecture reference -->
<template>
  <div>
    <!-- ⭐ Two breakpoints, no router trick. A redirect cannot know the screen width, and a
         width check at navigation time is wrong again as soon as the device is turned. The
         layout works this way throughout: below 992px the menu column is gone, so here the
         LIST is the page; above it the menu stands to the left and this shows the first
         section, exactly as the account tab used to open. -->
    <div class="d-lg-none">
      <div class="card bg-white gradido-border-radius appBoxShadow p-4 mt--3">
        <!-- ⛔ By PATH: the route at /overview carries no name and the named form throws. -->
        <router-link to="/overview" class="settings-back" data-test="settings-back-to-account">
          <i-mdi-arrow-left class="svg-icon" />
          <span class="ms-2">{{ $t('navigation.back-to-account') }}</span>
        </router-link>
        <settings-menu />
      </div>
    </div>
    <div class="d-none d-lg-block">
      <settings-account />
    </div>
  </div>
</template>
<script setup>
import SettingsAccount from './Account.vue'
import SettingsMenu from '@/components/Menu/SettingsMenu.vue'
</script>
<style scoped>
/* The same colour as the way back in the desk menu: one way back, one look. */
.settings-back {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  font-weight: bold;
  color: var(--text) !important;
}
</style>
