// AI-GENERATED — not an architecture reference
import { BCol, BRow } from 'bootstrap-vue-next'
import { computed, defineComponent, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { SettingsSection } from '@/components/UserSettings/SettingsSection'
import { UserSettingsSwitch } from '@/components/UserSettings/UserSettingsSwitch'
import { useWalletStore } from '@/store/useWalletStore'

export const Communities = defineComponent({
  name: 'Communities',
  setup() {
    const { t } = useI18n()
    const store = useWalletStore()

    const humhubAllowed = ref<boolean | null>(store.humhubAllowed)

    const isHumhubActivated = computed(() => humhubAllowed.value === true)

    const humhubStateSwitch = (eventData: boolean) => {
      humhubAllowed.value = eventData
    }

    return () => (
      // Only the circles. The member search that stood beside them went with the old GMS: its
      // three settings (where you live, how exactly, whether others may find you) are the ones
      // the matching asks on its home tab, and that is the one place for them now. This page
      // is registered only where HumHub is switched on (routes.js).
      <SettingsSection title={t('settings.community')}>
        <div class='mt-3'>
          <BRow>
            <BCol cols='12' md='6' lg='6'>
              <div class='h3'>{t('Humhub.title')}</div>
            </BCol>
            <BCol cols='12' md='6' lg='6' class='text-end'>
              <UserSettingsSwitch
                initialValue={(store.humhubAllowed as boolean | null) ?? undefined}
                attrName='humhubAllowed'
                disabled={isHumhubActivated.value}
                enabledText={t('settings.humhub.enabled')}
                disabledText={t('settings.humhub.disabled')}
                notAllowedText={t('settings.humhub.delete-disabled')}
                onValue-changed={humhubStateSwitch}
              />
            </BCol>
          </BRow>
          {/* The "how should your name appear" selector is gone (NU-024): what HumHub
              shows is the alias now, full stop. The stored setting keeps steering the
              technical account key over there and stays untouched underneath. */}
          <div class='h4'>{t('Humhub.desc')}</div>
        </div>
      </SettingsSection>
    )
  },
})
