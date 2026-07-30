import type { CreaContributionInput } from '@/graphql/input/CreaContributionInput'
import type { CreaEvaluation } from '@/graphql/model/CreaEvaluation'
import { SALUTATION_PLACEHOLDER, SALUTATION_UNCERTAIN_FLAG } from './deterministics'
import { applyCreaDeterministics } from './postprocess'

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
    defaultSalutation: '',
    openPoints: [],
    flags: [],
  }) as CreaEvaluation

describe('crea postprocess — salutation', () => {
  // The client fills [ANREDE] so the moderator can correct the salutation and watch the
  // draft follow. If the backend substituted it again, that field would go dead.
  it('leaves the placeholder in the reply for the client to fill', () => {
    const input = { recipientFirstName: 'Thomas' } as CreaContributionInput
    const result = applyCreaDeterministics(
      input,
      evaluationWith(`${SALUTATION_PLACEHOLDER}, danke!`),
    )
    expect(result.responseText).toBe(`${SALUTATION_PLACEHOLDER}, danke!`)
  })

  it('reports what the name heuristic alone gives', () => {
    const input = { recipientFirstName: 'Thomas' } as CreaContributionInput
    const result = applyCreaDeterministics(input, evaluationWith(`${SALUTATION_PLACEHOLDER}!`))
    expect(result.defaultSalutation).toBe('Lieber Thomas')
  })

  // A stored salutation must not bleed into defaultSalutation. The client shows the
  // default as the field's hint and renders the draft with it whenever the moderator
  // empties the field, so merging the two would resurrect the value just cleared. The two
  // are deliberately unlike each other here: with a stored salutation the heuristic would
  // have produced anyway, this test would still pass if they were merged into one.
  it('keeps the heuristic default apart from a stored salutation', () => {
    const input = {
      recipientFirstName: 'Thomas',
      salutation: 'Hallo Tom',
    } as CreaContributionInput
    const result = applyCreaDeterministics(input, evaluationWith(`${SALUTATION_PLACEHOLDER}!`))
    expect(result.defaultSalutation).toBe('Lieber Thomas')
  })

  it('flags an uncertain salutation, and stops once one is stored', () => {
    const unknown = { recipientFirstName: 'Kim' } as CreaContributionInput
    expect(
      applyCreaDeterministics(unknown, evaluationWith(`${SALUTATION_PLACEHOLDER}, danke!`)).flags,
    ).toContain(SALUTATION_UNCERTAIN_FLAG)

    const stored = {
      recipientFirstName: 'Kim',
      salutation: 'Liebe Frau Meier',
    } as CreaContributionInput
    const result = applyCreaDeterministics(stored, evaluationWith(`${SALUTATION_PLACEHOLDER}!`))
    expect(result.flags).not.toContain(SALUTATION_UNCERTAIN_FLAG)
    expect(result.defaultSalutation).toBe('Hallo Kim')
  })
})
