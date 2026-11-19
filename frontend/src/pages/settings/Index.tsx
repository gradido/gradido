// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { SettingsMenu } from '@/components/Menu/SettingsMenu'
import IMdiArrowLeft from '~icons/mdi/arrow-left'
import { Account as SettingsAccount } from './Account'
import classes from './Index.module.scss'

export const SettingsIndex = defineComponent({
  name: 'SettingsIndex',
  setup() {
    const { t } = useI18n()

    return () => (
      <div class={classes['settings-index']}>
        {/* ⭐ Two breakpoints, no router trick. A redirect cannot know the screen width, and a
            width check at navigation time is wrong again as soon as the device is turned. The
            layout works this way throughout: below 992px the menu column is gone, so here the
            LIST is the page; above it the menu stands to the left and this shows the first
            section, exactly as the account tab used to open. */}
        <div class='d-lg-none'>
          <div class='card bg-white gradido-border-radius appBoxShadow py-4 px-0 mt--3'>
            {/* ⛔ By PATH: the route at /overview carries no name and the named form throws. */}
            <RouterLink
              to='/overview'
              class='settings-back px-4'
              data-test='settings-back-to-account'
            >
              <IMdiArrowLeft class='svg-icon' />
              <span class='ms-2'>{t('navigation.back-to-account')}</span>
            </RouterLink>
            <SettingsMenu class='is-page' />
          </div>
        </div>
        <div class='d-none d-lg-block'>
          <SettingsAccount />
        </div>
      </div>
    )
  },
})
