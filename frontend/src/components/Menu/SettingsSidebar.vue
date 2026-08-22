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
        <BNav vertical class="w-100">
          <!-- /settings shows this section on a wide screen, so light its entry there too. -->
          <BNavItem
            to="/settings/account"
            :active="$route.path === '/settings'"
            class="mb-3"
            active-class="active-route"
            data-test="settings-menu-account"
          >
            <div class="sidebar-menu-item-wrapper">
              <i-mdi-account class="svg-icon" />
              <span class="ms-2">{{ $t('settings.menu.account') }}</span>
            </div>
          </BNavItem>
          <BNavItem
            to="/settings/appearance"
            class="mb-3"
            active-class="active-route"
            data-test="settings-menu-appearance"
          >
            <div class="sidebar-menu-item-wrapper">
              <i-mdi-palette-outline class="svg-icon" />
              <span class="ms-2">{{ $t('settings.menu.appearance') }}</span>
            </div>
          </BNavItem>
          <BNavItem
            to="/settings/gradido-card"
            class="mb-3"
            active-class="active-route"
            data-test="settings-menu-gradido-card"
          >
            <div class="sidebar-menu-item-wrapper">
              <i-mdi-card-account-details-outline class="svg-icon" />
              <span class="ms-2">{{ $t('settings.menu.gradido-card') }}</span>
            </div>
          </BNavItem>
          <BNavItem
            to="/settings/thank-you-card"
            class="mb-3"
            active-class="active-route"
            data-test="settings-menu-thank-you-card"
          >
            <div class="sidebar-menu-item-wrapper">
              <i-mdi-credit-card-outline class="svg-icon" />
              <span class="ms-2">{{ $t('thank-you-card.name') }}</span>
            </div>
          </BNavItem>
          <BNavItem
            to="/settings/visibility"
            class="mb-3"
            active-class="active-route"
            data-test="settings-menu-visibility"
          >
            <div class="sidebar-menu-item-wrapper">
              <i-mdi-eye-outline class="svg-icon" />
              <span class="ms-2">{{ $t('settings.menu.visibility') }}</span>
            </div>
          </BNavItem>
          <BNavItem
            to="/settings/notifications"
            class="mb-3"
            active-class="active-route"
            data-test="settings-menu-notifications"
          >
            <div class="sidebar-menu-item-wrapper">
              <i-mdi-bell-outline class="svg-icon" />
              <span class="ms-2">{{ $t('settings.menu.notifications') }}</span>
            </div>
          </BNavItem>
          <!-- The area is on its way out with the matching, and where neither GMS nor HumHub is
               switched on it does not exist at all -- so the entry goes, and the route is not
               registered either. Hiding only the entry would leave the page reachable by typing
               the address; the matching routes carry the same note for the same reason. -->
          <BNavItem
            v-if="isCommunityService"
            to="/settings/communities"
            class="mb-3"
            active-class="active-route"
            data-test="settings-menu-communities"
          >
            <div class="sidebar-menu-item-wrapper">
              <i-mdi-account-group class="svg-icon" />
              <span class="ms-2">
                {{ $t('settings.community') }}
                <span class="d-block small text-muted">
                  {{ $t('settings.menu.communities-note') }}
                </span>
              </span>
            </div>
          </BNavItem>
        </BNav>
      </div>
    </div>
  </div>
</template>
<script setup>
import CONFIG from '@/config'
import { BNav, BNavItem } from 'bootstrap-vue-next'

defineProps({
  shadow: { type: Boolean, default: true },
})

// Read once: the flags are baked in at build time, they cannot change while the app runs.
const isCommunityService = CONFIG.GMS_ACTIVE || CONFIG.HUMHUB_ACTIVE
</script>
<style scoped>
.settings-back {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  margin-left: 4px;
  font-weight: bold;
  color: rgb(56 56 56) !important;
}

:deep(.nav-item > a) {
  color: rgb(56 56 56) !important;
  border-left: 4px transparent solid;
  display: block;
}

:deep(.active-route) {
  display: block;
  font-weight: bold;
  color: rgb(2 2 1);
  border-left-color: rgb(219 129 19) !important;
}

:deep(.nav-link) {
  padding: 0;
}

.sidebar-menu-item-wrapper {
  display: flex;
  align-items: flex-start;
  padding: 4px 12px;
}

.svg-icon {
  flex: 0 0 auto;
  margin-top: 2px;
  filter: brightness(1) invert(0);
}

.active-route .svg-icon {
  filter: brightness(0) invert(0);
}

#component-sidebar {
  min-width: 200px;
}

@media screen and (width >= 1025px) {
  #side-menu {
    max-width: 180px;
  }

  #component-sidebar {
    min-width: 180px;
  }
}
</style>
