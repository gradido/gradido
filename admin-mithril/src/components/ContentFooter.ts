// AI-GENERATED — not an architecture reference
import classes from '@admin/components/ContentFooter.module.scss'
import { CONFIG } from '@admin/config'
import m, { type ClassComponent } from 'mithril'
import { currentLocale, t } from '@/i18n'

const LINK = 'link-underline link-underline-opacity-0 link-underline-opacity-100-hover'

/** Below every page: the year, the site of the community, and the version on a line of its own. */
export class ContentFooter implements ClassComponent {
  view() {
    return [
      m('hr.mb-0'),
      m(
        'div',
        { class: classes.contentFooter },
        m(
          '.col.mt-4.mb-4',
          m('.copyright.text-center.text-lg-center.text-muted', [
            m('div', [
              t('footer.copyright.year', { year: new Date().getFullYear() }),
              ' ',
              m(
                'a.fw-bold.ms-1',
                { class: LINK, href: `https://gradido.net/${currentLocale()}`, target: '_blank' },
                t('footer.copyright.link'),
              ),
            ]),
            m(
              'div',
              m(
                'a',
                {
                  class: LINK,
                  href: `https://github.com/gradido/gradido/commit/${CONFIG.BUILD_COMMIT}`,
                  target: '_blank',
                },
                t('footer.app_version', { version: CONFIG.APP_VERSION }),
              ),
            ),
          ]),
        ),
      ),
    ]
  }
}
