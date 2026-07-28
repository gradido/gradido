import type { CreaEvaluation } from '@/graphql/model/CreaEvaluation'
import { buildCreaRecordRows, type CreaRecordMeta } from './records'
import { CREA_BEHAVIOR_VERSION, CREA_RULESET_VERSION, CREA_TAXONOMY_VERSION } from './ruleset'

const meta: CreaRecordMeta = {
  contributionRef: 'contrib-1',
  communityUuid: 'comm-1',
  personPseudonym: 'person-abc',
  rawText: 'Ich habe im Tierheim geholfen und Nachhilfe gegeben.',
  model: 'claude-sonnet-5',
}

const evaluation: CreaEvaluation = {
  beitragRef: 'contrib-1',
  activities: [
    {
      activity: 'Tierheim-Hilfe',
      categoryKey: 'species_protection',
      outputType: 'care',
      hours: 3,
      hoursEstimated: false,
      verdict: 'confirm',
      confidence: 'high',
    },
    {
      activity: 'Nachhilfe',
      categoryKey: 'tutoring',
      outputType: 'knowledge',
      hours: 2,
      hoursEstimated: true,
      verdict: 'inquire',
      confidence: 'low',
    },
  ],
  overallVerdict: 'inquire',
  discrepancy: 'none',
  appliedRule: 'inquire_unclear',
  confidence: 'medium',
  reasoning: 'one clear, one unclear',
  responseText: '[ANREDE], danke!',
  openPoints: [],
  flags: [],
}

describe('crea records — buildCreaRecordRows', () => {
  it('creates one row per activity carrying activity + contribution fields', () => {
    const rows = buildCreaRecordRows(evaluation, meta)
    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      contributionRef: 'contrib-1',
      communityUuid: 'comm-1',
      personPseudonym: 'person-abc',
      activity: 'Tierheim-Hilfe',
      categoryKey: 'species_protection',
      outputType: 'care',
      hours: 3,
      hoursEstimated: false,
      creaVerdict: 'confirm',
      confidence: 'high',
      appliedRule: 'inquire_unclear',
      discrepancy: 'none',
      overallVerdict: 'inquire',
      moderatorFinal: null,
      moderatorComment: null,
      rawText: meta.rawText,
      model: 'claude-sonnet-5',
    })
    expect(rows[1]).toMatchObject({
      activity: 'Nachhilfe',
      creaVerdict: 'inquire',
      hoursEstimated: true,
      confidence: 'low',
    })
  })

  it('stamps the current taxonomy/ruleset/behavior versions', () => {
    const rows = buildCreaRecordRows(evaluation, meta)
    expect(rows[0]).toMatchObject({
      taxonomyVersion: CREA_TAXONOMY_VERSION,
      rulesetVersion: CREA_RULESET_VERSION,
      behaviorVersion: CREA_BEHAVIOR_VERSION,
    })
  })

  it('defaults optional meta to null (no leakage of undefined)', () => {
    const rows = buildCreaRecordRows(evaluation, { contributionRef: 'c2' })
    expect(rows[0]).toMatchObject({
      communityUuid: null,
      personPseudonym: null,
      rawText: null,
      model: null,
    })
  })
})
