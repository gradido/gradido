// AI-GENERATED — not an architecture reference
import m, { type ClassComponent } from 'mithril'
import { t } from '@/i18n'

type Variant = 'success' | 'danger' | 'warning'

type Toast = { id: number; variant: Variant; title: string; body: string }

// as long as bootstrap-vue-next showed a toast
const SHOWN_FOR = 5000

let toasts: Toast[] = []
let lastId = 0

const remove = (id: number) => {
  toasts = toasts.filter((toast) => toast.id !== id)
}

const show = (variant: Variant, title: string, message: string) => {
  const id = ++lastId
  // a message the server prefixed, as the old admin cut it off
  toasts.push({ id, variant, title, body: message.replace(/^GraphQL error: /, '') })
  setTimeout(() => {
    remove(id)
    m.redraw()
  }, SHOWN_FOR)
  // also where it is shown after an answer, outside of Mithril's handlers
  m.redraw()
}

export const toastSuccess = (message: string) => show('success', t('success'), message)
export const toastError = (message: string) => show('danger', t('error'), message)
export const toastWarning = (message: string) => show('warning', t('notice'), message)

/** The toasts shown, at the top on the right; drawn once, by the layout. */
export class Toasts implements ClassComponent {
  view() {
    return m(
      '.toast-container.position-fixed.top-0.end-0.p-3',
      toasts.map(({ id, variant, title, body }) =>
        m(
          '.toast.gdd-toaster.show',
          {
            key: id,
            class: `text-bg-${variant}`,
            role: 'alert',
            'aria-live': 'assertive',
            'aria-atomic': 'true',
          },
          [
            m('.toast-header.gdd-toaster-title', [
              m('strong.me-auto', title),
              m('button.btn-close', {
                type: 'button',
                'aria-label': 'Close',
                onclick: () => remove(id),
              }),
            ]),
            m('.toast-body.gdd-toaster-body', body),
          ],
        ),
      ),
    )
  }
}
