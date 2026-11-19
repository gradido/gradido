// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import IMdiArrowLeft from '~icons/mdi/arrow-left'
import classes from './SettingsSection.module.scss'

export const SettingsSection = defineComponent({
  name: 'SettingsSection',
  props: {
    title: { type: String, required: true },
  },
  setup(props, { slots }) {
    const { t } = useI18n()

    return () => (
      <div
        class={[
          'card bg-white gradido-border-radius appBoxShadow p-4 mt--3',
          classes['settings-section'],
        ]}
      >
        {/* Only on the phone. On a wide screen the settings menu stands in the layout column
            to the left and carries its own way back to the account; here the list at /settings
            is the menu, so this is the way back to it. */}
        <RouterLink
          to='/settings'
          class='settings-section-back d-lg-none'
          data-test='back-to-settings'
        >
          <IMdiArrowLeft class='svg-icon' />
          <span class='ms-2'>{t('navigation.back-to-settings')}</span>
        </RouterLink>
        <div class='h2'>{props.title}</div>
        <div class='mt-4'>{slots.default?.()}</div>
      </div>
    )
  },
})
