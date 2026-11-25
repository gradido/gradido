// AI-GENERATED — not an architecture reference
import { expect, it, mock } from 'bun:test'
import m from 'mithril'
import { ThemedSelect } from './ThemedSelect'

const options = [
  { value: 'red', text: 'Red' },
  { value: 'green', text: 'Green', disabled: true },
  { value: 'blue', text: 'Blue' },
]

/** The attributes of every button among `children`, as drawn. */
function buttonsIn(children: m.Children): m.Attributes[] {
  if (Array.isArray(children)) {
    return children.flatMap(buttonsIn)
  }
  if (typeof children !== 'object' || children === null) {
    return []
  }
  return children.tag === 'button' ? [children.attrs] : buttonsIn(children.children)
}

/** The buttons of the options as the select draws them, by their text. */
function drawn(disabled: boolean, onchange: (value: string) => void) {
  const select = new ThemedSelect<string>()
  const buttons = buttonsIn(
    select.view(m(ThemedSelect<string>, { value: 'red', options, onchange, disabled })),
  )
  return Object.fromEntries(buttons.map((button, index) => [options[index].text, button]))
}

it('lets an option be chosen that is neither locked nor the one chosen', () => {
  const onchange = mock()
  const buttons = drawn(false, onchange)
  buttons.Red.onclick()
  buttons.Green.onclick()
  expect(onchange).not.toHaveBeenCalled()
  buttons.Blue.onclick()
  expect(onchange).toHaveBeenCalledWith('blue')
  expect(buttons.Green['aria-disabled']).toBe('true')
  expect(buttons.Blue['aria-disabled']).toBeUndefined()
})

it('lets nothing be chosen while the select is locked', () => {
  const onchange = mock()
  const buttons = drawn(true, onchange)
  buttons.Blue.onclick()
  expect(onchange).not.toHaveBeenCalled()
  expect(buttons.Blue['aria-disabled']).toBe('true')
})
