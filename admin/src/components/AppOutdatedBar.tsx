// AI-GENERATED — not an architecture reference
import { BButton } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppOutdated } from '@/composables/useAppOutdated'
import classes from './AppOutdatedBar.module.css'

export const AppOutdatedBar = defineComponent({
  name: 'AppOutdatedBar',
  setup() {
    // Shown when the server rejected an operation this bundle sent, which means the tab has been
    // open across a deploy. The reload is a button, never automatic: whoever is mid-contribution
    // must get the chance to copy their text out first.
    const { t } = useI18n()
    const { appOutdated, reloadApp } = useAppOutdated()

    return () =>
      appOutdated.value ? (
        <div class={classes.appOutdatedBar} role='alert' data-test='app-outdated-bar'>
          <span class={classes.appOutdatedText}>{t('appOutdated.text')}</span>
          <BButton size='sm' variant='light' data-test='app-outdated-reload' onClick={reloadApp}>
            {t('appOutdated.reload')}
          </BButton>
        </div>
      ) : null
  },
})
