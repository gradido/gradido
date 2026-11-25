import m from 'mithril'
import * as v from 'valibot'
import { FormField } from './Form'

type Attrs<TSchema extends v.GenericSchema<string, unknown>> = m.Attributes & {
  label: string
  /** the key of the value in what the form sends */
  name: string
  /** of the input, `<name>-input-field` where not set: for two fields of one name on a page */
  id?: string
  /** the rule of this field: `sendSchema.entries.amount`, so that it is the form's own */
  schema: TSchema
  /** what stands in the field at first; the field holds what is typed after */
  defaultValue?: string
  /** for a page that reckons while the member types */
  oninput?: (value: v.InferOutput<TSchema> | undefined) => void
}

/**
 * One field of a form: its label, its input and what is wrong with the value, in the markup
 * the styles are written for (what bootstrap-vue-next drew). It holds its value and checks it
 * itself. Green as soon as what was entered fits; red, with the sentence of the first rule
 * broken, only once the field was left: nobody is told off while typing. Nothing on an empty
 * field that fits. Every other attribute goes to the input (`type`, `placeholder`, …).
 *
 * An amount is a text field (`inputmode: 'decimal'` for the keys of a phone), read by its
 * schema. A `type: 'number'` field reads a comma by the browser and the language of the
 * machine, not of the wallet: Firefox refuses it, Chromium and Safari read `1,5` as 15 where
 * that language is English. And the point every browser gives out there groups thousands in
 * German (`1.555`). Where a field is `type: 'number'` all the same, it needs the `step` of its rule
 * (`step: '0.01'`): it cannot be read off the schema, and the browser checks a number input by
 * its step (1 where none is set) before the form sends -- 1.5 would fit the schema and never
 * reach `onsubmit`.
 */
export class Field<TSchema extends v.GenericSchema<string, unknown>>
  extends FormField
  implements m.ClassComponent<Attrs<TSchema>>
{
  #rawValue: string | undefined
  #touched = false
  #parsedValueResult: v.SafeParseResult<TSchema> | undefined

  oninit({ attrs: { defaultValue } }: m.Vnode<Attrs<TSchema>>) {
    this.#rawValue = defaultValue ?? ''
  }

  /** As of the last draw. */
  isValid() {
    return this.#parsedValueResult?.success ?? false
  }

  setTouched() {
    this.#touched = true
  }

  #getState() {
    if (this.isValid()) {
      return this.#rawValue === '' ? undefined : 'valid'
    }
    return this.#touched ? 'invalid' : undefined
  }

  get value(): v.InferOutput<TSchema> | undefined {
    return this.isValid() ? this.#parsedValueResult?.output : undefined
  }
  get error() {
    return this.#parsedValueResult?.issues ? this.#parsedValueResult.issues[0].message : undefined
  }

  view({
    attrs: { label, schema, oninput, 'data-test': dataTest, ...input },
  }: m.Vnode<Attrs<TSchema>>) {
    this.#parsedValueResult = v.safeParse(schema, this.#rawValue)
    const state = this.#getState()
    const id = input.id ?? `${input.name}-input-field`
    const feedbackId = `${input.id ?? input.name}-feedback`
    return m(
      'div',
      m(
        '.b-form-group',
        { role: 'group', 'data-test': dataTest },
        m('label.form-label.d-block', { for: id }, label),
        m('input.form-control', {
          ...input,
          id,
          value: this.#rawValue,
          class: [state && `is-${state}`, input.class].join(' '),
          'aria-invalid': String(state === 'invalid'),
          'aria-describedby': feedbackId,
          oninput: (event: InputEvent & { target: HTMLInputElement }) => {
            this.#rawValue = event.target.value
            this.#parsedValueResult = v.safeParse(schema, event.target.value)
            oninput?.(this.value)
          },
          onblur: () => this.setTouched(),
        }),
        m('.invalid-feedback', { id: feedbackId }, state === 'invalid' ? this.error : undefined),
      ),
    )
  }
}
