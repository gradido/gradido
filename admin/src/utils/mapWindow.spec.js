// AI-GENERATED — not an architecture reference

import { describe, it, expect, afterEach } from 'vitest'
import { MAP_WINDOW_NAME, dropMapWindowName } from './mapWindow'

describe('mapWindow', () => {
  afterEach(() => {
    window.name = ''
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
    dropMapWindowName(win)
    expect(win.name).toBe('')
  })

  it.each([
    ['no name', ''],
    ['a name of its own', 'my-window'],
    ['a name that only begins alike', 'gradido-wallet-map-2'],
  ])('leaves a window with %s as it is', (_name, name) => {
    const win = { name }
    dropMapWindowName(win)
    expect(win.name).toBe(name)
  })

  it('asks the window it runs in where it is told no other', () => {
    window.name = 'gradido-wallet-map'
    dropMapWindowName()
    expect(window.name).toBe('')
  })
})
