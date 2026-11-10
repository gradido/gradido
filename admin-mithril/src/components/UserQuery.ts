// AI-GENERATED — not an architecture reference
import classes from '@admin/components/UserQuery.module.css'
import m, { type ClassComponent, type Vnode } from 'mithril'
import { t } from '@/i18n'
import closeIcon from '~icons/ic/baseline-close'

interface Attrs {
  value: string
  oninput: (value: string) => void
  placeholder?: string
  class?: string
}

/** The search field with its ×, which empties it. */
export class UserQuery implements ClassComponent<Attrs> {
  view({ attrs: { value, oninput, placeholder, class: className } }: Vnode<Attrs>) {
    return m(
      'div',
      { class: className },
      m('.d-flex', { class: classes.field }, [
        m('input.form-control.test-input-criteria', {
          type: 'text',
          placeholder: placeholder || t('user_search'),
          value,
          oninput: (event: Event) => oninput((event.target as HTMLInputElement).value),
        }),
        m(
          'button.btn.test-click-clear-criteria',
          {
            type: 'button',
            class: classes.clearButton,
            'aria-label': t('search.clear'),
            title: t('search.clear'),
            onclick: () => oninput(''),
          },
          m.trust(closeIcon.replace('<svg ', '<svg aria-hidden="true" ')),
        ),
      ]),
    )
  }
}
