// AI-GENERATED — not an architecture reference
import classes from '@admin/components/AppOutdatedBar.module.css'
import m, { type ClassComponent } from 'mithril'
import { t } from '@/i18n'
import { appOutdated } from '@/store/appOutdated.store'

/**
 * A newer version is out, and the server no longer takes what this one asks. The reload is a
 * button, never automatic: whoever is in the middle of a text must be able to copy it out first.
 */
export class AppOutdatedBar implements ClassComponent {
  view() {
    return appOutdated.value
      ? m(
          'div',
          { class: classes.appOutdatedBar, role: 'alert', 'data-test': 'app-outdated-bar' },
          [
            m('span', { class: classes.appOutdatedText }, t('appOutdated.text')),
            m(
              'button.btn.btn-sm.btn-light',
              {
                type: 'button',
                'data-test': 'app-outdated-reload',
                onclick: () => location.reload(),
              },
              t('appOutdated.reload'),
            ),
          ],
        )
      : null
  }
}
