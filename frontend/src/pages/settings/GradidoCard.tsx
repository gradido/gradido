// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { SettingsSection } from '@/components/UserSettings/SettingsSection'
import { UserGradidoCard } from '@/components/UserSettings/UserGradidoCard'

export const GradidoCard = defineComponent({
  name: 'GradidoCard',
  setup() {
    const { t } = useI18n()

    return () => (
      <SettingsSection title={t('settings.menu.gradido-card')}>
        <UserGradidoCard class='mb-5' />
      </SettingsSection>
    )
  },
})
