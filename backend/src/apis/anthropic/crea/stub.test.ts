import type { CreaBatchInput } from '@/graphql/input/CreaBatchInput'
import type { CreaContributionInput } from '@/graphql/input/CreaContributionInput'
import { SALUTATION_PLACEHOLDER, SIGNATURE_PLACEHOLDER } from './deterministics'
import {
  buildStubBatch,
  buildStubBatchRewrite,
  buildStubEvaluation,
  buildStubRewrite,
  CREA_STUB_FLAG,
} from './stub'

const stubInput = (over: Partial<CreaContributionInput> = {}): CreaContributionInput =>
  ({ text: 'Ich habe im Tierheim geholfen.', ...over }) as CreaContributionInput

describe('crea stub preview evaluation', () => {
  it('carries the stub_preview flag so the UI can label it as a preview', () => {
    expect(buildStubEvaluation(stubInput()).flags).toContain(CREA_STUB_FLAG)
  })

  it('derives the activity hours from the entered GDD (1 h = 20 GDD)', () => {
    expect(buildStubEvaluation(stubInput({ enteredGdd: 200 })).activities[0].hours).toBe(10)
  })

  it('fills the salutation locally from a known male first name', () => {
    const result = buildStubEvaluation(stubInput({ recipientFirstName: 'Bernd' }))
    expect(result.responseText).toContain('Lieber Bernd')
    expect(result.responseText).not.toContain(SALUTATION_PLACEHOLDER)
  })

  it('flags an uncertain salutation for an unknown name (E-005)', () => {
    expect(buildStubEvaluation(stubInput({ recipientFirstName: 'Xyzzy' })).flags).toContain(
      'anrede_unsicher',
    )
  })

  it('fills the moderator signature when provided, keeps the placeholder otherwise', () => {
    const withSignature = buildStubEvaluation(stubInput({ moderatorSignature: 'Herzlich, Bernd' }))
    expect(withSignature.responseText).toContain('Herzlich, Bernd')
    expect(withSignature.responseText).not.toContain(SIGNATURE_PLACEHOLDER)

    expect(buildStubEvaluation(stubInput()).responseText).toContain(SIGNATURE_PLACEHOLDER)
  })

  it('returns a confirm verdict with schema-valid enum values', () => {
    const result = buildStubEvaluation(stubInput({ enteredGdd: 100 }))
    expect(result.overallVerdict).toBe('confirm')
    expect(result.activities[0].categoryKey).toBe('other')
    expect(result.activities[0].outputType).toBe('service')
  })
})

describe('crea stub rewrite (moderator deviates, E-017 / E-019)', () => {
  it('fills the salutation and keeps the signature placeholder for the client', () => {
    const { responseText } = buildStubRewrite(
      stubInput({ moderatorDecision: 'confirm', recipientFirstName: 'Bernd' }),
    )
    expect(responseText).toContain('Lieber Bernd')
    expect(responseText).not.toContain(SALUTATION_PLACEHOLDER)
    expect(responseText).toContain(SIGNATURE_PLACEHOLDER)
  })

  it('gives a distinct reply per target decision', () => {
    const confirm = buildStubRewrite(stubInput({ moderatorDecision: 'confirm' })).responseText
    const inquire = buildStubRewrite(stubInput({ moderatorDecision: 'inquire' })).responseText
    const deny = buildStubRewrite(stubInput({ moderatorDecision: 'deny' })).responseText
    expect(confirm).not.toBe(inquire)
    expect(inquire).not.toBe(deny)
  })

  it('mentions that the hours become free again on a rejection (verified against creations.ts)', () => {
    expect(buildStubRewrite(stubInput({ moderatorDecision: 'deny' })).responseText).toContain(
      'wieder frei',
    )
  })

  it('points to the common-good page on an inquiry', () => {
    expect(buildStubRewrite(stubInput({ moderatorDecision: 'inquire' })).responseText).toContain(
      'gradido.net/gemeinwohl-was-ist-das',
    )
  })

  it('adds a memo supplement only when confirming (E-019)', () => {
    expect(
      buildStubRewrite(stubInput({ moderatorDecision: 'confirm' })).memoSupplement,
    ).toBeTruthy()
    expect(buildStubRewrite(stubInput({ moderatorDecision: 'inquire' })).memoSupplement).toBeNull()
    expect(buildStubRewrite(stubInput({ moderatorDecision: 'deny' })).memoSupplement).toBeNull()
  })
})

describe('crea stub batch evaluation (E-020)', () => {
  const batchInput = (over: Partial<CreaBatchInput> = {}): CreaBatchInput =>
    ({
      contributions: [{ text: 'Ich habe im Tierheim geholfen.' }, { text: 'Chor-Probe geleitet.' }],
      ...over,
    }) as CreaBatchInput

  it('carries the stub_preview flag so the UI labels it as a preview', () => {
    expect(buildStubBatch(batchInput()).flags).toContain(CREA_STUB_FLAG)
  })

  it('returns ONE overall verdict + ONE reply that mentions the contribution count', () => {
    const result = buildStubBatch(batchInput())
    expect(result.overallVerdict).toBe('confirm')
    expect(typeof result.responseText).toBe('string')
    expect(result.reasoning).toContain('2')
  })

  it('fills the salutation locally and keeps the signature placeholder for the client', () => {
    const result = buildStubBatch(batchInput({ recipientFirstName: 'Bernd' }))
    expect(result.responseText).toContain('Lieber Bernd')
    expect(result.responseText).not.toContain(SALUTATION_PLACEHOLDER)
    expect(result.responseText).toContain(SIGNATURE_PLACEHOLDER)
  })

  it('flags an uncertain salutation for an unknown name (E-005)', () => {
    expect(buildStubBatch(batchInput({ recipientFirstName: 'Xyzzy' })).flags).toContain(
      'anrede_unsicher',
    )
  })

  it('rewrites one joint reply per target decision, memo note only on confirm (E-020)', () => {
    const confirm = buildStubBatchRewrite(batchInput({ moderatorDecision: 'confirm' }))
    const deny = buildStubBatchRewrite(batchInput({ moderatorDecision: 'deny' }))
    expect(confirm.responseText).not.toBe(deny.responseText)
    expect(deny.responseText).toContain('wieder frei')
    expect(confirm.memoSupplement).toBeTruthy()
    expect(deny.memoSupplement).toBeNull()
  })
})
