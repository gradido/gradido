// AI-GENERATED — not an architecture reference
import '@admin/components/NotFoundPage.css'
import m, { type ClassComponent } from 'mithril'
import { t } from '@/i18n'
import illustration from './NotFound.svg?raw'

// one step back in the history, from the picture as from the button
const back = (event: Event) => {
  event.preventDefault()
  history.back()
}

/** An address the admin does not know, a page the moderator may not open, and the signing out. */
export class NotFound implements ClassComponent {
  view() {
    return m('div', [
      m(
        '.header.py-1.py-lg-1.pt-lg-3',
        m(
          '.container',
          m(
            '.header-body.text-center.mb-3',
            m(
              'a',
              { href: '#!', onclick: back },
              m(
                '.container',
                m('.row', m('.col-sm-12.col-md-12.mt-5.mb-5', m.trust(illustration))),
              ),
            ),
          ),
        ),
      ),
      m(
        '.text-center',
        m('button.btn.btn-md.btn-light.test-back', { type: 'button', onclick: back }, t('back')),
      ),
    ])
  }
}
