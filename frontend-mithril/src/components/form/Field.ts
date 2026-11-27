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
 * What every field a member types into holds: what is typed, whether it was left, and what its
 * schema says of it. Green as soon as what was entered fits; red only once the field was left:
 * nobody is told off while typing. Nothing on an empty field that fits. The field draws itself
 * and hands its input `inputAttrs`.
 */
export abstract class TypedField<
  TSchema extends v.GenericSchema<string, unknown>,
> extends FormField {
  protected typed = ''
  #touched = false
  #parsed: v.SafeParseResult<TSchema> | undefined

  /** As of the last draw, or of the last key. */
  isValid() {
    return this.#parsed?.success ?? false
  }

  setTouched() {
    this.#touched = true
  }

  /** Checks what is typed: first thing in `view`. */
  protected check(schema: TSchema) {
    this.#parsed = v.safeParse(schema, this.typed)
    return this.#parsed
  }

  protected get state() {
    if (this.isValid()) {
      return this.typed === '' ? undefined : 'valid'
    }
    return this.#touched ? 'invalid' : undefined
  }

  /** The state as Bootstrap's class, named whole: PurgeCSS keeps only names it finds. */
  protected get stateClass() {
    return { valid: 'is-valid', invalid: 'is-invalid', none: '' }[this.state ?? 'none']
  }

  /** What makes an input this field's; `typed` hears every key, with its check. */
  protected inputAttrs(
    schema: TSchema,
    id: string,
    feedbackId: string,
    typed: (parsed: v.SafeParseResult<TSchema>) => void,
  ) {
    return {
      id,
      value: this.typed,
      'aria-invalid': String(this.state === 'invalid'),
      'aria-describedby': feedbackId,
      oninput: (event: InputEvent & { target: HTMLInputElement }) => {
        this.typed = event.target.value
        // at once: Enter may come before the next draw
        typed(this.check(schema))
      },
      onblur: () => this.setTouched(),
    }
  }
}

/**
 * One field of a form: its label, its input and what is wrong with the value, in the markup
 * the styles are written for (what bootstrap-vue-next drew). It holds its value and checks it
 * itself (`TypedField`); red with the sentence of the first rule broken. Every other attribute
 * goes to the input (`type`, `placeholder`, …).
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
  extends TypedField<TSchema>
  implements m.ClassComponent<Attrs<TSchema>>
{
  oninit({ attrs: { defaultValue } }: m.Vnode<Attrs<TSchema>>) {
    this.typed = defaultValue ?? ''
  }

  view({
    attrs: { label, schema, oninput, 'data-test': dataTest, ...input },
  }: m.Vnode<Attrs<TSchema>>) {
    const parsed = this.check(schema)
    const state = this.state
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
          ...this.inputAttrs(schema, id, feedbackId, (now) =>
            oninput?.(now.success ? now.output : undefined),
          ),
          class: [this.stateClass, input.class].join(' '),
        }),
        m(
          '.invalid-feedback',
          { id: feedbackId },
          state === 'invalid' ? parsed.issues?.[0].message : undefined,
        ),
      ),
    )
  }
}
