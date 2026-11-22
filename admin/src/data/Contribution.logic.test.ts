// AI-GENERATED — not an architecture reference
import { afterEach, beforeEach, describe, expect, it } from 'bun:test'
import { setLocale } from '@/i18n'
import {
  creationGroupFilterOptions,
  detailsState,
  groupFilterOptions,
  memoComment,
  offersBulkResubmission,
  rowTone,
} from './Contribution.logic'
import type { ListedContribution } from './Contribution.schema'

beforeEach(() => setLocale('de'))
afterEach(() => setLocale('en'))

const contribution = (more: Partial<ListedContribution> = {}): ListedContribution => ({
  id: 1,
  userId: 1,
  user: null,
  amount: '100',
  memo: 'memo',
  creationGroups: [],
  contributionDate: '2026-10-01T00:00:00.000Z',
  createdAt: '2026-10-05T09:00:00.000Z',
  closedAt: null,
  closedBy: null,
  closedByUserName: null,
  updatedBy: null,
  updatedByUserName: null,
  moderatorId: null,
  moderatorUserName: null,
  contributionStatus: 'PENDING',
  messagesCount: 0,
  lastMessageType: null,
  lastMessageByModerator: null,
  colleagueNoteOnQuestion: null,
  resubmissionAt: null,
  ...more,
})

describe('rowTone', () => {
  it('colours open, confirmed, denied and deleted apart', () => {
    expect(
      ['PENDING', 'IN_PROGRESS', 'CONFIRMED', 'DENIED', 'DELETED'].map((contributionStatus) =>
        rowTone(contribution({ contributionStatus })),
      ),
    ).toEqual(['table-primary', 'table-primary', 'table-success', 'table-warning', 'table-danger'])
  })
})

describe('detailsState', () => {
  it("tells a question from a colleague's note on it", () => {
    expect(detailsState(contribution({ contributionStatus: 'IN_PROGRESS' }))).toBe('question')
    expect(
      detailsState(
        contribution({ contributionStatus: 'IN_PROGRESS', colleagueNoteOnQuestion: true }),
      ),
    ).toBe('note')
  })

  it("tells the member's answer from their change, where they had the last word", () => {
    const memberLast = { lastMessageByModerator: false }
    expect(detailsState(contribution({ ...memberLast, lastMessageType: 'DIALOG' }))).toBe('answer')
    expect(detailsState(contribution({ ...memberLast, lastMessageType: 'HISTORY' }))).toBe(
      'changed',
    )
    expect(
      detailsState(
        contribution({ ...memberLast, lastMessageType: 'DIALOG', contributionStatus: 'CONFIRMED' }),
      ),
    ).toBe('conversation')
  })

  it('says nothing without a conversation', () => {
    expect(detailsState(contribution())).toBeNull()
    expect(
      detailsState(contribution({ lastMessageType: 'DIALOG', lastMessageByModerator: true })),
    ).toBe('conversation')
  })
})

describe('memoComment', () => {
  it('names who closed, changed and entered it, in that order', () => {
    expect(
      memoComment(
        contribution({
          contributionStatus: 'DENIED',
          closedBy: 2,
          closedByUserName: 'Ann',
          updatedBy: 3,
          updatedByUserName: 'Bo',
          moderatorId: 4,
          moderatorUserName: 'Cy',
        }),
      ),
    ).toBe('Abgelehnt von Ann. | Text von Bo bearbeitet. | Erstellt von Cy.')
    expect(memoComment(contribution({ moderatorId: 4, moderatorUserName: 'Cy' }))).toBe(
      'Erstellt von Cy.',
    )
    expect(memoComment(contribution())).toBe('')
  })
})

describe('offersBulkResubmission', () => {
  const two = [contribution({ id: 1 }), contribution({ id: 2 })]
  const date = { resubmissionAt: 'then', unchanged: false }

  it('offers a resubmission for the open contributions of the one member on the list', () => {
    expect(offersBulkResubmission(two, date)).toBe(true)
    expect(offersBulkResubmission(two, { resubmissionAt: null, unchanged: false })).toBe(true)
    expect(offersBulkResubmission(two, { resubmissionAt: 'then', unchanged: true })).toBe(true)
  })

  it('offers nothing with nothing to spread, others on the list, or one open contribution', () => {
    expect(offersBulkResubmission(two, { resubmissionAt: null, unchanged: true })).toBe(false)
    expect(offersBulkResubmission([...two, contribution({ id: 3, userId: 2 })], date)).toBe(false)
    expect(
      offersBulkResubmission([two[0], contribution({ id: 2, contributionStatus: 'DENIED' })], date),
    ).toBe(false)
  })
})

describe('groupFilterOptions', () => {
  const groups = [
    { tag: 'garten', name: 'Garten' },
    { tag: 'kueche', name: null },
  ]

  it('offers whoever sees every group everything, and each group', () => {
    const all = { seesAllCreationGroups: true, visibleCreationGroups: [], seesUntagged: false }
    expect(groupFilterOptions(all, groups).map((option) => option.value)).toEqual([
      '',
      '*grouped',
      '*untagged',
      'garten',
      'kueche',
    ])
  })

  it('offers a scoped moderator their groups, and the ungrouped where the scope covers them', () => {
    const scoped = { seesAllCreationGroups: false, visibleCreationGroups: ['kueche'] }
    expect(groupFilterOptions({ ...scoped, seesUntagged: false }, groups)).toEqual([
      { value: '*grouped', text: '(alle Gruppen)' },
      { value: 'kueche', text: '#kueche' },
    ])
    expect(
      groupFilterOptions({ ...scoped, seesUntagged: true }, groups).map((option) => option.value),
    ).toEqual(['*grouped', '*untagged', 'kueche'])
  })

  it('offers a moderator scoped to no group the ungrouped alone', () => {
    expect(
      groupFilterOptions(
        { seesAllCreationGroups: false, visibleCreationGroups: [], seesUntagged: true },
        groups,
      ).map((option) => option.value),
    ).toEqual(['*untagged'])
  })
})

// "Meine Gruppen" (MG1): the creation page's filter in its three forms
describe('creationGroupFilterOptions', () => {
  const groups = [
    { id: 1, tag: 'garten', name: 'Garten' },
    { id: 2, tag: 'kueche', name: null },
    { id: 3, tag: 'potsdam', name: 'Potsdam' },
  ]
  const all = { seesAllCreationGroups: true, visibleCreationGroups: [], seesUntagged: true }

  it('offers whoever chose "Meine Gruppen" first, the three fixed rows, and their groups alone', () => {
    expect(
      creationGroupFilterOptions(all, groups, { groupIds: [3, 2], untagged: true, off: false }),
    ).toEqual([
      { value: '*handled', text: 'Meine Gruppen' },
      { value: '', text: '(mit und ohne Gruppe)' },
      { value: '*grouped', text: '(alle Gruppen)' },
      { value: '*untagged', text: '(ohne Gruppe)' },
      { value: 'kueche', text: '#kueche' },
      { value: 'potsdam', text: 'Potsdam' },
    ])
  })

  // the page opens on the first row, *handled, before the choice is known
  it('offers whoever chose nothing every group, everything standing for *handled', () => {
    expect(creationGroupFilterOptions(all, groups, null)).toEqual([
      { value: '*handled', text: '(mit und ohne Gruppe)' },
      { value: '*grouped', text: '(alle Gruppen)' },
      { value: '*untagged', text: '(ohne Gruppe)' },
      { value: 'garten', text: 'Garten' },
      { value: 'kueche', text: '#kueche' },
      { value: 'potsdam', text: 'Potsdam' },
    ])
  })

  // MG5: the area switched off narrows no filter -- "everything" stands on "", never *handled, which
  // the server reads as nothing
  it('offers whoever switched it off every group, and "everything" as "", without "Meine Gruppen"', () => {
    expect(creationGroupFilterOptions(all, groups, null, true)).toEqual([
      { value: '', text: '(mit und ohne Gruppe)' },
      { value: '*grouped', text: '(alle Gruppen)' },
      { value: '*untagged', text: '(ohne Gruppe)' },
      { value: 'garten', text: 'Garten' },
      { value: 'kueche', text: '#kueche' },
      { value: 'potsdam', text: 'Potsdam' },
    ])
  })

  it('offers a moderator with an assigned scope the rows of before, a choice or none', () => {
    const scoped = {
      seesAllCreationGroups: false,
      visibleCreationGroups: ['kueche'],
      seesUntagged: true,
    }
    const before = groupFilterOptions(scoped, groups)
    expect(creationGroupFilterOptions(scoped, groups, null)).toEqual(before)
    expect(
      creationGroupFilterOptions(scoped, groups, { groupIds: [1], untagged: false, off: false }),
    ).toEqual(before)
    expect(before.map((option) => option.value)).toEqual(['*grouped', '*untagged', 'kueche'])
  })
})
