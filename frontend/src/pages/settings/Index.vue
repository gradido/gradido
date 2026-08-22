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
        <div class="h2 mb-4">{{ $t('navigation.settings') }}</div>
        <BListGroup flush>
          <BListGroupItem to="/settings/account" data-test="settings-list-account">
            <i-mdi-account class="svg-icon me-2" />
            {{ $t('settings.menu.account') }}
          </BListGroupItem>
          <BListGroupItem to="/settings/appearance" data-test="settings-list-appearance">
            <i-mdi-palette-outline class="svg-icon me-2" />
            {{ $t('settings.menu.appearance') }}
          </BListGroupItem>
          <BListGroupItem to="/settings/gradido-card" data-test="settings-list-gradido-card">
            <i-mdi-card-account-details-outline class="svg-icon me-2" />
            {{ $t('settings.menu.gradido-card') }}
          </BListGroupItem>
          <BListGroupItem to="/settings/thank-you-card" data-test="settings-list-thank-you-card">
            <i-mdi-credit-card-outline class="svg-icon me-2" />
            {{ $t('thank-you-card.name') }}
          </BListGroupItem>
          <BListGroupItem to="/settings/visibility" data-test="settings-list-visibility">
            <i-mdi-eye-outline class="svg-icon me-2" />
            {{ $t('settings.menu.visibility') }}
          </BListGroupItem>
          <BListGroupItem to="/settings/notifications" data-test="settings-list-notifications">
            <i-mdi-bell-outline class="svg-icon me-2" />
            {{ $t('settings.menu.notifications') }}
          </BListGroupItem>
          <BListGroupItem
            v-if="isCommunityService"
            to="/settings/communities"
            data-test="settings-list-communities"
          >
            <i-mdi-account-group class="svg-icon me-2" />
            {{ $t('settings.community') }}
            <span class="d-block small text-muted ms-4 ps-2">
              {{ $t('settings.menu.communities-note') }}
            </span>
          </BListGroupItem>
        </BListGroup>
      </div>
    </div>
    <div class="d-none d-lg-block">
      <settings-account />
    </div>
  </div>
</template>
<script setup>
import CONFIG from '@/config'
import SettingsAccount from './Account.vue'
import { BListGroup, BListGroupItem } from 'bootstrap-vue-next'

// Read once: the flags are baked in at build time, they cannot change while the app runs.
const isCommunityService = CONFIG.GMS_ACTIVE || CONFIG.HUMHUB_ACTIVE
</script>
<style scoped>
.settings-back {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  font-weight: bold;
}
</style>
