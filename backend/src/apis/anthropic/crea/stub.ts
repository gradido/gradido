import type { CreaBatchInput } from '@/graphql/input/CreaBatchInput'
import type { CreaContributionInput } from '@/graphql/input/CreaContributionInput'
import type { CreaBatchEvaluation } from '@/graphql/model/CreaBatchEvaluation'
import type { CreaEvaluation } from '@/graphql/model/CreaEvaluation'
import type { CreaRewriteResult } from '@/graphql/model/CreaRewriteResult'
import {
  resolveEnteredHours,
  SALUTATION_PLACEHOLDER,
  SIGNATURE_PLACEHOLDER,
} from './deterministics'
import { applyCreaDeterministics, fillSalutation } from './postprocess'

// Flag the stub carries so the admin UI shows a clear "preview, no AI" banner
// (E-005 — never let a canned result look like a real evaluation).
export const CREA_STUB_FLAG = 'stub_preview'

/**
 * Builds a canned evaluation WITHOUT calling the Anthropic API, then runs the
 * real deterministic layer over it (salutation, discrepancy, signature). Gated
 * by CONFIG.CREA_STUB and only ever reached when no real client is configured
 * (no key). Lets the whole UI + DB + deterministics path be exercised on staging
 * before the API key (DO-5) exists — everything except the model's judgement.
 */
export function buildStubEvaluation(input: CreaContributionInput): CreaEvaluation {
  const hours = resolveEnteredHours(input) ?? 1
  const isEn = (input.uiLanguage ?? 'de').startsWith('en')

  const reasoning = isEn
    ? 'Preview without AI: a sample result to test the interface, the database and the salutation/signature handling. Once the API key is set, Crea’s real assessment appears here.'
    : 'Vorschau ohne KI: ein Beispiel-Ergebnis zum Testen der Oberfläche, der Datenbank und der Anrede-/Signatur-Logik. Sobald der KI-Schlüssel gesetzt ist, steht hier Creas echte Begründung.'

  const body = isEn
    ? 'thank you very much for **your valuable contribution to the common good**. (This is a preview reply — the real wording will come from Crea once the AI is connected.)'
    : 'vielen Dank für **Deinen wertvollen Gemeinwohl-Beitrag**. (Dies ist ein Vorschau-Text — die echte Formulierung kommt von Crea, sobald die KI verbunden ist.)'

  const raw: CreaEvaluation = {
    beitragRef: input.contributionRef ?? '',
    activities: [
      {
        activity: isEn ? 'Sample activity (preview)' : 'Beispiel-Taetigkeit (Vorschau)',
        categoryKey: 'other',
        outputType: 'service',
        hours,
        hoursEstimated: true,
        verdict: 'confirm',
        confidence: 'medium',
      },
    ],
    overallVerdict: 'confirm',
    discrepancy: 'none',
    appliedRule: 'confirm_positive_list',
    confidence: 'medium',
    reasoning,
    responseText: `${SALUTATION_PLACEHOLDER},\n\n${body}\n\n${SIGNATURE_PLACEHOLDER}`,
    openPoints: [],
    flags: [CREA_STUB_FLAG],
  }
  return applyCreaDeterministics(input, raw)
}

/**
 * Canned rewrite for the staging preview (E-017 / E-019): mirrors rewriteResponse
 * without calling the API. Returns a fixed reply text for the moderator's target
 * decision (with [ANREDE] filled locally and [SIGNATUR] left for the client), plus —
 * only on a confirm rewrite — a canned memoSupplement so the preview exercises the
 * whole "Text ergaenzen" append path. Only reached when no real client is configured.
 */
export function buildStubRewrite(input: CreaContributionInput): CreaRewriteResult {
  const isEn = (input.uiLanguage ?? 'de').startsWith('en')
  const bodies = isEn
    ? {
        confirm:
          'thank you so much — I will gladly credit **your contribution to the common good**.',
        inquire:
          'thank you for your contribution! Could you tell me a little more about it? (More on the common good: https://gradido.net/gemeinwohl-was-ist-das/)',
        deny: 'thank you for your effort. This contribution cannot be credited this time — but the hours become free again, so you are welcome to submit new contributions.',
      }
    : {
        confirm: 'vielen Dank — ich schreibe Dir **Deinen Gemeinwohl-Beitrag** sehr gerne gut.',
        inquire:
          'vielen Dank für Deinen Beitrag! Magst Du mir noch ein wenig mehr dazu erzählen? (Mehr zum Gemeinwohl: https://gradido.net/gemeinwohl-was-ist-das/)',
        deny: 'danke für Deinen Einsatz. Diesen Beitrag kann ich Dir diesmal leider nicht gutschreiben — die Stunden werden dadurch aber wieder frei, und Du kannst gerne neue Beiträge einreichen.',
      }
  const key = (input.moderatorDecision ?? 'confirm') as keyof typeof bodies
  const body = bodies[key] ?? bodies.confirm
  const text = `${SALUTATION_PLACEHOLDER},\n\n${body}\n\n${SIGNATURE_PLACEHOLDER}`
  const memoSupplement =
    key === 'confirm'
      ? isEn
        ? 'Approved as a genuine contribution to the common good (preview note).'
        : 'Als echter Gemeinwohl-Beitrag genehmigt (Vorschau-Hinweis).'
      : null
  return { responseText: fillSalutation(input, text).text, memoSupplement }
}

/**
 * Canned batch evaluation for the staging preview (E-020): mirrors evaluateBatch
 * without calling the API. One overall verdict + one reply for all contributions,
 * with [ANREDE] filled locally and [SIGNATUR] left for the client. Only reached when
 * no real client is configured (no key).
 */
export function buildStubBatch(input: CreaBatchInput): CreaBatchEvaluation {
  const isEn = (input.uiLanguage ?? 'de').startsWith('en')
  const count = input.contributions.length
  const reasoning = isEn
    ? `Preview without AI: a sample overall assessment of ${count} contributions to test the interface. Once the API key is set, Crea’s real assessment appears here.`
    : `Vorschau ohne KI: eine Beispiel-Gesamtbewertung von ${count} Beiträgen zum Testen der Oberfläche. Sobald der API-Schlüssel gesetzt ist, steht hier Creas echte Begründung.`
  const body = isEn
    ? 'thank you very much for **your contributions to the common good**. (This is a preview reply — the real wording will come from Crea once the AI is connected.)'
    : 'vielen Dank für **Deine Gemeinwohl-Beiträge**. (Dies ist ein Vorschau-Text — die echte Formulierung kommt von Crea, sobald die KI verbunden ist.)'
  const raw = `${SALUTATION_PLACEHOLDER},\n\n${body}\n\n${SIGNATURE_PLACEHOLDER}`
  const { text, uncertain } = fillSalutation(input, raw)
  return {
    overallVerdict: 'confirm',
    confidence: 'medium',
    reasoning,
    responseText: text,
    openPoints: [],
    flags: uncertain ? [CREA_STUB_FLAG, 'anrede_unsicher'] : [CREA_STUB_FLAG],
  }
}

/**
 * Canned batch rewrite for the staging preview (E-020): mirrors rewriteBatch without
 * calling the API. Returns a fixed joint reply for the moderator's target decision,
 * [ANREDE] filled locally and [SIGNATUR] left for the client. No memoSupplement in
 * batch mode. Only reached when no real client is configured.
 */
export function buildStubBatchRewrite(input: CreaBatchInput): CreaRewriteResult {
  const isEn = (input.uiLanguage ?? 'de').startsWith('en')
  const bodies = isEn
    ? {
        confirm:
          'thank you so much — I will gladly credit **your contributions to the common good**.',
        inquire:
          'thank you for your contributions! Could you tell me a little more about them? (More on the common good: https://gradido.net/gemeinwohl-was-ist-das/)',
        deny: 'thank you for your effort. These contributions cannot be credited this time — but the hours become free again, so you are welcome to submit new ones.',
      }
    : {
        confirm: 'vielen Dank — ich schreibe Dir **Deine Gemeinwohl-Beiträge** sehr gerne gut.',
        inquire:
          'vielen Dank für Deine Beiträge! Magst Du mir noch ein wenig mehr dazu erzählen? (Mehr zum Gemeinwohl: https://gradido.net/gemeinwohl-was-ist-das/)',
        deny: 'danke für Deinen Einsatz. Diese Beiträge kann ich Dir diesmal leider nicht gutschreiben — die Stunden werden dadurch aber wieder frei, und Du kannst gerne neue Beiträge einreichen.',
      }
  const key = (input.moderatorDecision ?? 'confirm') as keyof typeof bodies
  const body = bodies[key] ?? bodies.confirm
  const text = `${SALUTATION_PLACEHOLDER},\n\n${body}\n\n${SIGNATURE_PLACEHOLDER}`
  // Public memo note only on a confirm deviation (E-019), like the single rewrite stub.
  const memoSupplement =
    key === 'confirm'
      ? isEn
        ? 'Approved as genuine contributions to the common good (preview note).'
        : 'Als echte Gemeinwohl-Beiträge genehmigt (Vorschau-Hinweis).'
      : null
  return { responseText: fillSalutation(input, text).text, memoSupplement }
}
