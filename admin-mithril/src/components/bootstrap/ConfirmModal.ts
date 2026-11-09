// AI-GENERATED — not an architecture reference
import m, { type ClassComponent, type Vnode } from 'mithril'
import { t } from '@/i18n'
import { Modal } from './Modal'

interface Attrs {
  title: string
  body: string
  /** the words of the button that agrees */
  yes: string
  variant: 'danger' | 'success'
  onyes: () => void
  onclose: () => void
}

/**
 * The question before a step that cannot simply be taken back, as bootstrap-vue-next's confirm
 * asked it: in the middle of the window, with no ×; Escape and a click beside it are a no.
 */
export class ConfirmModal implements ClassComponent<Attrs> {
  view({ attrs: { title, body, yes, variant, onyes, onclose } }: Vnode<Attrs>) {
    return m(
      Modal,
      {
        title,
        centered: true,
        headerClose: false,
        onclose,
        footer: [
          m(
            'button.btn.btn-md.btn-secondary',
            { type: 'button', onclick: onclose },
            t('overlay.cancel'),
          ),
          m(
            'button.btn.btn-md',
            {
              type: 'button',
              class: `btn-${variant}`,
              onclick: () => {
                onclose()
                onyes()
              },
            },
            yes,
          ),
        ],
      },
      body,
    )
  }
}
