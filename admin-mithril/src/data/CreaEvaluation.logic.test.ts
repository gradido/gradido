// AI-GENERATED — not an architecture reference
import { describe, expect, it } from 'bun:test'
import type { ListedContribution } from './Contribution.schema'
import {
  batchInput,
  contributionMeta,
  evaluationInput,
  renderDraft,
  sectionsByResubmission,
  shownFlags,
  tenureKey,
} from './CreaEvaluation.logic'

const contribution = (id: number, more: Partial<ListedContribution> = {}) =>
  ({
    id,
    userId: 7,
    user: { firstName: 'Ann' },
    amount: '50',
    memo: `memo ${id}`,
    contributionDate: '2026-10-01T00:00:00.000Z',
    resubmissionAt: null,
    ...more,
  }) as ListedContribution

describe('renderDraft', () => {
  it('fills in what there is, and leaves a placeholder without a value standing', () => {
    expect(renderDraft('[ANREDE], hi. [SIGNATUR]', 'Hallo Ann', 'Peter')).toBe(
      'Hallo Ann, hi. Peter',
    )
    expect(renderDraft('[ANREDE], hi. [SIGNATUR]', 'Hallo Ann', '')).toBe(
      'Hallo Ann, hi. [SIGNATUR]',
    )
  })
})

describe('contributionMeta', () => {
  it('names hours, amount and day', () => {
    expect(contributionMeta(contribution(1, { amount: '50' }), 'de', 'Std')).toBe(
      '2,5 Std · 50 GDD · 1.10.2026',
    )
  })
})

describe('tenureKey', () => {
  const now = new Date('2026-11-09T12:00:00Z')

  it('picks the unit and says one apart from several', () => {
    expect(tenureKey('2026-11-09T08:00:00Z', now)).toEqual({ key: 'crea.tenure.today', count: 0 })
    expect(tenureKey('2026-11-08T08:00:00Z', now)).toEqual({ key: 'crea.tenure.day', count: 1 })
    expect(tenureKey('2026-02-01T08:00:00Z', now)).toEqual({ key: 'crea.tenure.months', count: 9 })
    expect(tenureKey('nonsense', now)).toBeNull()
  })
})

describe('sectionsByResubmission', () => {
  it('parts never put off, due and later, and leaves empty groups out', () => {
    const now = new Date('2026-11-09T12:00:00Z')
    const sections = sectionsByResubmission(
      [
        contribution(1, { resubmissionAt: '2099-01-01T00:00:00Z' }),
        contribution(2),
        contribution(3, { resubmissionAt: '2026-01-01T00:00:00Z' }),
      ],
      now,
    )
    expect(sections.map(({ key, items }) => [key, items.map(({ id }) => id)])).toEqual([
      ['open', [2]],
      ['due', [3]],
      ['later', [1]],
    ])
    expect(sectionsByResubmission([contribution(1)], now).map(({ key }) => key)).toEqual(['open'])
  })
})

describe('shownFlags', () => {
  it('leaves out the preview marker, and the salutation once it is stored', () => {
    const flags = ['stub_preview', 'anrede_unsicher', 'discrepancy_recomputed']
    expect(shownFlags(flags, false)).toEqual(['anrede_unsicher', 'discrepancy_recomputed'])
    expect(shownFlags(flags, true)).toEqual(['discrepancy_recomputed'])
    expect(shownFlags(null, false)).toEqual([])
  })
})

describe('the input for Crea', () => {
  it('names the member by pseudonym, and by id only where Crea may read the remark', () => {
    expect(evaluationInput(contribution(3), 'Hi Ann', false, 'de')).toEqual({
      text: 'memo 3',
      enteredGdd: 50,
      contributionRef: '3',
      recipientFirstName: 'Ann',
      salutation: 'Hi Ann',
      personPseudonym: '7',
      userId: null,
      date: '2026-10-01T00:00:00.000Z',
      uiLanguage: 'de',
    })
    expect(evaluationInput(contribution(3), null, true, 'de').userId).toBe(7)
  })

  it('gives several contributions of the member together', () => {
    expect(
      batchInput([contribution(1), contribution(2)], contribution(1), null, true, 'en'),
    ).toEqual({
      contributions: [
        { text: 'memo 1', enteredGdd: 50, date: '2026-10-01T00:00:00.000Z' },
        { text: 'memo 2', enteredGdd: 50, date: '2026-10-01T00:00:00.000Z' },
      ],
      recipientFirstName: 'Ann',
      salutation: null,
      uiLanguage: 'en',
      userId: 7,
    })
  })
})
