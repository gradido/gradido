// AI-GENERATED — not an architecture reference
import m from 'mithril'

type Attrs = m.Attributes & {
  headline: string
  subtitle: string
  /** With both, a button that leads on to the page `linkTo`. */
  buttonText?: string
  linkTo?: string
}

/**
 * What a page says in place of its form once that is done with: that it worked, or why not,
 * and where to go on. Every other attribute goes to the block (`data-test`).
 */
export class Message implements m.ClassComponent<Attrs> {
  view({ attrs: { headline, subtitle, buttonText, linkTo, ...block } }: m.Vnode<Attrs>) {
    return m(
      'div',
      block,
      m(
        '.header.py-lg-6',
        m(
          '.container',
          m(
            '.header-body.text-center.mb-7',
            m('p.h1.test-message-headline', headline),
            m('p.h4.fw-normal.test-message-subtitle', subtitle),
            m('hr'),
            buttonText && linkTo
              ? m(
                  'button.btn.btn-secondary.test-message-button',
                  { type: 'button', onclick: () => m.route.set(linkTo) },
                  buttonText,
                )
              : undefined,
          ),
        ),
      ),
    )
  }
}
