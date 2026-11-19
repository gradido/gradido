// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import { type PageItem, pageItems } from './Pagination'

// the entries written short: a page as its number (`~` where a small screen leaves it out), an
// arrow as its text (in brackets where disabled), an ellipsis as …
const short = (items: PageItem[]) =>
  items.map((item) =>
    item.kind === 'ellipsis'
      ? '…'
      : item.kind === 'page'
        ? `${item.page}${item.smHidden ? '~' : ''}`
        : item.disabled
          ? `(${item.text})`
          : item.text,
  )

describe('pageItems', () => {
  it('shows every page below five', () => {
    expect(short(pageItems(2, 3))).toEqual(['«', '‹', '1', '2', '3', '›', '»'])
  })

  it('disables the arrows that lead nowhere', () => {
    expect(short(pageItems(1, 2))).toEqual(['(«)', '(‹)', '1', '2', '›', '»'])
    expect(short(pageItems(2, 2))).toEqual(['«', '‹', '1', '2', '(›)', '(»)'])
  })

  it('leaves out the pages after the first four, where the first two are shown', () => {
    expect(short(pageItems(2, 5))).toEqual(['«', '‹', '1', '2', '3', '4~', '…', '›', '»'])
  })

  it('leaves out the pages before the last four, where the last two are shown', () => {
    expect(short(pageItems(10, 10))).toEqual(['«', '‹', '…', '7~', '8', '9', '10', '(›)', '(»)'])
  })

  it('shows three pages around one in the middle', () => {
    expect(short(pageItems(5, 10))).toEqual(['«', '‹', '…', '4', '5', '6', '…', '›', '»'])
    // the last but two is still one in the middle
    expect(short(pageItems(8, 10))).toEqual(['«', '‹', '…', '7', '8', '9', '…', '›', '»'])
  })

  it('shows three places without ellipsis and without « », as on a phone', () => {
    expect(short(pageItems(5, 10, 3, false))).toEqual(['‹', '4', '5', '6', '›'])
    expect(short(pageItems(10, 10, 3, false))).toEqual(['‹', '8', '9~', '10', '(›)'])
  })

  it('leads the arrows to the pages next to the one shown', () => {
    const items = pageItems(5, 10)
    expect(items.filter((item) => item.kind === 'arrow').map((item) => item.page)).toEqual([
      1, 4, 6, 10,
    ])
  })
})
