// AI-GENERATED — not an architecture reference

import m from 'mithril'
import * as v from 'valibot'
import { icon } from '@/components/ui/icon'
import { t } from '@/i18n'
import eye from '~icons/bi/eye'
import eyeSlash from '~icons/bi/eye-slash'
import { TypedField } from './Field'
import classes from './PasswordField.module.css'

type Attrs<TSchema extends v.GenericSchema<string, unknown>> = m.Attributes & {
  /** label and placeholder */
  label: string
  /** the key of the value in what the form sends */
  name: string
  schema: TSchema
  /** for a page that holds a second field against this one */
  oninput?: (typed: string) => void
}

/**
 * The field of a password: hidden as it is typed, with an eye that shows it. Green and red as
 * every field (`TypedField`); of a password that does not fit it names every rule broken, not
 * the first alone.
 * Every other attribute goes to the input (`autocomplete`).
 */
export class PasswordField<TSchema extends v.GenericSchema<string, unknown>>
  extends TypedField<TSchema>
  implements m.ClassComponent<Attrs<TSchema>>
{
  #shown = false

  view({ attrs: { label, schema, oninput, ...input } }: m.Vnode<Attrs<TSchema>>) {
    const parsed = this.check(schema)
    const state = this.state
    const id = `${input.name}-input-field`
    const feedbackId = `${input.name}-feedback`
    return m(
      'div',
      { class: classes.inputPassword },
      m(
        '.b-form-group',
        { role: 'group' },
        m('label.form-label.d-block', { for: id }, label),
        // the eye stands inside the field's frame (assets/scss/_reveal-field.scss)
        m(
          '.reveal-field',
          m('input.form-control.rounded-input.password-input', {
            ...input,
            ...this.inputAttrs(schema, id, feedbackId, () => oninput?.(this.typed)),
            type: this.#shown ? 'text' : 'password',
            placeholder: label,
            class: [classes.passwordInput, this.stateClass].join(' '),
            'data-test': 'password-input-field',
          }),
          // named by what it will do
          m(
            'button.btn.reveal-eye',
            {
              type: 'button',
              'aria-label': this.#shown ? t('form.hidePassword') : t('form.showPassword'),
              'data-test': 'password-eye',
              onclick: () => {
                this.#shown = !this.#shown
              },
            },
            icon(this.#shown ? eye : eyeSlash, { class: 'eye-icon' }),
          ),
        ),
        state === 'invalid' && parsed.issues
          ? m(
              '.invalid-feedback.d-block',
              { id: feedbackId },
              parsed.issues.map(({ message }) => m('span', message, ' ', m('br'))),
            )
          : undefined,
      ),
    )
  }
}
