<!-- AI-GENERATED — not an architecture reference -->
<template>
  <settings-section :title="$t('settings.menu.appearance')">
    <!-- ⚠️ Left, under its own heading. The right-aligned row was a leftover from the old
         settings page, where every line was a label on the left and a control pushed to the
         far right -- with the wide column that put the language picker as far from its own
         label as the page allowed. (Bernd, 24.08.2026: "war noch nie schön".) -->
    <div class="mb-2">{{ $t('language') }}</div>
    <user-language />

    <hr />
    <!-- This block used to hang OUTSIDE the tabs, below all of them, because the old page
         had no place for it: neither "personal details" nor "circles" is what it is. It has
         a place now. -->
    <BRow class="mt-3">
      <BCol cols="12">
        <div class="mb-2">{{ $t('settings.theme.title') }}</div>
        <BFormRadioGroup v-model="themeMode" name="theme-mode" stacked :options="themeOptions" />
        <div class="mt-2 text-muted small">{{ $t('settings.theme.hint') }}</div>
      </BCol>
    </BRow>
  </settings-section>
</template>
<script setup>
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useI18n } from 'vue-i18n'
import SettingsSection from '@/components/UserSettings/SettingsSection.vue'
import UserLanguage from '@/components/LanguageSwitch2.vue'
import { BRow, BCol, BFormRadioGroup } from 'bootstrap-vue-next'

const { t } = useI18n()
const store = useStore()

// Theme mode (system | light | dark): apply immediately, persisted device-local.
// App.vue toggles the .dark-mode class from the effective value.
const themeMode = ref(store.state.themeMode)

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
