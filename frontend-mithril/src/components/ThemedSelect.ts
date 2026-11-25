import '@frontend/components/ThemedSelect.scss'
import m from 'mithril'
import { Dropdown } from './Dropdown'

type Attrs<TValue> = {
  value: TValue
  options: { value: TValue; text: string; disabled?: boolean }[]
  onchange: (value: TValue) => void
  /** shown while `value` is none of the options */
  placeholder?: string
  disabled?: boolean
  'data-test'?: string
}

/**
 * A choice of one among `options`, drawn as a dropdown in the theme's colours: the browser's
 * own `<select>` opens a list the styles cannot reach. `onchange` is called with a value
 * other than the one chosen.
 *
 * Drawn as `m(ThemedSelect<Language>, …)`: through `m()` TypeScript loses the type
 * argument, and `onchange` would be handed `unknown`.
 */
export class ThemedSelect<TValue> implements m.ClassComponent<Attrs<TValue>> {
  view({ attrs }: m.Vnode<Attrs<TValue>>) {
    const chosen = attrs.options.find((option) => option.value === attrs.value)
    return m(
      Dropdown,
      {
        class: `themed-select ${chosen ? '' : 'themed-select-placeholder'}`,
        buttonContent: chosen?.text ?? attrs.placeholder,
        buttonClass: 'btn-md btn-outline-secondary themed-select-toggle',
        menuClass: 'themed-select-menu',
        disabled: attrs.disabled,
        'data-test': attrs['data-test'],
      },
      attrs.options.map((option) =>
        m(
          'li',
          { role: 'presentation' },
          m(
            'button.dropdown-item',
            {
              type: 'button',
              role: 'menuitem',
              class: option === chosen ? 'active' : option.disabled ? 'disabled' : '',
              'aria-current': option === chosen ? 'true' : undefined,
              disabled: option.disabled,
              onclick: () => option !== chosen && attrs.onchange(option.value),
            },
            option.text,
          ),
        ),
      ),
    )
  }
}
