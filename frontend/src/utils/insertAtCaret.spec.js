// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { insertAtCaret } from './insertAtCaret'

describe('insertAtCaret', () => {
  let field
  let heard

  /** A text field in the page, with words in it and the caret where a test puts it. */
  const fieldWith = (value, start = value.length, end = start, tag = 'textarea') => {
    field = document.createElement(tag)
    document.body.appendChild(field)
    field.value = value
    field.setSelectionRange(start, end)
    heard = []
    field.addEventListener('input', (event) => heard.push(event))
    return field
  }

  beforeEach(() => {
    // jsdom has no `execCommand`; a test that needs the browser's own typing brings its own.
    expect(document.execCommand).toBeUndefined()
  })

  afterEach(() => {
    document.body.innerHTML = ''
    delete document.execCommand
    vi.restoreAllMocks()
  })

  it('puts the text in where the caret stands', () => {
    fieldWith('Danke Dir', 5)

    expect(insertAtCaret(field, '🙏')).toBe(true)

    expect(field.value).toBe('Danke🙏 Dir')
  })

  it('puts it at the end of a field whose caret is at its end', () => {
    fieldWith('Danke ')

    insertAtCaret(field, '🙏')

    expect(field.value).toBe('Danke 🙏')
  })

  it('puts it in the place of what is selected', () => {
    fieldWith('Das ist gut so', 8, 11)

    insertAtCaret(field, '👍')

    expect(field.value).toBe('Das ist 👍 so')
  })

  it('leaves the caret behind what was put in, for the next one', () => {
    fieldWith('ab', 1)

    insertAtCaret(field, '🙏')
    insertAtCaret(field, '🌱')

    expect(field.value).toBe('a🙏🌱b')
    expect(field.selectionStart).toBe(5)
    expect(field.selectionEnd).toBe(5)
  })

  it('lets the field say that it was typed in: whoever listens to it hears', () => {
    fieldWith('Hallo ')

    insertAtCaret(field, '👋')

    expect(heard).toHaveLength(1)
    expect(heard[0].bubbles).toBe(true)
    expect(heard[0].inputType).toBe('insertText')
    expect(heard[0].data).toBe('👋')
  })

  it('takes the caret of a field that does not hold the focus, and leaves the focus in it', () => {
    fieldWith('eins zwei', 4)
    const other = document.createElement('button')
    document.body.appendChild(other)
    other.focus()
    expect(document.activeElement).toBe(other)
    const focused = vi.spyOn(field, 'focus')

    insertAtCaret(field, '🙂')

    expect(field.value).toBe('eins🙂 zwei')
    expect(document.activeElement).toBe(field)
    // Without moving the page to bring the field into sight.
    expect(focused).toHaveBeenCalledWith({ preventScroll: true })
  })

  it('writes into a one-line field as well', () => {
    fieldWith('Thema', 5, 5, 'input')

    insertAtCaret(field, '☕')

    expect(field.value).toBe('Thema☕')
  })

  describe('a field that stops at a number of characters', () => {
    it('takes an emoji that still fits -- counted as the field counts, two for most', () => {
      fieldWith('12345678')
      field.maxLength = 10

      expect(insertAtCaret(field, '🙏')).toBe(true)

      expect(field.value).toBe('12345678🙏')
      expect(field.value).toHaveLength(10)
    })

    it('takes none that would not fit whole, and says so', () => {
      fieldWith('123456789')
      field.maxLength = 10

      expect(insertAtCaret(field, '🙏')).toBe(false)

      expect(field.value).toBe('123456789')
      expect(heard).toHaveLength(0)
    })

    it('counts what is selected as room: it gives way to the emoji', () => {
      fieldWith('1234567890', 8, 10)
      field.maxLength = 10

      expect(insertAtCaret(field, '🙏')).toBe(true)

      expect(field.value).toBe('12345678🙏')
    })

    it('holds a sign with a selector to the same count', () => {
      // The heart with its selector: one sign for the eye, two units for the field.
      fieldWith('123456789')
      field.maxLength = 10

      expect(insertAtCaret(field, '❤️')).toBe(false)
      expect(field.value).toBe('123456789')
    })
  })

  it('writes nothing into a field that takes no words', () => {
    fieldWith('gesperrt')
    field.disabled = true
    expect(insertAtCaret(field, '🙂')).toBe(false)

    field.disabled = false
    field.readOnly = true
    expect(insertAtCaret(field, '🙂')).toBe(false)

    expect(field.value).toBe('gesperrt')
    expect(heard).toHaveLength(0)
  })

  it('does nothing without a field, or without anything to put in', () => {
    expect(insertAtCaret(null, '🙂')).toBe(false)
    expect(insertAtCaret(undefined, '🙂')).toBe(false)
    fieldWith('bleibt')
    expect(insertAtCaret(field, '')).toBe(false)
    expect(field.value).toBe('bleibt')
  })

  describe('where the browser types for the wallet', () => {
    /** The browser's own typing: writes at the caret and lets the field say so, as Chrome does. */
    const browserTypes = () => {
      document.execCommand = vi.fn((command, _ui, text) => {
        const target = document.activeElement
        target.setRangeText(text, target.selectionStart, target.selectionEnd, 'end')
        target.dispatchEvent(
          new InputEvent('input', { bubbles: true, inputType: command, data: text }),
        )
        return true
      })
    }

    it('lets it type the emoji, so that the field’s undo takes it back like a keystroke', () => {
      browserTypes()
      fieldWith('Danke Dir', 5)

      expect(insertAtCaret(field, '🙏')).toBe(true)

      expect(document.execCommand).toHaveBeenCalledWith('insertText', false, '🙏')
      expect(field.value).toBe('Danke🙏 Dir')
      // Typed once: the wallet does not write it a second time.
      expect(heard).toHaveLength(1)
    })

    it('types into the field it was asked for, not into the one that held the focus', () => {
      browserTypes()
      const other = document.createElement('textarea')
      document.body.appendChild(other)
      other.value = 'woanders'
      other.focus()
      fieldWith('hier', 4)

      insertAtCaret(field, '🙂')

      expect(field.value).toBe('hier🙂')
      expect(other.value).toBe('woanders')
    })

    // The browser types where the caret IS -- and a browser may put it elsewhere when the focus
    // comes back by script. The caret is put back where it stood before it types.
    it('types at the caret as it stood, wherever the focus puts it on its way in', () => {
      browserTypes()
      fieldWith('eins zwei', 4)
      const focus = field.focus.bind(field)
      field.focus = (options) => {
        focus(options)
        field.setSelectionRange(0, 0)
      }

      insertAtCaret(field, '🙂')

      expect(field.value).toBe('eins🙂 zwei')
    })

    // The browser types where the focus IS: a field that could not take it must not send the
    // emoji into whatever holds it.
    it('writes into the field itself where the field cannot take the focus', () => {
      browserTypes()
      const other = document.createElement('textarea')
      document.body.appendChild(other)
      other.value = 'woanders'
      other.focus()
      fieldWith('hier', 4)
      field.focus = () => {}

      expect(insertAtCaret(field, '🙂')).toBe(true)

      expect(field.value).toBe('hier🙂')
      expect(other.value).toBe('woanders')
      expect(document.execCommand).not.toHaveBeenCalled()
      expect(heard).toHaveLength(1)
    })

    it('writes it itself where the browser says "done" and has done nothing', () => {
      document.execCommand = vi.fn(() => true)
      fieldWith('Danke ', 6)

      expect(insertAtCaret(field, '🙏')).toBe(true)

      expect(field.value).toBe('Danke 🙏')
      expect(heard).toHaveLength(1)
    })

    it('writes it itself where the browser says no', () => {
      document.execCommand = vi.fn(() => false)
      fieldWith('Danke ', 6)

      insertAtCaret(field, '🙏')

      expect(field.value).toBe('Danke 🙏')
      expect(heard).toHaveLength(1)
    })

    it('writes it itself where the browser’s typing throws', () => {
      document.execCommand = vi.fn(() => {
        throw new Error('not supported')
      })
      fieldWith('Danke ', 6)

      insertAtCaret(field, '🙏')

      expect(field.value).toBe('Danke 🙏')
    })

    it('does not write a second time where the emoji took the place of the same emoji', () => {
      browserTypes()
      fieldWith('a🙏b', 1, 3)

      insertAtCaret(field, '🙏')

      expect(field.value).toBe('a🙏b')
      expect(heard).toHaveLength(1)
    })
  })
})
