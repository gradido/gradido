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
 * own `<select>` opens a list the styles cannot reach. To a screen reader it is a menu of
 * radio entries (`menuitemradio`), the one chosen checked. `onchange` is called with a value
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
      attrs.options.map((option) => {
        // a select locked while its menu is open lets nothing be chosen either
        const disabled = attrs.disabled || option.disabled
        return m(
          'li',
          { role: 'none' },
          m(
            'button.dropdown-item',
            {
              type: 'button',
              role: 'menuitemradio',
              tabindex: -1,
              class: option === chosen ? 'active' : disabled ? 'disabled' : '',
              'aria-checked': String(option === chosen),
              'aria-disabled': disabled ? 'true' : undefined,
              onclick: () => {
                if (!disabled && option !== chosen) {
                  attrs.onchange(option.value)
                }
              },
            },
            option.text,
          ),
        )
      }),
    )
  }
}
