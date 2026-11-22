// AI-GENERATED — not an architecture reference
import { buildHandledPredicate } from './findContributions'

// "Meine Gruppen" (MG1): what '*handled' adds to the list's query for a choice. Which rows it
// selects is the database's to show (HandledCreationGroups.test.ts); here, which parts it takes.
describe('buildHandledPredicate', () => {
  it('asks for the ticked groups by their numbers', () => {
    const { sql, params } = buildHandledPredicate({ groupIds: [3, 7], untagged: false, off: false })
    expect(sql).toContain('cgh.creation_group_id IN (:...handledGroupIds)')
    expect(sql).not.toContain('NOT EXISTS')
    expect(params).toEqual({ handledGroupIds: [3, 7] })
  })

  it('asks for the contributions in no group alone, with no numbers to send', () => {
    const { sql, params } = buildHandledPredicate({ groupIds: [], untagged: true, off: false })
    expect(sql).toMatch(/^\(NOT EXISTS .*\)$/)
    expect(sql).not.toContain('handledGroupIds')
    expect(params).toEqual({})
  })

  it('takes the ticked groups or no group, where both are ticked', () => {
    const { sql, params } = buildHandledPredicate({ groupIds: [3], untagged: true, off: false })
    expect(sql).toContain('IN (:...handledGroupIds)) OR NOT EXISTS')
    expect(params).toEqual({ handledGroupIds: [3] })
  })

  // MG5: off finds nothing, whatever is ticked behind it
  it('finds nothing where the choice is off, with no numbers to send', () => {
    const { sql, params } = buildHandledPredicate({ groupIds: [3, 7], untagged: true, off: true })
    expect(sql).toBe('(1 = 0)')
    expect(params).toEqual({})
  })
})
