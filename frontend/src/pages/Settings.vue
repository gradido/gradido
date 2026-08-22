<template>
  <div class="card bg-white gradido-border-radius appBoxShadow p-4 mt--3">
    <BTabs :model-value="tabIndex" content-class="mt-3" @update:modelValue="tabIndex = $event">
      <BTab :title="$t('PersonalDetails')">
        <div class="h2">{{ $t('PersonalDetails') }}</div>
        <div class="my-4 small">
          {{ $t('settings.info') }}
        </div>

        <settings-account />
        <hr />
        <settings-appearance />
        <hr />
        <settings-notifications />
        <hr />
        <settings-visibility />
        <hr />
        <settings-gradido-card />
        <hr />
        <settings-thank-you-card />
      </BTab>
      <BTab
        v-if="isCommunityService"
        class="community-service-tabs"
        :title="$t('settings.community')"
      >
        <settings-communities />
      </BTab>
    </BTabs>

    <BRow class="mt-3">
      <BCol cols="12">
        <div class="mb-2">{{ $t('settings.theme.title') }}</div>
        <BFormRadioGroup v-model="themeMode" name="theme-mode" stacked :options="themeOptions" />
        <div class="mt-2 text-muted small">{{ $t('settings.theme.hint') }}</div>
      </BCol>
    </BRow>
  </div>
</template>
<script setup>
import CONFIG from '../config'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import SettingsAccount from './settings/Account.vue'
import SettingsAppearance from './settings/Appearance.vue'
import SettingsNotifications from './settings/Notifications.vue'
import SettingsVisibility from './settings/Visibility.vue'
import SettingsGradidoCard from './settings/GradidoCard.vue'
import SettingsThankYouCard from './settings/ThankYouCard.vue'
import SettingsCommunities from './settings/Communities.vue'
import { BTabs, BTab, BRow, BCol, BFormRadioGroup } from 'bootstrap-vue-next'

const props = defineProps({
  balance: { type: Number, default: 0 },
  transactionCount: { type: Number, default: 0 },
})

const route = useRoute()
const { t } = useI18n()
const store = useStore()
const state = store.state

const themeMode = ref(state.themeMode)

let tabIndex = 0
if (route.params.tabAlias === 'extern') {
  tabIndex = 1
}

// setting if gms and/or humhub are enabled in frontend config .env
const isCommunityService = CONFIG.GMS_ACTIVE || CONFIG.HUMHUB_ACTIVE

// Theme mode (system | light | dark): apply immediately, persisted device-local.
// App.vue toggles the .dark-mode class from the effective value.
const themeOptions = computed(() => [
  { value: 'system', text: t('settings.theme.system') },
  { value: 'light', text: t('settings.theme.light') },
  { value: 'dark', text: t('settings.theme.dark') },
])

watch(themeMode, (val) => {
  store.commit('setThemeMode', val)
  store.dispatch('applyTheme')
})
</script>
<style>
.card-border-radius {
  border-radius: 0 5px 5px 0 !important;
}

@media screen and (width <= 1235px) {
  .card-border-radius {
    border-radius: 0 !important;
  }
}

.card-background-gray {
  background-color: #ebebeba3 !important;
}
</style>
<style scoped>
:deep(.form-label) {
  padding-bottom: 0;
}

:deep(.nav-link) {
  color: #383838 !important;
}

:deep(.nav-link.active) {
  color: #525f7f !important;
}
</style>
