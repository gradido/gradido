// AI-GENERATED — not an architecture reference
import { expect, it, spyOn } from 'bun:test'
import m from 'mithril'
import { BusyButton } from './BusyButton'

it('is locked while its own click is open, also where the caller says `busy: false`', async () => {
  // Mithril's redraw needs a browser: here it is only counted
  const nothing = () => undefined
  const redraw = spyOn(m, 'redraw').mockImplementation(Object.assign(nothing, { sync: nothing }))
  const answer = Promise.withResolvers<void>()
  const button = new BusyButton()
  const draw = () => button.view(m(BusyButton, { busy: false, onclick: () => answer.promise }))

  expect(draw().attrs.disabled).toBeFalsy()
  const clicked = draw().attrs.onclick()
  expect(draw().attrs.disabled).toBe(true)

  answer.resolve()
  await clicked
  expect(draw().attrs.disabled).toBeFalsy()
  expect(redraw).toHaveBeenCalledTimes(1)
  redraw.mockRestore()
})
