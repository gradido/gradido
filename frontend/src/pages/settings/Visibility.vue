<!-- AI-GENERATED — not an architecture reference -->
<template>
  <settings-section :title="$t('settings.menu.visibility')">
    <BRow class="mb-5">
      <BCol cols="12" md="6" lg="6">
        {{ $t('settings.avatar.visibility') }}
        <div class="small">{{ $t('settings.avatar.visibilityInfo') }}</div>
      </BCol>
      <BCol cols="12" md="6" lg="6" class="text-end">
        <user-settings-switch
          :initial-value="state.avatarVisibleToMembers"
          :attr-name="'avatarVisibleToMembers'"
          :enabled-text="$t('settings.avatar.enabled')"
          :disabled-text="$t('settings.avatar.disabled')"
        />
      </BCol>
    </BRow>
  </settings-section>
</template>
<script setup>
import SettingsSection from '@/components/UserSettings/SettingsSection.vue'
import { useStore } from 'vuex'
import UserSettingsSwitch from '@/components/UserSettings/UserSettingsSwitch.vue'
import { BRow, BCol } from 'bootstrap-vue-next'

const store = useStore()
const state = store.state
</script>
