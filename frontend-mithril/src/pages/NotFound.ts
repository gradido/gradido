// AI-GENERATED — not an architecture reference
// the swing of the drawing's parts, by their ids
import './NotFound.css'
import m from 'mithril'
import { t } from '@/i18n'
import { openedBefore } from '@/router'
import drawing from './NotFound.svg?raw'

/** What every address the wallet does not know shows: a drawing, and the way back. */
export class NotFound implements m.ClassComponent {
  // Back to the page of the wallet before this one. Where the wallet started here there is
  // none: on to the overview, which asks for the sign-in.
  #back() {
    if (openedBefore()) {
      history.back()
    } else {
      m.route.set('/overview')
    }
  }

  view() {
    return m(
      'div',
      m(
        '.header.py-1.py-lg-1.pt-lg-3',
        m(
          '.container',
          m(
            '.header-body.text-center.mb-3',
            // the drawing leads back as well
            m(
              'a',
              {
                href: '/overview',
                'aria-label': t('back'),
                onclick: (event: MouseEvent) => {
                  event.preventDefault()
                  this.#back()
                },
              },
              m('.container', m('.row', m('.col-sm-12.col-md-12.mt-5.mb-5', m.trust(drawing)))),
            ),
          ),
        ),
      ),
      m(
        '.text-center',
        m(
          'button.btn.btn-light.test-back',
          { type: 'button', onclick: () => this.#back() },
          t('back'),
        ),
      ),
    )
  }
}
