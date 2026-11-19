// AI-GENERATED — not an architecture reference
import { BCol, BFormRadioGroup, BRow } from 'bootstrap-vue-next'
import { computed, defineComponent, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { LanguageSwitch2 as UserLanguage } from '@/components/LanguageSwitch2'
import { SettingsSection } from '@/components/UserSettings/SettingsSection'
import { useWalletStore } from '@/store/useWalletStore'

export const Appearance = defineComponent({
  name: 'Appearance',
  setup() {
    const { t } = useI18n()
    const store = useWalletStore()

    // Theme mode (system | light | dark): apply immediately, persisted device-local.
    // App.tsx toggles the .dark-mode class from the effective value.
    const themeMode = ref(store.themeMode)

    const themeOptions = computed(() => [
      { value: 'system', text: t('settings.theme.system') },
      { value: 'light', text: t('settings.theme.light') },
      { value: 'dark', text: t('settings.theme.dark') },
    ])

    watch(themeMode, (val) => {
      store.setThemeMode(val)
      store.applyTheme()
    })

    return () => (
      // `overflow-visible`: the card clips (`.gradido-border-radius`), and the language menu
      // opens downwards, taller than what is left of this short card. Clipped, its last
      // languages lay below the card's edge and could not be scrolled into reach.
      <SettingsSection title={t('settings.menu.appearance')} class='overflow-visible'>
        {/* ⚠️ Left, under its own heading. The right-aligned row was a leftover from the old
            settings page, where every line was a label on the left and a control pushed to the
            far right -- with the wide column that put the language picker as far from its own
            label as the page allowed. (Bernd, 24.08.2026: "war noch nie schön".) */}
        <div class='mb-2'>{t('language')}</div>
        <UserLanguage />

        <hr />
        {/* This block used to hang OUTSIDE the tabs, below all of them, because the old page
            had no place for it: neither "personal details" nor "circles" is what it is. It has
            a place now. */}
        <BRow class='mt-3'>
          <BCol cols='12'>
            <div class='mb-2'>{t('settings.theme.title')}</div>
            <BFormRadioGroup
              modelValue={themeMode.value}
              name='theme-mode'
              stacked
              options={themeOptions.value}
              onUpdate:modelValue={(mode) => {
                themeMode.value = mode as typeof themeMode.value
              }}
            />
            <div class='mt-2 text-muted small'>{t('settings.theme.hint')}</div>
          </BCol>
        </BRow>
      </SettingsSection>
    )
  },
})
