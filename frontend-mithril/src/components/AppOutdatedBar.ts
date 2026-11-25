// AI-GENERATED — not an architecture reference
import classes from '@frontend/components/AppOutdatedBar.module.scss'
import m from 'mithril'
import { t } from '@/i18n'
import { appOutdated } from '@/store/appOutdated'

/**
 * Says that the server runs a newer version than this page (`appOutdated`). The reload is a
 * button, never automatic: whoever is in the middle of a text must be able to copy it first.
 */
export class AppOutdatedBar implements m.ClassComponent {
  view() {
    return appOutdated.value
      ? m(
          '.app-outdated-bar',
          { class: classes['app-outdated-bar'], role: 'alert', 'data-test': 'app-outdated-bar' },
          m('span.app-outdated-text', t('appOutdated.text')),
          m(
            'button.btn.btn-light.btn-sm',
            {
              type: 'button',
              'data-test': 'app-outdated-reload',
              onclick: () => location.reload(),
            },
            t('appOutdated.reload'),
          ),
        )
      : null
  }
}
