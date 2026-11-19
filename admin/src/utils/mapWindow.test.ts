// AI-GENERATED — not an architecture reference

import { afterAll, afterEach, describe, expect, it } from 'bun:test'
import { dropMapWindowName, MAP_WINDOW_NAME } from './mapWindow'

describe('mapWindow', () => {
  // no browser here: the window the admin runs in is one of the test's own
  const own = { name: '' }
  Object.assign(globalThis, { window: own })
  afterAll(() => {
    Reflect.deleteProperty(globalThis, 'window')
  })

  afterEach(() => {
    own.name = ''
  })

  // ⛔ The wallet knows the window by this word (frontend/src/utils/adminMapWindow.js). The two
  // apps share no code: a name changed on one side alone is a way back that leads nowhere.
  it('names the window the wallet knows', () => {
    expect(MAP_WINDOW_NAME).toBe('gradido-wallet-map')
  })

  // The admin interface can come to run in the window a pin opened: the wallet's "Admin" takes
  // the window it is clicked in there, and a window keeps its name.
  it('takes the name off a window that carries it', () => {
    const win = { name: 'gradido-wallet-map' }
    dropMapWindowName(win as Window)
    expect(win.name).toBe('')
  })

  it.each([
    ['no name', ''],
    ['a name of its own', 'my-window'],
    ['a name that only begins alike', 'gradido-wallet-map-2'],
  ])('leaves a window with %s as it is', (_name, name) => {
    const win = { name }
    dropMapWindowName(win as Window)
    expect(win.name).toBe(name)
  })

  it('asks the window it runs in where it is told no other', () => {
    own.name = 'gradido-wallet-map'
    dropMapWindowName()
    expect(own.name).toBe('')
  })
})
