// AI-GENERATED — not an architecture reference
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import IHumbleiconsLogout from '~icons/humbleicons/logout'
import IMdiArrowLeft from '~icons/mdi/arrow-left'
import { SettingsMenu } from './SettingsMenu'
import classes from './SettingsSidebar.module.scss'

export const SettingsSidebar = defineComponent({
  name: 'SettingsSidebar',
  props: {
    shadow: { type: Boolean, default: true },
  },
  emits: ['logout'],
  setup(props, { emit }) {
    const { t } = useI18n()

    // The same shell and the same id as the main menu on purpose: the dark-mode rules for
    // menu text hang off #component-sidebar (gradido-template-dark.scss), and the two never
    // stand side by side -- the layout column shows one or the other.
    return () => (
      <div id='component-sidebar' class={classes.settingsSidebar}>
        <div
          id='side-menu'
          class={['gradido-border-radius pt-2 bg-white', props.shadow ? 'app-box-shadow' : '']}
        >
          <div class='mb-3 mt-3'>
            {/* ⛔ By PATH, not by name: the route at /overview carries no name -- `name: 'Overview'`
                in Overview.vue is the component's name and has nothing to do with routing -- and the
                named form throws. Every other link to the overview in this wallet is written this way. */}
            <RouterLink to='/overview' class='settings-back' data-test='settings-back-to-account'>
              <IMdiArrowLeft class='svg-icon' />
              <span class='ms-2'>{t('navigation.back-to-account')}</span>
            </RouterLink>
            <hr class='m-3' />

            <SettingsMenu />

            {/* ⛔ The one item of the main menu that has to come along. While a settings route is
                open this menu stands in the main one's place, so everything it offered is out of
                reach until one goes back -- acceptable for "overview", which is one arrow away,
                and not acceptable for signing out. Found by the end-to-end test. */}
            <hr class='m-3' />
            {/* ⚠️ A button, not an anchor without an href: signing out is an action, and an
                anchor with nothing to point at is neither reachable by keyboard nor announced
                as something one can press. */}
            <button
              type='button'
              class='settings-logout'
              data-test='logout-menu'
              onClick={() => emit('logout')}
            >
              <IHumbleiconsLogout class='svg-icon' />
              <span class='ms-2'>{t('navigation.logout')}</span>
            </button>
          </div>
        </div>
      </div>
    )
  },
})
