// AI-GENERATED — not an architecture reference
import '@admin/components/ThemedSelect.scss'
import m, { type ClassComponent, type Vnode } from 'mithril'
import { Dropdown } from '@/components/bootstrap/Dropdown'

export type Option = { value: string; text: string }

interface Attrs {
  value: string
  options: Option[]
  onchange: (value: string) => void
  class?: string
  'data-test'?: string
  size?: 'sm' | 'md'
  /** the name of the button, where no word beside it names the choice */
  label?: string
}

/**
 * A select whose open list is plain HTML: a native one is painted by the browser in the colours
 * of the system, and the light admin showed a dark list on a Mac.
 */
export class ThemedSelect implements ClassComponent<Attrs> {
  view({
    attrs: { value, options, onchange, class: className, 'data-test': test, size, label },
  }: Vnode<Attrs>) {
    const chosen = options.find((option) => option.value === value)
    return m(
      Dropdown,
      {
        class: ['themed-select', chosen ? '' : 'themed-select-placeholder', className].join(' '),
        'data-test': test,
        toggle: chosen?.text ?? '',
        toggleClass: 'btn-outline-secondary themed-select-toggle',
        size,
        label,
      },
      options.map((option) =>
        m(
          'li',
          { role: 'presentation' },
          m(
            'button.dropdown-item',
            {
              type: 'button',
              role: 'menuitem',
              class: option.value === value ? 'active' : '',
              'aria-current': option.value === value ? 'true' : undefined,
              onclick: () => option.value !== value && onchange(option.value),
            },
            option.text,
          ),
        ),
      ),
    )
  }
}
