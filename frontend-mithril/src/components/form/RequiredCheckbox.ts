// AI-GENERATED — not an architecture reference
import m from 'mithril'
import { FormField } from './Form'

type Attrs = {
  id: string
  /** the key under which the form sends `true` */
  name: string
  class?: string
}

/** A box that has to be ticked before its form is sent: a consent. Its children are the label. */
export class RequiredCheckbox extends FormField implements m.ClassComponent<Attrs> {
  #checked = false

  isValid() {
    return this.#checked
  }

  setTouched() {
    // nothing to say: the locked button says it
  }

  view({ attrs: { id, name, class: place }, children }: m.Vnode<Attrs>) {
    return m(
      '.form-check',
      { class: place },
      m('input.form-check-input', {
        id,
        name,
        type: 'checkbox',
        value: 'true',
        checked: this.#checked,
        class: this.#checked ? 'is-valid' : undefined,
        onchange: (event: Event & { target: HTMLInputElement }) => {
          this.#checked = event.target.checked
        },
      }),
      m('label.form-check-label', { for: id }, children),
    )
  }
}
