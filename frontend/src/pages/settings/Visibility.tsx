// AI-GENERATED — not an architecture reference
import { BCol, BRow } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { SettingsSection } from '@/components/UserSettings/SettingsSection'
import { UserSettingsSwitch } from '@/components/UserSettings/UserSettingsSwitch'
import { useWalletStore } from '@/store/useWalletStore'

export const Visibility = defineComponent({
  name: 'Visibility',
  setup() {
    const { t } = useI18n()
    const store = useWalletStore()

    return () => (
      <SettingsSection title={t('settings.menu.visibility')}>
        <BRow class='mb-5'>
          <BCol cols='12' md='6' lg='6'>
            {t('settings.avatar.visibility')}
            <div class='small'>{t('settings.avatar.visibilityInfo')}</div>
          </BCol>
          <BCol cols='12' md='6' lg='6' class='text-end'>
            <UserSettingsSwitch
              initialValue={(store.avatarVisibleToMembers as boolean | null) ?? undefined}
              attrName='avatarVisibleToMembers'
              enabledText={t('settings.avatar.enabled')}
              disabledText={t('settings.avatar.disabled')}
            />
          </BCol>
        </BRow>
      </SettingsSection>
    )
  },
})
