import m from 'mithril'
import { t } from '@/i18n'

type Toast = { id: number; variant: 'success' | 'danger' | 'warning'; title: string; text: string }

// as long as the old wallet showed one
const SHOWN_MS = 5000
// where a toast waits for the page loaded next
const AFTER_RELOAD_KEY = 'gradido-toast-after-reload'

let shown: Toast[] = []
let lastId = 0

function remove(id: number) {
  shown = shown.filter((toast) => toast.id !== id)
  m.redraw()
}

function show(variant: Toast['variant'], title: string, text: string) {
  const id = ++lastId
  shown.push({ id, variant, title, text })
  setTimeout(remove, SHOWN_MS, id)
  // also where it is shown after an answer, outside of Mithril's handlers
  m.redraw()
}

export function toastSuccess(text: string) {
  show('success', t('success'), text)
}

export function toastError(text: string) {
  show('danger', t('message.errorTitle'), text)
}

export function toastInfo(text: string) {
  show('warning', t('info'), text)
}

/**
 * An error toast for what ends in a reload -- a session that ended: the page loaded next shows
 * it. In sessionStorage, which is this tab's and survives the reload.
 */
export function toastErrorAfterReload(text: string) {
  sessionStorage.setItem(AFTER_RELOAD_KEY, text)
}

/**
 * The toasts shown, at the top on the right, in the markup the styles are written for (what
 * bootstrap-vue-next drew). Mounted once, by main.ts, beside the pages: a toast outlives the
 * page that showed it.
 */
export class Toasts implements m.ClassComponent {
  oninit() {
    const waiting = sessionStorage.getItem(AFTER_RELOAD_KEY)
    if (waiting) {
      sessionStorage.removeItem(AFTER_RELOAD_KEY)
      toastError(waiting)
    }
  }

  view() {
    return m(
      '.top-0.end-0.toast-container.position-fixed.p-3',
      shown.map(({ id, variant, title, text }) =>
        // the span keeps two toasts as close as they stood: the container's gap is for blocks
        m(
          'span',
          { key: id },
          m(
            '.toast.gdd-toaster.show.fade',
            {
              class: `text-bg-${variant}`,
              role: 'alert',
              'aria-live': 'assertive',
              'aria-atomic': 'true',
            },
            m(
              '.toast-header.gdd-toaster-title',
              m('strong.me-auto', title),
              m('button.btn-close', {
                type: 'button',
                'aria-label': 'Close',
                onclick: () => remove(id),
              }),
            ),
            m(
              '.toast-body',
              { class: variant === 'warning' ? 'gdd-toaster-body-darken' : 'gdd-toaster-body' },
              text,
            ),
          ),
        ),
      ),
    )
  }
}
