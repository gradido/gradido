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
    expect(chosenGroupsOf(moderator, kept(), 'creation')).toEqual({
      groupIds: [3, 7],
      untagged: true,
      off: false,
    })
    expect(chosenGroupsOf(moderator, kept({ groupIds: [] }), 'creation')).toEqual({
      groupIds: [],
      untagged: true,
      off: false,
    })
  })

  // The same browser is used by more than one moderator.
  it('is none where the kept choice is somebody else’s', () => {
    expect(
      chosenGroupsOf(moderator, kept({ of: 'b1d2c3e4-0000-4000-8000-000000000001' }), 'creation'),
    ).toBeNull()
  })

  it('is none where nothing is ticked, nothing is kept, or the moderator may not choose', () => {
    expect(
      chosenGroupsOf(moderator, kept({ groupIds: [], untagged: false }), 'creation'),
    ).toBeNull()
    expect(chosenGroupsOf(moderator, null, 'creation')).toBeNull()
    expect(chosenGroupsOf(null, kept(), 'creation')).toBeNull()
    expect(
      chosenGroupsOf({ ...moderator, seesAllCreationGroups: false }, kept(), 'creation'),
    ).toBeNull()
  })
})

// MG5: who may switch a column off, and the column switched off -- narrowing no filter
describe('maySwitchOff', () => {
  it('is yes for an administrator, who sees every group, in both columns', () => {
    expect(maySwitchOff(signedIn({ role: 'ADMIN' }), 'creation')).toBe(true)
    expect(maySwitchOff(signedIn({ role: 'ADMIN' }), 'support')).toBe(true)
  })

  // the creations moderators may switch off, taking turns (Bernd, 25.11.2026); the support an
  // administrator assigns
  it('is yes for a moderator of either kind in the creations, no in the support', () => {
    for (const role of ['MODERATOR', 'MODERATOR_AI']) {
      expect(maySwitchOff(signedIn({ role }), 'creation')).toBe(true)
      expect(maySwitchOff(signedIn({ role }), 'support')).toBe(false)
    }
  })

  it('is no where they may not choose, and for nobody signed in', () => {
    expect(
      maySwitchOff(signedIn({ role: 'MODERATOR', seesAllCreationGroups: false }), 'creation'),
    ).toBe(false)
    expect(maySwitchOff(null, 'creation')).toBe(false)
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
    expect(isSwitchedOff(moderator, kept(), 'support')).toBe(true)
    expect(chosenGroupsOf(moderator, kept(), 'support')).toBeNull()
  })

  it('is no where it is on, kept of somebody else, or unknown', () => {
    expect(isSwitchedOff(moderator, kept({ off: false }), 'creation')).toBe(false)
    expect(
      isSwitchedOff(moderator, kept({ of: 'b1d2c3e4-0000-4000-8000-000000000001' }), 'creation'),
    ).toBe(false)
    expect(isSwitchedOff(moderator, null, 'creation')).toBe(false)
  })

  it('is yes for a moderator who switched the creations off', () => {
    const now = { ...moderator, role: 'MODERATOR' }
    expect(isSwitchedOff(now, kept(), 'creation')).toBe(true)
    expect(chosenGroupsOf(now, kept(), 'creation')).toBeNull()
  })

  // a support kept from the time as an administrator: the ticks count, as the server reads them
  it('is no for the support of a moderator, and their ticks count', () => {
    const now = { ...moderator, role: 'MODERATOR' }
    expect(isSwitchedOff(now, kept(), 'support')).toBe(false)
    expect(chosenGroupsOf(now, kept(), 'support')).toEqual({
      groupIds: [3],
      untagged: false,
      off: false,
    })
  })
})
