// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import * as v from 'valibot'
import {
  chosenGroupsOf,
  isSwitchedOff,
  mayChooseGroups,
  maySwitchOff,
  supportIsTheirs,
} from './Moderator.logic'
import { type Moderator, moderatorSchema } from './Moderator.schema'

const signedIn = (more: Partial<Moderator>): Moderator => ({
  firstName: 'Peter',
  lastName: 'Lustig',
  alias: 'peter',
  role: 'MODERATOR',
  gradidoID: 'a6c9b4a2-0f2b-4b8e-9f43-3c3c1b1e9d01',
  communityUuid: '2d7f7a1e-6b8e-4a0a-9c3e-8f1f6a2b9c11',
  language: 'de',
  avatar: null,
  avatarColorIndex: null,
  visibleCreationGroups: [],
  seesAllCreationGroups: true,
  seesUntagged: true,
  handlesSupportTickets: false,
  ...more,
})

describe('supportIsTheirs', () => {
  it('is yes for a moderator or KI-moderator with the tick, no without it', () => {
    expect(supportIsTheirs(signedIn({ handlesSupportTickets: true }))).toBe(true)
    expect(supportIsTheirs(signedIn({ role: 'MODERATOR_AI', handlesSupportTickets: true }))).toBe(
      true,
    )
    expect(supportIsTheirs(signedIn({}))).toBe(false)
    expect(supportIsTheirs(signedIn({ role: 'MODERATOR_AI' }))).toBe(false)
  })

  it('is yes for an administrator, with the tick and without', () => {
    expect(supportIsTheirs(signedIn({ role: 'ADMIN' }))).toBe(true)
    expect(supportIsTheirs(signedIn({ role: 'ADMIN', handlesSupportTickets: true }))).toBe(true)
  })

  it('is no where nobody is signed in', () => {
    expect(supportIsTheirs(null)).toBe(false)
  })

  // what the admin kept before K6: no tick at all -- an administrator keeps the support, a
  // moderator has none until they come in through the wallet again
  it('reads a state kept from before the tick: yes for an administrator, no for a moderator', () => {
    const { handlesSupportTickets: _left, ...before } = signedIn({})
    expect(supportIsTheirs(v.parse(moderatorSchema, { ...before, role: 'ADMIN' }))).toBe(true)
    expect(supportIsTheirs(v.parse(moderatorSchema, before))).toBe(false)
  })
})

// "Meine Gruppen" (MG1)
describe('mayChooseGroups', () => {
  it('is yes for whoever has a role and sees every group', () => {
    expect(mayChooseGroups(signedIn({ role: 'ADMIN' }))).toBe(true)
    expect(mayChooseGroups(signedIn({ role: 'MODERATOR' }))).toBe(true)
    expect(mayChooseGroups(signedIn({ role: 'MODERATOR_AI' }))).toBe(true)
  })

  // the scope is their list
  it('is no for a moderator with an assigned scope', () => {
    expect(
      mayChooseGroups(
        signedIn({ seesAllCreationGroups: false, visibleCreationGroups: ['garden'] }),
      ),
    ).toBe(false)
  })

  it('is no without a role, and where nobody is signed in', () => {
    expect(mayChooseGroups(signedIn({ role: null }))).toBe(false)
    expect(mayChooseGroups(null)).toBe(false)
  })
})

describe('chosenGroupsOf', () => {
  const moderator = signedIn({ role: 'ADMIN' })
  const kept = (more = {}) => ({
    of: moderator.gradidoID,
    groupIds: [3, 7],
    untagged: true,
    off: false,
    ...more,
  })

  it('is the choice kept for the moderator signed in', () => {
    expect(chosenGroupsOf(moderator, kept())).toEqual({
      groupIds: [3, 7],
      untagged: true,
      off: false,
    })
    expect(chosenGroupsOf(moderator, kept({ groupIds: [] }))).toEqual({
      groupIds: [],
      untagged: true,
      off: false,
    })
  })

  // The same browser is used by more than one moderator.
  it('is none where the kept choice is somebody else’s', () => {
    expect(
      chosenGroupsOf(moderator, kept({ of: 'b1d2c3e4-0000-4000-8000-000000000001' })),
    ).toBeNull()
  })

  it('is none where nothing is ticked, nothing is kept, or the moderator may not choose', () => {
    expect(chosenGroupsOf(moderator, kept({ groupIds: [], untagged: false }))).toBeNull()
    expect(chosenGroupsOf(moderator, null)).toBeNull()
    expect(chosenGroupsOf(null, kept())).toBeNull()
    expect(chosenGroupsOf({ ...moderator, seesAllCreationGroups: false }, kept())).toBeNull()
  })
})

// MG5: who may switch a column off, and the column switched off -- narrowing no filter
describe('maySwitchOff', () => {
  it('is yes for an administrator, who sees every group', () => {
    expect(maySwitchOff(signedIn({ role: 'ADMIN' }))).toBe(true)
  })

  it('is no for a moderator of either kind, though they may choose, and for nobody signed in', () => {
    for (const role of ['MODERATOR', 'MODERATOR_AI']) {
      expect(mayChooseGroups(signedIn({ role }))).toBe(true)
      expect(maySwitchOff(signedIn({ role }))).toBe(false)
    }
    expect(maySwitchOff(null)).toBe(false)
  })
})

describe('isSwitchedOff', () => {
  const moderator = signedIn({ role: 'ADMIN' })
  const kept = (more = {}) => ({
    of: moderator.gradidoID,
    groupIds: [3],
    untagged: false,
    off: true,
    ...more,
  })

  it('is yes for the choice kept of the administrator signed in, and off', () => {
    expect(isSwitchedOff(moderator, kept())).toBe(true)
    expect(chosenGroupsOf(moderator, kept())).toBeNull()
  })

  it('is no where it is on, kept of somebody else, or unknown', () => {
    expect(isSwitchedOff(moderator, kept({ off: false }))).toBe(false)
    expect(isSwitchedOff(moderator, kept({ of: 'b1d2c3e4-0000-4000-8000-000000000001' }))).toBe(
      false,
    )
    expect(isSwitchedOff(moderator, null)).toBe(false)
  })

  // kept from the time as an administrator: the ticks count, as the server reads them by then
  it('is no for a moderator, and their ticks count', () => {
    const now = { ...moderator, role: 'MODERATOR' }
    expect(isSwitchedOff(now, kept())).toBe(false)
    expect(chosenGroupsOf(now, kept())).toEqual({ groupIds: [3], untagged: false, off: false })
  })
})
