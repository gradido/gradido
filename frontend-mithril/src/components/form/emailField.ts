// AI-GENERATED — not an architecture reference
import m from 'mithril'
import type { emailFieldSchema } from '@/data/Form.schema'
import { t } from '@/i18n'
import { Field } from './Field'

/** The field `email` of a form: an address, checked by `schema` (`emailFieldSchema`). */
export function emailField(schema: ReturnType<typeof emailFieldSchema>) {
  return m(Field<typeof schema>, {
    label: t('form.email'),
    name: 'email',
    schema,
    type: 'email',
    placeholder: t('form.email'),
    class: 'rounded-input',
    autocomplete: 'off',
    'data-test': 'input-email',
  })
}
