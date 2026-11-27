// AI-GENERATED — not an architecture reference
import CONFIG from '@frontend/config'
import m from 'mithril'
import { t } from '@/i18n'

/** The community this wallet belongs to, and the ways on: to its registration, or to another. */
export class RegisterCommunity implements m.ClassComponent {
  view() {
    const wayOn = (href: string, text: string) =>
      m(
        '.row',
        m('.col.text-center', m(m.route.Link, { class: 'btn btn-outline-secondary', href }, text)),
      )
    return m(
      '#register-community',
      m(
        '.p-3',
        m(
          '.container',
          m(
            '.text-center.mb-7.header',
            m(
              '.row.justify-content-center',
              m(
                '.col-md-8.col-lg-6.col-xl-5.px-2',
                m('h1', CONFIG.COMMUNITY_NAME),
                m('p.text-lead', CONFIG.COMMUNITY_DESCRIPTION),
                m('p.text-lead.community-location', CONFIG.COMMUNITY_URL),
              ),
            ),
            wayOn('/register', t('community.continue-to-registration')),
            m('hr'),
            wayOn('/select-community', t('community.choose-another-community')),
            m('hr'),
            wayOn('/login', t('back')),
          ),
        ),
      ),
    )
  }
}
