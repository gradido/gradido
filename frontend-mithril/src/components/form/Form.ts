import m from 'mithril'
import * as v from 'valibot'

/**
 * What a form asks of a field it draws. A component that is one extends this: by that the
 * form finds it among what it draws (`instanceof`).
 */
export abstract class FormField {
  abstract isValid(): boolean
  abstract setTouched(): void
}

type Attrs<TSchema extends v.GenericSchema> = m.Attributes & {
  /** The rule of the whole form: what is sent goes through it. */
  schema: TSchema
  /** Called with the values as `schema` gives them out. The form is locked while it runs. */
  onsubmit: (values: v.InferOutput<TSchema>) => unknown
  /**
   * The button that sends: `m(BusyButton, { class: 'btn-primary' }, t('form.send_now'))`. The form
   * draws it after the fields, and makes it the one that submits, locks and waits.
   */
  submitBusyButton: m.Vnode<m.Attributes, unknown>
  /**
   * Classes of the place the button stands in, where that is more than the button's own
   * width: `col-12 col-lg-6` in a form that is a `row`.
   */
  submitPlaceClass?: string
}

// What Mithril leaves at a vnode once it is drawn: `state` is a component's instance,
// `instance` what its view gave. Mithril's own types lack `instance` and call a child `any`,
// which would go through unchecked: here each is unknown until it is looked at.
type Drawn = { state?: unknown; children?: unknown; instance?: unknown }

/**
 * The `<form>` around its fields, with the button that sends it. The button is locked until
 * every field fits; a pointer that goes to it, or a finger on it, lets every field say what is wrong
 * with it, also one never entered. Sent by the button or by Enter: the values of the inputs,
 * by their `name`, go through `schema` to `onsubmit`, and the browser does not load the page
 * anew. Every other attribute goes to the form.
 *
 * Drawn as `m(Form<typeof sendSchema>, …)`: only so does `onsubmit` know its values.
 */
export class Form<const TSchema extends v.GenericSchema>
  implements m.ClassComponent<Attrs<TSchema>>
{
  #fields: FormField[] = []
  #valid = false
  #sending = false
  // The place of the button, and whether the pointer was seen outside it since the form came.
  // A pointer resting where the button is drawn (the sign-in, under the button of the page
  // before) did not go to it: its enter tells nothing.
  #place?: Element
  #pointerCame = false
  #moved = (event: PointerEvent) => {
    this.#pointerCame ||= !(event.target instanceof Node && this.#place?.contains(event.target))
  }

  // The fields among what was drawn, also those another component drew.
  #fieldsIn(drawn: unknown): FormField[] {
    if (Array.isArray(drawn)) {
      return drawn.flatMap((child) => this.#fieldsIn(child))
    }
    if (typeof drawn !== 'object' || drawn === null) {
      return []
    }
    const vnode: Drawn = drawn
    return vnode.state instanceof FormField
      ? [vnode.state]
      : this.#fieldsIn(vnode.instance ?? vnode.children)
  }

  // The fields exist only once they are drawn: the form looks after each draw, and draws
  // once more where the button has to change.
  #check({ instance }: Drawn) {
    this.#fields = this.#fieldsIn(instance)
    const valid = this.#fields.every((field) => field.isValid())
    if (valid !== this.#valid) {
      this.#valid = valid
      m.redraw()
    }
  }

  oncreate(vnode: m.VnodeDOM<Attrs<TSchema>>) {
    this.#check(vnode)
    document.addEventListener('pointermove', this.#moved)
  }

  onremove() {
    document.removeEventListener('pointermove', this.#moved)
  }

  onupdate(vnode: m.VnodeDOM<Attrs<TSchema>>) {
    this.#check(vnode)
  }

  #touchAll() {
    for (const field of this.#fields) {
      field.setTouched()
    }
  }

  view({
    attrs: { schema, onsubmit, submitBusyButton, submitPlaceClass, ...form },
    children,
  }: m.Vnode<Attrs<TSchema>>) {
    return m(
      'form',
      {
        ...form,
        onsubmit: async (event: SubmitEvent & { currentTarget: HTMLFormElement }) => {
          event.preventDefault()
          this.#touchAll()
          // asked of the fields now: `#valid` is as of the last draw, and Enter may come
          // before the next
          if (this.#sending || !this.#fields.every((field) => field.isValid())) {
            return
          }
          // throws where the fields let through what the form's schema does not: the two
          // have run apart
          const values = v.parse(schema, Object.fromEntries(new FormData(event.currentTarget)))
          this.#sending = true
          try {
            await onsubmit(values)
          } finally {
            this.#sending = false
            // Mithril redraws after a handler's promise only where it is fulfilled: after a
            // throw the button would stay locked
            m.redraw()
          }
        },
      },
      children,
      // a locked button tells of no pointer: the span around it does
      m(
        'span.d-inline-block',
        {
          class: submitPlaceClass,
          oncreate: ({ dom }: m.VnodeDOM) => {
            this.#place = dom
          },
          onpointerenter: () => this.#pointerCame && this.#touchAll(),
          onpointerdown: () => this.#touchAll(),
        },
        {
          ...submitBusyButton,
          attrs: {
            ...submitBusyButton.attrs,
            type: 'submit',
            busy: this.#sending,
            disabled: !this.#valid,
          },
        },
      ),
    )
  }
}
