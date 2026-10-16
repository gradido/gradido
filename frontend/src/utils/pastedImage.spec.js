// AI-GENERATED — not an architecture reference
import { afterEach, describe, expect, it } from 'vitest'
import { pastedImage, pasteIsFor, windowOf } from './pastedImage'

/**
 * What a paste carries, as a browser hands it to the page: the words of the clipboard, its files,
 * its items. jsdom has no clipboard: a test says what is on it.
 */
const paste = ({ text = '', files = [], items = [] } = {}, target = document.body) => {
  const event = new Event('paste', { bubbles: true, cancelable: true })
  Object.defineProperty(event, 'clipboardData', {
    value: { getData: (type) => (type === 'text/plain' ? text : ''), files, items },
  })
  Object.defineProperty(event, 'target', { value: target })
  return event
}

const png = (name = 'image.png') => new File(['PNG'], name, { type: 'image/png' })
/** An item of the clipboard, as `DataTransfer.items` lists it. */
const item = (file, kind = 'file') => ({ kind, type: file.type, getAsFile: () => file })

describe('pastedImage', () => {
  it('is the picture of a screenshot: a file and no words', () => {
    const shot = png()

    expect(pastedImage(paste({ files: [shot] }))).toBe(shot)
  })

  it('finds the picture among the items where the files are empty', () => {
    const shot = png()

    expect(pastedImage(paste({ items: [item(shot)] }))).toBe(shot)
  })

  /**
   * ⛔ Some programs put the words AND a picture of them on the clipboard (a spreadsheet: a picture
   * of the cells): the words are what the member copied, and they go into the field as ever.
   */
  it('is nothing where words come with the picture', () => {
    expect(pastedImage(paste({ text: 'Spalte A\tSpalte B', files: [png()] }))).toBeNull()
  })

  it('takes the picture where the words are only space', () => {
    const shot = png()

    expect(pastedImage(paste({ text: ' \n', files: [shot] }))).toBe(shot)
  })

  it('takes the first picture, past a file that is none', () => {
    const pdf = new File(['%PDF'], 'brief.pdf', { type: 'application/pdf' })
    const shot = png('zweites.png')

    expect(pastedImage(paste({ files: [pdf, shot] }))).toBe(shot)
  })

  it('is nothing for a file that is no picture, for an item of words, or for no data', () => {
    const pdf = new File(['%PDF'], 'brief.pdf', { type: 'application/pdf' })

    expect(pastedImage(paste({ files: [pdf] }))).toBeNull()
    expect(pastedImage(paste({ items: [item(png(), 'string')] }))).toBeNull()
    expect(pastedImage(paste())).toBeNull()
    expect(pastedImage(new Event('paste'))).toBeNull()
  })

  it('is nothing for an item whose file cannot be had', () => {
    expect(pastedImage(paste({ items: [{ kind: 'file', getAsFile: () => null }] }))).toBeNull()
  })
})

describe('pasteIsFor', () => {
  /** An element in the page, under body -- or in a window, as `windowAt` makes one. */
  const element = (parent = document.body) => parent.appendChild(document.createElement('div'))

  /** A window over the page: Bootstrap's dialog (shown or not), or the wallet's own. */
  const windowAt = (className) => {
    const box = document.createElement('div')
    box.className = className
    return document.body.appendChild(box)
  }

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('for a place in a window', () => {
    it('takes a paste from anywhere in the same window, the window itself as well', () => {
      const dialog = windowAt('modal show')
      const place = element(element(dialog))
      const field = element(dialog)

      expect(pasteIsFor(paste({}, field), place)).toBe(true)
      expect(pasteIsFor(paste({}, place), place)).toBe(true)
      // A BModal gives itself the keyboard when it opens.
      expect(pasteIsFor(paste({}, dialog), place)).toBe(true)
    })

    it('leaves a paste from another window alone, and one from the page under it', () => {
      const dialog = windowAt('modal show')
      const place = element(dialog)
      const editor = windowAt('modal show')

      expect(pasteIsFor(paste({}, element(editor)), place)).toBe(false)
      expect(pasteIsFor(paste({}, document.body), place)).toBe(false)
      expect(pasteIsFor(paste({}, element()), place)).toBe(false)
    })

    /**
     * The avatar enlarged over the chat window (z-index 2000 over Bootstrap's 1054): the dialog's
     * focus trap pulls the keyboard back into the dialog beneath, and the paste comes from there.
     */
    it('leaves a paste alone from its own window while a higher one lies over it', () => {
      const dialog = windowAt('modal show')
      dialog.style.zIndex = '1054'
      const place = element(dialog)
      const zoom = windowAt('avatar-zoom')
      zoom.setAttribute('aria-modal', 'true')
      zoom.style.zIndex = '2000'

      expect(pasteIsFor(paste({}, element(dialog)), place)).toBe(false)
      zoom.remove()
      expect(pasteIsFor(paste({}, element(dialog)), place)).toBe(true)
    })

    /** A group window under the contact window opened from it: the contact window lies higher. */
    it('takes a paste while the other open windows lie under its own', () => {
      const under = windowAt('modal show')
      under.style.zIndex = '1052'
      const top = windowAt('modal show')
      top.style.zIndex = '1054'
      const place = element(top)

      expect(pasteIsFor(paste({}, element(top)), place)).toBe(true)
      expect(pasteIsFor(paste({}, element(under)), element(under))).toBe(false)
    })

    it('counts the wallet’s own window and any that says it is modal as windows', () => {
      const own = windowAt('modal-overlay')
      const zoom = windowAt('avatar-zoom')
      zoom.setAttribute('aria-modal', 'true')

      expect(windowOf(element(own))).toBe(own)
      expect(windowOf(element(zoom))).toBe(zoom)
      expect(pasteIsFor(paste({}, element(zoom)), element(own))).toBe(false)
    })
  })

  describe('for a place on the page', () => {
    it('takes a paste from anywhere on the page, the page itself as well', () => {
      const place = element()

      expect(pasteIsFor(paste({}, element()), place)).toBe(true)
      expect(pasteIsFor(paste({}, document.body), place)).toBe(true)
    })

    it('leaves a paste from a window over the page alone', () => {
      const place = element()
      const dialog = windowAt('modal show')

      expect(pasteIsFor(paste({}, element(dialog)), place)).toBe(false)
    })

    /**
     * A BModal that is closing has lost Bootstrap's `show` while it still fades out, the keyboard
     * still in it: a paste there is still that window's, not the page's.
     */
    it('leaves a paste alone from a window that is closing', () => {
      const place = element()
      const closing = windowAt('modal fade')

      expect(pasteIsFor(paste({}, element(closing)), place)).toBe(false)
    })

    /**
     * The wallet's own window (AppModal: the avatar's) does not take the keyboard: it stays on the
     * page, on the button that opened the window -- and the paste is the window's.
     */
    it('takes none while a window lies over the page, wherever the keyboard stands', () => {
      const place = element()

      for (const open of ['modal show', 'modal-overlay']) {
        const over = windowAt(open)
        expect(pasteIsFor(paste({}, document.body), place)).toBe(false)
        over.remove()
      }
      const zoom = windowAt('avatar-zoom')
      zoom.setAttribute('aria-modal', 'true')
      expect(pasteIsFor(paste({}, document.body), place)).toBe(false)
    })

    /**
     * A BModal that is not shown can stay in the page, hidden -- the editor of the picture choice
     * does --, its `aria-modal` on it all the same: it lies over nothing.
     */
    it('takes a paste while a window that is not shown stays in the page', () => {
      const place = element()
      const hidden = windowAt('modal')
      hidden.setAttribute('aria-modal', 'true')

      expect(pasteIsFor(paste({}, document.body), place)).toBe(true)
    })
  })

  it('is for no place where there is none', () => {
    expect(pasteIsFor(paste({}, document.body), null)).toBe(false)
    expect(pasteIsFor(paste({}, document.body), undefined)).toBe(false)
  })

  it('takes a target that is no element as the page', () => {
    const place = element()

    expect(pasteIsFor(paste({}, document), place)).toBe(true)
    expect(windowOf(document)).toBeNull()
  })
})
