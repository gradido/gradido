// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { SettingsSection } from '@/components/UserSettings/SettingsSection'
import { UserThankYouCard } from '@/components/UserSettings/UserThankYouCard'

export const ThankYouCard = defineComponent({
  name: 'ThankYouCard',
  setup() {
    const { t } = useI18n()

    return () => (
      <SettingsSection title={t('thank-you-card.name')}>
        <UserThankYouCard class='mb-5' />
      </SettingsSection>
    )
  },
})
