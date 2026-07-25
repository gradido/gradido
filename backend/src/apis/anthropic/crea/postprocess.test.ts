import type { CreaContributionInput } from '@/graphql/input/CreaContributionInput'
import type { CreaEvaluation } from '@/graphql/model/CreaEvaluation'
import { SALUTATION_PLACEHOLDER } from './deterministics'
import { applyCreaDeterministics, resolveSalutation } from './postprocess'

const evaluationWith = (responseText: string): CreaEvaluation =>
  ({
    beitragRef: 'contrib-1',
    activities: [],
    overallVerdict: 'confirm',
    discrepancy: 'none',
    appliedRule: 'confirm_positive_list',
    confidence: 'medium',
    reasoning: 'reason',
    responseText,
    salutation: '',
    defaultSalutation: '',
    openPoints: [],
    flags: [],
  }) as CreaEvaluation

describe('crea postprocess — salutation', () => {
  it('resolves the salutation from the first name when none is stored', () => {
    expect(resolveSalutation({ recipientFirstName: 'Thomas' })).toEqual({
      salutation: 'Lieber Thomas',
      uncertain: false,
    })
  })

  it('lets a stored salutation win over the name heuristic', () => {
    expect(
      resolveSalutation({ recipientFirstName: 'Hans-Juergen', salutation: 'Lieber Jogi' }),
    ).toEqual({ salutation: 'Lieber Jogi', uncertain: false })
  })

  // The client fills [ANREDE] so the moderator can correct the salutation and watch
  // the draft follow. If the backend substituted it again, that field would go dead.
  it('leaves the placeholder in the reply for the client to fill', () => {
    const input = { recipientFirstName: 'Thomas' } as CreaContributionInput
    const result = applyCreaDeterministics(
      input,
      evaluationWith(`${SALUTATION_PLACEHOLDER}, danke!`),
    )
    expect(result.responseText).toBe(`${SALUTATION_PLACEHOLDER}, danke!`)
    expect(result.salutation).toBe('Lieber Thomas')
  })

  it('flags an uncertain salutation, and stops once one is stored', () => {
    const unknown = { recipientFirstName: 'Kim' } as CreaContributionInput
    expect(
      applyCreaDeterministics(unknown, evaluationWith(`${SALUTATION_PLACEHOLDER}, danke!`)).flags,
    ).toContain('anrede_unsicher')

    const stored = { recipientFirstName: 'Kim', salutation: 'Hallo Kim' } as CreaContributionInput
    const result = applyCreaDeterministics(stored, evaluationWith(`${SALUTATION_PLACEHOLDER}!`))
    expect(result.flags).not.toContain('anrede_unsicher')
    expect(result.salutation).toBe('Hallo Kim')
  })
})
