import type { CreaContributionInput } from '@/graphql/input/CreaContributionInput'
import type { CreaEvaluation } from '@/graphql/model/CreaEvaluation'
import {
  buildSalutation,
  computeDiscrepancy,
  resolveEnteredHours,
  SALUTATION_PLACEHOLDER,
  SIGNATURE_PLACEHOLDER,
  sumActivityHours,
} from './deterministics'

/**
 * Fills the [ANREDE] placeholder locally from the recipient's first name (E-012 —
 * PII stays local). Shared by the full evaluation, the rewrite call, the batch call
 * and the stub, so all paths build the salutation identically. Takes only the
 * salutation fields (not the whole input) so the batch input can reuse it. Returns
 * the filled text plus whether the salutation is uncertain (so callers can flag it,
 * E-005).
 */
export function fillSalutation(
  recipient: { recipientFirstName?: string | null; salutation?: string | null },
  text: string,
): { text: string; uncertain: boolean } {
  const { salutation, uncertain } = buildSalutation(
    recipient.recipientFirstName,
    recipient.salutation,
  )
  return { text: text.split(SALUTATION_PLACEHOLDER).join(salutation), uncertain }
}

/**
 * Layer-3 post-processing, shared by the live Anthropic client and the stub
 * preview (design docs `G` ch. 5-6, E-009 / E-012 / E-013). The CODE owns the
 * discrepancy flag and fills the [ANREDE] / [SIGNATUR] placeholders locally, so
 * neither the recipient's nor the moderator's name ever reaches the API.
 *
 * Mutates and returns the passed evaluation (always a freshly parsed/built
 * object, so in-place editing is safe).
 */
export function applyCreaDeterministics(
  input: CreaContributionInput,
  evaluation: CreaEvaluation,
): CreaEvaluation {
  // The code recomputes the authoritative discrepancy from Crea's extracted
  // activity hours vs. the entered hours and overwrites the model's proposal; a
  // divergence is flagged so the UI can surface it to the moderator (E-005).
  const enteredHours = resolveEnteredHours(input)
  const extractedHours = sumActivityHours(evaluation)
  const authoritative = computeDiscrepancy(extractedHours, enteredHours, input.memberStatus)
  if (authoritative !== evaluation.discrepancy) {
    evaluation.flags = [...(evaluation.flags ?? []), 'discrepancy_recomputed']
  }
  evaluation.discrepancy = authoritative

  // Fill [ANREDE] locally from the recipient's first name; flag an uncertain
  // salutation for the moderator (E-005).
  const { text, uncertain } = fillSalutation(input, evaluation.responseText)
  evaluation.responseText = text
  if (uncertain) {
    evaluation.flags = [...(evaluation.flags ?? []), 'anrede_unsicher']
  }

  // Fill [SIGNATUR] with the moderator's own greeting (E-013). Left in place when
  // unset so the moderator notices and configures it.
  if (input.moderatorSignature) {
    evaluation.responseText = evaluation.responseText
      .split(SIGNATURE_PLACEHOLDER)
      .join(input.moderatorSignature)
  }
  return evaluation
}
