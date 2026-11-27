// AI-GENERATED — not an architecture reference
import m from 'mithril'
import * as v from 'valibot'
import { newPasswordSchema } from '@/data/Form.schema'
import { t } from '@/i18n'
import { PasswordField } from './PasswordField'

/**
 * The password an account is given, typed twice: `newPassword` with every rule a password
 * keeps, and `newPasswordRepeat`, which has to say the same. The browser offers to make one
 * up, and puts no saved one in.
 */
export class NewPasswordFields implements m.ClassComponent {
  #typed = ''

  view() {
    const repeatLabel = t('form.passwordRepeat')
    const repeatSchema = v.pipe(
      v.string(),
      v.nonEmpty(() => t('form.validation.requiredField', { fieldName: repeatLabel })),
      // an empty field is told so above, and not this as well
      v.check(
        (repeated) => repeated === '' || repeated === this.#typed,
        t('site.signup.dont_match'),
      ),
    )
    return m(
      'div',
      m(
        '.row.mb-2',
        m(
          '.col',
          m(PasswordField<typeof newPasswordSchema>, {
            label: t('form.password'),
            name: 'newPassword',
            schema: newPasswordSchema,
            autocomplete: 'new-password',
            oninput: (typed) => {
              this.#typed = typed
            },
          }),
        ),
      ),
      m(
        '.row.mb-2',
        m(
          '.col',
          m(PasswordField<typeof repeatSchema>, {
            label: repeatLabel,
            name: 'newPasswordRepeat',
            schema: repeatSchema,
            autocomplete: 'new-password',
          }),
        ),
      ),
    )
  }
}
