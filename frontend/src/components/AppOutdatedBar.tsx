// AI-GENERATED — not an architecture reference
import { BButton } from 'bootstrap-vue-next'
import { defineComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAppOutdated } from '@/composables/useAppOutdated'
import classes from './AppOutdatedBar.module.scss'

// Shown when this bundle is no longer the one the server is working with. Two things raise
// it: apolloProvider, when an operation is rejected because the schema moved under an open
// tab -- and newVersionCheck, which asks for index.html now and then and finds a newer build
// being served. The second is the common one and it means nothing is broken yet, so the text
// stays an offer rather than an error.
//
// The reload is a button, never automatic: whoever is mid-contribution must get the chance to
// copy their text out first.
export const AppOutdatedBar = defineComponent({
  name: 'AppOutdatedBar',
  setup() {
    const { t } = useI18n()
    const { appOutdated, reloadApp } = useAppOutdated()

    return () =>
      appOutdated.value ? (
        <div
          class={['app-outdated-bar', classes['app-outdated-bar']]}
          role='alert'
          data-test='app-outdated-bar'
        >
          <span class='app-outdated-text'>{t('appOutdated.text')}</span>
          <BButton size='sm' variant='light' data-test='app-outdated-reload' onClick={reloadApp}>
            {t('appOutdated.reload')}
          </BButton>
        </div>
      ) : null
  },
})
