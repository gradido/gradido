<!-- AI-GENERATED — not an architecture reference -->
<template>
  <settings-section :title="$t('settings.community')">
    <div v-if="isHumhub" class="mt-3">
      <BRow>
        <BCol cols="12" md="6" lg="6">
          <div class="h3">{{ $t('Humhub.title') }}</div>
        </BCol>
        <BCol cols="12" md="6" lg="6" class="text-end">
          <user-settings-switch
            :initial-value="state.humhubAllowed"
            :attr-name="'humhubAllowed'"
            :disabled="isHumhubActivated"
            :enabled-text="$t('settings.humhub.enabled')"
            :disabled-text="$t('settings.humhub.disabled')"
            :not-allowed-text="$t('settings.humhub.delete-disabled')"
            @value-changed="humhubStateSwitch"
          />
        </BCol>
      </BRow>
      <div class="h4">{{ $t('Humhub.desc') }}</div>
      <BRow v-if="humhubAllowed" class="mb-4 humhub-publish-name-row">
        <BCol cols="12" md="6" lg="6">
          {{ $t('settings.humhub.naming-format') }}
        </BCol>
        <BCol cols="12" md="6" lg="6">
          <user-naming-format
            :initial-value="state.humhubPublishName"
            :attr-name="'humhubPublishName'"
            :success-message="$t('settings.humhub.publish-name.updated')"
          />
        </BCol>
      </BRow>
    </div>
    <div v-if="isGMS" class="mt-3">
      <BRow>
        <BCol cols="12" md="6" lg="6">
          <div class="h3">{{ $t('GMS.title') }}</div>
        </BCol>
        <BCol cols="12" md="6" lg="6" class="text-start">
          <user-settings-switch
            :initial-value="state.gmsAllowed"
            :attr-name="'gmsAllowed'"
            :enabled-text="$t('settings.GMS.enabled')"
            :disabled-text="$t('settings.GMS.disabled')"
            @value-changed="gmsStateSwitch"
          />
        </BCol>
      </BRow>
      <div class="h4 mt-3">{{ $t('GMS.desc') }}</div>
      <div v-if="gmsAllowed">
        <BRow class="mb-4">
          <BCol cols="12" md="6" lg="6">
            {{ $t('settings.GMS.naming-format') }}
          </BCol>
          <BCol cols="12" md="6" lg="6">
            <user-naming-format
              :initial-value="state.gmsPublishName"
              :attr-name="'gmsPublishName'"
              :success-message="$t('settings.GMS.publish-name.updated')"
            />
          </BCol>
        </BRow>
        <BRow class="mb-4">
          <BCol cols="12" md="6" lg="6">
            {{ $t('settings.GMS.location-format') }}
          </BCol>
          <BCol cols="12" md="6" lg="6">
            <user-g-m-s-location-format />
          </BCol>
        </BRow>
        <BRow class="mb-5">
          <BCol cols="12" md="6" lg="6">
            {{ $t('settings.GMS.location.label') }}
          </BCol>
          <BCol cols="12" md="6" lg="6">
            <user-gms-location-capturing />
          </BCol>
        </BRow>
      </div>
    </div>
    <div v-else>
      <BRow>
        <BCol cols="12" md="6" lg="6">
          <div class="h3 text-muted">{{ $t('GMS.title') }}</div>
        </BCol>
        <BCol cols="12" md="6" lg="6" class="text-end">
          <user-settings-switch :disabled="true" />
        </BCol>
      </BRow>
      <div class="h4 mt-3 text-muted">{{ $t('GMS.desc') }}</div>
    </div>
  </settings-section>
</template>
<script setup>
import SettingsSection from '@/components/UserSettings/SettingsSection.vue'
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import CONFIG from '@/config'
import UserSettingsSwitch from '@/components/UserSettings/UserSettingsSwitch.vue'
import UserNamingFormat from '@/components/UserSettings/UserNamingFormat'
import UserGMSLocationFormat from '@/components/UserSettings/UserGMSLocationFormat'
import UserGmsLocationCapturing from '@/components/UserSettings/UserGmsLocationCapturing'
import { BRow, BCol } from 'bootstrap-vue-next'

const store = useStore()
const state = store.state

const gmsAllowed = ref(state.gmsAllowed)
const humhubAllowed = ref(state.humhubAllowed)

const isHumhubActivated = computed(() => humhubAllowed.value === true)

// setting if gms and/or humhub are enabled in frontend config .env
const isGMS = CONFIG.GMS_ACTIVE
const isHumhub = CONFIG.HUMHUB_ACTIVE

const gmsStateSwitch = (eventData) => {
  gmsAllowed.value = eventData
}

const humhubStateSwitch = (eventData) => {
  humhubAllowed.value = eventData
}
</script>
