import m from 'mithril'
import { t } from '@/i18n'
import { Modal } from './Modal'

type Attrs = {
  title: string
  /** the words of the button that agrees */
  yes: string
  /** the words of the button that does not; "Cancel" where not set */
  no?: string
  /** the colour of the button that agrees; primary where not set */
  variant?: 'primary' | 'danger' | 'success'
  onyes: () => void
  onclose: () => void
}

/**
 * The question before a step that cannot simply be taken back: its children in the middle of
 * the screen, a button that agrees and one that does not. Escape and a click beside it are a no.
 */
export class ConfirmModal implements m.ClassComponent<Attrs> {
  view({ attrs, children }: m.Vnode<Attrs>) {
    return m(
      Modal,
      {
        title: attrs.title,
        centered: true,
        alert: true,
        onclose: attrs.onclose,
        footer: [
          m(
            'button.btn.btn-md.btn-secondary',
            // a step that cannot be taken back: the focus starts at the button that does not
            { type: 'button', autofocus: true, onclick: attrs.onclose },
            attrs.no ?? t('form.cancel'),
          ),
          m(
            'button.btn.btn-md',
            {
              type: 'button',
              class: `btn-${attrs.variant ?? 'primary'}`,
              onclick: () => {
                attrs.onclose()
                attrs.onyes()
              },
            },
            attrs.yes,
          ),
        ],
      },
      children,
    )
  }
}
