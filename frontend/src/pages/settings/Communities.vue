<!-- AI-GENERATED — not an architecture reference -->
<template>
  <!-- Only the circles. The member search that stood beside them went with the old GMS: its
       three settings (where you live, how exactly, whether others may find you) are the ones
       the matching asks on its home tab, and that is the one place for them now. This page
       is registered only where HumHub is switched on (routes.js). -->
  <settings-section :title="$t('settings.community')">
    <div class="mt-3">
      <BRow>
        <BCol cols="12" md="6" lg="6">
          <div class="h3">{{ $t('Humhub.title') }}</div>
        </BCol>
        <BCol cols="12" md="6" lg="6" class="text-end">
          <user-settings-switch
            :initial-value="store.humhubAllowed"
            :attr-name="'humhubAllowed'"
            :disabled="isHumhubActivated"
            :enabled-text="$t('settings.humhub.enabled')"
            :disabled-text="$t('settings.humhub.disabled')"
            :not-allowed-text="$t('settings.humhub.delete-disabled')"
            @value-changed="humhubStateSwitch"
          />
        </BCol>
      </BRow>
      <!-- The "how should your name appear" selector is gone (NU-024): what HumHub
           shows is the alias now, full stop. The stored setting keeps steering the
           technical account key over there and stays untouched underneath. -->
      <div class="h4">{{ $t('Humhub.desc') }}</div>
    </div>
  </settings-section>
</template>
<script setup>
import SettingsSection from '@/components/UserSettings/SettingsSection.vue'
import { computed, ref } from 'vue'
import { useWalletStore } from '@/store/useWalletStore'
import UserSettingsSwitch from '@/components/UserSettings/UserSettingsSwitch.vue'
import { BRow, BCol } from 'bootstrap-vue-next'

const store = useWalletStore()

const humhubAllowed = ref(store.humhubAllowed)

const isHumhubActivated = computed(() => humhubAllowed.value === true)

const humhubStateSwitch = (eventData) => {
  humhubAllowed.value = eventData
}
</script>
